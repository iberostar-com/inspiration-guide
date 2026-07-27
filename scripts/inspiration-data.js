import { tagTitle } from './iberostar/tag-label.js';
import { taxonomyTitle } from './iberostar/taxonomy.js';

const MOCK_ARTICLES = [
  {
    id: 'article-001',
    title: 'Guia de playas secretas del Caribe',
    summary:
      'Recorre arenales poco conocidos y rutas para disfrutar del Caribe sin masificaciones.',
    image: 'https://picsum.photos/seed/article-001/1200/800',
    author: 'author-001',
    category: 'destinos',
    subcategory: 'playas',
    publishDate: '2026-06-01',
    readingTime: 5,
    tags: ['travel', 'nature'],
  },
  {
    id: 'article-002',
    title: 'Gastronomia caribena: sabores autenticos',
    summary:
      'Mercados, platos tradicionales y productos locales de la cocina caribena.',
    image: 'https://picsum.photos/seed/article-002/1200/800',
    author: 'author-002',
    category: 'destinos',
    subcategory: 'playas',
    publishDate: '2026-06-05',
    readingTime: 7,
    tags: ['food', 'travel'],
  },
  {
    id: 'article-003',
    title: 'Alpinismo en los Pirineos',
    summary:
      'Etapas, equipo basico y recomendaciones de seguridad para una travesia de montana.',
    image: 'https://picsum.photos/seed/article-003/1200/800',
    author: 'author-001',
    category: 'destinos',
    subcategory: 'montana',
    publishDate: '2026-06-08',
    readingTime: 6,
    tags: ['adventure', 'nature'],
  },
  {
    id: 'article-004',
    title: 'Ciudades europeas para tu proximo viaje',
    summary:
      'Escapadas urbanas con propuestas culturales, gastronomicas y de barrio.',
    image: 'https://picsum.photos/seed/article-004/1200/800',
    author: 'author-002',
    category: 'destinos',
    subcategory: 'ciudad',
    publishDate: '2026-06-10',
    readingTime: 4,
    tags: ['travel', 'culture'],
  },
  {
    id: 'article-005',
    title: 'Senderismo en la ruta del Inca',
    summary:
      'Planifica el recorrido con tiempos realistas, aclimatacion y puntos clave.',
    image: 'https://picsum.photos/seed/article-005/1200/800',
    author: 'author-001',
    category: 'destinos',
    subcategory: 'montana',
    publishDate: '2026-06-12',
    readingTime: 8,
    tags: ['adventure', 'culture'],
  },
  {
    id: 'article-006',
    title: 'Los mejores mercados de abastos del mundo',
    summary:
      'Mercados emblematicos para descubrir cultura local a traves de sus productos.',
    image: 'https://picsum.photos/seed/article-006/1200/800',
    author: 'author-002',
    category: 'destinos',
    subcategory: 'ciudad',
    publishDate: '2026-06-14',
    readingTime: 5,
    tags: ['food', 'lifestyle'],
  },
  {
    id: 'article-007',
    title: 'Yoga frente al mar: encuentra tu equilibrio',
    summary:
      'Hacer yoga en la playa incrementa los beneficios fisicos, emocionales y espirituales de esta filosofia ancestral.',
    image: 'https://picsum.photos/seed/article-007/1200/800',
    author: 'author-001',
    category: 'deportes',
    subcategory: 'bienestar',
    publishDate: '2026-06-16',
    readingTime: 8,
    tags: ['travel', 'lifestyle'],
  },
  {
    id: 'article-008',
    title: 'Los 12 deportes extremos mas practicados del mundo',
    summary:
      'Los deportes extremos mas practicados te llevaran por tierra, agua y aire para descargar adrenalina en tus viajes.',
    image: 'https://picsum.photos/seed/article-008/1200/800',
    author: 'author-002',
    category: 'deportes',
    subcategory: 'aventura',
    publishDate: '2026-06-18',
    readingTime: 8,
    tags: ['travel', 'adventure'],
  },
  {
    id: 'article-009',
    title: 'Todo lo que debes saber para bucear en Cozumel',
    summary:
      'La practica del buceo en Cozumel es para muchas personas mucho mas que una filosofia de vida.',
    image: 'https://picsum.photos/seed/article-009/1200/800',
    author: 'author-001',
    category: 'destinos',
    subcategory: 'playas',
    publishDate: '2026-06-20',
    readingTime: 8,
    tags: ['travel', 'nature'],
  },
  {
    id: 'article-010',
    title: 'Conoce Portugal en bici: las mejores rutas',
    summary:
      'Descubrir Portugal en bici siempre es buena idea: un pais costero lleno de paisajes increibles que se disfrutan en movimiento.',
    image: 'https://picsum.photos/seed/article-010/1200/800',
    author: 'author-002',
    category: 'destinos',
    subcategory: 'ciudad',
    publishDate: '2026-06-22',
    readingTime: 8,
    tags: ['travel', 'culture'],
  },
  {
    id: 'article-011',
    title: 'Escapadas romanticas para dos',
    summary:
      'Destinos con encanto para desconectar en pareja y vivir experiencias inolvidables.',
    image: 'https://picsum.photos/seed/article-011/1200/800',
    author: 'author-001',
    category: 'destinos',
    subcategory: 'ciudad',
    publishDate: '2026-06-24',
    readingTime: 6,
    tags: ['travel', 'lifestyle'],
  },
  {
    id: 'article-012',
    title: 'Rutas de senderismo con vistas al oceano',
    summary:
      'Caminos costeros para todos los niveles con paradas para disfrutar del paisaje.',
    image: 'https://picsum.photos/seed/article-012/1200/800',
    author: 'author-002',
    category: 'deportes',
    subcategory: 'montana',
    publishDate: '2026-06-26',
    readingTime: 7,
    tags: ['travel', 'nature'],
  },
  {
    id: 'article-013',
    title: 'Islas paradisiacas que aun puedes descubrir',
    summary:
      'Rincones poco masificados donde el mar turquesa y la calma son los protagonistas.',
    image: 'https://picsum.photos/seed/article-013/1200/800',
    author: 'author-001',
    category: 'destinos',
    subcategory: 'playas',
    publishDate: '2026-06-28',
    readingTime: 5,
    tags: ['travel', 'nature'],
  },
  {
    id: 'article-014',
    title: 'Viajar en familia: guia para no morir en el intento',
    summary:
      'Consejos practicos para que las vacaciones con ninos sean un exito de principio a fin.',
    image: 'https://picsum.photos/seed/article-014/1200/800',
    author: 'author-002',
    category: 'destinos',
    subcategory: 'ciudad',
    publishDate: '2026-06-30',
    readingTime: 6,
    tags: ['travel', 'culture'],
  },
  {
    id: 'article-015',
    title: 'Los mejores atardeceres del Mediterraneo',
    summary:
      'Miradores y calas donde el cielo se tine de colores al caer la tarde.',
    image: 'https://picsum.photos/seed/article-015/1200/800',
    author: 'author-001',
    category: 'destinos',
    subcategory: 'playas',
    publishDate: '2026-07-02',
    readingTime: 4,
    tags: ['travel', 'lifestyle'],
  },
];

const AEM_REQUEST_CACHE = new Map();
const ARTICLE_PATH_WARNINGS = new Set();

function isLocalhost() {
  return window.location.hostname.includes('localhost');
}

function normalizeTag(tag) {
  return String(tag || '')
    .trim()
    .toLowerCase();
}

function normalizeSlug(value) {
  return normalizeTag(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getCurrentLanguageRoot() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const locale = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  return locale ? `/${locale.toLowerCase()}` : '';
}

function warnInvalidArticlePathOnce(path) {
  const key = `${path || ''}`.trim();
  if (!key || ARTICLE_PATH_WARNINGS.has(key)) return;
  ARTICLE_PATH_WARNINGS.add(key);
  // eslint-disable-next-line no-console
  console.warn('[inspiration-data] Invalid article path', { path });
}

function toPathname(value) {
  const raw = `${value || ''}`.trim();
  if (!raw) return '';

  if (/^(?:https?:)?\/\//i.test(raw)) {
    try {
      return new URL(raw, window.location.origin).pathname || '';
    } catch {
      return '';
    }
  }

  return raw;
}

function normalizePathString(path) {
  const normalized = `${path || ''}`
    .trim()
    .split(/[?#]/, 1)[0]
    .replace(/\/+/g, '/')
    .replace(/\.html$/i, '')
    .replace(/\/$/, '');

  if (!normalized) return '';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export function normalizeArticlePath(article) {
  const localeRoot = getCurrentLanguageRoot();
  const rawPath = typeof article === 'string'
    ? article
    : article?.path || article?.url || article?.href || '';
  const resolvedPath = normalizePathString(toPathname(rawPath));

  if (!resolvedPath) {
    const fallbackSlug = `${typeof article === 'string' ? '' : article?.slug || article?.id || ''}`
      .trim()
      .replace(/\.html$/i, '')
      .replace(/^\/+/, '');

    if (!fallbackSlug) {
      warnInvalidArticlePathOnce(rawPath);
      return '';
    }

    return `${localeRoot}/inspiration-guide/articles/${fallbackSlug}`;
  }

  if (/^\/[a-z]{2}-[a-z]{2}\/inspiration-guide\//i.test(resolvedPath)) {
    return resolvedPath;
  }

  if (/^\/inspiration-guide\//i.test(resolvedPath)) {
    return `${localeRoot}${resolvedPath}`;
  }

  if (/^[^/]+$/.test(resolvedPath.replace(/^\//, ''))) {
    const slug = resolvedPath.replace(/^\//, '');
    return `${localeRoot}/inspiration-guide/articles/${slug}`;
  }

  return resolvedPath;
}

function normalizeTagPath(value) {
  const tag = `${value || ''}`.trim().toLowerCase();
  const withoutNamespace = tag.includes(':')
    ? tag.split(':').slice(1).join(':')
    : tag;

  return withoutNamespace
    .split('/')
    .map(normalizeSlug)
    .filter(Boolean)
    .join('/');
}

// Root folders of the category tag tree (e.g. `inspiration-guide:categorías/destinos`).
// They are structural, not real categories, so they are excluded from route paths
// and from hierarchy matching.
const CATEGORY_ROOT_SEGMENTS = new Set([
  'categorias',
  'categories',
  'category',
]);

function stripCategoryRoot(path) {
  const segments = `${path || ''}`.split('/').filter(Boolean);
  while (segments.length > 1 && CATEGORY_ROOT_SEGMENTS.has(segments[0])) {
    segments.shift();
  }
  return segments.join('/');
}

/**
 * Normalizes any category value (tag id, tag path or slug) to its hierarchy path,
 * e.g. `inspiration-guide:categorías/destinos/islas-baleares` -> `destinos/islas-baleares`.
 */
export function normalizeCategoryPath(value) {
  const first = `${value || ''}`.split(/[|,;]/)[0];
  return stripCategoryRoot(normalizeTagPath(first));
}

/**
 * Hierarchical category match: an article belongs to a category when its own
 * category path equals the target path or is a descendant of it. A parent
 * category page therefore also collects the articles of all its subcategories,
 * while categories without children only match their direct articles.
 */
export function articleMatchesCategory(article, category) {
  const target = normalizeCategoryPath(category);
  if (!target) return true;

  return [article?.categorySlug, article?.categoryPath, article?.category]
    .map((value) => normalizeCategoryPath(value))
    .filter(Boolean)
    .some((path) => path === target || path.startsWith(`${target}/`));
}

function tagLabel(value) {
  const first = `${value || ''}`.split(/[|,;]/)[0];
  return tagTitle(first) || tagTitle(normalizeTagPath(value));
}

function getMetaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

/**
 * Resolves the category context of the current page: the `article-category`
 * page metadata first, then the URL segments after `/category/` (all of them,
 * so nested subcategory pages like `/category/destinos/mallorca` are supported).
 */
export function getPageCategoryPath() {
  const fromMeta = normalizeCategoryPath(
    getMetaContent('article-category')
      || getMetaContent('article-category-path'),
  );
  if (fromMeta) return fromMeta;

  const segments = window.location.pathname.split('/').filter(Boolean);
  const idx = segments.indexOf('category');
  if (idx < 0) return '';

  const rest = segments
    .slice(idx + 1)
    .map((segment) => decodeURIComponent(segment).replace(/\.html?$/i, ''))
    .join('/');
  return normalizeCategoryPath(rest);
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  return [];
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeTag(item?.tag || item?.title || item?.name || item))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[|,;]/)
      .map((item) => normalizeTag(item))
      .filter(Boolean);
  }

  return [];
}

function isVisible(value) {
  const normalized = `${value ?? ''}`.trim().toLowerCase();
  return !['false', '0', 'no', 'hidden'].includes(normalized);
}

function normalizeReadTime(value) {
  const text = `${value || ''}`.trim();
  if (!text) return '';
  if (/\bmin\b/i.test(text)) return text;

  const minutes = Number.parseInt(text, 10);
  return minutes > 0 ? `${minutes} min` : text;
}

function isMeaningfulValue(value) {
  if (value === undefined || value === null) return false;

  const normalized = `${value}`.trim().toLowerCase();
  return (
    normalized !== '' && normalized !== 'undefined' && normalized !== 'null'
  );
}

function firstDefined(...values) {
  const value = values.find((item) => isMeaningfulValue(item));
  return value === undefined ? '' : value;
}

function normalizeArticle(raw, index) {
  const id = firstDefined(
    raw.id,
    raw.articleId,
    raw.slug,
    raw.path,
    `aem-article-${index + 1}`,
  );
  const title = firstDefined(
    raw.title,
    raw.name,
    raw.headline,
    raw.articleTitle,
    'Untitled',
  );
  const summary = firstDefined(
    raw.summary,
    raw.description,
    raw.excerpt,
    raw.teaser,
    '',
  );
  const rawPath = firstDefined(raw.path, raw.articleUrl, raw.url, raw.href, '');
  const image = firstDefined(
    raw.image,
    raw.imagePath,
    raw.featuredImage,
    raw.heroImage,
    raw.ogImage,
    '',
  );
  const authorPath = firstDefined(
    raw.author,
    raw.authorPath,
    raw.articleAuthor,
    '',
  );
  const author = firstDefined(
    raw.author?.name,
    raw.authorName,
    raw.authorId,
    tagLabel(authorPath),
    '',
  );
  const categoryTag = firstDefined(
    raw.category,
    raw.categoryTag,
    raw.mainCategory,
    '',
  );
  const categorySlug = normalizeCategoryPath(
    firstDefined(raw.categorySlug, raw.categoryId, categoryTag),
  );
  const category = firstDefined(
    raw.categoryTitle,
    raw.categoryName,
    tagLabel(categoryTag),
  );
  const categoryUrl = firstDefined(
    raw.categoryUrl,
    raw.categoryPath,
    categorySlug
      ? `${getCurrentLanguageRoot()}/inspiration-guide/category/${categorySlug}`
      : '',
  );
  const categoryPath = firstDefined(
    raw.categoryPath,
    raw.categoryHierarchy,
    categoryTag,
    categorySlug,
    '',
  );
  const subcategory = firstDefined(
    raw.subcategory,
    raw.subCategory,
    raw.subcategorySlug,
    '',
  );
  const publishDate = firstDefined(
    raw.publishDate,
    raw.publicationDate,
    raw.publishedAt,
    raw.date,
    '',
  );
  const publicationTimestampRaw = firstDefined(
    raw.publicationTimestamp,
    Date.parse(publishDate),
    0,
  );
  const publicationTimestamp = Number.parseInt(publicationTimestampRaw, 10) || 0;
  const updateDate = firstDefined(raw.updateDate, raw.updatedAt, '');
  const readingTimeRaw = firstDefined(
    raw.readingTime,
    raw.readTime,
    raw.minutesToRead,
    0,
  );
  const readingTime = Number.parseInt(readingTimeRaw, 10) || 0;
  const readTime = normalizeReadTime(
    firstDefined(raw.readTime, raw.readingTime, raw.minutesToRead, ''),
  );
  const tags = normalizeTags(
    firstDefined(raw.tags, raw.tagList, raw.keywords, []),
  );
  const normalizedPath = normalizeArticlePath({
    href: raw.href,
    id,
    path: rawPath,
    slug: raw.slug,
    url: raw.url,
  }) || `${getCurrentLanguageRoot()}/inspiration-guide/article/${id}`;

  return {
    id: String(id),
    title: String(title),
    summary: String(summary),
    description: String(summary),
    image: String(image),
    imageAlt: String(
      firstDefined(
        raw.imageAlt,
        raw.altEs,
        raw.imageAltEs,
        raw.dcDescription,
        raw.imageDcDescription,
        raw.autogenDescription,
        raw.imageAutogenDescription,
        raw.alt,
        title,
        '',
      ),
    ),
    author: String(author),
    authorPath: String(authorPath),
    authorName: String(author),
    authorImage: String(firstDefined(raw.authorImage, raw.author?.image, '')),
    category: String(category),
    categorySlug: String(categorySlug),
    categoryPath: String(categoryPath),
    categoryUrl: String(categoryUrl),
    subcategory: String(subcategory),
    publishDate: String(publishDate),
    publicationDate: String(publishDate),
    publicationTimestamp,
    updateDate: String(updateDate),
    readingTime,
    readTime,
    tags,
    path: String(normalizedPath),
    href: String(normalizedPath),
    url: String(normalizedPath),
    robots: String(firstDefined(raw.robots, '')),
    lastModified: String(firstDefined(raw.lastModified, '')),
    visible: isVisible(raw.visible),
  };
}

function isCompleteArticle(article) {
  return (
    article.title
    && article.title.toLowerCase() !== 'untitled'
    && article.id
    && article.visible
  );
}

function pickArticlesCollection(payload) {
  const candidates = [
    toArray(payload?.items),
    toArray(payload?.data),
    toArray(payload?.articles),
    toArray(payload?.results),
  ];
  return candidates.find((list) => list.length > 0) || [];
}

function getIndexRows(payload) {
  return toArray(payload?.data);
}

function getMetaFromDocument(doc, name) {
  return (
    doc.querySelector(`meta[name="${name}"]`)?.content?.trim()
    || doc.querySelector(`meta[property="${name}"]`)?.content?.trim()
    || ''
  );
}

function normalizePagePath(path) {
  return `/${String(path || '').replace(/^\/+|\/+$/g, '')}`;
}

function isArticlePath(path) {
  return /\/inspiration-guide\/articles?\//.test(normalizePagePath(path));
}

function isAuthorContext() {
  return (
    window.location.hostname?.includes('author-')
    || window.location.pathname?.includes('/content/')
  );
}

function resolveAemDataUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('aem-data-url');
  if (fromQuery) {
    return fromQuery;
  }

  const fromMeta = getMetaContent('inspiration-aem-data-url');
  if (fromMeta) {
    return fromMeta;
  }

  return '';
}

function resolvePageIndexUrl() {
  return '/query-index.json';
}

function isPageIndexUrl(url = '') {
  return url.endsWith('/query-index.json') || url === 'query-index.json';
}

function getDefaultArticleIndexUrls() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const locale = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));

  return [
    locale
      ? `/${locale.toLowerCase()}/inspiration-guide/articles-index.json`
      : '',
    '/inspiration-guide/articles-index.json',
  ].filter(Boolean);
}

async function fetchJson(url) {
  if (AEM_REQUEST_CACHE.has(url)) {
    return AEM_REQUEST_CACHE.get(url);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`AEM data fetch failed (${response.status}) for ${url}`);
  }

  const payload = await response.json();
  AEM_REQUEST_CACHE.set(url, payload);
  return payload;
}

async function fetchArticleMetadata(path) {
  const articlePath = normalizePagePath(path);
  const response = await fetch(articlePath, {
    method: 'GET',
    headers: {
      Accept: 'text/html',
    },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(
      `Article metadata fetch failed (${response.status}) for ${articlePath}`,
    );
  }

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  return {
    path: articlePath,
    url: articlePath,
    title:
      getMetaFromDocument(doc, 'jcr:title')
      || getMetaFromDocument(doc, 'og:title')
      || doc.querySelector('title')?.textContent?.trim(),
    description:
      getMetaFromDocument(doc, 'jcr:description')
      || getMetaFromDocument(doc, 'description')
      || getMetaFromDocument(doc, 'og:description'),
    image:
      getMetaFromDocument(doc, 'article-image')
      || getMetaFromDocument(doc, 'og:image'),
    ogImage: getMetaFromDocument(doc, 'og:image'),
    imageAlt: getMetaFromDocument(doc, 'article-image-alt'),
    authorName: getMetaFromDocument(doc, 'article-author-name'),
    author: getMetaFromDocument(doc, 'article-author'),
    authorImage: getMetaFromDocument(doc, 'article-author-image'),
    category: getMetaFromDocument(doc, 'article-category'),
    categoryPath: getMetaFromDocument(doc, 'article-category-path'),
    tags: getMetaFromDocument(doc, 'article-tags'),
    publicationDate: getMetaFromDocument(doc, 'article-publication-date'),
    updateDate: getMetaFromDocument(doc, 'article-update-date'),
    readTime: getMetaFromDocument(doc, 'article-read-time'),
    visible: getMetaFromDocument(doc, 'article-visible'),
    robots: getMetaFromDocument(doc, 'robots'),
  };
}

async function getArticlesFromPageIndex() {
  const payload = await fetchJson(resolvePageIndexUrl());
  const articleRows = getIndexRows(payload).filter((row) => isArticlePath(row.path));
  const articles = await Promise.all(
    articleRows.map((row) => fetchArticleMetadata(row.path)),
  );
  return articles;
}

function buildTagFrequency(articles) {
  const frequency = new Map();
  articles.forEach((article) => {
    (article.tags || []).forEach((tag) => {
      const key = normalizeTag(tag);
      if (!key) return;
      frequency.set(key, (frequency.get(key) || 0) + 1);
    });
  });
  return frequency;
}

async function enrichSparseArticles(articles = []) {
  const enriched = await Promise.all(
    articles.map(async (article, index) => {
      const needsEnrichment = !article.title
        || article.title.toLowerCase() === 'untitled'
        || !article.image
        || !article.description;

      if (!needsEnrichment || !article.path || article.path === '#') {
        return article;
      }

      try {
        const metadata = await fetchArticleMetadata(article.path);
        return normalizeArticle(
          {
            ...article,
            ...metadata,
          },
          index,
        );
      } catch (error) {
        return article;
      }
    }),
  );

  return enriched;
}

async function getAemArticles() {
  const primaryUrl = resolveAemDataUrl();
  const isAuthor = isAuthorContext();
  const urlsToTry = [
    primaryUrl,
    resolvePageIndexUrl(),
    ...(isAuthor ? [] : getDefaultArticleIndexUrls()),
  ].filter(Boolean);

  const tryLoadArticles = async (urls) => {
    if (!urls.length) return null;
    const [currentUrl, ...remainingUrls] = urls;

    try {
      const payload = await fetchJson(currentUrl);
      const collection = isPageIndexUrl(currentUrl)
        ? getIndexRows(payload).filter((row) => isArticlePath(row.path))
        : pickArticlesCollection(payload);
      const normalized = collection
        .map((article, index) => normalizeArticle(article, index))
        .filter((article) => article.id && article.visible);

      const enriched = await enrichSparseArticles(normalized);
      const results = enriched.filter(isCompleteArticle);

      if (results.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[inspiration-data] Loaded ${results.length} articles from ${currentUrl}`,
        );
        return results;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug(
        `[inspiration-data] Failed to load from ${currentUrl}:`,
        error,
      );
    }

    return tryLoadArticles(remainingUrls);
  };

  const articles = await tryLoadArticles(urlsToTry);
  if (articles) return articles;

  try {
    const collection = await getArticlesFromPageIndex();

    return collection
      .map((article, index) => normalizeArticle(article, index))
      .filter(isCompleteArticle);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      '[inspiration-data] Failed to load fallback article data:',
      error,
    );
    return [];
  }
}

export function getDataMode() {
  const params = new URLSearchParams(window.location.search);
  const modeFromQuery = params.get('data-mode');
  if (modeFromQuery === 'mock' || modeFromQuery === 'aem') {
    return modeFromQuery;
  }

  const metaMode = document.querySelector(
    'meta[name="inspiration-data-mode"]',
  )?.content;
  if (metaMode === 'mock' && isLocalhost()) {
    return metaMode;
  }

  if (metaMode === 'aem') {
    return metaMode;
  }

  return 'aem';
}

// Upgrades each article's category label to the Title of its category landing
// page when it exists; otherwise the slug-derived label from normalizeArticle stays.
async function withCategoryTitles(articles) {
  return Promise.all(articles.map(async (article) => {
    const reference = article.categoryUrl || article.categoryPath;
    if (!reference) return article;

    const title = await taxonomyTitle(reference);
    return title ? { ...article, category: title } : article;
  }));
}

export async function getArticles() {
  const mode = getDataMode();
  const articles = mode === 'aem'
    ? await getAemArticles()
    : MOCK_ARTICLES.map((article, index) => normalizeArticle(article, index));

  return withCategoryTitles(articles);
}

export async function getTagCloud(strategy = 'frequency', limit = 20) {
  const articles = await getArticles();
  const frequency = buildTagFrequency(articles);

  if (strategy === 'category') {
    return Array.from(frequency.keys())
      .sort((a, b) => a.localeCompare(b))
      .slice(0, limit)
      .map((tag) => ({ tag, count: frequency.get(tag) || 0 }));
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}
