import { getMetadata } from '../../scripts/aem.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';
import { getPlaceholder } from '../../scripts/iberostar/placeholders.js';

const MAX_SUBCATEGORIES = 9;
const LOCALE_PATTERN = /^[a-z]{2}-[a-z]{2}$/i;
const CONTENT_PREFIX_PATTERN = /^\/content\/[^/]+/;
const HEADING_TAGS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);
const SUBCATEGORY_VARIANT_CLASS = 'subcategory';

function normalizePath(path) {
  const { pathname } = new URL(path || window.location.pathname, window.location);
  return pathname
    .replace(CONTENT_PREFIX_PATTERN, '')
    .replace(/(\.plain)?\.html$/, '')
    .replace(/\/index$/, '')
    .replace(/\/$/, '') || '/';
}

function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('category-hero-rendered'));
}

function getFieldElement(block, propName, fallbackIndex = -1) {
  const selector = `[data-aue-prop="${propName}"]`;
  const sourceRows = getSourceRows(block);
  const prop = sourceRows
    .map((row) => (row.matches?.(selector) ? row : row.querySelector?.(selector)))
    .find(Boolean);

  if (prop) return prop;

  if (fallbackIndex < 0) return null;

  const row = sourceRows[fallbackIndex];
  if (!row) return null;

  const cells = [...row.children];
  if (cells.length > 1) return cells[cells.length - 1];
  return cells[0] || row;
}

function getTextValue(block, propName, fallbackIndex = -1, fallback = '') {
  return getFieldElement(block, propName, fallbackIndex)?.textContent?.trim() || fallback;
}

function getHrefValueFromElement(element) {
  if (!element) return '';
  return element.querySelector?.('a[href]')?.getAttribute('href')?.trim()
    || element.getAttribute?.('href')?.trim()
    || '';
}

function getCurrentLocale(segments) {
  return segments.find((segment) => LOCALE_PATTERN.test(segment)) || '';
}

function getGuideRoot(path) {
  const segments = path.split('/').filter(Boolean);
  const locale = getCurrentLocale(segments);
  const guideIndex = segments.indexOf('inspiration-guide');

  if (guideIndex > -1) {
    return `/${segments.slice(0, guideIndex + 1).join('/')}`;
  }

  return locale ? `/${locale}` : '/';
}

function toLabel(segment) {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTitleFallback() {
  return getMetadata('og:title')
    || document.querySelector('h1')?.textContent?.trim()
    || document.title?.split('|')?.[0]?.trim()
    || '';
}

async function getUiString(key, fallback) {
  const translated = await getTranslation(key, '');
  if (translated) return translated;
  return getPlaceholder(key, fallback);
}

async function getSegmentLabel(segment) {
  const map = {
    category: { key: 'breadcrumbCategories', fallback: 'Categories' },
    tag: { key: 'breadcrumbTags', fallback: 'Tags' },
    articles: { key: 'breadcrumbArticles', fallback: 'Articles' },
    article: { key: 'breadcrumbArticles', fallback: 'Articles' },
  };

  const config = map[segment];
  if (!config) return toLabel(segment);

  return getUiString(config.key, config.fallback);
}

async function buildBreadcrumbItems() {
  const path = normalizePath(window.location.pathname);
  const segments = path.split('/').filter(Boolean);
  const locale = getCurrentLocale(segments);
  const guideIndex = segments.indexOf('inspiration-guide');

  if (guideIndex === -1) {
    return [];
  }

  const visibleSegments = guideIndex > -1
    ? segments.slice(guideIndex + 1)
    : segments.filter((segment) => !LOCALE_PATTERN.test(segment));

  const homeLabel = await getUiString('breadcrumbHome', 'Home');
  const homeUrl = normalizePath(getGuideRoot(path));
  const currentLabel = getTitleFallback();
  const items = [{ label: homeLabel, url: homeUrl }];
  const baseSegments = locale ? [locale, 'inspiration-guide'] : ['inspiration-guide'];

  const labels = await Promise.all(visibleSegments.map((segment, index) => {
    if (index === visibleSegments.length - 1 && currentLabel) {
      return currentLabel;
    }
    return getSegmentLabel(segment);
  }));

  visibleSegments.forEach((segment, index) => {
    const url = `/${[...baseSegments, ...visibleSegments.slice(0, index + 1)].join('/')}`;
    items.push({
      label: labels[index] || toLabel(segment),
      url,
    });
  });

  return items
    .filter((item) => item.label)
    .filter((item, index, list) => index === 0 || item.url !== list[index - 1].url);
}

function createBreadcrumbItem(item, isLast) {
  const li = document.createElement('li');
  li.className = 'category-hero-breadcrumb-item';

  if (isLast || !item.url) {
    const span = document.createElement('span');
    span.textContent = item.label;
    if (isLast) span.setAttribute('aria-current', 'page');
    li.append(span);
    return li;
  }

  const link = document.createElement('a');
  link.href = item.url;
  link.textContent = item.label;
  li.append(link);
  return li;
}

async function renderBreadcrumbs() {
  const items = await buildBreadcrumbItems();
  if (!items.length) return null;

  const ariaLabel = await getUiString('breadcrumbAriaLabel', 'Breadcrumb');
  const nav = document.createElement('nav');
  nav.className = 'category-hero-breadcrumbs';
  nav.setAttribute('aria-label', ariaLabel);

  const list = document.createElement('ol');
  list.className = 'category-hero-breadcrumb-list';

  items.forEach((item, index) => {
    list.append(createBreadcrumbItem(item, index === items.length - 1));
  });

  nav.append(list);
  return nav;
}

function parseSubcategoryRow(row) {
  if (!row) return null;

  const titleEl = row.querySelector('[data-aue-prop="title"]') || row.children[0] || row;
  const urlEl = row.querySelector('[data-aue-prop="url"]') || row.children[1] || row;

  const title = titleEl?.textContent?.trim() || '';
  const hrefFromField = getHrefValueFromElement(urlEl);
  const hrefFromTitle = getHrefValueFromElement(titleEl);
  const href = hrefFromField || hrefFromTitle || '';

  if (!title || !href) return null;

  return { title, href };
}

function getSubcategoryRows(block) {
  const rows = getSourceRows(block);
  const itemRows = rows.filter(
    (row) => row.querySelector('[data-aue-resource="core/franklin/components/block/v1/block/item"]'),
  );

  if (itemRows.length) {
    return itemRows;
  }

  return rows.slice(4);
}

function getSubcategories(block) {
  return getSubcategoryRows(block)
    .map(parseSubcategoryRow)
    .filter(Boolean)
    .slice(0, MAX_SUBCATEGORIES);
}

function sanitizeHeadingTag(value) {
  const normalized = `${value || 'h2'}`.trim().toLowerCase();
  return HEADING_TAGS.has(normalized) ? normalized : 'h2';
}

function hideSource(block) {
  getSourceRows(block).forEach((row) => {
    row.classList.add('category-hero-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

function renderSubcategories(headingText, headingTag, items) {
  if (!items.length) return null;

  const section = document.createElement('section');
  section.className = 'category-hero-subcategories';
  section.setAttribute('aria-label', headingText);

  const heading = document.createElement(headingTag);
  heading.className = 'category-hero-subcategories-title';
  heading.textContent = headingText;

  const list = document.createElement('ul');
  list.className = 'category-hero-subcategories-list';

  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'category-hero-subcategories-item';

    const link = document.createElement('a');
    link.className = 'category-hero-subcategories-link';
    link.href = item.href;
    link.textContent = item.title;

    li.append(link);
    list.append(li);
  });

  section.append(heading, list);
  return section;
}

export default async function decorate(block) {
  block.querySelector(':scope > .category-hero-rendered')?.remove();

  if (block.classList.contains(SUBCATEGORY_VARIANT_CLASS)) {
    block.classList.add('category-hero-subcategory');
  }

  const pretitle = getTextValue(block, 'pretitle', 0, '');
  const title = getTextValue(block, 'title', 1, getTitleFallback());
  const description = getFieldElement(block, 'description', 2);
  const subcategoriesHeadingTag = sanitizeHeadingTag(
    getTextValue(block, 'subcategoriesHeadingTag', 3, 'h2'),
  );
  const subcategoriesHeading = await getUiString('categoryHeroSubcategoriesTitle', 'Subcategories');
  const subcategories = getSubcategories(block);

  hideSource(block);

  const rendered = document.createElement('div');
  rendered.className = 'category-hero-rendered';

  const content = document.createElement('div');
  content.className = 'category-hero-content';

  const heading = document.createElement('div');
  heading.className = 'category-hero-heading';

  const breadcrumbs = await renderBreadcrumbs();
  if (breadcrumbs) rendered.append(breadcrumbs);

  if (pretitle) {
    const pretitleEl = document.createElement('p');
    pretitleEl.className = 'category-hero-pretitle';
    pretitleEl.textContent = pretitle;
    heading.append(pretitleEl);
  }

  if (title) {
    const titleEl = document.createElement('h1');
    titleEl.className = 'category-hero-title';
    titleEl.textContent = title;
    heading.append(titleEl);
  }

  if (heading.childElementCount) {
    content.append(heading);
  }

  const subcategorySection = renderSubcategories(
    subcategoriesHeading,
    subcategoriesHeadingTag,
    subcategories,
  );
  if (subcategorySection) {
    content.append(subcategorySection);
  }

  if (description?.textContent?.trim()) {
    const descriptionEl = document.createElement('p');
    descriptionEl.className = 'category-hero-description';
    descriptionEl.textContent = description.textContent.trim();
    content.append(descriptionEl);
  }

  rendered.append(content);

  block.append(rendered);
}
