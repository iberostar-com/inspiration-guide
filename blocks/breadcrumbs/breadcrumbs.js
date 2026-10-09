import { getMetadata } from '../../scripts/aem.js';
import { tagTitle } from '../../scripts/iberostar/tag-label.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';

const LOCALE_PATTERN = /^[a-z]{2}-[a-z]{2}$/i;
const CONTENT_PREFIX_PATTERN = /^\/content\/[^/]+/;

const SEGMENT_LABEL_KEYS = {
  articles: 'breadcrumbArticles',
  article: 'breadcrumbArticles',
  category: 'breadcrumbCategories',
  tag: 'breadcrumbTags',
};

const SEGMENT_LABEL_FALLBACKS = {
  articles: 'Artículos',
  article: 'Artículos',
  category: 'Categorías',
  tag: 'Tags',
};

const CATEGORY_ROOT_SEGMENTS = new Set(['categorias', 'categorías', 'categories', 'category']);
const BREADCRUMB_TITLE_META = 'breadcrumb-title';
const BREADCRUMB_VISIBLE_META = 'breadcrumb-visible';
const NAVIGATION_TITLE_META = 'navigation-title';

// Bug 169657: /category, /tag y /articles son segmentos de enrutado, no niveles de navegacion.
// Solo se muestran cuando el usuario esta en su propia pagina indice.
const ROUTING_SEGMENTS = Object.keys(SEGMENT_LABEL_KEYS);

const GUIDE_SEGMENT = 'inspiration-guide';
const GUIDE_LABEL_FALLBACK = 'Inspiration Guide';
const pageBreadcrumbCache = new Map();

function normalizePath(path) {
  const { pathname } = new URL(path || window.location.pathname, window.location);
  return pathname
    .replace(CONTENT_PREFIX_PATTERN, '')
    .replace(/(\.plain)?\.html$/, '')
    .replace(/\/index$/, '')
    .replace(/\/$/, '') || '/';
}

function getAuthorContentPrefix() {
  const { pathname } = new URL(window.location.pathname, window.location);
  return pathname.match(CONTENT_PREFIX_PATTERN)?.[0] || '';
}

function toBreadcrumbDataFetchPath(path) {
  const normalizedPath = normalizePath(path);
  const authorContentPrefix = getAuthorContentPrefix();

  if (authorContentPrefix) {
    return `${authorContentPrefix}${normalizedPath}.html`;
  }

  return normalizedPath;
}

function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('breadcrumbs-rendered'));
}

function getPropElement(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  return getSourceRows(block)
    .map((row) => (row.matches?.(selector) ? row : row.querySelector?.(selector)))
    .find(Boolean) || null;
}

function getTextValue(block, propName, fallback = '') {
  return getPropElement(block, propName)?.textContent?.trim() || fallback;
}

function getHrefValue(block, propName, fallback = '') {
  const el = getPropElement(block, propName);
  const href = el?.querySelector?.('a[href]')?.getAttribute('href')?.trim();
  const text = el?.textContent?.trim();
  return href || text || fallback;
}

function getCurrentLocale(segments) {
  return segments.find((segment) => LOCALE_PATTERN.test(segment)) || '';
}

function getLocaleRoot(locale) {
  return locale ? `/${locale}` : '/';
}

function getGuideRoot(path) {
  const segments = path.split('/').filter(Boolean);
  const locale = getCurrentLocale(segments);
  const guideIndex = segments.indexOf(GUIDE_SEGMENT);

  if (guideIndex > -1) {
    return `/${segments.slice(0, guideIndex + 1).join('/')}`;
  }

  return getLocaleRoot(locale);
}

function toLabel(segment) {
  return tagTitle(decodeURIComponent(segment));
}

function getTitleFallback() {
  return getMetadata(BREADCRUMB_TITLE_META)
    || getMetadata(NAVIGATION_TITLE_META)
    || document.querySelector('h1')?.textContent?.trim()
    || getMetadata('og:title')
    || document.title?.split('|')?.[0]?.trim()
    || '';
}

function getMetaFromDocument(doc, name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  return [...doc.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((meta) => meta.content?.trim())
    .filter(Boolean)
    .join(', ');
}

function isFalseValue(value = '') {
  const text = `${value}`.trim().toLowerCase();
  return text === 'false' || text === 'no' || text === 'off' || text === '0';
}

function normalizeTaxonomySegments(value = '') {
  const rawValue = `${value || ''}`.split(',')[0].trim();
  if (!rawValue) return [];

  let taxonomyPath = rawValue;

  if (taxonomyPath.includes(':')) {
    taxonomyPath = taxonomyPath.slice(taxonomyPath.indexOf(':') + 1);
  } else if (taxonomyPath.startsWith('/')) {
    const path = normalizePath(taxonomyPath);
    const segments = path.split('/').filter(Boolean);
    const categoryIndex = segments.indexOf('category');
    taxonomyPath = categoryIndex > -1
      ? segments.slice(categoryIndex + 1).join('/')
      : segments.join('/');
  }

  return taxonomyPath
    .split('/')
    .map((segment) => decodeURIComponent(segment).trim())
    .filter(Boolean)
    .filter((segment, index) => index > 0 || !CATEGORY_ROOT_SEGMENTS.has(segment.toLowerCase()));
}

function getArticleCategorySegments() {
  return normalizeTaxonomySegments(
    getMetadata('article-category-path') || getMetadata('article-category'),
  );
}

async function fetchPageBreadcrumbData(path) {
  const fetchPath = toBreadcrumbDataFetchPath(path);
  if (pageBreadcrumbCache.has(fetchPath)) {
    return pageBreadcrumbCache.get(fetchPath);
  }

  const dataPromise = fetch(fetchPath)
    .then(async (response) => {
      if (!response.ok) return {};
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return {
        title: getMetaFromDocument(doc, BREADCRUMB_TITLE_META)
          || getMetaFromDocument(doc, NAVIGATION_TITLE_META)
          || doc.querySelector('h1')?.textContent?.trim()
          || getMetaFromDocument(doc, 'og:title')
          || doc.title?.split('|')?.[0]?.trim()
          || '',
        visible: !isFalseValue(getMetaFromDocument(doc, BREADCRUMB_VISIBLE_META)),
      };
    })
    .catch(() => ({}));

  pageBreadcrumbCache.set(fetchPath, dataPromise);
  return dataPromise;
}

async function enrichBreadcrumbItem(item, isCurrent = false) {
  if (isCurrent || !item.url) {
    return {
      ...item,
      label: getTitleFallback() || item.label,
    };
  }

  const data = await fetchPageBreadcrumbData(item.url);
  if (data.visible === false) return null;

  return {
    ...item,
    label: data.title || item.label,
  };
}

async function buildArticleCategoryItems(categorySegments, guideRoot) {
  const itemPromises = categorySegments.map((segment, index) => enrichBreadcrumbItem({
    label: toLabel(segment),
    url: `${guideRoot}/category/${categorySegments.slice(0, index + 1).join('/')}`,
  }));
  const items = await Promise.all(itemPromises);
  return items.filter(Boolean);
}

async function getLocalizedSegmentLabel(segment) {
  const key = SEGMENT_LABEL_KEYS[segment];
  if (!key) return toLabel(segment);

  const fallback = SEGMENT_LABEL_FALLBACKS[segment] || toLabel(segment);
  return getTranslation(key, fallback);
}

async function buildAutoItems(block) {
  const path = normalizePath(window.location.pathname);
  const segments = path.split('/').filter(Boolean);
  const locale = getCurrentLocale(segments);
  const guideIndex = segments.indexOf(GUIDE_SEGMENT);
  const insideGuide = guideIndex > -1;
  const guideRoot = getGuideRoot(path);
  const pageType = getMetadata('page-type')?.trim().toLowerCase() || '';
  const visibleSegments = insideGuide ? segments.slice(guideIndex + 1) : segments
    .filter((segment) => !LOCALE_PATTERN.test(segment));
  const lastIndex = visibleSegments.length - 1;
  const basePath = insideGuide ? guideRoot : getLocaleRoot(locale).replace(/\/$/, '');
  const homeLabel = getTextValue(
    block,
    'homeLabel',
    await getTranslation('breadcrumbHome', 'Inicio'),
  );
  const homeUrl = normalizePath(getHrefValue(block, 'homeUrl', getLocaleRoot(locale)));
  const currentLabel = getTextValue(block, 'currentLabel', getTitleFallback());
  const items = [{ label: homeLabel, url: homeUrl }];

  if (insideGuide) {
    items.push({
      label: await getTranslation('breadcrumbGuide', GUIDE_LABEL_FALLBACK),
      url: guideRoot,
    });
  }

  if (insideGuide && pageType === 'article') {
    const categoryItems = await buildArticleCategoryItems(getArticleCategorySegments(), guideRoot);
    const currentSegment = visibleSegments[lastIndex] || '';
    const currentItem = await enrichBreadcrumbItem({
      label: currentLabel || toLabel(currentSegment),
      url: path,
    }, true);

    return [...items, ...categoryItems, currentItem];
  }

  const labels = await Promise.all(visibleSegments.map((segment, index) => {
    if (SEGMENT_LABEL_KEYS[segment]) {
      return getLocalizedSegmentLabel(segment);
    }
    if (index === lastIndex && currentLabel) {
      return currentLabel;
    }
    return toLabel(segment);
  }));

  const segmentItems = await Promise.all(visibleSegments.map((segment, index) => {
    if (index !== lastIndex && ROUTING_SEGMENTS.includes(segment)) return null;

    return enrichBreadcrumbItem({
      label: labels[index] || toLabel(segment),
      url: `${basePath}/${visibleSegments.slice(0, index + 1).join('/')}`,
    }, index === lastIndex);
  }));

  items.push(...segmentItems.filter(Boolean));

  return items;
}

function getBackLink(items) {
  // Bug 166013 (mobile): un único back-link al padre directo, como en el resto de Iberostar.com
  if (items.length < 2) return null;
  const parent = items[items.length - 2];
  return parent?.url ? parent : null;
}

function renderBackLink(back) {
  const link = document.createElement('a');
  link.className = 'breadcrumbs-back';
  link.href = back.url;

  const icon = document.createElement('i');
  icon.className = 'ibh-icon-arrow-back';
  icon.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'breadcrumbs-back-label';
  label.textContent = back.label;

  link.append(icon, label);
  return link;
}

function createBreadcrumbItem(item, isLast) {
  const li = document.createElement('li');
  li.className = 'breadcrumbs-item';

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

function renderBreadcrumbs(items) {
  const nav = document.createElement('nav');
  nav.className = 'breadcrumbs-rendered';
  nav.setAttribute('aria-label', 'Breadcrumb');

  const back = getBackLink(items);
  if (back) nav.append(renderBackLink(back));

  const list = document.createElement('ol');
  list.className = 'breadcrumbs-list';

  items.forEach((item, index) => {
    list.append(createBreadcrumbItem(item, index === items.length - 1));
  });

  nav.append(list);
  return nav;
}

function hideSource(block) {
  getSourceRows(block).forEach((row) => {
    row.classList.add('breadcrumbs-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

export default async function decorate(block) {
  block.querySelector(':scope > .breadcrumbs-rendered')?.remove();

  const items = (await buildAutoItems(block))
    .filter((item) => item.label)
    .filter((item, index, list) => index === 0 || item.url !== list[index - 1].url);

  if (!items.length) return;

  hideSource(block);
  block.append(renderBreadcrumbs(items));
}
