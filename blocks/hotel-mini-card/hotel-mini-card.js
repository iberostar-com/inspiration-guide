import { createResponsiveImage } from '../../scripts/iberostar/media.js';

const FIELD_ORDER = [
  'media_image',
  'hotel_hotelName',
  'hotel_location',
  'hotel_stars',
  'hotel_priceFrom',
  'cta_linkText',
  'cta_link',
  'cta_linkTarget',
  'tag_tagLabel',
];

const FIELD_ALIASES = {
  ctaText: ['cta_linkText'],
  image: ['media_image'],
  imageAlt: ['media_imageAlt'],
  hotelName: ['hotel_hotelName'],
  link: ['cta_link'],
  linkTarget: ['cta_linkTarget'],
  location: ['hotel_location'],
  priceFrom: ['hotel_priceFrom'],
  stars: ['hotel_stars'],
  tagLabel: ['tag_tagLabel'],
};

function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('hotel-mini-card-rendered'));
}

function getCells(row) {
  if (!row) return [];
  if (row.children.length > 1) return [...row.children];

  const nested = [...(row.children[0]?.children || [])];
  return nested.length ? nested : [...row.children];
}

function getPropElement(root, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  if (root?.matches?.(selector)) return root;
  return root?.querySelector?.(selector) || null;
}

function getField(block, row, propName) {
  const names = [propName, ...(FIELD_ALIASES[propName] || [])];
  const fromRow = names
    .map((name) => getPropElement(row, name))
    .find(Boolean);
  if (fromRow) return fromRow;

  const fromBlock = getSourceRows(block)
    .flatMap((sourceRow) => names.map((name) => getPropElement(sourceRow, name)))
    .find(Boolean);
  if (fromBlock) return fromBlock;

  const index = FIELD_ORDER.findIndex((name) => names.includes(name));
  return index > -1 ? getCells(row)[index] || null : null;
}

function getText(block, row, propName, legacyAttr = '', fallback = '') {
  return getField(block, row, propName)?.textContent?.trim()
    || block.getAttribute(legacyAttr)?.trim()
    || fallback;
}

function getHref(block, row, propName, legacyAttr = '') {
  const field = getField(block, row, propName);
  return field?.querySelector?.('a[href]')?.getAttribute('href')?.trim()
    || block.getAttribute(legacyAttr)?.trim()
    || field?.textContent?.trim()
    || '';
}

function getImage(block, row) {
  const field = getField(block, row, 'image');
  return field?.querySelector?.('img')?.src
    || field?.querySelector?.('a[href]')?.getAttribute('href')?.trim()
    || block.getAttribute('data-image')?.trim()
    || '';
}

function getVariant(block) {
  const variant = block.getAttribute('data-variant')
    || block.getAttribute('data-layout')
    || (block.classList.contains('vertical') ? 'vertical' : '');
  return variant === 'vertical' ? 'vertical' : 'horizontal';
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

function readHotel(block, row, index, variant) {
  const link = getHref(block, row, 'link', 'data-link');
  const linkField = getField(block, row, 'link');
  const linkText = linkField?.querySelector?.('a[href]')?.textContent?.trim();

  return {
    ctaText: getText(block, row, 'ctaText', 'data-cta-text', linkText || 'Ver disponibilidad'),
    href: link || '#',
    image: getImage(block, row),
    imageAlt: getText(block, row, 'imageAlt', 'data-image-alt', ''),
    location: getText(block, row, 'location', 'data-location', ''),
    name: getText(block, row, 'hotelName', 'data-hotel-name', `Hotel ${index + 1}`),
    priceFrom: getText(block, row, 'priceFrom', 'data-price-from', ''),
    stars: normalizeStars(getText(block, row, 'stars', 'data-stars', '')),
    tagLabel: variant === 'vertical' ? getText(block, row, 'tagLabel', 'data-tag-label', '') : '',
    target: normalizeTarget(getText(block, row, 'linkTarget', 'data-link-target', '_self')),
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

  const title = document.createElement(variant === 'vertical' ? 'h3' : 'h2');
  title.className = 'hotel-mini-card-title';

  if (variant === 'vertical') {
    title.append(createLink(hotel.href, hotel.name, 'hotel-mini-card-title-link', hotel.target));
  } else {
    title.textContent = hotel.name;
  }
  info.append(title);

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

export default function decorate(block) {
  block.querySelector(':scope > .hotel-mini-card-rendered')?.remove();

  const variant = getVariant(block);
  const rows = getSourceRows(block);
  const sourceRows = rows.length ? rows : [block];

  const list = document.createElement('ul');
  list.className = `hotel-mini-card-rendered hotel-mini-card-list hotel-mini-card-list-${variant}`;

  sourceRows.forEach((row, index) => {
    const hotel = readHotel(block, row, index, variant);
    const li = document.createElement('li');
    li.className = 'hotel-mini-card-item';
    li.append(createHotelMiniCard(hotel, variant));
    list.append(li);
  });

  if (!list.children.length) return;

  hideSource(block);
  block.append(list);
}
