import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import formatLocalizedDate, { hasValidDate } from '../../scripts/iberostar/date-format.js';
import { getPlaceholder } from '../../scripts/iberostar/placeholders.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';
import {
  articleMatchesCategory,
  getArticles,
  getPageCategoryPath,
} from '../../scripts/inspiration-data.js';
import {
  toPageHref,
  toPublicPagePath as toPublicContentPath,
} from '../../scripts/iberostar/page-links.js';

const RESERVED_PROPS = new Set([
  'ctaLabel',
  'featuredArticlePath',
  'featuredArticleTitleHeading',
  'featuredBadge',
  'featuredLabel',
  'featuredLabelHeading',
  'filterCategory',
  'filter_tag1',
  'filter_tag2',
  'filter_tag3',
  'filter_tag4',
  'filter_tag5',
  'filterTags',
  'latestArticleTitleHeading',
  'latestLabel',
  'latestLabelHeading',
  'maxItems',
  'mode',
]);

const DATA_MODES = new Set(['manual', 'auto-category', 'auto-filter', 'auto-tag']);
const RENDER_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

const POSITIONAL_PROP_CANDIDATES = {
  featuredLabel: [0],
  latestLabel: [1, 2],
  mode: [2],
  maxItems: [3],
  featuredArticlePath: [2, 5],
  filterTags: [3, 8],
  featuredLabelHeading: [4, 1],
  latestLabelHeading: [5, 3],
  featuredBadge: [6, 4],
  featuredArticleTitleHeading: [7, 6],
  latestArticleTitleHeading: [8, 7],
  filterCategory: [10],
};

const FIELD_SELECTORS = {
  authorImage: 'article_authorImage',
  authorName: 'article_authorName',
  category: 'article_category',
  categoryUrl: 'article_categoryUrl',
  description: 'article_description',
  image: 'article_image',
  imageAlt: 'article_imageAlt',
  placement: 'article_placement',
  publicationDate: 'article_publicationDate',
  readTime: 'article_readTime',
  title: 'article_title',
  url: 'article_url',
};

function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('blog-split-list-rendered'));
}

function getCells(row) {
  if (!row) return [];
  if (row.children.length > 1) return [...row.children];

  const nested = [...(row.children[0]?.children || [])];
  return nested.length ? nested : [...row.children];
}

function getRowText(row) {
  return row?.textContent?.trim() || '';
}

function hasAuthoredProps(block) {
  return getSourceRows(block).some((row) => row.querySelector('[data-aue-prop]'));
}

function getLegacyMode(block) {
  const value = getRowText(getSourceRows(block)[2]).toLowerCase();
  return DATA_MODES.has(value) ? value : '';
}

function getPositionalRowValue(row, propName) {
  if (propName === 'featuredArticlePath') {
    return row?.querySelector('a[href]')?.getAttribute('href')?.trim() || getRowText(row);
  }

  return getRowText(row);
}

function isValidPositionalValue(propName, value, legacyMode) {
  const normalized = `${value || ''}`.trim();
  const lowered = normalized.toLowerCase();

  if (!normalized) return false;

  if (propName === 'mode') return DATA_MODES.has(lowered);
  if (propName === 'maxItems') return !!legacyMode && /^\d+$/.test(normalized);

  if (propName === 'featuredLabelHeading'
    || propName === 'latestLabelHeading'
    || propName === 'featuredArticleTitleHeading'
    || propName === 'latestArticleTitleHeading') {
    return RENDER_TAGS.has(lowered);
  }

  if (propName === 'featuredArticlePath') {
    return lowered.startsWith('/') || lowered.startsWith('http') || lowered.startsWith('urn:');
  }

  if (propName === 'filterCategory') {
    return lowered.includes(':');
  }

  if (propName === 'filterTags' || propName === 'featuredLabel' || propName === 'latestLabel' || propName === 'featuredBadge') {
    // A visible label is never a reference, so paths and urls belong to another field.
    const isReference = lowered.startsWith('/') || lowered.startsWith('http') || lowered.startsWith('urn:');
    return !isReference && !RENDER_TAGS.has(lowered) && !DATA_MODES.has(lowered);
  }

  return true;
}

function hasPositionalConfig(block) {
  const rows = getSourceRows(block);
  return rows.length >= 4 && rows.slice(0, 4).every((row) => getCells(row).length === 1);
}

function getPositionalTextValue(block, propName) {
  const rows = getSourceRows(block);
  const legacyMode = getLegacyMode(block);
  const candidates = POSITIONAL_PROP_CANDIDATES[propName] || [];

  if (!hasPositionalConfig(block)) return '';

  if (propName === 'mode') return legacyMode;

  return candidates
    .map((index) => getPositionalRowValue(rows[index], propName))
    .find((value) => isValidPositionalValue(propName, value, legacyMode)) || '';
}

function isAuthoredArticleRow(row) {
  const cells = getCells(row);

  if (row.children.length > 1) return true;

  if (row.getAttribute('data-aue-model') === 'blog-split-list-article') return true;

  if (row.querySelector('[data-aue-model="blog-split-list-article"]')) return true;

  if (cells.length > 3 && row.querySelector('a[href], img, picture')) return true;

  return [...row.querySelectorAll('[data-aue-prop]')]
    .some((el) => el.getAttribute('data-aue-prop')?.startsWith('article_'));
}

// The mode select renders as a plain config row whose position depends on the
// model revision the page was published with, so it is detected by value.
function getModeRowValue(block) {
  return getSourceRows(block)
    .filter((row) => !isAuthoredArticleRow(row))
    .map((row) => getRowText(row).toLowerCase())
    .find((text) => DATA_MODES.has(text)) || '';
}

function getPropElement(root, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  if (root?.matches?.(selector)) return root;
  return root?.querySelector?.(selector) || null;
}

function rowContainsReservedProp(row) {
  const ownProp = row.getAttribute('data-aue-prop');
  if (ownProp && RESERVED_PROPS.has(ownProp)) return true;

  return [...row.querySelectorAll('[data-aue-prop]')]
    .some((el) => RESERVED_PROPS.has(el.getAttribute('data-aue-prop')));
}

function getFieldByProp(block, propName) {
  return getSourceRows(block)
    .map((row) => getPropElement(row, propName))
    .find(Boolean) || null;
}

function getTextValue(block, propName, fallback = '') {
  // An instrumented field is authoritative: if the author cleared it, it stays
  // empty instead of leaking a neighbouring row through positional extraction.
  const el = getFieldByProp(block, propName);
  if (el) return el.textContent?.trim() || fallback;

  // Universal Editor can output mixed rows (some fields instrumented, others positional only).
  // Fall back to positional extraction when the specific prop is not instrumented.
  const positional = getPositionalTextValue(block, propName);
  if (positional) return positional;

  return fallback;
}

function getRenderTag(block, propName, fallback) {
  const configured = getTextValue(block, propName, fallback).toLowerCase();
  return RENDER_TAGS.has(configured) ? configured : fallback;
}

function getHrefFromElement(el) {
  if (!el) return '';

  const linked = el.querySelector('a[href]')?.getAttribute('href')?.trim();
  if (linked) return linked;

  return el.textContent?.trim() || '';
}

function getImageFromElement(el) {
  if (!el) return '';

  return el.querySelector('img')?.src
    || el.querySelector('a[href]')?.getAttribute('href')?.trim()
    || el.textContent?.trim()
    || '';
}

function normalizeList(value) {
  return `${value || ''}`
    .split(/[|,;\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getListValues(el) {
  const items = [...(el?.querySelectorAll?.('li') || [])]
    .flatMap((item) => {
      const text = item.textContent?.trim();
      const href = item.querySelector('a[href]')?.getAttribute('href')?.trim();
      return [text, href];
    })
    .filter(Boolean);

  if (items.length) return items;

  const links = [...(el?.querySelectorAll?.('a[href]') || [])]
    .flatMap((link) => [
      link.textContent?.trim(),
      link.getAttribute('href')?.trim(),
    ])
    .filter(Boolean);

  if (links.length) return links;

  return normalizeList(el?.textContent || '');
}

function getConfiguredTags(block) {
  const explicitTags = ['filter_tag1', 'filter_tag2', 'filter_tag3', 'filter_tag4', 'filter_tag5']
    .map((propName) => getTextValue(block, propName, ''))
    .filter(Boolean);
  const filterTagsField = getFieldByProp(block, 'filterTags');

  return [
    ...explicitTags,
    ...getListValues(filterTagsField),
    ...(!filterTagsField ? normalizeList(getTextValue(block, 'filterTags', '')) : []),
  ];
}

function normalizeSlug(value) {
  return `${value || ''}`
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getTagMatchKeys(value) {
  const raw = `${value || ''}`.trim().toLowerCase();
  if (!raw) return [];

  const withoutQuery = raw.split(/[?#]/, 1)[0];
  const withoutNamespace = withoutQuery.includes(':')
    ? withoutQuery.split(':').slice(1).join(':')
    : withoutQuery;
  const pathSegments = withoutNamespace.split('/').filter(Boolean);
  const leaf = pathSegments[pathSegments.length - 1] || '';

  return [
    normalizeSlug(raw),
    normalizeSlug(withoutQuery),
    normalizeSlug(withoutNamespace),
    normalizeSlug(leaf),
  ].filter(Boolean);
}

function buildTagKeySet(values = []) {
  return new Set(values.flatMap((value) => getTagMatchKeys(value)));
}

function normalizeUrl(value) {
  return `${value || ''}`.trim();
}

function normalizeValue(value) {
  const normalized = normalizeUrl(value);
  return normalized.toLowerCase() === 'undefined' ? '' : normalized;
}

function toPathKey(value) {
  return normalizeUrl(value)
    .split(/[?#]/, 1)[0]
    .replace(/^urn:[^:]*:/i, '')
    .replace(/\.html$/i, '')
    .split('/')
    .map(normalizeSlug)
    .filter(Boolean)
    .join('/');
}

function samePath(a, b) {
  const left = toPathKey(a);
  const right = toPathKey(b);

  if (!left || !right) return false;
  if (left === right) return true;

  return (left.includes('/') && right.endsWith(`/${left}`))
    || (right.includes('/') && left.endsWith(`/${right}`));
}

function getCurrentLocale() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const locale = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  return locale || document.documentElement.lang || 'en';
}

function formatDate(value) {
  if (!value) return '';
  if (!hasValidDate(value)) return value;

  return formatLocalizedDate(value, {
    locale: getCurrentLocale(),
    dateStyle: 'long',
  });
}

function getCurrentPathSegment(kind) {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const idx = segments.indexOf(kind);
  return idx > -1 ? segments[idx + 1] || '' : '';
}

function getManualRows(block) {
  const rows = getSourceRows(block);
  const manualRows = rows.filter(isAuthoredArticleRow);

  if (manualRows.length) return manualRows;

  if (hasAuthoredProps(block)) return [];

  const contentRows = rows.slice(hasPositionalConfig(block) ? 4 : 0);
  return contentRows.some((row) => getCells(row).length > 3)
    ? contentRows.filter((row) => !rowContainsReservedProp(row))
    : [];
}

// Manually added article rows always win, regardless of the Source selector: an
// author who drops articles into the block should not also have to remember to
// switch Source to "Manual" for them to show up.
function getConfiguredMode(block) {
  if (getManualRows(block).length > 0) return 'manual';

  const configured = (getTextValue(block, 'mode', '')
    || getModeRowValue(block)
    || block.getAttribute('data-mode')
    || '').toLowerCase();

  return configured || 'auto-filter';
}

function getConfiguredMaxItems(block) {
  const fromProp = Number.parseInt(getTextValue(block, 'maxItems', ''), 10);
  if (!Number.isNaN(fromProp) && fromProp > 0) return fromProp;

  const fromAttr = Number.parseInt(block.getAttribute('data-max-items') || '', 10);
  return !Number.isNaN(fromAttr) && fromAttr > 0 ? fromAttr : 3;
}

function getManualField(row, propName, cells, index) {
  const byProp = getPropElement(row, propName);
  if (byProp) return byProp;
  return cells[index] || null;
}

function normalizeArticle(article = {}, index = 0) {
  const rawUrl = normalizeValue(article.url || article.href || article.path);
  const rawPath = normalizeValue(article.path) || rawUrl;
  const href = toPublicContentPath(rawUrl) || '#';
  const path = toPublicContentPath(rawPath) || href;
  const title = normalizeValue(article.title);
  const description = normalizeValue(article.description || article.summary);
  const category = normalizeValue(article.category);
  const categorySlug = normalizeValue(article.categorySlug || normalizeSlug(category));

  return {
    id: `${normalizeValue(article.id) || path || `article-${index + 1}`}`,
    authorImage: normalizeValue(article.authorImage),
    authorName: normalizeValue(article.authorName || article.author),
    category,
    categoryPath: normalizeValue(article.categoryPath),
    categorySlug,
    categoryUrl: normalizeValue(article.categoryUrl) || (categorySlug ? `/inspiration-guide/category/${categorySlug}` : ''),
    description,
    href,
    image: normalizeValue(article.image),
    imageAlt: normalizeValue(article.imageAlt) || title,
    path,
    publicationDate: normalizeValue(article.publicationDate || article.publishDate),
    readTime: normalizeValue(article.readTime) || (article.readingTime ? `${article.readingTime} min` : ''),
    tags: Array.isArray(article.tags) ? article.tags.map((tag) => `${tag}`.toLowerCase()) : [],
    title,
  };
}

function fromManualRows(block) {
  return getManualRows(block)
    .map((row, index) => {
      const cells = getCells(row);
      if (!cells.length) return null;

      const authorImageField = getManualField(row, FIELD_SELECTORS.authorImage, cells, 10);
      const authorNameField = getManualField(row, FIELD_SELECTORS.authorName, cells, 9);
      const categoryField = getManualField(row, FIELD_SELECTORS.category, cells, 5);
      const categoryUrlField = getManualField(row, FIELD_SELECTORS.categoryUrl, cells, 6);
      const descriptionField = getManualField(row, FIELD_SELECTORS.description, cells, 2);
      const imageField = getManualField(row, FIELD_SELECTORS.image, cells, 3);
      const imageAltField = getManualField(row, FIELD_SELECTORS.imageAlt, cells, 4);
      const publicationDateField = getManualField(row, FIELD_SELECTORS.publicationDate, cells, 7);
      const readTimeField = getManualField(row, FIELD_SELECTORS.readTime, cells, 8);
      const titleField = getManualField(row, FIELD_SELECTORS.title, cells, 1);
      const urlField = getManualField(row, FIELD_SELECTORS.url, cells, 11);
      const article = normalizeArticle({
        authorImage: getImageFromElement(authorImageField),
        authorName: authorNameField?.textContent?.trim() || '',
        category: categoryField?.textContent?.trim() || '',
        categoryUrl: getHrefFromElement(categoryUrlField),
        description: descriptionField?.textContent?.trim() || '',
        image: getImageFromElement(cells.length <= 4 ? cells[0] : imageField),
        imageAlt: imageAltField?.textContent?.trim() || '',
        publicationDate: publicationDateField?.textContent?.trim() || '',
        readTime: readTimeField?.textContent?.trim() || '',
        title: titleField?.textContent?.trim() || '',
        url: getHrefFromElement(urlField || cells[3]),
      }, index);

      const placementField = cells.length <= 4
        ? null
        : getManualField(row, FIELD_SELECTORS.placement, cells, 0);
      const placement = placementField?.textContent?.trim().toLowerCase()
        || (index === 0 ? 'featured' : 'latest');

      return article.title || article.image || article.href !== '#'
        ? { ...article, placement }
        : null;
    })
    .filter(Boolean);
}

// Category pages emit `page-type=category` metadata; nested subcategory pages
// may miss the category metadata, so the `/category/` URL segment is the fallback.
function isCategoryPageContext() {
  const pageType = document.querySelector('meta[name="page-type"]')?.content?.trim().toLowerCase() || '';
  return pageType === 'category' || !!getCurrentPathSegment('category');
}

function filterArticles(articles, block, mode) {
  const configuredCategory = getTextValue(block, 'filterCategory', '');
  const configuredTags = getConfiguredTags(block);
  const configuredTagKeys = buildTagKeySet(configuredTags);
  const contextTag = normalizeSlug(getCurrentPathSegment('tag'));

  // Hierarchical target: on parent category pages the page context resolves to the
  // full category path, so articles of any child subcategory also match. Auto-filter
  // only inherits the page context on category pages to keep other pages unscoped.
  const contextCategory = (mode === 'auto-category' || isCategoryPageContext())
    ? getPageCategoryPath()
    : '';
  const categoryTarget = configuredCategory || contextCategory;

  return articles.filter((article) => {
    const item = normalizeArticle(article);
    const articleTagKeys = buildTagKeySet([
      ...(item.tags || []),
      item.category,
      item.categorySlug,
      item.categoryPath,
      item.categoryUrl,
    ]);
    const categoryMatches = !categoryTarget || articleMatchesCategory(item, categoryTarget);
    const tagMatches = !configuredTagKeys.size
      || [...configuredTagKeys].some((tag) => articleTagKeys.has(tag));

    if (mode === 'auto-category') {
      return categoryMatches;
    }

    if (mode === 'auto-tag') {
      const targetTags = configuredTags.length ? configuredTags : [contextTag].filter(Boolean);
      const targetTagKeys = buildTagKeySet(targetTags);
      return !targetTags.length
        || [...targetTagKeys].some((tag) => articleTagKeys.has(tag));
    }

    return categoryMatches && tagMatches;
  });
}

function sortArticles(items) {
  return [...items].sort((a, b) => {
    const dateA = Date.parse(a.publicationDate || '');
    const dateB = Date.parse(b.publicationDate || '');

    if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
    if (Number.isNaN(dateA)) return 1;
    if (Number.isNaN(dateB)) return -1;
    return dateB - dateA;
  });
}

function isRenderableArticle(article) {
  const item = normalizeArticle(article);
  return Boolean(item.title && item.title.toLowerCase() !== 'untitled' && item.href && item.href !== '#');
}

function getFeaturedReference(block) {
  return getHrefFromElement(getFieldByProp(block, 'featuredArticlePath'))
    || getTextValue(block, 'featuredArticlePath', '');
}

async function getAutoItems(block, mode, maxItems) {
  const articles = (await getArticles())
    .map(normalizeArticle)
    .filter(isRenderableArticle);
  const featuredPath = toPublicContentPath(getFeaturedReference(block));
  const sortedArticles = sortArticles(articles);
  const filtered = sortArticles(filterArticles(articles, block, mode));
  const featured = sortedArticles.find((article) => (
    samePath(toPublicContentPath(article.href), featuredPath)
    || samePath(toPublicContentPath(article.path), featuredPath)
    || article.id === featuredPath
  )) || filtered[0] || sortedArticles[0];

  if (!featured) return [];

  const latest = filtered
    .filter((article) => (
      article !== featured
      && !samePath(toPublicContentPath(article.href), toPublicContentPath(featured.href))
      && !samePath(toPublicContentPath(article.path), toPublicContentPath(featured.path))
      && article.id !== featured.id
    ))
    .slice(0, Math.max(maxItems - 1, 0));

  return [featured, ...latest];
}

function hideSource(block) {
  getSourceRows(block).forEach((row) => {
    row.classList.add('blog-split-list-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

function isAuthoringPage(block) {
  return Boolean(block.closest('[data-aue-resource]') || document.querySelector('[data-aue-resource]'));
}

function appendAuthoringPlaceholder(block) {
  if (!isAuthoringPage(block)) return;

  const placeholder = document.createElement('div');
  placeholder.className = 'blog-split-list-rendered blog-split-list-empty';

  const message = document.createElement('p');
  message.textContent = 'Blog Split List: add Article items, or pick a Featured Article Page. Automatic listings are resolved from the published article index, so they only render on preview and publish.';
  placeholder.append(message);
  block.append(placeholder);
}

function createEyebrow(text, tagName = 'p') {
  if (!text) return null;

  const eyebrow = document.createElement(tagName);
  eyebrow.className = 'blog-split-list-eyebrow';
  eyebrow.textContent = text;
  return eyebrow;
}

function createCta(href, label, className) {
  const cta = document.createElement('a');
  cta.className = className;
  cta.href = toPageHref(href) || '#';
  const text = document.createElement('span');
  text.textContent = label;
  const icon = document.createElement('i');
  icon.className = 'ibh-icon-arrow-forward';
  cta.append(text, icon);
  return cta;
}

function appendImage(parent, item, imageOptions) {
  if (!item.image) return;

  const imageLink = document.createElement('a');
  imageLink.href = toPageHref(item.href);
  imageLink.setAttribute('aria-label', item.title);

  const media = createResponsiveImage(
    item.image,
    item.imageAlt || item.title,
    imageOptions,
  );

  media.addEventListener('media:image-unavailable', () => {
    parent.remove();
  });

  imageLink.append(media);
  parent.append(imageLink);
}

function appendMeta(parent, item, includeDate = false) {
  const meta = document.createElement('div');
  meta.className = 'blog-split-meta';

  if (item.category) {
    const category = item.categoryUrl ? document.createElement('a') : document.createElement('span');
    category.className = 'blog-split-category';
    category.textContent = item.category;
    if (item.categoryUrl) category.href = toPageHref(item.categoryUrl);
    meta.append(category);
  }

  if (includeDate && item.publicationDate) {
    const date = document.createElement('time');
    date.dateTime = item.publicationDate;
    date.textContent = formatDate(item.publicationDate);
    meta.append(date);
  }

  if (includeDate && item.readTime) {
    const readTime = document.createElement('span');
    readTime.className = 'blog-split-read-time';
    const icon = document.createElement('i');
    icon.className = 'ibh-icon-schedule';
    readTime.append(icon, document.createTextNode(item.readTime));
    meta.append(readTime);
  }

  if (meta.children.length) parent.append(meta);
}

function appendAuthor(parent, item) {
  if (!item.authorName && !item.authorImage) return;

  const author = document.createElement('div');
  author.className = 'blog-split-author';

  if (item.authorImage) {
    const avatar = createResponsiveImage(item.authorImage, item.authorName || '', {
      preset: 'blog-split-list-author',
    });
    avatar.addEventListener('media:image-unavailable', () => avatar.remove());
    author.append(avatar);
  }

  if (item.authorName) {
    const name = document.createElement('p');
    name.textContent = item.authorName;
    author.append(name);
  }

  parent.append(author);
}

function createFeatured(item, ctaLabel, badgeLabel, titleTagName = 'h2') {
  const article = document.createElement('article');
  article.className = 'blog-split-featured';

  if (item.image) {
    const media = document.createElement('div');
    media.className = 'blog-split-media';
    appendImage(media, item, {
      eager: true,
      preset: 'blog-split-list-featured',
    });

    if (badgeLabel) {
      const badge = document.createElement('span');
      badge.className = 'blog-split-badge';
      badge.textContent = badgeLabel;
      media.append(badge);
    }

    article.append(media);
  }

  const body = document.createElement('div');
  body.className = 'blog-split-body';

  appendMeta(body, item, true);

  const title = document.createElement(titleTagName);
  const link = document.createElement('a');
  link.href = toPageHref(item.href);
  link.textContent = item.title;
  title.append(link);
  body.append(title);

  appendAuthor(body, item);

  if (item.description) {
    const summary = document.createElement('p');
    summary.className = 'blog-split-description';
    summary.textContent = item.description;
    body.append(summary);
  }

  body.append(createCta(item.href, ctaLabel, 'blog-split-featured-cta'));
  article.append(body);
  return article;
}

function createListItem(item, ctaLabel, titleTagName = 'h3') {
  const li = document.createElement('li');
  li.className = 'blog-split-item';

  const article = document.createElement('article');

  if (item.image) {
    const media = document.createElement('div');
    media.className = 'blog-split-item-media';
    appendImage(media, item, {
      preset: 'blog-split-list-item',
    });
    article.append(media);
  }

  const body = document.createElement('div');
  body.className = 'blog-split-item-body';
  appendMeta(body, item);

  const heading = document.createElement(titleTagName);
  const link = document.createElement('a');
  link.href = toPageHref(item.href);
  link.textContent = item.title;
  heading.append(link);
  body.append(heading);

  if (item.description) {
    const description = document.createElement('p');
    description.className = 'blog-split-description';
    description.textContent = item.description;
    body.append(description);
  }

  body.append(createCta(item.href, ctaLabel, 'blog-split-item-cta'));

  article.append(body);
  li.append(article);
  return li;
}

function splitManualItems(items, maxItems, featuredReference = '') {
  const featuredPath = toPublicContentPath(featuredReference);
  const referenced = featuredPath
    ? items.find((item) => samePath(item.href, featuredPath) || samePath(item.path, featuredPath))
    : null;
  const featured = items.find((item) => item.placement === 'featured') || referenced || items[0];
  if (!featured) return [];

  const latest = items
    .filter((item) => item !== featured)
    .sort((left, right) => {
      const leftDate = Date.parse(left.publicationDate || '');
      const rightDate = Date.parse(right.publicationDate || '');

      if (Number.isNaN(leftDate) && Number.isNaN(rightDate)) return 0;
      if (Number.isNaN(leftDate)) return 1;
      if (Number.isNaN(rightDate)) return -1;
      return rightDate - leftDate;
    })
    .slice(0, Math.max(maxItems - 1, 0));

  return [featured, ...latest];
}

export default async function decorate(block) {
  block.querySelectorAll(':scope > .blog-split-list-rendered').forEach((rendered) => rendered.remove());

  const mode = getConfiguredMode(block);
  const maxItems = getConfiguredMaxItems(block);
  // Authored headings are optional: an empty field renders no heading at all,
  // so a page can show a single title instead of one per column.
  const featuredTitle = getTextValue(block, 'featuredLabel', '');
  const featuredTitleTag = getRenderTag(block, 'featuredLabelHeading', 'p');
  const latestTitle = getTextValue(block, 'latestLabel', '');
  const latestTitleTag = getRenderTag(block, 'latestLabelHeading', 'p');
  const featuredBadge = getTextValue(block, 'featuredBadge', '');
  const featuredArticleTitleTag = getRenderTag(block, 'featuredArticleTitleHeading', 'h2');
  const latestArticleTitleTag = getRenderTag(block, 'latestArticleTitleHeading', 'h3');
  const ctaLabel = getTextValue(block, 'ctaLabel', '')
    || await getTranslation('readArticle', 'Leer artículo')
    || await getPlaceholder('readArticle', 'Leer artículo');
  const featuredReference = getFeaturedReference(block);
  let items = mode === 'manual'
    ? splitManualItems(fromManualRows(block), maxItems, featuredReference)
    : await getAutoItems(block, mode, maxItems);

  // Manual source without authored article rows still honours the featured
  // article reference, resolving the rest of the list from the article index.
  if (!items.length && mode === 'manual' && featuredReference) {
    items = await getAutoItems(block, 'auto-filter', maxItems);
  }

  hideSource(block);

  if (!items.length) {
    appendAuthoringPlaceholder(block);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'blog-split-list-rendered';
  // With at least one column heading both columns share a heading row, so the
  // media of each column stays aligned even when only one title is authored.
  if (featuredTitle || latestTitle) wrapper.classList.add('blog-split-list-has-headings');

  const featuredColumn = document.createElement('section');
  featuredColumn.className = 'blog-split-list-featured-column';
  featuredColumn.append(
    ...[
      createEyebrow(featuredTitle, featuredTitleTag),
      createFeatured(items[0], ctaLabel, featuredBadge, featuredArticleTitleTag),
    ].filter(Boolean),
  );
  wrapper.append(featuredColumn);

  if (items.length > 1) {
    const latestColumn = document.createElement('section');
    latestColumn.className = 'blog-split-list-latest-column';
    const latestEyebrow = createEyebrow(latestTitle, latestTitleTag);
    if (latestEyebrow) latestColumn.append(latestEyebrow);

    const list = document.createElement('ul');
    list.className = 'blog-split-side-list';
    items.slice(1).forEach((item) => {
      list.append(createListItem(item, ctaLabel, latestArticleTitleTag));
    });

    latestColumn.append(list);
    wrapper.append(latestColumn);
  }

  block.append(wrapper);
}
