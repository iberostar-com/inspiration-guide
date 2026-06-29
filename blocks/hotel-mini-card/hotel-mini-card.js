import { createResponsiveImage } from '../../scripts/iberostar/media.js';

const FIELD_POSITIONS = {
  media_image: [0, 0],
  media_imageAlt: [0, 0],
  hotel_hotelName: [1, 0],
  hotel_location: [1, 1],
  hotel_stars: [1, 2],
  hotel_priceFrom: [1, 3],
  cta_linkText: [2, 0],
  cta_link: [2, 0],
  cta_linkTarget: [2, 1],
  tag_layout: [3, 0],
  tag_tagLabel: [3, 0],
};

const FIELD_ALIASES = {
  ctaText: ['cta_linkText', 'card_linkText'],
  image: ['media_image', 'card_image'],
  imageAlt: ['media_imageAlt', 'card_imageAlt'],
  hotelName: ['hotel_hotelName', 'card_hotelName'],
  link: ['cta_link', 'card_link'],
  linkTarget: ['cta_linkTarget', 'card_linkTarget'],
  location: ['hotel_location', 'card_location'],
  layout: ['tag_layout'],
  priceFrom: ['hotel_priceFrom', 'card_priceFrom'],
  stars: ['hotel_stars', 'card_stars'],
  tagLabel: ['tag_tagLabel', 'card_tagLabel'],
};

function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('hotel-mini-card-rendered'));
}

function getCells(row) {
  if (!row) return [];

  let content = row;
  while (
    content.children.length === 1
    && content.firstElementChild?.tagName === 'DIV'
    && !content.firstElementChild.hasAttribute('data-aue-prop')
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

function getField(block, propName) {
  const names = [propName, ...(FIELD_ALIASES[propName] || [])];
  const fromBlock = getSourceRows(block)
    .flatMap((sourceRow) => names.map((name) => getPropElement(sourceRow, name)))
    .find(Boolean);
  if (fromBlock) return fromBlock;

  const position = names.map((name) => FIELD_POSITIONS[name]).find(Boolean);
  if (!position) return null;

  const [rowIndex, cellIndex] = position;
  return getCells(getSourceRows(block)[rowIndex])[cellIndex] || null;
}

function getText(block, propName, legacyAttr = '', fallback = '') {
  return getField(block, propName)?.textContent?.trim()
    || block.getAttribute(legacyAttr)?.trim()
    || fallback;
}

function getAnchor(field) {
  if (field?.matches?.('a[href]')) return field;
  return field?.querySelector?.('a[href]') || null;
}

function getHref(block, propName, legacyAttr = '') {
  const field = getField(block, propName);
  return getAnchor(field)?.getAttribute('href')?.trim()
    || block.getAttribute(legacyAttr)?.trim()
    || field?.textContent?.trim()
    || '';
}

function getImageElement(field) {
  if (field?.matches?.('img')) return field;
  return field?.querySelector?.('img') || null;
}

function getImage(block) {
  const field = getField(block, 'image');
  return getImageElement(field)?.src
    || getAnchor(field)?.getAttribute('href')?.trim()
    || block.getAttribute('data-image')?.trim()
    || '';
}

function getImageAlt(block) {
  const field = getField(block, 'image');
  return getImageElement(field)?.alt?.trim()
    || getText(block, 'imageAlt', 'data-image-alt', '');
}

function normalizeVariant(value) {
  const normalized = `${value || ''}`.trim().toLowerCase();
  if (normalized.includes('vertical')) return 'vertical';
  if (normalized.includes('horizontal')) return 'horizontal';
  return '';
}

function getClassVariant(block) {
  if (block.classList.contains('vertical')) return 'vertical';
  if (block.classList.contains('horizontal')) return 'horizontal';
  return '';
}

function getVariant(block) {
  return [
    block.getAttribute('data-layout'),
    block.getAttribute('data-variant'),
    getClassVariant(block),
    getText(block, 'layout', '', ''),
  ].map(normalizeVariant).find(Boolean) || 'horizontal';
}

function normalizeStars(value) {
  const parsed = Number.parseInt(`${value || ''}`.replace(/[^\d]/g, ''), 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(parsed, 5));
}

function createStars(count, variant) {
  if (!count) return null;

  const stars = document.createElement('span');
  stars.className = 'hotel-mini-card-stars';
  stars.setAttribute('aria-label', `${count} stars`);
  stars.textContent = '★'.repeat(count);
  if (variant === 'vertical') stars.classList.add('hotel-mini-card-stars-small');
  return stars;
}

function createLink(href, text, className, target = '_self') {
  const link = document.createElement('a');
  link.className = className;
  link.href = href || '#';
  link.textContent = text;
  if (target === '_blank') {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  return link;
}

function createTag(label) {
  if (!label) return null;

  const tag = document.createElement('span');
  tag.className = 'hotel-mini-card-tag';

  const icon = document.createElement('span');
  icon.className = 'hotel-mini-card-tag-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '%';

  const text = document.createElement('span');
  text.className = 'hotel-mini-card-tag-label';
  text.textContent = label;

  tag.append(icon, text);
  return tag;
}

function normalizeTarget(value) {
  return `${value || ''}`.trim().toLowerCase() === '_blank' ? '_blank' : '_self';
}

export function readHotelData(block, variant = 'horizontal') {
  const link = getHref(block, 'link', 'data-link');
  const linkField = getField(block, 'link');
  const linkText = getAnchor(linkField)?.textContent?.trim();

  return {
    ctaText: getText(block, 'ctaText', 'data-cta-text', linkText || ''),
    href: link,
    image: getImage(block),
    imageAlt: getImageAlt(block),
    location: getText(block, 'location', 'data-location', ''),
    name: getText(block, 'hotelName', 'data-hotel-name', ''),
    priceFrom: getText(block, 'priceFrom', 'data-price-from', ''),
    stars: normalizeStars(getText(block, 'stars', 'data-stars', '')),
    tagLabel: variant === 'vertical' ? getText(block, 'tagLabel', 'data-tag-label', '') : '',
    target: normalizeTarget(getText(block, 'linkTarget', 'data-link-target', '_self')),
  };
}

export function createHotelMiniCard(hotel, variant = 'horizontal') {
  const article = document.createElement('article');
  article.className = `hotel-mini-card hotel-mini-card-${variant}`;

  if (hotel.image) {
    const media = document.createElement('div');
    media.className = 'hotel-mini-card-media';
    media.append(createResponsiveImage(hotel.image, hotel.imageAlt || hotel.name, {
      preset: variant === 'vertical' ? 'hotel-mini-card-vertical' : 'hotel-mini-card-horizontal',
    }));
    article.append(media);
  }

  const tag = createTag(hotel.tagLabel);
  if (tag) article.append(tag);

  const body = document.createElement('div');
  body.className = 'hotel-mini-card-body';

  const info = document.createElement('div');
  info.className = 'hotel-mini-card-info';

  const stars = createStars(hotel.stars, variant);
  if (stars) info.append(stars);

  if (hotel.name) {
    const title = document.createElement(variant === 'vertical' ? 'h3' : 'h2');
    title.className = 'hotel-mini-card-title';

    if (variant === 'vertical' && hotel.href) {
      title.append(createLink(hotel.href, hotel.name, 'hotel-mini-card-title-link', hotel.target));
    } else {
      title.textContent = hotel.name;
    }
    info.append(title);
  }

  if (hotel.location) {
    const location = document.createElement('p');
    location.className = 'hotel-mini-card-location';
    location.textContent = hotel.location;
    info.append(location);
  }

  body.append(info);

  const action = document.createElement('div');
  action.className = 'hotel-mini-card-action';

  if (hotel.priceFrom) {
    const price = document.createElement('p');
    price.className = 'hotel-mini-card-price';
    price.textContent = hotel.priceFrom;
    action.append(price);
  }

  if (variant === 'horizontal' && hotel.href) {
    action.append(createLink(hotel.href, hotel.ctaText, 'hotel-mini-card-cta', hotel.target));
  }

  if (action.children.length) body.append(action);

  article.append(body);
  return article;
}

function hideSource(block) {
  getSourceRows(block).forEach((row) => {
    if (row === block) return;
    row.classList.add('hotel-mini-card-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

function isAuthoringPage(block) {
  return Boolean(block.closest('[data-aue-resource]') || document.querySelector('[data-aue-resource]'));
}

function observeAuthorChanges(block) {
  block.hotelMiniCardObserver?.disconnect();
  if (!isAuthoringPage(block)) return;

  const observer = new MutationObserver(() => {
    observer.disconnect();
    // eslint-disable-next-line no-use-before-define
    decorate(block);
  });
  getSourceRows(block).forEach((row) => {
    observer.observe(row, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
  block.hotelMiniCardObserver = observer;
}

export default function decorate(block) {
  block.hotelMiniCardObserver?.disconnect();
  block.querySelector(':scope > .hotel-mini-card-rendered')?.remove();

  const variant = getVariant(block);
  const hotel = readHotelData(block, variant);
  const rendered = document.createElement('div');
  rendered.className = 'hotel-mini-card-rendered';
  rendered.append(createHotelMiniCard(hotel, variant));

  hideSource(block);
  block.append(rendered);
  observeAuthorChanges(block);
}
