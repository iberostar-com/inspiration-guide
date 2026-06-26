import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import formatLocalizedDate, { hasValidDate } from '../../scripts/iberostar/date-format.js';
import { getPlaceholder } from '../../scripts/iberostar/placeholders.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';
import { getArticles } from '../../scripts/inspiration-data.js';

const RESERVED_PROPS = new Set([
  'ctaLabel',
  'featuredArticlePath',
  'featuredBadge',
  'featuredLabel',
  'filterCategory',
  'filter_tag1',
  'filter_tag2',
  'filter_tag3',
  'filter_tag4',
  'filter_tag5',
  'filterTags',
  'latestLabel',
  'maxItems',
  'mode',
]);

const DATA_MODES = new Set(['manual', 'auto-category', 'auto-filter', 'auto-tag']);

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

function hasPositionalConfig(block) {
  const rows = getSourceRows(block);
  return rows.length >= 4 && rows.slice(0, 4).every((row) => getCells(row).length === 1);
}

function getPositionalTextValue(block, propName) {
  const rows = getSourceRows(block);
  const legacyMode = getLegacyMode(block);

  if (!hasPositionalConfig(block)) return '';

  if (propName === 'featuredLabel') return getRowText(rows[0]);
  if (propName === 'latestLabel') return getRowText(rows[1]);
  if (propName === 'mode') return legacyMode;
  if (propName === 'maxItems' && legacyMode) return getRowText(rows[3]);
  if (propName === 'featuredArticlePath' && !legacyMode) {
    return rows[2]?.querySelector('a[href]')?.getAttribute('href')?.trim() || getRowText(rows[2]);
  }
  if (propName === 'filterTags' && !legacyMode) return getRowText(rows[3]);

  return '';
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
  const el = getFieldByProp(block, propName);
  const text = el?.textContent?.trim();
  if (text) return text;

  if (!hasAuthoredProps(block)) {
    return getPositionalTextValue(block, propName) || fallback;
  }

  return fallback;
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
    .split(/[|,;]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getListValues(el) {
  const items = [...(el?.querySelectorAll?.('li') || [])]
    .map((item) => item.textContent?.trim())
    .filter(Boolean);

  return items.length ? items : normalizeList(el?.textContent || '');
}

function getConfiguredTags(block) {
  const explicitTags = ['filter_tag1', 'filter_tag2', 'filter_tag3', 'filter_tag4', 'filter_tag5']
    .map((propName) => getTextValue(block, propName, ''))
    .filter(Boolean);
  const filterTagsField = getFieldByProp(block, 'filterTags');
  const positionalTagsField = !filterTagsField
    && !hasAuthoredProps(block)
    && hasPositionalConfig(block)
    ? getSourceRows(block)[3]
    : null;

  return [
    ...explicitTags,
    ...getListValues(filterTagsField),
    ...getListValues(positionalTagsField),
    ...(!filterTagsField && !positionalTagsField ? normalizeList(getTextValue(block, 'filterTags', '')) : []),
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

function normalizeUrl(value) {
  return `${value || ''}`.trim();
}

function normalizeValue(value) {
  const normalized = normalizeUrl(value);
  return normalized.toLowerCase() === 'undefined' ? '' : normalized;
}

function samePath(a, b) {
  const left = normalizeUrl(a).replace(/\/$/, '');
  const right = normalizeUrl(b).replace(/\/$/, '');
  return !!left && !!right && left === right;
}

function toPublicContentPath(value) {
  const path = normalizeUrl(value)
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/\.html$/, '');
  const guideIndex = path.indexOf('/inspiration-guide/');

  if (guideIndex > -1 && path.startsWith('/content/')) {
    return path.slice(guideIndex);
  }

  return path;
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
  if (!hasAuthoredProps(block)) {
    return rows.slice(hasPositionalConfig(block) ? 4 : 0);
  }

  return rows.filter((row) => !rowContainsReservedProp(row));
}

function getConfiguredMode(block) {
  const configured = getTextValue(block, 'mode', block.getAttribute('data-mode') || '').toLowerCase();
  const hasManualItems = getManualRows(block).length > 0;

  if (configured === 'manual' && !hasManualItems) return 'auto-filter';
  if (configured) return configured;
  return hasManualItems ? 'manual' : 'auto-filter';
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

function filterArticles(articles, block, mode) {
  const configuredCategory = normalizeSlug(getTextValue(block, 'filterCategory', ''));
  const configuredTags = getConfiguredTags(block);
  const contextCategory = normalizeSlug(getCurrentPathSegment('category'));
  const contextTag = normalizeSlug(getCurrentPathSegment('tag'));

  return articles.filter((article) => {
    const item = normalizeArticle(article);
    const articleTags = item.tags.map(normalizeSlug);
    const category = normalizeSlug(item.categorySlug || item.category);
    const categoryMatches = !configuredCategory || category === configuredCategory;
    const tagMatches = !configuredTags.length
      || configuredTags.some((tag) => articleTags.includes(normalizeSlug(tag)));

    if (mode === 'auto-category') {
      const target = configuredCategory || contextCategory;
      return !target || category === target;
    }

    if (mode === 'auto-tag') {
      const targetTags = configuredTags.length ? configuredTags : [contextTag].filter(Boolean);
      return !targetTags.length
        || targetTags.some((tag) => articleTags.includes(normalizeSlug(tag)));
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

async function getAutoItems(block, mode, maxItems) {
  const articles = (await getArticles()).map(normalizeArticle);
  const featuredPath = toPublicContentPath(
    getHrefFromElement(getFieldByProp(block, 'featuredArticlePath'))
      || getTextValue(block, 'featuredArticlePath', ''),
  );
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

function createEyebrow(text) {
  const eyebrow = document.createElement('p');
  eyebrow.className = 'blog-split-list-eyebrow';
  eyebrow.textContent = text;
  return eyebrow;
}

function createCta(href, label, className) {
  const cta = document.createElement('a');
  cta.className = className;
  cta.href = href || '#';
  cta.textContent = label;
  return cta;
}

function appendImage(parent, item, imageOptions) {
  if (!item.image) return;

  const imageLink = document.createElement('a');
  imageLink.href = item.href;
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
    if (item.categoryUrl) category.href = item.categoryUrl;
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
    readTime.textContent = item.readTime;
    meta.append(readTime);
  }

  if (meta.children.length) parent.append(meta);
}

function appendAuthor(parent, item) {
  if (!item.authorName && !item.authorImage) return;

  const author = document.createElement('div');
  author.className = 'blog-split-author';

  if (item.authorImage) {
    const avatar = document.createElement('img');
    avatar.src = item.authorImage;
    avatar.alt = item.authorName || '';
    avatar.loading = 'lazy';
    avatar.addEventListener('error', () => avatar.remove());
    author.append(avatar);
  }

  if (item.authorName) {
    const name = document.createElement('p');
    name.textContent = item.authorName;
    author.append(name);
  }

  parent.append(author);
}

function createFeatured(item, ctaLabel, badgeLabel) {
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

  const title = document.createElement('h2');
  const link = document.createElement('a');
  link.href = item.href;
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

function createListItem(item, ctaLabel) {
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

  const heading = document.createElement('h3');
  const link = document.createElement('a');
  link.href = item.href;
  link.textContent = item.title;
  heading.append(link);
  body.append(heading);
  body.append(createCta(item.href, ctaLabel, 'blog-split-item-cta'));

  article.append(body);
  li.append(article);
  return li;
}

function splitManualItems(items, maxItems) {
  const featured = items.find((item) => item.placement === 'featured') || items[0];
  if (!featured) return [];

  const latest = items
    .filter((item) => item !== featured)
    .slice(0, Math.max(maxItems - 1, 0));

  return [featured, ...latest];
}

export default async function decorate(block) {
  block.querySelector(':scope > .blog-split-list-rendered')?.remove();

  const mode = getConfiguredMode(block);
  const maxItems = getConfiguredMaxItems(block);
  const featuredTitle = getTextValue(block, 'featuredLabel', '')
    || await getTranslation('featuredColumnTitle', 'En portada')
    || await getPlaceholder('featuredColumnTitle', 'En portada');
  const latestTitle = getTextValue(block, 'latestLabel', '')
    || await getTranslation('latestColumnTitle', 'Últimas publicaciones')
    || await getPlaceholder('latestColumnTitle', 'Últimas publicaciones');
  const featuredBadge = getTextValue(block, 'featuredBadge', '')
    || await getTranslation('featuredArticle', 'Artículo destacado')
    || await getPlaceholder('featuredArticle', 'Artículo destacado');
  const ctaLabel = getTextValue(block, 'ctaLabel', '')
    || await getTranslation('readArticle', 'Leer artículo')
    || await getPlaceholder('readArticle', 'Leer artículo');
  const items = mode === 'manual'
    ? splitManualItems(fromManualRows(block), maxItems)
    : await getAutoItems(block, mode, maxItems);

  if (!items.length) {
    // Silently exit if no items; block remains undecorated or shows empty
    return;
  }

  hideSource(block);

  const wrapper = document.createElement('div');
  wrapper.className = 'blog-split-list-rendered';

  const featuredColumn = document.createElement('section');
  featuredColumn.className = 'blog-split-list-featured-column';
  featuredColumn.append(
    createEyebrow(featuredTitle),
    createFeatured(items[0], ctaLabel, featuredBadge),
  );
  wrapper.append(featuredColumn);

  if (items.length > 1) {
    const latestColumn = document.createElement('section');
    latestColumn.className = 'blog-split-list-latest-column';
    latestColumn.append(createEyebrow(latestTitle));

    const list = document.createElement('ul');
    list.className = 'blog-split-side-list';
    items.slice(1).forEach((item) => list.append(createListItem(item, ctaLabel)));

    latestColumn.append(list);
    wrapper.append(latestColumn);
  }

  block.append(wrapper);
}
