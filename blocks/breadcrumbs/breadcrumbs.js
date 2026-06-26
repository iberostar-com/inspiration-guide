import { getMetadata } from '../../scripts/aem.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';
import { getPlaceholder } from '../../scripts/iberostar/placeholders.js';

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

function normalizePath(path) {
  const { pathname } = new URL(path || window.location.pathname, window.location);
  return pathname
    .replace(CONTENT_PREFIX_PATTERN, '')
    .replace(/(\.plain)?\.html$/, '')
    .replace(/\/index$/, '')
    .replace(/\/$/, '') || '/';
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

async function getLocalizedSegmentLabel(segment) {
  const key = SEGMENT_LABEL_KEYS[segment];
  if (!key) return toLabel(segment);

  const fallback = SEGMENT_LABEL_FALLBACKS[segment] || toLabel(segment);
  return getTranslation(key, fallback) || getPlaceholder(key, fallback);
}

async function buildAutoItems(block) {
  const path = normalizePath(window.location.pathname);
  const segments = path.split('/').filter(Boolean);
  const locale = getCurrentLocale(segments);
  const guideIndex = segments.indexOf('inspiration-guide');
  const visibleSegments = guideIndex > -1 ? segments.slice(guideIndex + 1) : segments
    .filter((segment) => !LOCALE_PATTERN.test(segment));
  const homeLabel = getTextValue(
    block,
    'homeLabel',
    await getTranslation('breadcrumbHome', 'Inicio') || await getPlaceholder('breadcrumbHome', 'Inicio'),
  );
  const homeUrl = normalizePath(getHrefValue(block, 'homeUrl', getGuideRoot(path)));
  const currentLabel = getTextValue(block, 'currentLabel', getTitleFallback());
  const items = [{ label: homeLabel, url: homeUrl }];
  const baseSegments = locale ? [locale, 'inspiration-guide'] : ['inspiration-guide'];

  const labels = await Promise.all(visibleSegments.map((segment, index) => {
    if (index === visibleSegments.length - 1 && currentLabel) {
      return currentLabel;
    }
    return getLocalizedSegmentLabel(segment);
  }));

  visibleSegments.forEach((segment, index) => {
    const url = `/${[...baseSegments, ...visibleSegments.slice(0, index + 1)].join('/')}`;
    items.push({
      label: labels[index] || toLabel(segment),
      url,
    });
  });

  return items;
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
