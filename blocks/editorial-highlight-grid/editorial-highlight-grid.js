import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import {
  articleMatchesCategory,
  getArticles,
  getPageCategoryPath,
} from '../../scripts/inspiration-data.js';
import { createArticleCard } from '../../scripts/iberostar/article-card.js';
import { toPublicPagePath } from '../../scripts/iberostar/page-links.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADING_TAGS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);
const CARD_CTA = 'Leer artículo';
const LOCALE_PATTERN = /^\/[a-z]{2}-[a-z]{2}(?:\/|$)/i;

function getCurrentLocale() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const locale = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  return locale?.toLowerCase() || '';
}

function getArticleLocale(article) {
  const rawPath = article?.path || article?.url || article?.href || '';
  const normalized = `${rawPath || ''}`.trim();
  if (!normalized) return '';

  try {
    const pathname = new URL(normalized, window.location.origin).pathname || '';
    const match = pathname.match(LOCALE_PATTERN)?.[0] || '';
    return match.replaceAll('/', '').toLowerCase();
  } catch {
    return '';
  }
}

function filterArticlesByCurrentLocale(articles) {
  const currentLocale = getCurrentLocale();
  if (!currentLocale) return articles;

  return articles.filter((article) => {
    const articleLocale = getArticleLocale(article);
    return articleLocale === currentLocale;
  });
}

// ---------- source rows ----------

function getRows(block) {
  return [...block.children].filter((row) => !row.classList.contains('editorial-highlight-grid')
    && !row.classList.contains('editorial-highlight-grid-rendered'));
}

// A home article is a child component (reference to an article page).
function isArticleRow(row) {
  return !!(row.matches?.('[data-aue-model="editorial-highlight-article"]')
    || row.querySelector?.('[data-aue-model="editorial-highlight-article"]')
    || row.querySelector?.('a[href]'));
}

function getArticleRows(block) {
  return getRows(block).filter(isArticleRow);
}

function getConfigRows(block) {
  return getRows(block).filter((row) => !isArticleRow(row));
}

function textByProp(block, prop) {
  return block.querySelector(`[data-aue-prop="${prop}"]`)?.textContent?.trim() || '';
}

function sanitizeHeading(value, fallback) {
  const tag = `${value || fallback}`.trim().toLowerCase();
  return HEADING_TAGS.has(tag) ? tag : fallback;
}

// Select fields render their value without data-aue-prop, so the variant is read
// by matching the known option values across the block config rows.
function readVariant(block) {
  const byProp = textByProp(block, 'variant').toLowerCase();
  if (byProp) return byProp;
  const known = new Set(['home', 'default', 'tag', 'category']);
  const found = getConfigRows(block)
    .map((row) => row.textContent?.trim().toLowerCase())
    .find((text) => known.has(text));
  return found || block.getAttribute('data-variant') || 'default';
}

function readSource(block) {
  const byProp = textByProp(block, 'source').toLowerCase();
  if (byProp) return byProp;
  const known = new Set(['manual', 'auto-tag', 'auto-category']);
  const found = getConfigRows(block)
    .map((row) => row.textContent?.trim().toLowerCase())
    .find((text) => known.has(text));
  return found || block.getAttribute('data-source') || 'manual';
}

// ---------- default variant (auto/manual list with "load more") ----------

function getContextSegment(name) {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const idx = segments.indexOf(name);
  if (idx < 0) return '';
  const value = segments[idx + 1] || '';
  return decodeURIComponent(value).replace(/\.html?$/i, '').trim().toLowerCase();
}

function getContextTag() {
  return getContextSegment('tag');
}

// The current tag/category comes from the page metadata (Article Primary Category /
// Article Tags), emitted as meta tags. URL segments are only a fallback.
function getPageMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function normalizeSlug(value) {
  const raw = `${value || ''}`.trim().toLowerCase();
  if (!raw) return '';
  const afterNamespace = raw.includes(':') ? raw.split(':').pop() : raw;
  return afterNamespace.split('/').pop().trim();
}

// An authored category override (aem-tag id such as `inspiration-guide:categorías/destinos`)
// renders as a config row without instrumentation, so it is detected by its tag-id shape.
function getConfiguredCategory(block) {
  const byProp = textByProp(block, 'filterCategory');
  if (byProp) return byProp;
  return getConfigRows(block)
    .map((row) => row.textContent?.trim() || '')
    .find((text) => /^[a-z0-9_-]+:\S+$/i.test(text)) || '';
}

// Full hierarchy path so parent categories also match their subcategories.
function getCurrentCategory(block) {
  return getConfiguredCategory(block) || getPageCategoryPath();
}

function getCurrentTags() {
  const fromMeta = getPageMeta('article-tags')
    .split(/[|,;]/)
    .map(normalizeSlug)
    .filter(Boolean);
  if (fromMeta.length) return fromMeta;
  const fromUrl = getContextTag();
  return fromUrl ? [fromUrl] : [];
}

function manualItems(block) {
  return getArticleRows(block).map((row, index) => {
    const cells = [...row.children];
    const image = cells[0]?.querySelector('img')?.src || '';
    const title = cells[1]?.textContent?.trim() || `Manual article ${index + 1}`;
    const summary = cells[2]?.textContent?.trim() || '';
    const href = cells[3]?.textContent?.trim() || '#';
    return {
      id: `m-${index + 1}`, image, title, summary, href,
    };
  });
}

function articleTimestamp(article) {
  const ts = Number.parseInt(article.publicationTimestamp, 10);
  if (Number.isFinite(ts) && ts) return ts;
  const parsed = Date.parse(article.publicationDate || article.publishDate || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortArticles(articles, order) {
  return [...articles].sort((a, b) => (order === 'oldest'
    ? articleTimestamp(a) - articleTimestamp(b)
    : articleTimestamp(b) - articleTimestamp(a)));
}

async function autoItems(block, source) {
  const all = filterArticlesByCurrentLocale(await getArticles());
  if (source === 'auto-tag') {
    const tag = getContextTag();
    return sortArticles(all.filter((article) => !tag || article.tags.includes(tag)), 'newest')
      .map((article) => ({ ...article, href: article.href || `/article/${article.id}` }));
  }
  if (source === 'auto-category') {
    const category = getCurrentCategory(block);
    return sortArticles(all.filter((article) => articleMatchesCategory(article, category)), 'newest')
      .map((article) => ({ ...article, href: article.href || `/article/${article.id}` }));
  }
  return [];
}

function createCard(item) {
  const li = document.createElement('li');
  li.className = 'editorial-highlight-card';

  const article = document.createElement('article');

  if (item.image) {
    const media = document.createElement('div');
    media.className = 'editorial-highlight-media';
    media.append(createResponsiveImage(item.image, item.title, { preset: 'article-card' }));
    article.append(media);
  }

  const body = document.createElement('div');
  body.className = 'editorial-highlight-body';

  const h3 = document.createElement('h3');
  const link = document.createElement('a');
  link.href = item.href || '#';
  link.textContent = item.title;
  h3.append(link);
  body.append(h3);

  if (item.summary) {
    const p = document.createElement('p');
    p.textContent = item.summary;
    body.append(p);
  }

  article.append(body);
  li.append(article);
  return li;
}

function renderPage(list, items, pageSize, currentPage) {
  list.replaceChildren();
  const start = currentPage * pageSize;
  const chunk = items.slice(start, start + pageSize);
  chunk.forEach((item) => list.append(createCard(item)));
  return start + chunk.length < items.length;
}

async function decorateDefault(block) {
  const source = readSource(block);
  const pageSize = Number.parseInt(block.getAttribute('data-page-size') || '4', 10);
  const ctaLabel = block.getAttribute('data-cta-label') || 'Load more';

  const items = source === 'manual' ? manualItems(block) : await autoItems(block, source);

  const wrapper = document.createElement('div');
  wrapper.className = 'editorial-highlight-grid';

  const list = document.createElement('ul');
  list.className = 'editorial-highlight-list';

  let currentPage = 0;
  let hasMore = renderPage(list, items, pageSize, currentPage);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'editorial-highlight-load-more';
  button.textContent = ctaLabel;
  button.hidden = !hasMore;

  button.addEventListener('click', () => {
    currentPage += 1;
    hasMore = renderPage(list, items, pageSize, currentPage);
    button.hidden = !hasMore;
  });

  wrapper.append(list, button);
  block.replaceChildren(wrapper);
}

// ---------- home variant (manual list of article references) ----------

// aem.live normalizes the published slug (lowercase, accents stripped, repeated
// dashes collapsed) while the authored aem-content reference keeps the original
// node name, so both sides must be canonicalized before comparing.
function normalizePath(value) {
  const publicPath = toPublicPagePath(`${value || ''}`.trim());
  return publicPath
    .replace(/\.html$/, '')
    .replace(/\/+$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/-+/g, '-');
}

function findArticle(articles, refPath) {
  const target = normalizePath(refPath);
  if (!target) return null;
  return articles.find((article) => {
    const candidate = normalizePath(article.path || article.url || article.href);
    return candidate && (candidate === target
      || candidate.endsWith(target) || target.endsWith(candidate));
  }) || null;
}

function getRefPath(row) {
  const link = row.querySelector('a[href]');
  if (link) return link.getAttribute('href') || '';
  return row.textContent?.trim() || '';
}

// Maps an indexed article to the shape expected by the shared ArticleCard helper.
function toCardData(article) {
  return {
    title: article.title,
    description: article.description || article.summary || '',
    image: article.image,
    imageAlt: article.imageAlt || article.title,
    category: article.category,
    categoryUrl: article.categoryUrl,
    publicationDate: article.publicationDate || article.publishDate || '',
    readTime: article.readTime || '',
    url: toPublicPagePath(article.url || article.path || '') || '',
    ctaText: CARD_CTA,
  };
}

function enhanceCard(card) {
  const readTime = card.querySelector('.article-card-read-time');
  if (readTime && !readTime.querySelector('i')) {
    const icon = document.createElement('i');
    icon.className = 'ibh-icon-schedule';
    readTime.prepend(icon);
  }

  const cta = card.querySelector('.article-card-cta');
  if (cta && !cta.querySelector('i')) {
    const label = document.createElement('span');
    label.className = 'article-card-cta-label';
    label.textContent = cta.textContent;
    const arrow = document.createElement('i');
    arrow.className = 'ibh-icon-arrow-forward';
    cta.textContent = '';
    cta.append(label, arrow);
  }
}

function renderManualGrid(block, all) {
  const configRows = getConfigRows(block);
  const title = textByProp(block, 'title') || configRows[1]?.textContent?.trim() || '';
  const levels = configRows
    .map((row) => row.textContent?.trim().toLowerCase())
    .filter((text) => HEADING_TAGS.has(text));
  const titleHeading = sanitizeHeading(levels[0], 'h2');
  const cardHeading = sanitizeHeading(levels[1], 'h3');

  const isEditor = !!block.closest('[data-aue-resource]');

  block.classList.add('editorial-highlight-grid-home');

  const rendered = document.createElement('div');
  rendered.className = 'editorial-highlight-grid-rendered';

  if (title) {
    const heading = document.createElement(titleHeading);
    heading.className = 'editorial-highlight-grid-title';
    heading.textContent = title;
    rendered.append(heading);
  }

  const list = document.createElement('ul');
  list.className = 'editorial-highlight-grid-list';
  getArticleRows(block).forEach((row) => {
    const article = findArticle(all, getRefPath(row));
    // Skip unresolved items on published pages, but keep an editable placeholder
    // in Universal Editor so a just-added item can still be configured.
    if (!article && !isEditor) return;

    const li = document.createElement('li');
    li.className = 'editorial-highlight-grid-item';
    moveInstrumentation(row, li);

    if (article) {
      const card = createArticleCard(toCardData(article), { headingTag: cardHeading });
      enhanceCard(card);
      li.append(card);
    } else {
      const placeholder = document.createElement('p');
      placeholder.className = 'editorial-highlight-grid-placeholder';
      placeholder.textContent = 'Selecciona un artículo';
      li.append(placeholder);
    }

    list.append(li);
  });
  rendered.append(list);

  block.replaceChildren(rendered);
}

async function decorateHome(block) {
  const all = await getArticles();
  renderManualGrid(block, all);
}

// ---------- tag variant (feed of articles for the current tag page) ----------

const SORT_PREFIX = 'Orden:';
const TAG_SORTS = [
  { value: 'recent', label: 'Los más recientes' },
  { value: 'oldest', label: 'Los más antiguos' },
];

function sortButtonLabel(label) {
  return `${SORT_PREFIX} ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}

function articleHasTag(article, tag) {
  const target = tag.trim().toLowerCase();
  if (!target) return false;

  return (article.tags || []).some((value) => {
    const normalized = `${value || ''}`.trim().toLowerCase();
    if (!normalized) return false;
    if (normalized === target) return true;
    return normalized.split('/').pop().trim() === target
      || normalized.split(':').pop().trim() === target;
  });
}

function readPageSize(block) {
  const value = textByProp(block, 'pageSize') || block.getAttribute('data-page-size') || '';
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4;
}

function buildFeed(block, matched, pageSize) {
  block.classList.add('editorial-highlight-grid-home', 'editorial-highlight-grid-listing');

  const configRows = getConfigRows(block);
  const title = textByProp(block, 'title') || configRows[1]?.textContent?.trim() || '';
  const levels = configRows
    .map((row) => row.textContent?.trim().toLowerCase())
    .filter((text) => HEADING_TAGS.has(text));
  const titleHeading = sanitizeHeading(levels[0], 'h2');
  const cardHeading = sanitizeHeading(levels[1], 'h3');

  const rendered = document.createElement('div');
  rendered.className = 'editorial-highlight-grid-rendered';

  const feed = document.createElement('div');
  feed.className = 'editorial-highlight-grid-feed';

  if (title) {
    const heading = document.createElement(titleHeading);
    heading.className = 'editorial-highlight-grid-title';
    heading.textContent = title;
    feed.append(heading);
  }

  const toolbar = document.createElement('div');
  toolbar.className = 'editorial-highlight-grid-toolbar';

  const sort = document.createElement('div');
  sort.className = 'editorial-highlight-grid-sort';

  const sortButton = document.createElement('button');
  sortButton.type = 'button';
  sortButton.className = 'editorial-highlight-grid-sort-button';
  sortButton.setAttribute('aria-expanded', 'false');

  const sortLabel = document.createElement('span');
  sortLabel.className = 'editorial-highlight-grid-sort-label';
  sortLabel.textContent = sortButtonLabel(TAG_SORTS[0].label);

  const sortIcon = document.createElement('i');
  sortIcon.className = 'editorial-highlight-grid-sort-icon ibh-icon-keyboard-arrow-down';
  sortIcon.setAttribute('aria-hidden', 'true');
  sortButton.append(sortLabel, sortIcon);

  const sortMenu = document.createElement('ul');
  sortMenu.className = 'editorial-highlight-grid-sort-menu';

  const list = document.createElement('ul');
  list.className = 'editorial-highlight-grid-list';

  const moreButton = document.createElement('button');
  moreButton.type = 'button';
  moreButton.className = 'editorial-highlight-grid-more';
  moreButton.textContent = 'Ver más artículos';

  const state = { order: TAG_SORTS[0].value, shown: pageSize };

  const renderCards = () => {
    const items = sortArticles(matched, state.order).slice(0, state.shown).map((article) => {
      const li = document.createElement('li');
      li.className = 'editorial-highlight-grid-item';
      const card = createArticleCard(toCardData(article), { headingTag: cardHeading });
      enhanceCard(card);
      li.append(card);
      return li;
    });
    list.replaceChildren(...items);
    moreButton.hidden = state.shown >= matched.length;
  };

  const optionButtons = TAG_SORTS.map((option, index) => {
    const li = document.createElement('li');
    const optionButton = document.createElement('button');
    optionButton.type = 'button';
    optionButton.className = 'editorial-highlight-grid-sort-option';
    if (index === 0) optionButton.classList.add('is-selected');
    optionButton.textContent = option.label;
    li.append(optionButton);
    sortMenu.append(li);
    return optionButton;
  });

  optionButtons.forEach((optionButton, index) => {
    optionButton.addEventListener('click', () => {
      state.order = TAG_SORTS[index].value;
      sortLabel.textContent = sortButtonLabel(TAG_SORTS[index].label);
      sortButton.setAttribute('aria-expanded', 'false');
      optionButtons.forEach((button) => button.classList.remove('is-selected'));
      optionButton.classList.add('is-selected');
      renderCards();
    });
  });

  sortButton.addEventListener('click', () => {
    const expanded = sortButton.getAttribute('aria-expanded') === 'true';
    sortButton.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });

  document.addEventListener('click', (event) => {
    if (!sort.contains(event.target)) sortButton.setAttribute('aria-expanded', 'false');
  });

  moreButton.addEventListener('click', () => {
    state.shown += pageSize;
    renderCards();
  });

  sort.append(sortButton, sortMenu);
  toolbar.append(sort);
  feed.append(toolbar, list);
  rendered.append(feed, moreButton);

  renderCards();
  block.replaceChildren(rendered);
}

async function decorateTag(block) {
  const all = filterArticlesByCurrentLocale(await getArticles());

  if (getArticleRows(block).length) {
    renderManualGrid(block, all);
    return;
  }

  const tags = getCurrentTags();
  const matched = tags.length
    ? all.filter((article) => tags.some((tag) => articleHasTag(article, tag)))
    : all;
  buildFeed(block, matched, readPageSize(block));
}

async function decorateCategory(block) {
  const all = filterArticlesByCurrentLocale(await getArticles());

  if (getArticleRows(block).length) {
    renderManualGrid(block, all);
    return;
  }

  const category = getCurrentCategory(block);
  const matched = category
    ? all.filter((article) => articleMatchesCategory(article, category))
    : all;
  buildFeed(block, matched, readPageSize(block));
}

export default async function decorate(block) {
  const variant = readVariant(block);
  if (variant === 'home') {
    await decorateHome(block);
    return;
  }
  if (variant === 'tag') {
    await decorateTag(block);
    return;
  }
  if (variant === 'category') {
    await decorateCategory(block);
    return;
  }
  await decorateDefault(block);
}
