import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { getArticles } from '../../scripts/inspiration-data.js';
import { createArticleCard } from '../../scripts/iberostar/article-card.js';
import { toPublicPagePath } from '../../scripts/iberostar/page-links.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADING_TAGS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);
const CARD_CTA = 'Leer artículo';

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
  const known = new Set(['home', 'default']);
  const found = getConfigRows(block)
    .map((row) => row.textContent?.trim().toLowerCase())
    .find((text) => known.has(text));
  return found || block.getAttribute('data-variant') || 'default';
}

// ---------- default variant (auto/manual list with "load more") ----------

function getContextTag() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const idx = segments.indexOf('tag');
  return idx > -1 ? segments[idx + 1] || '' : '';
}

function getContextCategory() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const idx = segments.indexOf('category');
  return idx > -1 ? segments[idx + 1] || '' : '';
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

async function autoItems(source) {
  const all = await getArticles();
  if (source === 'auto-tag') {
    const tag = getContextTag();
    return all
      .filter((article) => !tag || article.tags.includes(tag))
      .map((article) => ({ ...article, href: `/article/${article.id}` }));
  }
  if (source === 'auto-category') {
    const category = getContextCategory();
    return all
      .filter((article) => !category || article.category === category)
      .map((article) => ({ ...article, href: `/article/${article.id}` }));
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
  const source = block.getAttribute('data-source') || 'manual';
  const pageSize = Number.parseInt(block.getAttribute('data-page-size') || '4', 10);
  const ctaLabel = block.getAttribute('data-cta-label') || 'Load more';

  const items = source === 'manual' ? manualItems(block) : await autoItems(source);

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

function normalizePath(value) {
  const publicPath = toPublicPagePath(`${value || ''}`.trim());
  return publicPath.replace(/\.html$/, '').replace(/\/+$/, '');
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
    authorName: article.authorName || article.author || '',
    url: toPublicPagePath(article.url || article.path || '') || '',
    ctaText: CARD_CTA,
  };
}

async function decorateHome(block) {
  const title = textByProp(block, 'title');
  const levels = getConfigRows(block)
    .map((row) => row.textContent?.trim().toLowerCase())
    .filter((text) => HEADING_TAGS.has(text));
  const titleHeading = sanitizeHeading(levels[0], 'h2');
  const cardHeading = sanitizeHeading(levels[1], 'h3');

  const all = await getArticles();
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
      li.append(createArticleCard(toCardData(article), { headingTag: cardHeading }));
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

export default async function decorate(block) {
  if (readVariant(block) === 'home') {
    await decorateHome(block);
    return;
  }
  await decorateDefault(block);
}
