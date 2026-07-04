import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { getArticles } from '../../scripts/inspiration-data.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const MAX_ITEMS = 3;
const CTA_COPY = 'Leer artículo';
const MODE_VALUES = new Set(['manual', 'auto-tag', 'auto-category']);
const HEADING_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const CONFIG_PROPS = new Set([
  'eyebrow',
  'eyebrowHeading',
  'title',
  'titleHeading',
  'mode',
  'manualArticle1',
  'manualArticle2',
  'manualArticle3',
]);

function getSourceRows(block) {
  return [...block.children].filter((row) => !row.classList.contains('editorial-article-grid-rendered'));
}

function getPropElement(root, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  if (root?.matches?.(selector)) return root;
  return root?.querySelector?.(selector) || null;
}

function getFieldByProp(block, propName) {
  return getSourceRows(block)
    .map((row) => getPropElement(row, propName))
    .find(Boolean) || null;
}

function toDataAttributeName(propName) {
  return `data-${propName.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;
}

function textByProp(block, propName, fallback = '') {
  const text = getFieldByProp(block, propName)?.textContent?.trim();
  if (text) return text;

  const attr = block.getAttribute(toDataAttributeName(propName));
  if (attr) return attr;

  return fallback;
}

function hrefByProp(block, propName) {
  const field = getFieldByProp(block, propName);
  if (!field) return '';

  const href = field.querySelector('a[href]')?.getAttribute('href')?.trim();
  return href || field.textContent?.trim() || '';
}

function normalizePath(path) {
  if (!path) return '';

  const withoutHtml = `${path}`.trim().replace(/\.html$/, '');
  const withLeadingSlash = withoutHtml.startsWith('/') ? withoutHtml : `/${withoutHtml}`;
  return withLeadingSlash.replace(/\/+$/, '') || '/';
}

function samePath(left, right) {
  return normalizePath(left) === normalizePath(right);
}

function sanitizeHeadingTag(value, fallback) {
  const normalized = `${value || fallback}`.trim().toLowerCase();
  return HEADING_TAGS.has(normalized) ? normalized : fallback;
}

function sanitizeMode(value) {
  const mode = `${value || ''}`.trim().toLowerCase();
  return MODE_VALUES.has(mode) ? mode : 'manual';
}

function getMetaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function normalizeStr(value) {
  return `${value || ''}`.trim().toLowerCase();
}

function splitList(value) {
  return `${value || ''}`
    .split(/[|,;>]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitPathSegments(value) {
  return `${value || ''}`
    .replace(/^[^:]+:/, '')
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toCategoryTree(value) {
  const directSegments = splitPathSegments(value);
  if (directSegments.length) return directSegments;

  return splitList(value)
    .map((item) => item.replace(/^[^:]+:/, '').trim())
    .filter(Boolean);
}

function getArticleTags(article) {
  if (Array.isArray(article?.tags)) {
    return article.tags.map(normalizeStr).filter(Boolean);
  }

  return splitList(article?.tags).map(normalizeStr).filter(Boolean);
}

function isVisibleArticle(article) {
  const visible = `${article?.visible ?? ''}`.trim().toLowerCase();
  if (['false', '0', 'no', 'hidden'].includes(visible)) return false;

  const robots = `${article?.robots || ''}`.trim().toLowerCase();
  return !robots.includes('noindex');
}

function getRootCategoryLabel(raw) {
  if (!raw) return '';

  const tree = toCategoryTree(raw)
    .map((part) => part.replace(/-/g, ' ').trim())
    .filter(Boolean);
  const root = tree[0] || '';
  return root.charAt(0).toUpperCase() + root.slice(1);
}

function getComparableTimestamp(article) {
  const direct = Number.parseInt(`${article?.publicationTimestamp || ''}`, 10);
  if (Number.isFinite(direct)) return direct;

  const fromDate = Date.parse(article?.publicationDate || article?.publishDate || '');
  if (Number.isFinite(fromDate)) return fromDate;

  const fromLastModified = Date.parse(article?.lastModified || '');
  if (Number.isFinite(fromLastModified)) return fromLastModified;

  return 0;
}

function byLatest(a, b) {
  return getComparableTimestamp(b) - getComparableTimestamp(a);
}

function extractCurrentArticle(allArticles) {
  const currentPath = normalizePath(window.location.pathname);
  return allArticles.find((article) => samePath(article.path || article.href, currentPath)) || null;
}

function getCurrentTags(currentArticle) {
  const indexedTags = getArticleTags(currentArticle);
  if (indexedTags.length) return indexedTags;

  return splitList(getMetaContent('article-tags'))
    .map(normalizeStr)
    .filter(Boolean);
}

function getCurrentCategoryTree(currentArticle) {
  const fromIndex = toCategoryTree(currentArticle?.categoryPath || currentArticle?.category)
    .map(normalizeStr)
    .filter(Boolean);
  if (fromIndex.length) return fromIndex;

  const fromMetaPath = toCategoryTree(getMetaContent('article-category-path'))
    .map(normalizeStr)
    .filter(Boolean);
  if (fromMetaPath.length) return fromMetaPath;

  return toCategoryTree(getMetaContent('article-category'))
    .map(normalizeStr)
    .filter(Boolean);
}

function matchesAnyTag(currentTags, article) {
  if (!currentTags.length) return false;

  const articleTags = getArticleTags(article);
  return articleTags.some((tag) => currentTags.includes(tag));
}

function matchesCategoryTree(currentTree, article) {
  if (!currentTree.length) return false;

  const articleTree = toCategoryTree(article?.categoryPath || article?.category)
    .map(normalizeStr)
    .filter(Boolean);

  if (!articleTree.length) return false;
  return currentTree.some((segment) => articleTree.includes(segment));
}

function toResolvedCardItem(article) {
  return {
    href: article.href || article.path || '',
    image: article.image || article.ogImage || '',
    imageAlt: article.imageAlt || '',
    title: article.title || '',
    category: getRootCategoryLabel(article.categoryPath || article.category),
  };
}

async function getAutoArticles(mode) {
  const all = (await getArticles()).filter(isVisibleArticle);
  const currentArticle = extractCurrentArticle(all);
  const currentPath = normalizePath(window.location.pathname);
  const withoutCurrent = all.filter(
    (article) => !samePath(article.path || article.href, currentPath),
  );

  if (mode === 'auto-tag') {
    const currentTags = getCurrentTags(currentArticle);
    if (!currentTags.length) return [];

    return withoutCurrent
      .filter((article) => matchesAnyTag(currentTags, article))
      .sort(byLatest)
      .map(toResolvedCardItem)
      .slice(0, MAX_ITEMS);
  }

  if (mode === 'auto-category') {
    const categoryTree = getCurrentCategoryTree(currentArticle);
    if (!categoryTree.length) return [];

    return withoutCurrent
      .filter((article) => matchesCategoryTree(categoryTree, article))
      .sort(byLatest)
      .map(toResolvedCardItem)
      .slice(0, MAX_ITEMS);
  }

  return [];
}

function findArticleByRef(allArticles, refPath) {
  const target = normalizePath(refPath);
  if (!target) return null;

  return allArticles.find((article) => {
    const candidate = normalizePath(article.path || article.href);
    return candidate && (candidate === target
      || candidate.endsWith(target) || target.endsWith(candidate));
  }) || null;
}

function getLegacyManualRows(block) {
  return getSourceRows(block)
    .filter((row) => !row.querySelector('[data-aue-prop]')
      || [...row.querySelectorAll('[data-aue-prop]')]
        .some((el) => !CONFIG_PROPS.has(el.getAttribute('data-aue-prop'))))
    .slice(0, MAX_ITEMS)
    .map((row, index) => ({ row, index }));
}

function parseLegacyManualItem(row, index) {
  const getLegacyProp = (propName) => row.querySelector(`[data-aue-prop="${propName}"]`) || null;

  const cells = [...row.children];
  const imageProp = getLegacyProp('image');
  const picture = imageProp ? imageProp.querySelector('picture') : cells[0]?.querySelector('picture');
  const img = picture?.querySelector('img');

  const titleProp = getLegacyProp('title');
  const title = titleProp ? titleProp.textContent?.trim() : cells[1]?.textContent?.trim() || '';

  const categoryProp = getLegacyProp('category');
  const rawCategory = categoryProp ? categoryProp.textContent?.trim() : cells[2]?.textContent?.trim() || '';

  const linkProp = getLegacyProp('link');
  const href = linkProp
    ? linkProp.querySelector('a[href]')?.getAttribute('href')?.trim() || linkProp.textContent?.trim() || ''
    : cells[3]?.querySelector('a[href]')?.getAttribute('href')?.trim() || cells[3]?.textContent?.trim() || '';

  if (!title || !href) return null;

  return {
    href,
    image: img?.src || '',
    imageAlt: img?.alt || '',
    title,
    category: getRootCategoryLabel(rawCategory) || rawCategory,
    picture,
    sourceRow: row,
    sortOrder: index,
  };
}

async function getManualItems(block) {
  const allArticles = (await getArticles()).filter(isVisibleArticle);

  const manualRefInputs = ['manualArticle1', 'manualArticle2', 'manualArticle3']
    .map((propName, index) => ({
      propName,
      index,
      refPath: hrefByProp(block, propName),
      sourceProp: getFieldByProp(block, propName),
    }));

  const hasManualRefInputs = manualRefInputs.some((item) => item.refPath);

  if (hasManualRefInputs) {
    return manualRefInputs
      .map((item) => {
        if (!item.refPath) return null;

        const article = findArticleByRef(allArticles, item.refPath);
        if (!article) return null;

        return {
          ...toResolvedCardItem(article),
          sourceProp: item.sourceProp,
          sortOrder: item.index,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, MAX_ITEMS);
  }

  const legacyResolved = getLegacyManualRows(block)
    .map(({ row, index }) => {
      const refPath = row.querySelector('a[href]')?.getAttribute('href')?.trim() || '';
      const article = findArticleByRef(allArticles, refPath);
      if (!article) return null;

      return {
        ...toResolvedCardItem(article),
        sourceRow: row,
        sortOrder: index,
      };
    })
    .filter(Boolean);

  const manualLegacy = getLegacyManualRows(block)
    .map(({ row, index }) => parseLegacyManualItem(row, index))
    .filter(Boolean);

  return [...manualRefs, ...legacyResolved, ...manualLegacy]
    .slice(0, MAX_ITEMS)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function createTag(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createCard(item) {
  if (!item?.title || !item?.href) return null;

  const article = document.createElement('article');
  article.className = 'editorial-article-grid-card';

  const link = document.createElement('a');
  link.className = 'editorial-article-grid-card-link';
  link.href = item.href;

  if (item.picture || item.image) {
    const media = document.createElement('div');
    media.className = 'editorial-article-grid-card-image';

    if (item.picture) {
      media.append(item.picture.cloneNode(true));
      const img = media.querySelector('img');
      if (img) img.alt = item.imageAlt || img.alt || '';
    } else {
      media.append(createResponsiveImage(item.image, item.imageAlt || '', { preset: 'article-card' }));
    }

    link.append(media);
  }

  const body = document.createElement('div');
  body.className = 'editorial-article-grid-card-body';

  if (item.category) {
    body.append(createTag('p', 'editorial-article-grid-card-category', item.category));
  }

  body.append(createTag('h3', 'editorial-article-grid-card-title', item.title));

  const cta = document.createElement('span');
  cta.className = 'editorial-article-grid-card-cta';
  cta.append(document.createTextNode(CTA_COPY));

  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→';
  cta.append(arrow);

  body.append(cta);
  link.append(body);
  article.append(link);

  return article;
}

function readConfig(block) {
  return {
    eyebrow: textByProp(block, 'eyebrow', ''),
    eyebrowHeading: sanitizeHeadingTag(textByProp(block, 'eyebrowHeading', 'h2'), 'h2'),
    title: textByProp(block, 'title', ''),
    titleHeading: sanitizeHeadingTag(textByProp(block, 'titleHeading', 'p'), 'p'),
    mode: sanitizeMode(textByProp(block, 'mode', block.getAttribute('data-mode') || 'manual')),
  };
}

function renderHeader(block, config) {
  if (!config.eyebrow && !config.title) return null;

  const header = document.createElement('header');
  header.className = 'editorial-article-grid-heading';

  if (config.eyebrow) {
    const eyebrow = createTag(config.eyebrowHeading, 'editorial-article-grid-eyebrow', config.eyebrow);
    const source = getFieldByProp(block, 'eyebrow');
    if (source) moveInstrumentation(source, eyebrow);
    header.append(eyebrow);
  }

  if (config.title) {
    const title = createTag(config.titleHeading, 'editorial-article-grid-title', config.title);
    const source = getFieldByProp(block, 'title');
    if (source) moveInstrumentation(source, title);
    header.append(title);
  }

  return header;
}

function hideSourceRows(sourceRows) {
  sourceRows.forEach((row) => {
    row.classList.add('editorial-article-grid-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

function collectSourceRows(items) {
  return items
    .map((item) => item.sourceRow || item.sourceProp)
    .filter(Boolean);
}

function renderCards(items) {
  const list = document.createElement('div');
  list.className = 'editorial-article-grid-list';

  items.forEach((item) => {
    const card = createCard(item);
    if (card) list.append(card);
  });

  return list;
}

function hasRenderableCards(items) {
  return items.some((item) => item?.title && item?.href);
}

function removePreviousRender(block) {
  block.querySelector(':scope > .editorial-article-grid-rendered')?.remove();
}

function markInstrumentation(items, rendered) {
  const cards = [...rendered.querySelectorAll('.editorial-article-grid-card')];
  items.forEach((item, index) => {
    const source = item.sourceRow || item.sourceProp;
    if (!source) return;
    moveInstrumentation(source, cards[index] || rendered);
  });
}

export default async function decorate(block) {
  removePreviousRender(block);

  const config = readConfig(block);
  const items = config.mode === 'manual'
    ? await getManualItems(block)
    : await getAutoArticles(config.mode);

  if (!hasRenderableCards(items)) {
    block.classList.add('editorial-article-grid-empty');
    return;
  }

  block.classList.remove('editorial-article-grid-empty');

  const rendered = document.createElement('section');
  rendered.className = 'editorial-article-grid-rendered';

  const header = renderHeader(block, config);
  if (header) rendered.append(header);

  const list = renderCards(items);
  rendered.append(list);

  block.append(rendered);
  hideSourceRows(collectSourceRows(items));
  markInstrumentation(items, rendered);
}
