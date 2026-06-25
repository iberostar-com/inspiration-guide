import { createOptimizedPicture } from '../../scripts/aem.js';
import { getArticles } from '../../scripts/inspiration-data.js';

const RESERVED_PROPS = new Set(['featuredLabel', 'latestLabel', 'mode', 'maxItems', 'ctaLabel']);

function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('blog-split-list-rendered'));
}

function rowContainsReservedProp(row) {
  const ownProp = row.getAttribute('data-aue-prop');
  if (ownProp && RESERVED_PROPS.has(ownProp)) {
    return true;
  }

  return [...row.querySelectorAll('[data-aue-prop]')]
    .some((el) => RESERVED_PROPS.has(el.getAttribute('data-aue-prop')));
}

function getFieldByProp(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;

  return getSourceRows(block)
    .map((row) => {
      if (row.matches?.(selector)) {
        return row;
      }

      return row.querySelector?.(selector) || null;
    })
    .find(Boolean) || null;
}

function getTextValue(block, propName, fallback = '') {
  const el = getFieldByProp(block, propName);
  const text = el?.textContent?.trim();

  return text || fallback;
}

function getConfiguredMode(block) {
  const fromProp = getTextValue(block, 'mode', '').toLowerCase();
  if (fromProp) {
    return fromProp;
  }

  return (block.getAttribute('data-mode') || 'manual').toLowerCase();
}

function getConfiguredMaxItems(block) {
  const fromProp = Number.parseInt(getTextValue(block, 'maxItems', ''), 10);
  if (!Number.isNaN(fromProp) && fromProp > 0) {
    return fromProp;
  }

  const fromAttr = Number.parseInt(block.getAttribute('data-max-items') || '', 10);
  if (!Number.isNaN(fromAttr) && fromAttr > 0) {
    return fromAttr;
  }

  return 5;
}

function getManualRows(block) {
  return getSourceRows(block).filter((row) => !rowContainsReservedProp(row));
}

function extractRowFields(row) {
  const cells = [...row.children];

  if (!cells.length) {
    return [];
  }

  if (cells.length > 1) {
    return cells;
  }

  const nested = [...cells[0].children];
  if (nested.length >= 4) {
    return nested;
  }

  return cells;
}

function getHrefFromField(field) {
  if (!field) {
    return '#';
  }

  const linked = field.querySelector('a[href]')?.getAttribute('href')?.trim();
  if (linked) {
    return linked;
  }

  return field.textContent?.trim() || '#';
}

function getImageFromField(field) {
  if (!field) {
    return '';
  }

  return field.querySelector('img')?.src || field.querySelector('a[href]')?.getAttribute('href')?.trim() || '';
}

function getCurrentCategorySlug() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const categoryIdx = segments.indexOf('category');
  if (categoryIdx > -1 && segments[categoryIdx + 1]) {
    return segments[categoryIdx + 1];
  }
  return '';
}

function fromManualRows(block, maxItems) {
  const rows = getManualRows(block).slice(0, maxItems);

  return rows.map((row, index) => {
    const fields = extractRowFields(row);
    const image = getImageFromField(fields[0]);
    const title = fields[1]?.textContent?.trim() || `Article ${index + 1}`;
    const summary = fields[2]?.textContent?.trim() || '';
    const href = getHrefFromField(fields[3]);

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

function createListItem(item, ctaLabel) {
  const li = document.createElement('li');
  li.className = 'blog-split-item';

  const link = document.createElement('a');
  link.className = 'blog-split-item-link';
  link.href = item.href;

  const pretitle = document.createElement('p');
  pretitle.className = 'blog-split-item-pretitle';
  pretitle.textContent = item.category || '';

  const heading = document.createElement('h3');
  heading.textContent = item.title;

  if (pretitle.textContent) {
    link.append(pretitle);
  }

  link.append(heading);

  const cta = document.createElement('span');
  cta.className = 'blog-split-item-cta';
  cta.textContent = ctaLabel;
  link.append(cta);

  if (item.summary) {
    const text = document.createElement('p');
    text.className = 'blog-split-item-summary';
    text.textContent = item.summary;
    li.append(link, text);
    return li;
  }

  li.append(link);
  return li;
}

function createFeatured(item, ctaLabel) {
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
  link.className = 'blog-split-featured-link';
  link.href = item.href;
  link.textContent = item.title;
  title.append(link);

  body.append(title);

  if (item.summary) {
    const summary = document.createElement('p');
    summary.textContent = item.summary;
    body.append(summary);
  }

  const cta = document.createElement('a');
  cta.className = 'blog-split-featured-cta';
  cta.href = item.href;
  cta.textContent = ctaLabel;
  body.append(cta);

  article.append(body);
  return article;
}

export default async function decorate(block) {
  const existing = block.querySelector(':scope > .blog-split-list-rendered');
  if (existing) {
    existing.remove();
  }

  const mode = getConfiguredMode(block);
  const maxItems = getConfiguredMaxItems(block);
  const featuredTitle = getTextValue(block, 'featuredLabel', 'En portada');
  const latestTitle = getTextValue(block, 'latestLabel', 'Ultimas publicaciones');
  const ctaLabel = getTextValue(block, 'ctaLabel', 'Leer articulo');

  const items = mode === 'auto-category'
    ? await fromAutoCategory(maxItems)
    : fromManualRows(block, maxItems);

  if (!items.length) {
    return;
  }

  hideSource(block);

  const wrapper = document.createElement('div');
  wrapper.className = 'blog-split-list-rendered';

  const featuredColumn = document.createElement('div');
  featuredColumn.className = 'blog-split-list-featured-column';
  featuredColumn.append(createEyebrow(featuredTitle));
  featuredColumn.append(createFeatured(items[0], ctaLabel));
  wrapper.append(featuredColumn);

  if (items.length > 1) {
    const latestColumn = document.createElement('div');
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
