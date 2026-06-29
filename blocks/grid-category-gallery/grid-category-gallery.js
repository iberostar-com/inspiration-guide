import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const MAX_CARDS = 4;
const CONFIG_FIELD_POSITIONS = {
  cta: 3,
  ctaText: 2,
  subtitle: 1,
  title: 0,
};

function getSourceRows(block) {
  return [...block.children]
    .filter((row) => !row.classList.contains('grid-category-gallery-rendered'));
}

function getCells(row) {
  if (!row) return [];
  if (row.children.length > 1) return [...row.children];

  const nested = [...(row.children[0]?.children || [])];
  return nested.length ? nested : [...row.children];
}

function getPropElement(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  return getSourceRows(block)
    .map((row) => (row.matches?.(selector) ? row : row.querySelector?.(selector)))
    .find(Boolean) || null;
}

function isConfigRow(row) {
  return Boolean(row.querySelector?.(
    '[data-aue-prop="title"], [data-aue-prop="subtitle"], [data-aue-prop="ctaText"], [data-aue-prop="cta"]',
  ));
}

function getConfigRows(block) {
  const rows = getSourceRows(block);
  const instrumented = rows.filter((row) => isConfigRow(row));
  if (instrumented.length) return instrumented;

  const hasLegacyConfig = ['data-title', 'data-subtitle', 'data-cta-text', 'data-cta']
    .some((attr) => block.hasAttribute(attr));
  if (hasLegacyConfig) return [];

  return rows.slice(0, Object.keys(CONFIG_FIELD_POSITIONS).length)
    .filter((row) => getCells(row).length === 1);
}

function getConfigField(block, propName, legacyAttr) {
  const prop = getPropElement(block, propName);
  if (prop) return prop;

  if (block.hasAttribute(legacyAttr)) return null;

  const configRows = getConfigRows(block);
  const ctaRow = configRows.find((row) => row.querySelector('a[href]'));
  let row = configRows[CONFIG_FIELD_POSITIONS[propName]];
  if (propName === 'cta') row = ctaRow || configRows[3] || configRows[2];
  if (propName === 'ctaText') row = ctaRow || configRows[2];
  const cells = getCells(row);
  return cells[cells.length - 1] || null;
}

function getConfigText(block, propName, legacyAttr) {
  const prop = getPropElement(block, propName);
  if (prop) return prop.textContent?.trim() || '';

  const legacyValue = block.getAttribute(legacyAttr);
  if (legacyValue !== null) return legacyValue.trim();

  return getConfigField(block, propName, legacyAttr)?.textContent?.trim() || '';
}

function getConfigHref(block, propName, legacyAttr) {
  const field = getConfigField(block, propName, legacyAttr);
  const anchor = field?.matches?.('a[href]') ? field : field?.querySelector?.('a[href]');
  const href = anchor?.getAttribute('href')?.trim();
  const legacyValue = block.getAttribute(legacyAttr);
  return href || legacyValue?.trim() || field?.textContent?.trim() || '';
}

function restoreSourceRows(block) {
  const rendered = block.querySelector(':scope > .grid-category-gallery-rendered');
  if (!rendered) return;

  rendered.querySelectorAll('.grid-category-gallery-item').forEach((item) => {
    const row = item.querySelector(':scope > .grid-category-gallery-source');
    if (!row) return;

    moveInstrumentation(item, row);
    row.classList.remove('grid-category-gallery-source');
    row.removeAttribute('aria-hidden');
    block.insertBefore(row, rendered);
  });
  rendered.remove();
}

function getCardLink(cell) {
  const anchor = cell?.matches?.('a[href]') ? cell : cell?.querySelector?.('a[href]');
  return anchor?.getAttribute('href')?.trim()
    || cell?.textContent?.trim()
    || '';
}

function createCard(row) {
  const cells = getCells(row);
  const picture = cells[0]?.querySelector('picture');
  const title = cells[1]?.textContent?.trim() || '';
  const subtitle = cells[2]?.textContent?.trim() || '';
  const link = getCardLink(cells[3]);

  const li = document.createElement('li');
  li.className = 'grid-category-gallery-item';
  moveInstrumentation(row, li);

  row.classList.add('grid-category-gallery-source');
  row.setAttribute('aria-hidden', 'true');

  const card = document.createElement(link ? 'a' : 'div');
  card.className = 'grid-category-gallery-card';
  if (link) {
    card.href = link;
    card.setAttribute('aria-label', title || subtitle || 'View destination');
  }

  const img = picture?.querySelector('img');
  if (img?.src) {
    const media = document.createElement('div');
    media.className = 'grid-category-gallery-media';
    media.append(createResponsiveImage(
      img.src,
      img.alt || title,
      { preset: 'category-card' },
    ));
    card.append(media);
  }

  const body = document.createElement('div');
  body.className = 'grid-category-gallery-body';

  if (subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'grid-category-gallery-subtitle';
    subtitleEl.textContent = subtitle;
    body.append(subtitleEl);
  }

  if (title) {
    const headingEl = document.createElement('h3');
    headingEl.className = 'grid-category-gallery-title';
    headingEl.textContent = title;
    body.append(headingEl);
  }

  card.append(body);
  li.append(row, card);
  return li;
}

function buildCarouselControls(list, items) {
  const controls = document.createElement('div');
  controls.className = 'grid-category-gallery-controls';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'grid-category-gallery-prev';
  prev.setAttribute('aria-label', 'Previous destinations');
  prev.innerHTML = '<span aria-hidden="true"></span>';

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'grid-category-gallery-next';
  next.setAttribute('aria-label', 'Next destinations');
  next.innerHTML = '<span aria-hidden="true"></span>';

  const updateButtons = () => {
    const { scrollLeft, scrollWidth, clientWidth } = list;
    prev.disabled = scrollLeft <= 0;
    next.disabled = scrollLeft + clientWidth >= scrollWidth - 1;
  };

  const scrollByCard = (direction) => {
    const itemWidth = items[0]?.getBoundingClientRect().width || 0;
    const gap = Number.parseFloat(window.getComputedStyle(list).columnGap) || 16;
    list.scrollBy({ left: direction * (itemWidth + gap), behavior: 'smooth' });
  };

  prev.addEventListener('click', () => scrollByCard(-1));
  next.addEventListener('click', () => scrollByCard(1));
  list.addEventListener('scroll', updateButtons, { passive: true });
  updateButtons();

  controls.append(prev, next);
  return controls;
}

function hideConfigRows(rows) {
  rows.forEach((row) => {
    row.classList.add('grid-category-gallery-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

export default function decorate(block) {
  restoreSourceRows(block);

  const title = getConfigText(block, 'title', 'data-title');
  const subtitle = getConfigText(block, 'subtitle', 'data-subtitle');
  const ctaText = getConfigText(block, 'ctaText', 'data-cta-text');
  const ctaUrl = getConfigHref(block, 'cta', 'data-cta');
  const sourceRows = getSourceRows(block);
  const configRows = new Set(getConfigRows(block));
  const cardRows = sourceRows
    .filter((row) => !configRows.has(row))
    .slice(0, MAX_CARDS);

  const rendered = document.createElement('div');
  rendered.className = 'grid-category-gallery-rendered';

  if (title || subtitle || ctaUrl) {
    const header = document.createElement('div');
    header.className = 'grid-category-gallery-header';

    const headerText = document.createElement('div');
    headerText.className = 'grid-category-gallery-header-text';

    if (title) {
      const titleEl = document.createElement('h2');
      titleEl.className = 'grid-category-gallery-heading';
      titleEl.textContent = title;
      headerText.append(titleEl);
    }

    if (subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.className = 'grid-category-gallery-subheading';
      subtitleEl.textContent = subtitle;
      headerText.append(subtitleEl);
    }

    header.append(headerText);

    if (ctaUrl) {
      const cta = document.createElement('a');
      cta.className = 'grid-category-gallery-cta';
      cta.href = ctaUrl;
      cta.textContent = ctaText || ctaUrl;
      header.append(cta);
    }

    rendered.append(header);
  }

  const list = document.createElement('ul');
  list.className = 'grid-category-gallery-list';

  const items = cardRows.map((row) => {
    const item = createCard(row);
    list.append(item);
    return item;
  });

  rendered.append(list);
  if (items.length > 1) rendered.append(buildCarouselControls(list, items));

  hideConfigRows(sourceRows.filter((row) => configRows.has(row) || !cardRows.includes(row)));
  block.append(rendered);
}
