import { getMetadata } from '../../scripts/aem.js';
import { tagTitle } from '../../scripts/iberostar/tag-label.js';
import { taxonomyTitle } from '../../scripts/iberostar/taxonomy.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';
import { getPlaceholder } from '../../scripts/iberostar/placeholders.js';

const MAX_SUBCATEGORIES = 9;
const HEADING_TAGS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);
const SUBCATEGORY_VARIANT_CLASS = 'subcategory';

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

function labelFromHref(href) {
  const segment = `${href || ''}`.replace(/(^\/+|\/+$|(\.(html|plain\.html))$)/g, '').split('/').filter(Boolean).pop() || '';
  return tagTitle(decodeURIComponent(segment));
}

function getTitleFallback() {
  return document.querySelector('h1')?.textContent?.trim()
    || getMetadata('og:title')
    || document.title?.split('|')?.[0]?.trim()
    || '';
}

async function getUiString(key, fallback) {
  const translated = await getTranslation(key, '');
  if (translated) return translated;
  return getPlaceholder(key, fallback);
}

function parseSubcategoryRow(row) {
  if (!row) return null;

  const urlEl = row.querySelector('[data-aue-prop="url"]') || row.children[1] || row.children[0] || row;
  const href = getHrefValueFromElement(urlEl);
  if (!href) return null;

  // For legacy positional rows (plain.html source), children[0] may hold an explicit text label.
  // If the row has no UE instrumentation and the first cell has no <a>, use its text.
  const isInstrumented = Boolean(row.querySelector('[data-aue-prop]'));
  const firstCell = row.children[0];
  const firstCellText = !isInstrumented && !firstCell?.querySelector('a[href]')
    ? firstCell?.textContent?.trim()
    : '';

  const title = firstCellText || labelFromHref(href);
  if (!title) return null;

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
  const fromRows = getSubcategoryRows(block)
    .map(parseSubcategoryRow)
    .filter(Boolean)
    .slice(0, MAX_SUBCATEGORIES);

  if (fromRows.length) return fromRows;

  return Array.from({ length: MAX_SUBCATEGORIES }, (_, index) => index + 1)
    .map((index) => {
      const urlEl = getFieldElement(block, `subcategory${index}Url`, -1);
      const href = getHrefValueFromElement(urlEl);
      if (!href) return null;
      return { title: labelFromHref(href), href };
    })
    .filter(Boolean);
}

function sanitizeHeadingTag(value) {
  const normalized = `${value || 'h2'}`.trim().toLowerCase();
  return HEADING_TAGS.has(normalized) ? normalized : 'h2';
}

async function enhanceSubcategoryTitles(list) {
  const links = [...list.querySelectorAll('.category-hero-subcategories-link')];
  if (!links.length) return;

  const titles = await Promise.all(links.map((link) => taxonomyTitle(link.getAttribute('href'))));

  titles.forEach((pageTitle, index) => {
    if (pageTitle && links[index]) {
      links[index].textContent = pageTitle;
    }
  });
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
    // Non-blocking: update link text with actual page titles after render
    enhanceSubcategoryTitles(subcategorySection);
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
