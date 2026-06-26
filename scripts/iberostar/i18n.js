const I18N_CACHE = new Map();

function getCurrentLocale() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const locale = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  return locale ? locale.toLowerCase() : (document.documentElement.lang || 'en').toLowerCase();
}

async function fetchI18nData(locale) {
  const cacheKey = `i18n:${locale}`;
  if (I18N_CACHE.has(cacheKey)) {
    return I18N_CACHE.get(cacheKey);
  }

  const paths = [
    `/${locale}/i18n.json`,
    `/i18n/${locale}.json`,
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

  if (locale !== 'en') {
    const enData = await fetchI18nData('en');
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
