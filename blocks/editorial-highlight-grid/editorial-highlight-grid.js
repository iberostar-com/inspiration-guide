import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { getArticles } from '../../scripts/inspiration-data.js';

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
  return [...block.children].map((row, index) => {
    const cells = [...row.children];
    const image = cells[0]?.querySelector('img')?.src || '';
    const title = cells[1]?.textContent?.trim() || `Manual article ${index + 1}`;
    const summary = cells[2]?.textContent?.trim() || '';
    const href = cells[3]?.textContent?.trim() || '#';
    return {
      id: `m-${index + 1}`,
      image,
      title,
      summary,
      href,
    };
  });
}

async function autoItems(source) {
  const all = await getArticles();
  if (source === 'auto-tag') {
    const tag = getContextTag();
    return all
      .filter((article) => !tag || article.tags.includes(tag))
      .map((article) => ({
        ...article,
        href: `/article/${article.id}`,
      }));
  }

  if (source === 'auto-category') {
    const category = getContextCategory();
    return all
      .filter((article) => !category || article.category === category)
      .map((article) => ({
        ...article,
        href: `/article/${article.id}`,
      }));
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

export default async function decorate(block) {
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
