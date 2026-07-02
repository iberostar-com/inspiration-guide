import { decorateIcons } from '../../scripts/aem.js';
import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_MAX_ITEMS = 9;

function getRows(block) {
  return [...block.children]
    .filter((row) => !row.classList.contains('carousel-category-gallery'));
}

// A card is authored as a child component (block/item). In Universal Editor it is
// tagged with data-aue-model; on published pages it is a multi-cell row with media.
function isCardRow(row) {
  if (row.matches?.('[data-aue-model="carousel-category-gallery-card"]')) return true;
  if (row.querySelector?.('[data-aue-model="carousel-category-gallery-card"]')) return true;
  if (row.querySelector?.('picture, img')) return true;
  return row.children.length > 1;
}

function getCardRows(block) {
  return getRows(block).filter(isCardRow);
}

function getConfigRows(block) {
  return getRows(block).filter((row) => !isCardRow(row));
}

// Reads a block-level field from the source rows. Prefers Universal Editor
// instrumentation (data-aue-prop); falls back to positional order on published
// pages, then to a data-* attribute. Returns the value and the element that
// carries the UE instrumentation (to move it onto the rendered node).
function readConfig(block, propName, index) {
  const configRows = getConfigRows(block);

  const instrumented = configRows
    .map((row) => (row.matches?.(`[data-aue-prop="${propName}"]`)
      ? row
      : row.querySelector?.(`[data-aue-prop="${propName}"]`)))
    .find(Boolean);
  if (instrumented) {
    return { value: instrumented.textContent?.trim() || '', source: instrumented };
  }

  const positional = configRows[index]?.textContent?.trim();
  if (positional) return { value: positional, source: null };

  return { value: block.getAttribute(`data-${propName}`) || '', source: null };
}

function createCard(row) {
  const cells = [...row.children];
  const icon = cells[0]?.textContent?.trim() || '';
  const picture = cells[1]?.querySelector('picture');
  const title = cells[2]?.textContent?.trim() || '';
  const link = cells[3]?.textContent?.trim() || '';

  const li = document.createElement('li');
  li.className = 'carousel-category-gallery-item';
  moveInstrumentation(row, li);

  const card = document.createElement(link ? 'a' : 'div');
  card.className = 'carousel-category-gallery-card';
  if (link) card.href = link;

  if (picture) {
    const media = document.createElement('div');
    media.className = 'carousel-category-gallery-media';
    media.append(createResponsiveImage(
      picture.querySelector('img')?.src,
      title,
      { preset: 'category-carousel' },
    ));
    card.append(media);
  }

  if (icon) {
    const iconSpan = document.createElement('span');
    iconSpan.className = `icon icon-${icon}`;
    card.append(iconSpan);
  }

  if (title) {
    const h3 = document.createElement('h3');
    h3.textContent = title;
    card.append(h3);
  }

  li.append(card);
  return li;
}

// Which cards are currently within the scroll viewport of the list.
function visibleRange(list) {
  const cards = [...list.children];
  const total = cards.length;
  if (!total) return { start: 0, end: 0, total: 0 };

  const box = list.getBoundingClientRect();
  const tolerance = 8;
  let first = -1;
  let last = -1;
  cards.forEach((card, index) => {
    const rect = card.getBoundingClientRect();
    if (rect.right > box.left + tolerance && rect.left < box.right - tolerance) {
      if (first === -1) first = index;
      last = index;
    }
  });
  if (first === -1) { first = 0; last = 0; }
  return { start: first + 1, end: last + 1, total };
}

function buildNav(list) {
  const nav = document.createElement('div');
  nav.className = 'carousel-category-gallery-nav';

  const counter = document.createElement('span');
  counter.className = 'carousel-category-gallery-counter';
  counter.setAttribute('aria-live', 'polite');

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-category-gallery-prev';
  prev.setAttribute('aria-label', 'Previous');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-category-gallery-next';
  next.setAttribute('aria-label', 'Next');

  const scrollByCard = (direction) => {
    const card = list.querySelector('.carousel-category-gallery-item');
    const amount = (card?.getBoundingClientRect().width || 300) + 16;
    list.scrollBy({ left: amount * direction, behavior: 'smooth' });
  };

  prev.addEventListener('click', () => scrollByCard(-1));
  next.addEventListener('click', () => scrollByCard(1));

  const update = () => {
    const { start, end, total } = visibleRange(list);
    if (!total) { counter.textContent = ''; return; }
    const range = start === end ? `${start}` : `${start} - ${end}`;
    counter.textContent = `${range} de ${total}`;
  };

  let scheduled = 0;
  const schedule = () => {
    if (scheduled) return;
    scheduled = requestAnimationFrame(() => { scheduled = 0; update(); });
  };
  list.addEventListener('scroll', schedule);
  window.addEventListener('resize', schedule);

  nav.append(counter, prev, next);
  return { nav, update };
}

export default function decorate(block) {
  const eyebrow = readConfig(block, 'eyebrow', 0);
  const title = readConfig(block, 'title', 1);
  const maxItems = Number.parseInt(readConfig(block, 'maxItems', 2).value, 10) || DEFAULT_MAX_ITEMS;

  const cardRows = getCardRows(block).slice(0, maxItems);

  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-category-gallery';

  const list = document.createElement('ul');
  list.className = 'carousel-category-gallery-list';
  cardRows.forEach((row) => list.append(createCard(row)));

  const showNav = cardRows.length > 1;
  let nav = null;

  if (eyebrow.value || title.value || showNav) {
    const header = document.createElement('div');
    header.className = 'carousel-category-gallery-header';

    const headings = document.createElement('div');
    headings.className = 'carousel-category-gallery-headings';

    if (eyebrow.value) {
      const el = document.createElement('p');
      el.className = 'carousel-category-gallery-eyebrow';
      el.textContent = eyebrow.value;
      if (eyebrow.source) moveInstrumentation(eyebrow.source, el);
      headings.append(el);
    }

    if (title.value) {
      const el = document.createElement('h2');
      el.className = 'carousel-category-gallery-title';
      el.textContent = title.value;
      if (title.source) moveInstrumentation(title.source, el);
      headings.append(el);
    }

    header.append(headings);

    if (showNav) {
      nav = buildNav(list);
      header.append(nav.nav);
    }

    wrapper.append(header);
  }

  wrapper.append(list);
  block.replaceChildren(wrapper);
  decorateIcons(wrapper);

  if (nav) requestAnimationFrame(nav.update);
}
