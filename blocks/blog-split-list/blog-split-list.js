import { createOptimizedPicture } from '../../scripts/aem.js';
import { getArticles } from '../../scripts/inspiration-data.js';

function getCurrentCategorySlug() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const categoryIdx = segments.indexOf('category');
  if (categoryIdx > -1 && segments[categoryIdx + 1]) {
    return segments[categoryIdx + 1];
  }
  return '';
}

function fromManualRows(block, maxItems) {
  const rows = [...block.children].slice(0, maxItems);
  return rows.map((row, index) => {
    const cells = [...row.children];
    const image = cells[0]?.querySelector('img')?.src || '';
    const title = cells[1]?.textContent?.trim() || `Article ${index + 1}`;
    const summary = cells[2]?.textContent?.trim() || '';
    const href = cells[3]?.textContent?.trim() || '#';

    return {
      id: `manual-${index + 1}`,
      image,
      title,
      summary,
      href,
    };
  });
}

async function fromAutoCategory(maxItems) {
  const category = getCurrentCategorySlug();
  const all = await getArticles();
  return all
    .filter((article) => !category || article.category === category)
    .slice(0, maxItems)
    .map((article) => ({
      id: article.id,
      image: article.image,
      title: article.title,
      summary: article.summary,
      href: `/article/${article.id}`,
    }));
}

function createListItem(item) {
  const li = document.createElement('li');
  li.className = 'blog-split-item';

  const link = document.createElement('a');
  link.href = item.href;

  const heading = document.createElement('h3');
  heading.textContent = item.title;

  link.appendChild(heading);

  if (item.summary) {
    const text = document.createElement('p');
    text.textContent = item.summary;
    li.append(link, text);
    return li;
  }

  li.append(link);
  return li;
}

function createFeatured(item) {
  const article = document.createElement('article');
  article.className = 'blog-split-featured';

  if (item.image) {
    const media = document.createElement('div');
    media.className = 'blog-split-media';
    media.append(
      createOptimizedPicture(item.image, item.title, false, [{ width: '750' }]),
    );
    article.append(media);
  }

  const body = document.createElement('div');
  body.className = 'blog-split-body';

  const title = document.createElement('h2');
  const link = document.createElement('a');
  link.href = item.href;
  link.textContent = item.title;
  title.append(link);

  body.append(title);

  if (item.summary) {
    const summary = document.createElement('p');
    summary.textContent = item.summary;
    body.append(summary);
  }

  article.append(body);
  return article;
}

export default async function decorate(block) {
  const mode = block.getAttribute('data-mode') || 'manual';
  const maxItems = Number.parseInt(block.getAttribute('data-max-items') || '5', 10);

  const items = mode === 'auto-category'
    ? await fromAutoCategory(maxItems)
    : fromManualRows(block, maxItems);

  if (!items.length) {
    block.replaceChildren();
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'blog-split-list';

  wrapper.append(createFeatured(items[0]));

  if (items.length > 1) {
    const list = document.createElement('ul');
    list.className = 'blog-split-side-list';
    items.slice(1).forEach((item) => list.append(createListItem(item)));
    wrapper.append(list);
  }

  block.replaceChildren(wrapper);
}
