import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { resolveFinalAlt } from '../../scripts/iberostar/image-alt.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_MAX_ITEMS = 9;

function getRows(block) {
  return [...block.children]
    .filter((row) => !row.classList.contains('carousel-category-gallery'));
}

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

function getPropElement(root, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  if (root?.matches?.(selector)) return root;
  return root?.querySelector?.(selector) || null;
}

function getTextFromElement(element) {
  return element?.textContent?.trim() || '';
}

function getCardImage(cell) {
  const image = cell?.matches?.('img') ? cell : cell?.querySelector?.('img');
  const anchor = cell?.matches?.('a[href]') ? cell : cell?.querySelector?.('a[href]');

  return {
    alt: image?.alt?.trim() || '',
    src: image?.src
      || anchor?.getAttribute('href')?.trim()
      || cell?.textContent?.trim()
      || '',
  };
}

function createCard(row) {
  const cells = [...row.children];
  const icon = getTextFromElement(getPropElement(row, 'icon')) || getTextFromElement(cells[0]);
  const imageField = getPropElement(row, 'image') || cells[1];
  const imageAltField = getPropElement(row, 'imageAlt');
  const imageAutoAltField = getPropElement(row, 'image_autoalt');
  const image = getCardImage(imageField);
  const title = getTextFromElement(getPropElement(row, 'title')) || getTextFromElement(cells[2]);
  const link = getTextFromElement(getPropElement(row, 'link')) || getTextFromElement(cells[3]);

  const li = document.createElement('li');
  li.className = 'carousel-category-gallery-item';
  moveInstrumentation(row, li);

  const card = document.createElement(link ? 'a' : 'div');
  card.className = 'carousel-category-gallery-card';
  if (link) card.href = link;

  if (image.src) {
    const media = document.createElement('div');
    media.className = 'carousel-category-gallery-media';
    media.append(createResponsiveImage(
      image.src,
      resolveFinalAlt(
        getTextFromElement(imageAltField),
        getTextFromElement(imageAutoAltField) || image.alt || title,
      ),
      { preset: 'category-carousel' },
    ));
    card.append(media);
  }

  if (icon) {
    const iconEl = document.createElement('i');
    iconEl.className = `ibh-icon-${icon.replace(/_/g, '-')}`;
    card.append(iconEl);
  }

  if (title) {
    const h3 = document.createElement('h3');
    h3.textContent = title;
    card.append(h3);
  }

  li.append(card);
  return li;
}

function getStride(cards) {
  const first = cards[0].getBoundingClientRect();
  if (cards[1]) return cards[1].getBoundingClientRect().left - first.left;
  return first.width;
}

function paging(list) {
  const cards = [...list.children];
  const total = cards.length;
  if (!total) {
    return {
      start: 0, end: 0, total: 0, index: 0, stride: 0,
    };
  }

  const stride = getStride(cards) || 1;
  const perView = Math.max(1, Math.round(list.clientWidth / stride));
  const maxIndex = Math.max(0, total - perView);
  const index = Math.min(Math.max(Math.round(list.scrollLeft / stride), 0), maxIndex);

  return {
    start: index + 1,
    end: Math.min(index + perView, total),
    total,
    index,
    stride,
  };
}

function enableDrag(list) {
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  const stop = () => {
    if (!dragging) return;
    dragging = false;
    list.style.removeProperty('scroll-snap-type');
  };

  list.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    dragging = true;
    moved = false;
    startX = event.clientX;
    startScroll = list.scrollLeft;
    list.style.scrollSnapType = 'none';
  });

  list.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    list.scrollLeft = startScroll - dx;
  });

  list.addEventListener('pointerup', stop);
  list.addEventListener('pointerleave', stop);
  list.addEventListener('pointercancel', stop);
  list.addEventListener('dragstart', (event) => event.preventDefault());

  list.addEventListener('click', (event) => {
    if (moved) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

function buildArrow(className, label, direction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', label);
  button.dataset.direction = direction;
  return button;
}

function buildControls(list, count) {
  const nav = document.createElement('div');
  nav.className = 'carousel-category-gallery-nav';

  const counter = document.createElement('span');
  counter.className = 'carousel-category-gallery-counter';
  counter.setAttribute('aria-live', 'polite');

  const prev = buildArrow('carousel-category-gallery-prev', 'Previous', -1);
  const next = buildArrow('carousel-category-gallery-next', 'Next', 1);
  nav.append(counter, prev, next);

  const dotsBar = document.createElement('div');
  dotsBar.className = 'carousel-category-gallery-dots-bar';

  const prevArrow = buildArrow('carousel-category-gallery-arrow carousel-category-gallery-arrow-prev', 'Previous', -1);
  const nextArrow = buildArrow('carousel-category-gallery-arrow carousel-category-gallery-arrow-next', 'Next', 1);

  const dots = document.createElement('div');
  dots.className = 'carousel-category-gallery-dots';

  const dotEls = Array.from({ length: count }, (unused, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-category-gallery-dot';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.dataset.index = i;
    dots.append(dot);
    return dot;
  });

  dotsBar.append(prevArrow, dots, nextArrow);

  const scrollToIndex = (i) => {
    const { stride } = paging(list);
    list.scrollTo({ left: i * stride, behavior: 'smooth' });
  };

  const step = (direction) => {
    const { index } = paging(list);
    scrollToIndex(index + direction);
  };

  [prev, next, prevArrow, nextArrow].forEach((button) => {
    button.addEventListener('click', () => step(Number(button.dataset.direction)));
  });

  dotEls.forEach((dot) => {
    dot.addEventListener('click', () => scrollToIndex(Number(dot.dataset.index)));
  });

  const update = () => {
    const {
      start, end, total, index,
    } = paging(list);
    if (!total) return;

    const range = start === end ? `${start}` : `${start} - ${end}`;
    counter.textContent = `${range} de ${total}`;

    const atStart = start <= 1;
    const atEnd = end >= total;
    prev.disabled = atStart;
    next.disabled = atEnd;
    prevArrow.disabled = atStart;
    nextArrow.disabled = atEnd;

    dotEls.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  };

  list.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  return { nav, dotsBar, update };
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
  if (showNav) enableDrag(list);
  let controls = null;

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
      controls = buildControls(list, cardRows.length);
      header.append(controls.nav);
    }

    wrapper.append(header);
  }

  wrapper.append(list);
  if (controls) wrapper.append(controls.dotsBar);

  block.replaceChildren(wrapper);

  if (controls) requestAnimationFrame(controls.update);
}
