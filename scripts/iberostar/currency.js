import getEnvironmentConfig from './environment-config.js';
import { getLocaleFromPath, getPlaceholder } from './placeholders.js';

// Same storage key and event name as iberostar.com (AEM currency-exchange-rates.js)
// so the selection is shared if the microsite is served under the same domain.
const STORAGE_KEY = 'iberostarSelectedCurrency';

export const CURRENCY_CHANGE_EVENT = 'iberostar:currency-change';

// Currency list agreed for the Inspiration Guide (Figma, market ES).
// Symbols follow the design: currencies without one render only their code.
const CURRENCY_CATALOG = {
  EUR: { symbol: '€', nameFallback: 'Euro' },
  TND: { symbol: '', nameFallback: 'Tunisian dinar' },
  MAD: { symbol: '', nameFallback: 'Moroccan dirham' },
  CAD: { symbol: '$', nameFallback: 'Canadian dollar' },
  USD: { symbol: '$', nameFallback: 'US dollar' },
  CHF: { symbol: '', nameFallback: 'Swiss franc' },
  GBP: { symbol: '£', nameFallback: 'Pound sterling' },
  CLP: { symbol: '$', nameFallback: 'Chilean peso' },
  MXN: { symbol: '$', nameFallback: 'Mexican peso' },
  BRL: { symbol: '$', nameFallback: 'Brazilian real' },
};

const MARKET_DEFAULT_CURRENCY = {
  br: 'BRL',
  de: 'EUR',
  es: 'EUR',
  fr: 'EUR',
  gb: 'GBP',
  us: 'USD',
};

const FALLBACK_CURRENCY = 'EUR';

let exchangeRatesPromise = null;
let conversionAvailablePromise = null;

function getMetaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function getCurrencyConfig() {
  const configured = getEnvironmentConfig().currency || {};
  const metaEnabled = getMetaContent('currency-selector');

  return {
    enabled: metaEnabled
      ? !['off', 'false', '0'].includes(metaEnabled.toLowerCase())
      : configured.enabled !== false,
    exchangeRatesEndpoint: getMetaContent('currency-exchange-rates-endpoint')
      || configured.exchangeRatesEndpoint
      || '',
  };
}

export function isCurrencySelectorEnabled() {
  return getCurrencyConfig().enabled;
}

function getMarketFromPath(pathname = window.location.pathname) {
  const [, market = ''] = getLocaleFromPath(pathname).split('-');
  return market.toLowerCase();
}

export function getDefaultCurrency() {
  return MARKET_DEFAULT_CURRENCY[getMarketFromPath()] || FALLBACK_CURRENCY;
}

export function getSupportedCurrencies() {
  return Object.keys(CURRENCY_CATALOG);
}

export function getCurrencyMetadata(currencyCode) {
  const normalizedCode = `${currencyCode || ''}`.trim().toUpperCase();
  const catalogEntry = CURRENCY_CATALOG[normalizedCode];
  if (!catalogEntry) return null;
  return { code: normalizedCode, ...catalogEntry };
}

export async function getCurrencyDisplayName(currencyCode) {
  const metadata = getCurrencyMetadata(currencyCode);
  if (!metadata) return '';
  return getPlaceholder(`currencyName${metadata.code}`, metadata.nameFallback);
}

function readPersistedCurrency() {
  try {
    return window.localStorage?.getItem(STORAGE_KEY) || '';
  } catch (error) {
    return '';
  }
}

export function getSelectedCurrency() {
  const persisted = readPersistedCurrency().toUpperCase();
  if (persisted && CURRENCY_CATALOG[persisted]) return persisted;
  return getDefaultCurrency();
}

export function setSelectedCurrency(currencyCode, { emit = true, persist = true } = {}) {
  const normalizedCode = `${currencyCode || ''}`.trim().toUpperCase();
  if (!normalizedCode || !CURRENCY_CATALOG[normalizedCode]) return;

  if (persist) {
    try {
      window.localStorage?.setItem(STORAGE_KEY, normalizedCode);
    } catch (error) {
      // Storage can be unavailable (private mode); the in-page state still works.
    }
  }

  document.body.dataset.selectedCurrency = normalizedCode;

  if (emit) {
    document.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, {
      detail: {
        currency: normalizedCode,
        metadata: getCurrencyMetadata(normalizedCode),
      },
    }));
  }
}

export function loadExchangeRates({ forceRefresh = false } = {}) {
  if (forceRefresh) exchangeRatesPromise = null;
  if (exchangeRatesPromise) return exchangeRatesPromise;

  const endpoint = getCurrencyConfig().exchangeRatesEndpoint;
  if (!endpoint) return Promise.reject(new Error('[currency] Missing exchange rates endpoint'));

  exchangeRatesPromise = fetch(endpoint, { headers: { Accept: 'application/json' } })
    .then((response) => {
      if (!response.ok) throw new Error(`[currency] Exchange rates request failed (${response.status})`);
      return response.json();
    })
    .catch((error) => {
      exchangeRatesPromise = null;
      throw error;
    });

  return exchangeRatesPromise;
}

export function clearExchangeRatesCache() {
  exchangeRatesPromise = null;
  conversionAvailablePromise = null;
}

/**
 * Resolves the multiplier that converts an amount from source to target
 * currency, preferring the direct rate and falling back to the inverse one.
 * Rates payload shape: { currencies: { TARGET: { exchange: { SOURCE: rate } } } }
 */
export function resolveExchangeRate(ratesPayload, sourceCurrency, targetCurrency) {
  const source = `${sourceCurrency || ''}`.toUpperCase();
  const target = `${targetCurrency || ''}`.toUpperCase();
  if (!source || !target) return null;
  if (source === target) return 1;

  const directRate = Number(ratesPayload?.currencies?.[target]?.exchange?.[source]);
  if (Number.isFinite(directRate) && directRate > 0) return directRate;

  const inverseRate = Number(ratesPayload?.currencies?.[source]?.exchange?.[target]);
  if (Number.isFinite(inverseRate) && inverseRate > 0) return 1 / inverseRate;

  return null;
}

export function convertCurrencyAmount(amount, sourceCurrency, targetCurrency, ratesPayload) {
  if (!Number.isFinite(amount)) return null;
  const rate = resolveExchangeRate(ratesPayload, sourceCurrency, targetCurrency);
  if (rate == null) return null;
  return amount * rate;
}

export function isConversionAvailable() {
  if (!getCurrencyConfig().enabled) return Promise.resolve(false);
  if (conversionAvailablePromise) return conversionAvailablePromise;

  conversionAvailablePromise = loadExchangeRates()
    .then((payload) => Boolean(payload?.currencies))
    .catch(() => false);

  return conversionAvailablePromise;
}

// Same public surface as iberostar.com for QA/debugging parity.
window.iberostar = window.iberostar || {};
window.iberostar.currencyExchangeRates = {
  CURRENCY_CHANGE_EVENT,
  clearExchangeRatesCache,
  convertCurrencyAmount,
  getCurrencyMetadata,
  getDefaultCurrency,
  getSelectedCurrency,
  getSupportedCurrencies,
  loadExchangeRates,
  resolveExchangeRate,
  setSelectedCurrency,
};
