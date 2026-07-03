const I18N_CACHE = new Map();
const DEFAULT_LOCALE = 'en-us';

function normalizeLocale(locale) {
  const value = `${locale || ''}`.trim().toLowerCase();
  if (!value) return DEFAULT_LOCALE;
  if (value === 'en') return DEFAULT_LOCALE;
  if (/^[a-z]{2}$/.test(value)) return `${value}-${value === 'en' ? 'us' : value}`;
  return value;
}

function getCurrentLocale() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const locale = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  const fromDocument = document.documentElement.lang || DEFAULT_LOCALE;
  return normalizeLocale(locale || fromDocument);
}

async function fetchI18nData(locale) {
  const normalizedLocale = normalizeLocale(locale);
  const cacheKey = `i18n:${normalizedLocale}`;
  if (I18N_CACHE.has(cacheKey)) {
    return I18N_CACHE.get(cacheKey);
  }

  const localeCandidates = [
    normalizedLocale,
    normalizedLocale === 'en' ? DEFAULT_LOCALE : '',
  ].filter(Boolean);

  const uniqueCandidates = [...new Set(localeCandidates)];
  const paths = [
    ...uniqueCandidates.flatMap((candidate) => [
      `/${candidate}/i18n.json`,
      `/i18n/${candidate}.json`,
    ]),
    '/i18n.json',
  ];

  // eslint-disable-next-line no-await-in-loop
  for (let i = 0; i < paths.length; i += 1) {
    const path = paths[i];
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(path, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    }).catch(() => null);

    if (response?.ok) {
      // eslint-disable-next-line no-await-in-loop
      const data = await response.json();
      I18N_CACHE.set(cacheKey, data);
      return data;
    }
  }

  I18N_CACHE.set(cacheKey, {});
  return {};
}

export async function getTranslation(key, fallback = '') {
  const locale = getCurrentLocale();
  const data = await fetchI18nData(locale);
  const value = data[key];

  if (value) return value;

  if (normalizeLocale(locale) !== DEFAULT_LOCALE) {
    const enData = await fetchI18nData(DEFAULT_LOCALE);
    if (enData[key]) return enData[key];
  }

  return fallback;
}

export function getTranslationSync(data, key, fallback = '') {
  if (!data || typeof data !== 'object') return fallback;
  const value = data[key];
  return value || fallback;
}

export async function loadI18nData(locale = null) {
  const targetLocale = locale || getCurrentLocale();
  return fetchI18nData(targetLocale);
}

export default getTranslation;
