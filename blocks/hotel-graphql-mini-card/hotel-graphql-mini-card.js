import { createHotelMiniCard } from '../hotel-mini-card/hotel-mini-card.js';
import { getPlaceholder } from '../../scripts/iberostar/placeholders.js';
import {
  fetchHotelByCode,
  isValidHotelCode,
} from '../../scripts/iberostar/hotels-api.js';
import {
  getHotelPriceData,
  initHotelPriceLiveUpdate,
} from '../../scripts/iberostar/hotel-price-line.js';

const FIELD_POSITIONS = {
  cta_link: [3, 0],
  cta_linkTarget: [4, 0],
  cta_linkText: [2, 0],
  destination: [1, 0],
  hotelCode: [0, 0],
};

const FIELD_ALIASES = {
  cta_link: ['link', 'ctaUrl'],
  cta_linkTarget: ['linkTarget'],
  cta_linkText: ['ctaText'],
  destination: ['destinationText'],
};

function getSourceRows(block) {
  return [...block.children]
    .filter((child) => !child.classList.contains('hotel-graphql-mini-card-rendered'));
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
  const sourceRows = getSourceRows(block);
  const fromProp = sourceRows
    .flatMap((row) => names.map((name) => getPropElement(row, name)))
    .find(Boolean);
  if (fromProp) return fromProp;

  const position = names.map((name) => FIELD_POSITIONS[name]).find(Boolean);
  if (!position) return null;

  const [rowIndex, cellIndex] = position;
  return getCells(sourceRows[rowIndex])[cellIndex] || null;
}

function getText(block, propName) {
  return getField(block, propName)?.textContent?.trim() || '';
}

function getAnchor(field) {
  if (field?.matches?.('a[href]')) return field;
  return field?.querySelector?.('a[href]') || null;
}

function getHref(block, propName) {
  const field = getField(block, propName);
  return getAnchor(field)?.getAttribute('href')?.trim()
    || field?.textContent?.trim()
    || '';
}

function normalizeTarget(value) {
  return `${value || ''}`.trim().toLowerCase() === '_blank' ? '_blank' : '_self';
}

function hideSource(block) {
  getSourceRows(block).forEach((row) => {
    if (row === block) return;
    row.classList.add('hotel-graphql-mini-card-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

function isAuthoringPage(block) {
  return Boolean(block.closest('[data-aue-resource]') || document.querySelector('[data-aue-resource]'));
}

function getLocaleSegment(pathname = window.location.pathname) {
  const segments = `${pathname || ''}`.split('/').filter(Boolean);
  const segment = segments.find((item) => /^[a-z]{2}-[a-z]{2}$/i.test(item));
  return segment ? segment.toLowerCase() : '';
}

function createHotelHref(hotel) {
  if (!hotel?.slug) return '';
  const localeSegment = getLocaleSegment();
  const slug = `${hotel.slug}`.split('/').filter(Boolean).join('/');
  if (!slug) return '';

  return localeSegment
    ? `/${localeSegment}/hotels/${slug}`
    : `/hotels/${slug}`;
}

function normalizeStars(value) {
  const clamp = (input) => Math.max(0, Math.min(Math.round(input), 5));

  if (Number.isFinite(value)) {
    return clamp(value);
  }

  if (Array.isArray(value)) {
    return normalizeStars(value[0]);
  }

  if (value && typeof value === 'object') {
    return normalizeStars(
      value.stars
      ?? value.value
      ?? value.number
      ?? value.count
      ?? value.label,
    );
  }

  const source = `${value || ''}`.trim();
  if (!source) return 0;

  const floatValue = Number.parseFloat(source.replace(',', '.'));
  if (Number.isFinite(floatValue)) {
    return clamp(floatValue);
  }

  const digitsMatch = source.match(/\d+/);
  if (!digitsMatch) return 0;

  const parsed = Number.parseInt(digitsMatch[0], 10);
  return Number.isNaN(parsed) ? 0 : clamp(parsed);
}

function isDebugEnabled() {
  const query = new URLSearchParams(window.location.search).get('hotel-api-debug');
  if (query) return query === '1' || query.toLowerCase() === 'true';

  const meta = document.querySelector('meta[name="hotel-api-debug"]')?.content?.trim();
  return meta === '1' || meta?.toLowerCase() === 'true';
}

function createEmptyState(message) {
  const empty = document.createElement('p');
  empty.className = 'hotel-graphql-mini-card-empty';
  empty.textContent = message;
  return empty;
}

function toMiniCardData(hotel, destinationText, cta) {
  if (!hotel) return null;

  const fallbackHref = createHotelHref(hotel);
  const href = cta.href || fallbackHref;

  const normalizedStars = normalizeStars(hotel.stars);
  if (isDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.info('[hotel-graphql-mini-card] Stars mapping', {
      code: hotel.code,
      normalizedStars,
      rawStars: hotel.stars,
      title: hotel.title,
    });
  }

  return {
    ctaText: cta.text,
    href,
    image: hotel.image || '',
    imageAlt: hotel.title || '',
    location: destinationText || '',
    name: hotel.title || '',
    priceFrom: hotel.priceFrom || '',
    priceData: hotel.priceData || null,
    stars: normalizedStars,
    tagLabel: '',
    target: cta.target,
  };
}

function observeAuthorChanges(block) {
  block.hotelGraphqlMiniCardObserver?.disconnect();
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

  block.hotelGraphqlMiniCardObserver = observer;
}

export default async function decorate(block) {
  initHotelPriceLiveUpdate();
  block.hotelGraphqlMiniCardObserver?.disconnect();

  const previous = block.querySelector(':scope > .hotel-graphql-mini-card-rendered');
  previous?.remove();

  const runId = (block.hotelGraphqlMiniCardRunId || 0) + 1;
  block.hotelGraphqlMiniCardRunId = runId;

  const hotelCode = `${getText(block, 'hotelCode') || ''}`.trim();
  const destinationText = getText(block, 'destination');
  const fallbackCtaText = await getPlaceholder('hotelGraphqlMiniCardCta', 'View hotel');
  const cta = {
    href: getHref(block, 'cta_link'),
    target: normalizeTarget(getText(block, 'cta_linkTarget')),
    text: getText(block, 'cta_linkText') || fallbackCtaText,
  };

  const rendered = document.createElement('div');
  rendered.className = 'hotel-graphql-mini-card-rendered';

  hideSource(block);

  if (!hotelCode) {
    if (isAuthoringPage(block)) {
      rendered.append(createEmptyState('Add a hotel code to load hotel data.'));
    }

    block.append(rendered);
    observeAuthorChanges(block);
    return;
  }

  if (!isValidHotelCode(hotelCode)) {
    // eslint-disable-next-line no-console
    console.warn('[hotels-api] Invalid hotelCode, skipping hotel fetch', { hotelCode });
    if (isAuthoringPage(block)) {
      rendered.append(createEmptyState(`Invalid hotel code: ${hotelCode}`));
    }
    block.append(rendered);
    observeAuthorChanges(block);
    return;
  }

  const hotel = await fetchHotelByCode(hotelCode);
  if (runId !== block.hotelGraphqlMiniCardRunId) return;

  const priceData = hotel ? await getHotelPriceData(hotel, hotelCode) : null;
  if (runId !== block.hotelGraphqlMiniCardRunId) return;

  const miniCardData = toMiniCardData(
    hotel ? { ...hotel, priceFrom: priceData?.text || '', priceData } : null,
    destinationText,
    cta,
  );
  if (miniCardData) {
    const card = createHotelMiniCard(miniCardData, 'horizontal');
    rendered.append(card);
  } else if (isAuthoringPage(block)) {
    rendered.append(createEmptyState(`No active hotel found for code ${hotelCode}.`));
  }

  block.append(rendered);
  observeAuthorChanges(block);
}
