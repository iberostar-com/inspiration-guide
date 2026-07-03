import { createHotelMiniCard } from '../hotel-mini-card/hotel-mini-card.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';
import { fetchHotelByCode } from '../../scripts/iberostar/hotels-api.js';

const FIELD_POSITIONS = {
  destination: [1, 0],
  hotelCode: [0, 0],
};

const FIELD_ALIASES = {
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
  const parsed = Number.parseInt(`${value || ''}`.replace(/[^\d]/g, ''), 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(parsed, 5));
}

function createEmptyState(message) {
  const empty = document.createElement('p');
  empty.className = 'hotel-graphql-mini-card-empty';
  empty.textContent = message;
  return empty;
}

function toMiniCardData(hotel, destinationText, ctaText) {
  if (!hotel) return null;

  return {
    ctaText,
    href: createHotelHref(hotel),
    image: hotel.image || '',
    imageAlt: hotel.title || '',
    location: destinationText || '',
    name: hotel.title || '',
    priceFrom: '',
    stars: normalizeStars(hotel.stars),
    tagLabel: '',
    target: '_self',
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
  block.hotelGraphqlMiniCardObserver?.disconnect();

  const previous = block.querySelector(':scope > .hotel-graphql-mini-card-rendered');
  previous?.remove();

  const runId = (block.hotelGraphqlMiniCardRunId || 0) + 1;
  block.hotelGraphqlMiniCardRunId = runId;

  const hotelCode = getText(block, 'hotelCode');
  const destinationText = getText(block, 'destination');
  const ctaText = await getTranslation('hotelGraphqlMiniCardCta', 'View hotel');

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

  const hotel = await fetchHotelByCode(hotelCode);
  if (runId !== block.hotelGraphqlMiniCardRunId) return;

  const miniCardData = toMiniCardData(hotel, destinationText, ctaText);
  if (miniCardData) {
    rendered.append(createHotelMiniCard(miniCardData, 'horizontal'));
  } else if (isAuthoringPage(block)) {
    rendered.append(createEmptyState(`No active hotel found for code ${hotelCode}.`));
  }

  block.append(rendered);
  observeAuthorChanges(block);
}
