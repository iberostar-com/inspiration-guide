import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { getArticles } from '../../scripts/inspiration-data.js';

function getContext(kind) {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const idx = segments.indexOf(kind);
  return idx > -1 ? segments[idx + 1] || '' : '';
}

function sortItems(items, sort) {
  if (sort === 'reading-time') {
    return [...items].sort((a, b) => b.readingTime - a.readingTime);
  }
  return [...items].sort((a, b) => `${b.publishDate}`.localeCompare(`${a.publishDate}`));
}

function manualItems(block) {
  return [...block.children].map((row, index) => {
    const cells = [...row.children];
    return {
      id: `manual-${index + 1}`,
      title: cells[1]?.textContent?.trim() || `Manual ${index + 1}`,
      summary: cells[2]?.textContent?.trim() || '',
      image: cells[0]?.querySelector('img')?.src || '',
      publishDate: '',
      readingTime: 0,
      href: cells[3]?.textContent?.trim() || '#',
    };
  });
}

async function autoItems(mode) {
  const all = await getArticles();
  if (mode === 'auto-tag') {
    const tag = getContext('tag');
    return all.filter((article) => !tag || article.tags.includes(tag));
  }

  if (mode === 'auto-category') {
    const category = getContext('category');
    return all.filter((article) => !category || article.category === category);
  }

  return [];
}

function makeCard(item) {
  const li = document.createElement('li');
  li.className = 'editorial-article-grid-card';

  if (item.image) {
    const media = document.createElement('div');
    media.className = 'editorial-article-grid-media';
    media.append(createResponsiveImage(item.image, item.title, false, [{ width: '750' }]));
    li.append(media);
  }

  const body = document.createElement('div');
  body.className = 'editorial-article-grid-body';

  const h3 = document.createElement('h3');
  const a = document.createElement('a');
  a.href = item.href || `/article/${item.id}`;
  a.textContent = item.title;
  h3.append(a);
  body.append(h3);

  if (item.summary) {
    const p = document.createElement('p');
    p.textContent = item.summary;
    body.append(p);
  }

  li.append(body);
  return li;
}

export default async function decorate(block) {
  const mode = block.getAttribute('data-mode') || 'manual';
  const sort = block.getAttribute('data-sort') || 'latest';
  const maxItems = Number.parseInt(block.getAttribute('data-max-items') || '8', 10);

  const items = mode === 'manual' ? manualItems(block) : await autoItems(mode);
  const sorted = sortItems(items, sort).slice(0, maxItems);

  const wrapper = document.createElement('div');
  wrapper.className = 'editorial-article-grid';

  const list = document.createElement('ul');
  list.className = 'editorial-article-grid-list';
  sorted.forEach((item) => list.append(makeCard(item)));

  wrapper.append(list);
  block.replaceChildren(wrapper);
}
