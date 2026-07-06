import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { getArticles } from '../../scripts/inspiration-data.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const MAX_ITEMS = 3;
const CTA_COPY = 'Leer artículo';
const MODE_VALUES = new Set(['manual', 'auto-tag', 'auto-category']);
const HEADING_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const CONFIG_PROP_ORDER = [
  'eyebrow',
  'eyebrowHeading',
  'title',
  'titleHeading',
  'mode',
  'manualArticle1',
  'manualArticle2',
  'manualArticle3',
];
const CONFIG_PROPS = new Set(CONFIG_PROP_ORDER);

function getSourceRows(block) {
  return [...block.children].filter((row) => !row.classList.contains('editorial-article-grid-rendered'));
}

function getPropElement(root, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  if (root?.matches?.(selector)) return root;
  return root?.querySelector?.(selector) || null;
}

function getPositionalConfigRows(block) {
  const rows = getSourceRows(block);
  const modeIndex = CONFIG_PROP_ORDER.indexOf('mode');
  const mode = rows[modeIndex]?.textContent?.trim().toLowerCase() || '';
  return MODE_VALUES.has(mode) ? rows.slice(0, CONFIG_PROP_ORDER.length) : [];
}

function getFieldByProp(block, propName) {
  const instrumentedField = getSourceRows(block)
    .map((row) => getPropElement(row, propName))
    .find(Boolean) || null;
  if (instrumentedField) return instrumentedField;

  const propIndex = CONFIG_PROP_ORDER.indexOf(propName);
  return getPositionalConfigRows(block)[propIndex] || null;
}

function toDataAttributeName(propName) {
  return `data-${propName.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;
}

function toDataAttributeNameWithDigitDashes(propName) {
  return toDataAttributeName(propName).replace(/(\d+)/g, '-$1');
}

function attrByProp(block, propName) {
  const dataAttrName = toDataAttributeName(propName);
  const attrNames = [
    dataAttrName,
    toDataAttributeNameWithDigitDashes(propName),
    dataAttrName.replace(/^data-/, ''),
    toDataAttributeNameWithDigitDashes(propName).replace(/^data-/, ''),
    propName,
  ];

  return attrNames
    .map((attrName) => block.getAttribute(attrName)?.trim())
    .find(Boolean) || '';
}

function textByProp(block, propName, fallback = '') {
  const text = getFieldByProp(block, propName)?.textContent?.trim();
  if (text) return text;

  const attr = attrByProp(block, propName);
  if (attr) return attr;

  return fallback;
}

function hrefByProp(block, propName) {
  const field = getFieldByProp(block, propName);
  if (field) {
    const href = field.querySelector('a[href]')?.getAttribute('href')?.trim();
    if (href) return href;

    const textValue = field.textContent?.trim() || '';
    if (textValue) return textValue;
  }

  const attr = attrByProp(block, propName);
  if (attr) return `${attr}`.trim();

  return '';
}

function normalizePath(path) {
  if (!path) return '';

  let normalized = `${path}`.trim();
  if (/^(?:https?:)?\/\//i.test(normalized)) {
    try {
      normalized = new URL(normalized, window.location.origin).pathname;
    } catch (e) {
      // Keep the authored value and normalize it as a path below.
    }
  }

  normalized = normalized
    .split(/[?#]/, 1)[0]
    .replace(/\/+/g, '/')
    .replace(/\/+$/, '')
    .replace(/\.html$/i, '')
    .replace(/^\/content\/inspiration-guide(?:\/|$)/i, '/');

  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
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

async function safeGetVisibleArticles() {
  try {
    return (await getArticles()).filter(isVisibleArticle);
  } catch (e) {
    return [];
  }
}

function toFallbackTitleFromPath(path) {
  const slug = normalizePath(path).split('/').filter(Boolean).pop() || '';
  if (!slug) return '';

  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getFallbackTitle(sourceProp, refPath) {
  const linkText = sourceProp?.querySelector('a')?.textContent?.trim() || '';
  if (linkText && !samePath(linkText, refPath)) return linkText;
  return toFallbackTitleFromPath(refPath);
}

async function getAutoArticles(mode) {
  const all = await safeGetVisibleArticles();
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

  const exactMatch = allArticles.find(
    (article) => normalizePath(article.path || article.href) === target,
  );
  if (exactMatch) return exactMatch;

  const targetSlug = target.split('/').filter(Boolean).pop() || '';
  if (!targetSlug) return null;

  return allArticles.find((article) => {
    const candidate = normalizePath(article.path || article.href);
    const candidateSlug = candidate.split('/').filter(Boolean).pop() || '';
    return candidateSlug === targetSlug;
  }) || null;
}

function getLegacyManualRows(block) {
  if (getPositionalConfigRows(block).length) return [];

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
  const allArticles = await safeGetVisibleArticles();

  const manualRefInputs = ['manualArticle1', 'manualArticle2', 'manualArticle3']
    .map((propName, index) => ({
      propName,
      index,
      refPath: hrefByProp(block, propName),
      sourceProp: getFieldByProp(block, propName),
    }));

  const hasManualRefInputs = manualRefInputs.some((item) => item.refPath);

  if (hasManualRefInputs) {
    const resolvedManualRefs = manualRefInputs
      .map((item) => {
        if (!item.refPath) return null;

        const article = findArticleByRef(allArticles, item.refPath);
        if (article) {
          return {
            ...toResolvedCardItem(article),
            sourceProp: item.sourceProp,
            sortOrder: item.index,
          };
        }

        const fallbackHref = normalizePath(item.refPath);
        const fallbackTitle = getFallbackTitle(item.sourceProp, item.refPath);
        if (!fallbackHref || !fallbackTitle) return null;

        return {
          href: fallbackHref,
          title: fallbackTitle,
          category: '',
          image: '',
          imageAlt: '',
          sourceProp: item.sourceProp,
          sortOrder: item.index,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, MAX_ITEMS);

    if (resolvedManualRefs.length) return resolvedManualRefs;
  }

  return getLegacyManualRows(block)
    .map(({ row, index }) => {
      const refPath = row.querySelector('a[href]')?.getAttribute('href')?.trim() || '';
      const article = findArticleByRef(allArticles, refPath);
      if (!article) return parseLegacyManualItem(row, index);

      return {
        ...toResolvedCardItem(article),
        sourceRow: row,
        sortOrder: index,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, MAX_ITEMS);
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
  hideSourceRows(getSourceRows(block));
  markInstrumentation(items, rendered);
}
