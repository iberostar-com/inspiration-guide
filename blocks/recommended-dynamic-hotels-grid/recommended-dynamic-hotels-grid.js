import {
  createHotelMiniCard,
} from '../hotel-mini-card/hotel-mini-card.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';
import { toPageHref } from '../../scripts/iberostar/page-links.js';
import {
  fetchHotelByCode,
  fetchHotelPriceByCode,
  getLocaleTagFromPath,
} from '../../scripts/iberostar/hotels-api.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const MAX_HOTELS = 4;
const CONFIG_FIELD_POSITIONS = {
  eyebrow: 0,
  gridCta_link: 3,
  gridCta_linkTarget: 4,
  gridCta_linkText: 2,
  title: 1,
};

function getSourceRows(block) {
  return [...block.children]
    .filter((child) => !child.classList.contains('recommended-dynamic-hotels-grid-rendered'));
}

function getPropElement(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  return getSourceRows(block)
    .map((row) => (row.matches?.(selector) ? row : row.querySelector?.(selector)))
    .find(Boolean) || null;
}

function getCells(row) {
  if (!row) return [];
  if (row.children.length > 1) return [...row.children];

  const nested = [...(row.children[0]?.children || [])];
  return nested.length ? nested : [...row.children];
}

function getAnchor(field) {
  if (field?.matches?.('a[href]')) return field;
  return field?.querySelector?.('a[href]') || null;
}

function hasConfigFields(row) {
  return Boolean(row.querySelector?.(
    '[data-aue-prop="eyebrow"], [data-aue-prop="title"], '
    + '[data-aue-prop="gridCta_linkText"], [data-aue-prop="gridCta_link"], '
    + '[data-aue-prop="gridCta_linkTarget"]',
  ));
}

function getConfigRows(block) {
  const rows = getSourceRows(block);
  const instrumented = rows.filter((row) => hasConfigFields(row));
  if (instrumented.length) return instrumented;

  const hasLegacyConfig = [
    'data-cta-link',
    'data-cta-link-target',
    'data-cta-link-text',
    'data-eyebrow',
    'data-title',
  ].some((attr) => block.hasAttribute(attr));
  if (hasLegacyConfig) return [];

  return rows.slice(0, Object.keys(CONFIG_FIELD_POSITIONS).length)
    .filter((row) => getCells(row).length === 1);
}

function getConfigField(block, propName, legacyAttr) {
  const prop = getPropElement(block, propName);
  if (prop) return prop;
  if (block.hasAttribute(legacyAttr)) return null;

  const rows = getConfigRows(block);
  const ctaRow = rows.find((row) => getAnchor(row));
  let row = rows[CONFIG_FIELD_POSITIONS[propName]];

  if (propName === 'gridCta_linkText') row = ctaRow || rows[2];
  if (propName === 'gridCta_link') row = ctaRow || rows[3] || rows[2];
  if (propName === 'gridCta_linkTarget') row = ctaRow || rows[4] || rows[2];

  const cells = getCells(row);
  return cells[cells.length - 1] || null;
}

function getConfigValue(block, propName, legacyAttr) {
  const field = getConfigField(block, propName, legacyAttr);
  if (field) return field.textContent?.trim() || '';

  const legacyValue = block.getAttribute(legacyAttr);
  return legacyValue?.trim() || '';
}

function getConfigHref(block, propName, legacyAttr) {
  const field = getConfigField(block, propName, legacyAttr);
  const legacyValue = block.getAttribute(legacyAttr);
  return getAnchor(field)?.getAttribute('href')?.trim()
    || legacyValue?.trim()
    || field?.textContent?.trim()
    || '';
}

function normalizeTarget(value) {
  return `${value || ''}`.trim().toLowerCase() === '_blank' ? '_blank' : '_self';
}

function getCtaConfig(block) {
  const field = getConfigField(block, 'gridCta_linkTarget', 'data-cta-link-target');
  const anchor = getAnchor(field);
  const target = anchor?.getAttribute('target')
    || getConfigValue(block, 'gridCta_linkTarget', 'data-cta-link-target');

  return {
    href: getConfigHref(block, 'gridCta_link', 'data-cta-link'),
    target: normalizeTarget(target),
    text: getConfigValue(block, 'gridCta_linkText', 'data-cta-link-text'),
  };
}

function hideSourceRows(rows) {
  rows.forEach((row) => {
    row.classList.add('recommended-dynamic-hotels-grid-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

function isAuthoringPage(block) {
  return Boolean(block.closest('[data-aue-resource]') || document.querySelector('[data-aue-resource]'));
}

function getText(field) {
  return field?.textContent?.trim() || '';
}

function getHotelCodes(block) {
  const rows = getSourceRows(block);
  const configRows = new Set(getConfigRows(block));
  const itemRows = rows.filter((row) => !configRows.has(row));

  return itemRows
    .slice(0, MAX_HOTELS)
    .map((row) => {
      const hotelCodeProp = row.querySelector('[data-aue-prop="hotelCode"]');
      const destinationProp = row.querySelector('[data-aue-prop="destination"]');
      const tagLabelProp = row.querySelector('[data-aue-prop="tag_tagLabel"]');
      const hotelCode = getText(hotelCodeProp || row.querySelector('[data-hotel-code]') || getCells(row)[0]);
      const destination = getText(destinationProp || row.querySelector('[data-destination]') || getCells(row)[1]);
      const tagLabel = getText(tagLabelProp || getCells(row)[2]);

      return {
        destination: destination.trim(),
        hotelCode: hotelCode.trim(),
        source: row,
        tagLabel: tagLabel.trim(),
      };
    })
    .filter(({ hotelCode }) => hotelCode);
}

function createHeader(labels) {
  const header = document.createElement('div');
  header.className = 'recommended-dynamic-hotels-grid-header';

  const copy = document.createElement('div');
  copy.className = 'recommended-dynamic-hotels-grid-copy';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'recommended-dynamic-hotels-grid-eyebrow';
  eyebrow.textContent = labels.eyebrow;

  const title = document.createElement('h2');
  title.className = 'recommended-dynamic-hotels-grid-title';
  title.textContent = labels.title;

  copy.append(eyebrow, title);
  if (labels.cta.text && labels.cta.href) {
    const cta = document.createElement('a');
    cta.className = 'recommended-dynamic-hotels-grid-cta';
    cta.href = toPageHref(labels.cta.href);
    cta.textContent = labels.cta.text;
    if (labels.cta.target === '_blank') {
      cta.target = '_blank';
      cta.rel = 'noopener noreferrer';
    }
    copy.append(cta);
  }
  header.append(copy);
  return header;
}

function createEmptyState(message) {
  const empty = document.createElement('p');
  empty.className = 'recommended-dynamic-hotels-grid-empty';
  empty.textContent = message;
  return empty;
}

function formatCurrencyValue(value, currency) {
  if (!Number.isFinite(value) || !currency) return '';

  const locale = getLocaleTagFromPath();
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(Math.round(value));
}

async function getPriceText(hotel, hotelCode) {
  const [prefix, perNightLabel, personSingular, personPlural] = await Promise.all([
    getTranslation('hotelPriceFromPrefix', 'Desde'),
    getTranslation('hotelPricePerNight', '/ noche'),
    getTranslation('hotelPricePersonSingular', 'persona'),
    getTranslation('hotelPricePersonPlural', 'personas'),
  ]);

  const endpointPrice = await fetchHotelPriceByCode(hotelCode);
  const fallbackPrice = Number.isFinite(hotel?.estimatedMinPrice)
    ? {
      currency: hotel?.estimatedMinCurrency || '',
      defaultOccupancy: { adults: 2, children: [] },
      priceFrom: hotel.estimatedMinPrice,
    }
    : null;
  const selectedPrice = endpointPrice || fallbackPrice;

  if (!selectedPrice?.currency || !Number.isFinite(selectedPrice?.priceFrom)) return '';

  const adults = selectedPrice?.defaultOccupancy?.adults || 2;
  const peopleLabel = adults === 1 ? personSingular : personPlural;
  const formattedPrice = formatCurrencyValue(selectedPrice.priceFrom, selectedPrice.currency);

  return [prefix, formattedPrice, `${adults} ${peopleLabel}`, perNightLabel]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createGridContainer(cards) {
  const container = document.createElement('div');
  container.className = 'recommended-dynamic-hotels-grid-container';

  cards.forEach((card) => {
    const item = document.createElement('div');
    item.className = 'recommended-dynamic-hotels-grid-item';
    item.append(card);
    container.append(item);
  });

  return container;
}

export default async function decorate(block) {
  const labels = {
    eyebrow: getConfigValue(block, 'eyebrow', 'data-eyebrow'),
    title: getConfigValue(block, 'title', 'data-title'),
    cta: getCtaConfig(block),
  };

  const hotelCodesToFetch = getHotelCodes(block);
  const sourceRows = getSourceRows(block);

  const rendered = document.createElement('div');
  rendered.className = 'recommended-dynamic-hotels-grid-rendered';

  hideSourceRows(sourceRows);

  rendered.append(createHeader(labels));

  if (!hotelCodesToFetch.length) {
    if (isAuthoringPage(block)) {
      rendered.append(createEmptyState('Add hotel codes to load hotels from GraphQL.'));
    }
    block.append(rendered);
    return;
  }

  const fetchPromises = hotelCodesToFetch.map(
    ({ hotelCode, destination, tagLabel }) => Promise.all([
      fetchHotelByCode(hotelCode),
      fetchHotelPriceByCode(hotelCode),
    ])
      .then(async ([hotel, price]) => {
        if (!hotel) return null;
        const hotelWithPrice = price
          ? { ...hotel, estimatedMinPrice: price.priceFrom, estimatedMinCurrency: price.currency }
          : hotel;
        const priceFrom = await getPriceText(hotelWithPrice, hotelCode);
        return {
          ctaText: '',
          href: '',
          image: hotel.image || '',
          imageAlt: hotel.title || '',
          location: destination || hotel.destination || '',
          name: hotel.title || '',
          priceFrom,
          stars: hotel.stars || 0,
          tagLabel: tagLabel || '',
          target: '_self',
        };
      })
      .catch(() => null),
  );

  const hotelDataList = await Promise.all(fetchPromises);
  const validHotels = hotelDataList.filter(Boolean);

  if (!validHotels.length) {
    if (isAuthoringPage(block)) {
      rendered.append(createEmptyState('No hotels found for the provided codes.'));
    }
    block.append(rendered);
    return;
  }

  const cards = validHotels.map((hotelData) => createHotelMiniCard(hotelData, 'vertical'));
  rendered.append(createGridContainer(cards));

  moveInstrumentation(block, rendered);
  block.append(rendered);
}
