import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { getArticles } from '../../scripts/inspiration-data.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const MAX_ITEMS = 3;
const CTA_COPY = 'Leer artículo';

// --- Metadata helpers ---

function getMetaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function normalizeStr(val) {
  return `${val || ''}`.trim().toLowerCase();
}

function getPageTags() {
  return getMetaContent('article-tags')
    .split(',')
    .map(normalizeStr)
    .filter(Boolean);
}

function getPageCategorySegments() {
  const raw = getMetaContent('article-category');
  if (!raw) return [];
  // e.g. "inspiration-guide:destinations/mallorca" → strip namespace, split by '/'
  const path = normalizeStr(raw).replace(/^[^:]+:/, '');
  const parts = path.split('/').filter(Boolean);
  // Build all ancestor paths: ["destinations", "destinations/mallorca"]
  const segments = [];
  parts.reduce((acc, part) => {
    const seg = acc ? `${acc}/${part}` : part;
    segments.push(seg);
    return seg;
  }, '');
  return segments;
}

/**
 * Returns the first (root) segment of a category path.
 * "inspiration-guide:destinations/mallorca" → "Destinations"
 * "destinations/mallorca" → "Destinations"
 * "beaches" → "Beaches"
 */
function getRootCategoryLabel(raw) {
  if (!raw) return '';
  const path = `${raw}`.replace(/^[^:]+:/, '').replace(/-/g, ' ');
  const first = path.split('/')[0]?.trim() || '';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

// --- Sorting ---

function byLatest(a, b) {
  return `${b.publishDate}`.localeCompare(`${a.publishDate}`);
}

// --- Auto article fetching ---

async function getAutoArticles(mode) {
  const all = await getArticles();
  const currentPath = window.location.pathname;

  if (mode === 'auto-tag') {
    const pageTags = getPageTags();
    if (!pageTags.length) return all.sort(byLatest).slice(0, MAX_ITEMS);
    return all
      .filter((a) => {
        if (a.path === currentPath) return false;
        return (a.tags || []).some((t) => pageTags.includes(normalizeStr(t)));
      })
      .sort(byLatest)
      .slice(0, MAX_ITEMS);
  }

  if (mode === 'auto-category') {
    const segments = getPageCategorySegments();
    if (!segments.length) return all.sort(byLatest).slice(0, MAX_ITEMS);
    return all
      .filter((a) => {
        if (a.path === currentPath) return false;
        const articleCat = normalizeStr(a.categorySlug || a.category || '');
        return segments.some((seg) => articleCat.includes(seg) || seg.includes(articleCat));
      })
      .sort(byLatest)
      .slice(0, MAX_ITEMS);
  }

  return [];
}

// --- Manual items (mode=manual) ---

function getManualItemProp(row, propName) {
  const el = row.querySelector(`[data-aue-prop="${propName}"]`);
  return el || null;
}

function getManualItems(block) {
  return [...block.children]
    .filter((row) => !row.classList.contains('editorial-article-grid-rendered'))
    .slice(0, MAX_ITEMS)
    .map((row, index) => {
      // Try data-aue-prop first, fall back to positional cells
      const cells = [...row.children];
      const imageProp = getManualItemProp(row, 'image');
      const picture = imageProp
        ? imageProp.querySelector('picture')
        : cells[0]?.querySelector('picture');
      const img = picture?.querySelector('img');

      const titleProp = getManualItemProp(row, 'title');
      const title = titleProp
        ? titleProp.textContent?.trim()
        : cells[1]?.textContent?.trim() || '';

      const categoryProp = getManualItemProp(row, 'category');
      const rawCategory = categoryProp
        ? categoryProp.textContent?.trim()
        : cells[2]?.textContent?.trim() || '';

      const linkProp = getManualItemProp(row, 'link');
      const href = linkProp
        ? linkProp.textContent?.trim() || linkProp.querySelector('a')?.href || ''
        : cells[3]?.textContent?.trim() || '#';

      return {
        id: `manual-${index + 1}`,
        image: img?.src || '',
        imageAlt: img?.alt || '',
        title,
        category: getRootCategoryLabel(rawCategory) || rawCategory,
        href,
        picture,
        sourceRow: row,
      };
    });
}

// --- Card rendering ---

function makeCard(item) {
  const li = document.createElement('li');
  li.className = 'editorial-article-grid-card';

  if (item.picture) {
    const media = document.createElement('div');
    media.className = 'editorial-article-grid-media';
    media.append(item.picture.cloneNode(true));
    li.append(media);
  } else if (item.image) {
    const media = document.createElement('div');
    media.className = 'editorial-article-grid-media';
    media.append(createResponsiveImage(item.image, item.imageAlt || item.title, { preset: 'article-card' }));
    li.append(media);
  }

  const body = document.createElement('div');
  body.className = 'editorial-article-grid-body';

  const category = item.category
    || getRootCategoryLabel(item.categorySlug || item.category || '');
  if (category) {
    const cat = document.createElement('p');
    cat.className = 'editorial-article-grid-category';
    cat.textContent = category;
    body.append(cat);
  }

  if (item.title) {
    const h3 = document.createElement('h3');
    h3.className = 'editorial-article-grid-title';
    const a = document.createElement('a');
    a.href = item.href || item.path || '#';
    a.textContent = item.title;
    h3.append(a);
    body.append(h3);
  }

  const cta = document.createElement('a');
  cta.className = 'editorial-article-grid-cta';
  cta.href = item.href || item.path || '#';
  cta.textContent = CTA_COPY;
  body.append(cta);

  li.append(body);
  return li;
}

// --- Header rendering ---

function renderHeader(eyebrow, title) {
  if (!eyebrow && !title) return null;

  const header = document.createElement('div');
  header.className = 'editorial-article-grid-header';

  if (eyebrow) {
    const el = document.createElement('h2');
    el.className = 'editorial-article-grid-eyebrow';
    el.textContent = eyebrow;
    header.append(el);
  }

  if (title) {
    const el = document.createElement('p');
    el.className = 'editorial-article-grid-heading';
    el.textContent = title;
    header.append(el);
  }

  return header;
}

// --- Main decorator ---

export default async function decorate(block) {
  block.querySelector(':scope > .editorial-article-grid-rendered')?.remove();

  const eyebrow = block.getAttribute('data-eyebrow') || '';
  const title = block.getAttribute('data-title') || '';
  const mode = block.getAttribute('data-mode') || 'manual';

  let items;
  let sourceRows = [];

  if (mode === 'manual') {
    const manual = getManualItems(block);
    items = manual;
    sourceRows = manual.map((m) => m.sourceRow).filter(Boolean);
  } else {
    items = await getAutoArticles(mode);
  }

  const rendered = document.createElement('div');
  rendered.className = 'editorial-article-grid-rendered';

  const header = renderHeader(eyebrow, title);
  if (header) rendered.append(header);

  const list = document.createElement('ul');
  list.className = 'editorial-article-grid-list';
  items.forEach((item) => list.append(makeCard(item)));
  rendered.append(list);

  block.append(rendered);

  // Hide source rows preserving UE instrumentation
  sourceRows.forEach((row, i) => {
    row.classList.add('editorial-article-grid-source');
    moveInstrumentation(row, rendered.querySelectorAll('.editorial-article-grid-card')[i] || rendered);
  });
}
