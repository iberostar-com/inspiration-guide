import { getPlaceholder } from './placeholders.js';
import { fetchHotelPriceByCode, getLocaleTagFromPath } from './hotels-api.js';
import {
  CURRENCY_CHANGE_EVENT,
  convertCurrencyAmount,
  getSelectedCurrency,
  isCurrencySelectorEnabled,
  loadExchangeRates,
} from './currency.js';

let labelsPromise = null;
let liveUpdateInitialized = false;

export function formatCurrencyValue(value, currency) {
  if (!Number.isFinite(value) || !currency) return '';

  const locale = getLocaleTagFromPath();
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(Math.round(value));
}

function getHotelPriceLabels() {
  if (!labelsPromise) {
    labelsPromise = Promise.all([
      getPlaceholder('hotelPriceFromPrefix', 'Desde'),
      getPlaceholder('hotelPricePerNight', '/ noche'),
      getPlaceholder('hotelPricePersonSingular', 'persona'),
      getPlaceholder('hotelPricePersonPlural', 'personas'),
    ]).then(([prefix, perNight, personSingular, personPlural]) => ({
      perNight,
      personPlural,
      personSingular,
      prefix,
    }));
  }
  return labelsPromise;
}

function buildPriceText({ amount, currency, adults }, labels) {
  const peopleLabel = adults === 1 ? labels.personSingular : labels.personPlural;
  const formattedPrice = formatCurrencyValue(amount, currency);
  if (!formattedPrice) return '';

  return [labels.prefix, formattedPrice, `${adults} ${peopleLabel}`, labels.perNight]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts a base amount into the visitor-selected currency. Falls back to
 * the base amount when the selector is disabled or rates are unavailable.
 */
async function resolveDisplayPrice(amount, currency) {
  if (!isCurrencySelectorEnabled()) return { amount, currency };

  const target = getSelectedCurrency();
  if (!target || target === currency) return { amount, currency };

  const rates = await loadExchangeRates().catch(() => null);
  const converted = convertCurrencyAmount(amount, currency, target, rates);
  if (!Number.isFinite(converted)) return { amount, currency };

  return { amount: converted, currency: target };
}

/**
 * Resolves the price line for a hotel card from the price-from endpoint
 * (or the GraphQL estimate as fallback).
 * @returns {Promise<{text: string, base: {amount: number, currency: string}, adults: number}|null>}
 */
export async function getHotelPriceData(hotel, hotelCode, endpointPrice = null) {
  const resolvedEndpointPrice = endpointPrice || await fetchHotelPriceByCode(hotelCode);
  const fallbackPrice = Number.isFinite(hotel?.estimatedMinPrice)
    ? {
      currency: hotel?.estimatedMinCurrency || '',
      defaultOccupancy: { adults: 2, children: [] },
      priceFrom: hotel.estimatedMinPrice,
    }
    : null;
  const selectedPrice = resolvedEndpointPrice || fallbackPrice;

  if (!selectedPrice?.currency || !Number.isFinite(selectedPrice?.priceFrom)) return null;

  const adults = selectedPrice?.defaultOccupancy?.adults || 2;
  const base = {
    amount: selectedPrice.priceFrom,
    currency: `${selectedPrice.currency}`.toUpperCase(),
  };

  const [display, labels] = await Promise.all([
    resolveDisplayPrice(base.amount, base.currency),
    getHotelPriceLabels(),
  ]);

  return {
    adults,
    base,
    text: buildPriceText({ ...display, adults }, labels),
  };
}

/**
 * Re-renders every dynamic hotel card price when the visitor changes
 * currency. Prices are always re-converted from the base amount stamped in
 * data attributes — never from the displayed text — and no request is made
 * to the price endpoint.
 */
export function initHotelPriceLiveUpdate() {
  if (liveUpdateInitialized) return;
  liveUpdateInitialized = true;
  if (!isCurrencySelectorEnabled()) return;

  document.addEventListener(CURRENCY_CHANGE_EVENT, async (event) => {
    const target = `${event.detail?.currency || getSelectedCurrency()}`.toUpperCase();
    const priceNodes = [...document.querySelectorAll('.hotel-mini-card-price[data-price-amount]')];
    if (!target || !priceNodes.length) return;

    const [labels, rates] = await Promise.all([
      getHotelPriceLabels(),
      loadExchangeRates().catch(() => null),
    ]);

    priceNodes.forEach((node) => {
      const amount = Number(node.dataset.priceAmount);
      const currency = `${node.dataset.priceCurrency || ''}`.toUpperCase();
      const adults = Number.parseInt(node.dataset.priceAdults || '2', 10) || 2;
      if (!Number.isFinite(amount) || !currency) return;

      let display = { amount, currency };
      if (target !== currency) {
        const converted = convertCurrencyAmount(amount, currency, target, rates);
        if (!Number.isFinite(converted)) return;
        display = { amount: converted, currency: target };
      }

      const text = buildPriceText({ ...display, adults }, labels);
      if (text) node.textContent = text;
    });
  });
}
