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

  let content = row;
  while (
    content.children.length === 1
    && content.firstElementChild?.tagName === 'DIV'
    && !content.firstElementChild.hasAttribute('data-aue-prop')
    && !content.firstElementChild.hasAttribute('data-aue-resource')
  ) {
    content = content.firstElementChild;
  }

  return content.children.length ? [...content.children] : [content];
}

function getPropElement(root, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  if (root?.matches?.(selector)) return root;
  return root?.querySelector?.(selector) || null;
}

function isInstrumentedCardRow(row) {
  return Boolean(
    row.matches?.('[data-aue-resource]')
    || row.querySelector?.(':scope > [data-aue-resource]')
    || getPropElement(row, 'image')
    || getPropElement(row, 'pretitle'),
  );
}

function getParentPropElement(block, propName) {
  return getSourceRows(block)
    .filter((row) => !isInstrumentedCardRow(row))
    .map((row) => getPropElement(row, propName))
    .find(Boolean) || null;
}

function isConfigRow(row) {
  if (isInstrumentedCardRow(row)) return false;

  return ['title', 'subtitle', 'ctaText', 'cta']
    .some((propName) => Boolean(getPropElement(row, propName)));
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
  const prop = getParentPropElement(block, propName);
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
  const prop = getParentPropElement(block, propName);
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

function getCardImage(field) {
  const image = field?.matches?.('img') ? field : field?.querySelector?.('img');
  const anchor = field?.matches?.('a[href]') ? field : field?.querySelector?.('a[href]');

  return {
    alt: image?.alt?.trim() || '',
    src: image?.src
      || anchor?.getAttribute('href')?.trim()
      || field?.textContent?.trim()
      || '',
  };
}

function getCardData(row) {
  const cells = getCells(row);
  const imageField = getPropElement(row, 'image') || cells[0];
  const imageAltField = getPropElement(row, 'imageAlt');
  const pretitleField = getPropElement(row, 'pretitle');
  const titleField = getPropElement(row, 'title');
  const legacySubtitleField = getPropElement(row, 'subtitle');
  const hasLegacyFields = !pretitleField && Boolean(legacySubtitleField);
  const positionalOffset = cells.length >= 5 ? 1 : 0;
  const image = getCardImage(imageField);

  const pretitle = hasLegacyFields
    ? titleField?.textContent?.trim() || ''
    : pretitleField?.textContent?.trim()
      || cells[1 + positionalOffset]?.textContent?.trim()
      || '';
  const title = hasLegacyFields
    ? legacySubtitleField?.textContent?.trim() || ''
    : titleField?.textContent?.trim()
      || cells[2 + positionalOffset]?.textContent?.trim()
      || '';
  const linkField = getPropElement(row, 'link') || cells[3 + positionalOffset];

  return {
    imageAlt: imageAltField?.textContent?.trim() || image.alt || title,
    imageSrc: image.src,
    link: getCardLink(linkField),
    pretitle,
    title,
  };
}

function createCard(row) {
  const {
    imageAlt,
    imageSrc,
    link,
    pretitle,
    title,
  } = getCardData(row);

  const li = document.createElement('li');
  li.className = 'grid-category-gallery-item';
  moveInstrumentation(row, li);

  row.classList.add('grid-category-gallery-source');
  row.setAttribute('aria-hidden', 'true');

  const card = document.createElement(link ? 'a' : 'div');
  card.className = 'grid-category-gallery-card';
  card.classList.toggle('has-image', Boolean(imageSrc));
  if (link) {
    card.href = link;
    card.setAttribute('aria-label', title || pretitle || 'View destination');
  }

  if (imageSrc) {
    const media = document.createElement('div');
    media.className = 'grid-category-gallery-media';
    media.append(createResponsiveImage(
      imageSrc,
      imageAlt,
      { preset: 'category-card' },
    ));
    card.append(media);
  }

  const body = document.createElement('div');
  body.className = 'grid-category-gallery-body';

  if (pretitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'grid-category-gallery-subtitle';
    subtitleEl.textContent = pretitle;
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

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'grid-category-gallery-next';
  next.setAttribute('aria-label', 'Next destinations');

  const dots = document.createElement('div');
  dots.className = 'grid-category-gallery-dots';
  const dotEls = items.map((item, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'grid-category-gallery-dot';
    dot.setAttribute('aria-label', `Go to destination ${index + 1}`);
    dot.dataset.index = index;
    dots.append(dot);
    return dot;
  });

  const getStride = () => {
    const first = items[0]?.getBoundingClientRect();
    if (!first) return 0;
    if (items[1]) return items[1].getBoundingClientRect().left - first.left;
    return first.width;
  };

  const currentIndex = () => {
    const stride = getStride() || 1;
    const perView = Math.max(1, Math.round(list.clientWidth / stride));
    const maxIndex = Math.max(0, items.length - perView);
    return Math.min(Math.max(Math.round(list.scrollLeft / stride), 0), maxIndex);
  };

  const scrollToIndex = (index) => {
    list.scrollTo({ left: index * getStride(), behavior: 'smooth' });
  };

  const update = () => {
    const index = currentIndex();
    dotEls.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  };

  prev.addEventListener('click', () => scrollToIndex(currentIndex() - 1));
  next.addEventListener('click', () => scrollToIndex(currentIndex() + 1));
  dotEls.forEach((dot) => {
    dot.addEventListener('click', () => scrollToIndex(Number(dot.dataset.index)));
  });
  list.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  controls.append(prev, dots, next);
  requestAnimationFrame(update);
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
  const instrumentedCardRows = sourceRows.filter((row) => isInstrumentedCardRow(row));
  const cardRows = (
    instrumentedCardRows.length
      ? instrumentedCardRows
      : sourceRows.filter((row) => !configRows.has(row))
  ).slice(0, MAX_CARDS);

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
      const subtitleEl = document.createElement('h2');
      subtitleEl.className = 'grid-category-gallery-subheading';
      subtitleEl.textContent = subtitle;
      headerText.append(subtitleEl);
    }

    header.append(headerText);

    if (ctaUrl) {
      const cta = document.createElement('a');
      cta.className = 'grid-category-gallery-cta';
      cta.href = ctaUrl;
      const ctaLabel = document.createElement('span');
      ctaLabel.className = 'grid-category-gallery-cta-label';
      ctaLabel.textContent = ctaText || ctaUrl;
      cta.append(ctaLabel);
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
