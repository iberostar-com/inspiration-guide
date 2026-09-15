const DEFAULT_COUNTRY = 'es';
const COUNTRY_HEADER_NAME = 'x-iberostar-client-country';
const COUNTRY_QUERY_KEYS = ['country', 'clientCountry', 'geolocation', 'countryOverride'];
const COUNTRY_COOKIE_KEYS = [
  'iberostar-client-country',
  'x-iberostar-client-country',
  'x-aem-client-country',
];
const GRS_HOSTS = ['aem-grspre.iberostar.com', 'aem-grsdev.iberostar.com', 'aem-grsqa.iberostar.com'];
const COUNTRY_WARNING_KEYS = new Set();

let cachedClientCountryResult = null;
let cachedClientCountryPromise = null;

function getWindowConfig() {
  return window.iberostarConfig || {};
}

function logWarnOnce(key, message, details = null) {
  if (COUNTRY_WARNING_KEYS.has(key)) return;
  COUNTRY_WARNING_KEYS.add(key);

  // eslint-disable-next-line no-console
  if (details) console.warn(message, details);
  // eslint-disable-next-line no-console
  else console.warn(message);
}

export function normalizeCountry(value) {
  const normalized = `${value || ''}`
    .trim()
    .toLowerCase()
    .replace('_', '-');

  if (!normalized) return '';

  if (/^[a-z]{2}$/.test(normalized)) return normalized;

  if (/^[a-z]{2}-[a-z]{2}$/.test(normalized)) {
    const [, market = ''] = normalized.split('-');
    return /^[a-z]{2}$/.test(market) ? market : '';
  }

  logWarnOnce(
    `invalid-country:${normalized}`,
    '[client-country] Invalid country value ignored',
    { value },
  );
  return '';
}

export function getLocaleFromPath(pathname = window.location.pathname) {
  const segments = `${pathname || ''}`.split('/').filter(Boolean);
  const localeSegment = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  return `${localeSegment || ''}`.toLowerCase();
}

export function getMarketCountryFromLocale(locale) {
  const normalizedLocale = `${locale || ''}`.trim().toLowerCase().replace('_', '-');
  const [, market = ''] = normalizedLocale.split('-');
  return normalizeCountry(market);
}

export function getCookieValue(cookieName, cookieString = document.cookie || '') {
  const name = `${cookieName || ''}`.trim();
  if (!name) return '';

  const encodedName = encodeURIComponent(name);
  const candidates = `${cookieString || ''}`
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);

  const pair = candidates.find((item) => item.startsWith(`${encodedName}=`) || item.startsWith(`${name}=`));
  if (!pair) return '';

  const value = pair.slice(pair.indexOf('=') + 1);

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getCountryFromCookie(cookieName, cookieString = document.cookie || '') {
  return normalizeCountry(getCookieValue(cookieName, cookieString));
}

export function getCountryFromQuery(search = window.location.search) {
  const params = new URLSearchParams(`${search || ''}`);
  const key = COUNTRY_QUERY_KEYS.find((paramKey) => {
    const rawValue = params.get(paramKey);
    return Boolean(normalizeCountry(rawValue));
  });

  if (!key) return '';
  return normalizeCountry(params.get(key));
}

function getCountryFromCookieList(cookieString = document.cookie || '') {
  const key = COUNTRY_COOKIE_KEYS.find(
    (cookieName) => Boolean(getCountryFromCookie(cookieName, cookieString)),
  );
  if (!key) {
    return { country: '', source: '' };
  }

  return {
    country: getCountryFromCookie(key, cookieString),
    source: key === 'iberostar-client-country' ? 'cookie' : 'legacy-cookie',
  };
}

function getCountryFromGlobalConfig(config = getWindowConfig()) {
  const keys = ['clientCountry', 'country', 'geoCountry'];
  const matchingKey = keys.find((key) => Boolean(normalizeCountry(config[key])));
  if (!matchingKey) return '';
  return normalizeCountry(config[matchingKey]);
}

function getNavigatorLanguageCountry(navigatorLanguage = window.navigator?.language || '') {
  const normalized = `${navigatorLanguage || ''}`.trim().toLowerCase().replace('_', '-');
  if (!normalized.includes('-')) return '';

  const [, market = ''] = normalized.split('-');
  return normalizeCountry(market);
}

function isGrsHost(hostname = window.location.hostname) {
  return GRS_HOSTS.includes(`${hostname || ''}`.toLowerCase());
}

function resolveSync(options = {}) {
  const queryCountry = getCountryFromQuery(options.search);
  if (queryCountry) return { country: queryCountry, source: 'query', isStrong: true };

  const cookieResult = getCountryFromCookieList(options.cookies);
  if (cookieResult.country) {
    return { ...cookieResult, isStrong: true };
  }

  const configCountry = getCountryFromGlobalConfig(options.config);
  if (configCountry) return { country: configCountry, source: 'config', isStrong: true };

  const locale = options.locale || getLocaleFromPath(options.pathname);
  const localeCountry = getMarketCountryFromLocale(locale);
  if (localeCountry) return { country: localeCountry, source: 'locale', isStrong: false };

  const navigatorCountry = getNavigatorLanguageCountry(options.navigatorLanguage);
  if (navigatorCountry) return { country: navigatorCountry, source: 'navigator', isStrong: false };

  return { country: DEFAULT_COUNTRY, source: 'default', isStrong: false };
}

async function readCountryFromHeader(options = {}) {
  const targetPath = options.pathname || window.location.pathname || '/';

  try {
    const response = await fetch(targetPath, {
      method: 'HEAD',
      credentials: 'same-origin',
      cache: 'no-store',
    });

    const fromHeader = normalizeCountry(response.headers.get(COUNTRY_HEADER_NAME));
    return fromHeader || '';
  } catch (error) {
    logWarnOnce(
      `country-header-failed:${targetPath}`,
      '[client-country] Failed to read country header, using fallback',
      { error },
    );
    return '';
  }
}

export function getClientCountrySync(options = {}) {
  const result = resolveSync(options);
  if (options.includeSource) {
    return result;
  }

  return result.country;
}

export async function resolveClientCountry(options = {}) {
  if (options.forceRefresh) {
    cachedClientCountryPromise = null;
    cachedClientCountryResult = null;
  }

  if (cachedClientCountryResult && !options.forceRefresh) {
    return cachedClientCountryResult;
  }

  if (cachedClientCountryPromise && !options.forceRefresh) {
    return cachedClientCountryPromise;
  }

  const syncResult = resolveSync(options);
  const hostname = `${options.hostname || window.location.hostname || ''}`.toLowerCase();

  if (syncResult.isStrong || !isGrsHost(hostname)) {
    cachedClientCountryResult = syncResult;
    return syncResult;
  }

  cachedClientCountryPromise = readCountryFromHeader(options)
    .then((headerCountry) => {
      const resolved = headerCountry
        ? { country: headerCountry, source: 'header', isStrong: true }
        : syncResult;
      cachedClientCountryResult = resolved;
      cachedClientCountryPromise = null;
      return resolved;
    })
    .catch(() => {
      cachedClientCountryResult = syncResult;
      cachedClientCountryPromise = null;
      return syncResult;
    });

  return cachedClientCountryPromise;
}

export async function getClientCountry(options = {}) {
  const result = await resolveClientCountry(options);
  if (options.includeSource) {
    return result;
  }

  return result.country;
}
