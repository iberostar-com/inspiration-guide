import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { getArticles } from '../../scripts/inspiration-data.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const MAX_ITEMS = 3;
const CTA_COPY = 'Leer artículo';

function getMetaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function normalizeTag(tag) {
  return `${tag || ''}`.trim().toLowerCase();
}

function getPageTags() {
  return getMetaContent('article-tags')
    .split(',')
    .map(normalizeTag)
    .filter(Boolean);
}

function getPageCategorySegments() {
  const raw = getMetaContent('article-category');
  if (!raw) return [];
  // e.g. "inspiration-guide:destinations/mallorca"
  // strip namespace prefix, split by '/'
  const path = normalizeTag(raw).replace(/^[^:]+:/, '');
  const parts = path.split('/').filter(Boolean);
  // build all ancestor paths too: ["destinations", "destinations/mallorca"]
  const segments = [];
  parts.reduce((acc, part) => {
    const seg = acc ? `${acc}/${part}` : part;
    segments.push(seg);
    return seg;
  }, '');
  return segments;
}

function byLatest(a, b) {
  return `${b.publishDate}`.localeCompare(`${a.publishDate}`);
}

async function getAutoArticles(mode) {
  const all = await getArticles();
  const currentPath = window.location.pathname;

  if (mode === 'auto-tag') {
    const pageTags = getPageTags();
    if (!pageTags.length) return all.sort(byLatest).slice(0, MAX_ITEMS);
    return all
      .filter((a) => {
        if (a.path === currentPath) return false;
        return a.tags.some((t) => pageTags.includes(normalizeTag(t)));
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
        const articleCat = normalizeTag(a.categorySlug || a.category);
        return segments.some((seg) => articleCat.includes(seg) || seg.includes(articleCat));
      })
      .sort(byLatest)
      .slice(0, MAX_ITEMS);
  }

  return [];
}

function getManualItems(block) {
  return [...block.children]
    .filter((row) => !row.classList.contains('editorial-article-grid-rendered'))
    .slice(0, MAX_ITEMS)
    .map((row, index) => {
      const cells = [...row.children];
      const picture = cells[0]?.querySelector('picture');
      const img = picture?.querySelector('img');
      return {
        id: `manual-${index + 1}`,
        image: img?.src || '',
        imageAlt: img?.alt || '',
        title: cells[1]?.textContent?.trim() || '',
        category: cells[2]?.textContent?.trim() || '',
        href: cells[3]?.textContent?.trim() || '#',
        picture,
        sourceRow: row,
      };
    });
}

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

  if (item.category) {
    const cat = document.createElement('p');
    cat.className = 'editorial-article-grid-category';
    cat.textContent = item.category;
    body.append(cat);
  }

  if (item.title) {
    const h3 = document.createElement('h3');
    h3.className = 'editorial-article-grid-title';
    const a = document.createElement('a');
    a.href = item.href || '#';
    a.textContent = item.title;
    h3.append(a);
    body.append(h3);
  }

  const cta = document.createElement('a');
  cta.className = 'editorial-article-grid-cta';
  cta.href = item.href || '#';
  cta.textContent = CTA_COPY;
  body.append(cta);

  li.append(body);
  return li;
}

export default async function decorate(block) {
  const existing = block.querySelector('.editorial-article-grid-rendered');
  if (existing) existing.remove();

  const pretitle = block.getAttribute('data-pretitle') || '';
  const title = block.getAttribute('data-title') || '';
  const mode = block.getAttribute('data-mode') || 'manual';

  let items;
  let sourceRows = [];

  if (mode === 'manual') {
    const manual = getManualItems(block);
    items = manual.map((m) => ({
      id: m.id,
      image: m.image,
      imageAlt: m.imageAlt,
      title: m.title,
      category: m.category,
      href: m.href,
      picture: m.picture,
    }));
    sourceRows = manual.map((m) => m.sourceRow).filter(Boolean);
  } else {
    items = await getAutoArticles(mode);
  }

  const rendered = document.createElement('div');
  rendered.className = 'editorial-article-grid-rendered';

  if (pretitle || title) {
    const header = document.createElement('div');
    header.className = 'editorial-article-grid-header';
    if (pretitle) {
      const h2 = document.createElement('h2');
      h2.className = 'editorial-article-grid-pretitle';
      h2.textContent = pretitle;
      header.append(h2);
    }
    if (title) {
      const p = document.createElement('p');
      p.className = 'editorial-article-grid-heading';
      p.textContent = title;
      header.append(p);
    }
    rendered.append(header);
  }

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
