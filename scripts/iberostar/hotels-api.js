import getEnvironmentConfig from './environment-config.js';

const DEFAULT_LOCALE = 'en_us';
const DEFAULT_LOCALE_HYPHENATED = 'en-us';
const GRAPHQL_REQUEST_CACHE = new Map();
const HOTEL_PRICE_REQUEST_CACHE = new Map();

function getMetaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function getHotelsConfig() {
  const environmentConfig = getEnvironmentConfig();
  const configuredHotels = environmentConfig.hotels || {};
  const dynamicMediaConfig = environmentConfig.dynamicMedia || {};

  return {
    aemAssetHost: dynamicMediaConfig.assetHost || '',
    graphqlHost: getMetaContent('hotel-graphql-host')
      || configuredHotels.graphqlHost
      || '',
    graphqlEndpoint: getMetaContent('hotel-graphql-endpoint')
      || configuredHotels.graphqlEndpoint
      || '/graphql/execute.json/iberostar-com/HotelByCode',
    graphqlOperationName: getMetaContent('hotel-graphql-operation-name')
      || configuredHotels.graphqlOperationName
      || 'HotelByCode',
    priceFromChannel: getMetaContent('hotel-price-channel')
      || configuredHotels.priceFromChannel
      || 'b2c-web',
    priceFromEndpoint: getMetaContent('hotel-price-endpoint')
      || configuredHotels.priceFromEndpoint
      || '',
  };
}

function normalizeEndpointPath(endpoint) {
  const value = `${endpoint || ''}`.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return value.startsWith('/') ? value : `/${value}`;
}

function isEdsPublicHostname(hostname = window.location.hostname) {
  return hostname.endsWith('.aem.page') || hostname.endsWith('.aem.live');
}

function resolveGraphqlHost(options, hotelsConfig) {
  if (options.graphqlHost) return options.graphqlHost;

  const configuredHost = hotelsConfig.graphqlHost || hotelsConfig.aemAssetHost || '';
  if (configuredHost) return configuredHost;

  if (isEdsPublicHostname()) {
    // EDS hosts don't usually expose the AEM GraphQL endpoint.
    // eslint-disable-next-line no-console
    console.warn('[hotels-api] Missing graphqlHost configuration for EDS host.');
  }

  return window.location.origin;
}

function normalizeLocale(locale) {
  return `${locale || ''}`.trim().toLowerCase().replace('-', '_');
}

export function getLocaleFromPath(pathname = window.location.pathname) {
  const segments = `${pathname || ''}`.split('/').filter(Boolean);
  const localeSegment = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  const locale = normalizeLocale(localeSegment);

  return locale || DEFAULT_LOCALE;
}

export function getLocaleTagFromPath(pathname = window.location.pathname) {
  const segments = `${pathname || ''}`.split('/').filter(Boolean);
  const localeSegment = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  return localeSegment?.toLowerCase() || DEFAULT_LOCALE_HYPHENATED;
}

export function getCountryCodeFromPath(pathname = window.location.pathname) {
  const localeTag = getLocaleTagFromPath(pathname);
  const [, market = 'us'] = localeTag.split('-');
  return market.toUpperCase();
}

export function getHotelsRootPathFromLocale(locale) {
  const normalizedLocale = normalizeLocale(locale) || DEFAULT_LOCALE;
  return `/content/dam/iberostar-com/${normalizedLocale}`;
}

function normalizeHotel(rawHotel) {
  if (!rawHotel || typeof rawHotel !== 'object') return null;

  // GraphQL schema exposes underscore-prefixed field names.
  // eslint-disable-next-line no-underscore-dangle
  const image = rawHotel?.mainImage?._dmS7Url
    // eslint-disable-next-line no-underscore-dangle
    || rawHotel?.mainImage?._path
    || '';

  return {
    // eslint-disable-next-line no-underscore-dangle
    path: rawHotel?._path || '',
    // eslint-disable-next-line no-underscore-dangle
    variation: rawHotel?._variation || '',
    isActive: Boolean(rawHotel?.isActive),
    code: rawHotel?.hotelCode || '',
    slug: rawHotel?.hotelSlug || '',
    title: rawHotel?.hotelTitle || '',
    abbrev: rawHotel?.abbrev || '',
    sortOrder: rawHotel?.sortOrder ?? null,
    latitude: rawHotel?.latitude ?? null,
    longitude: rawHotel?.longitude ?? null,
    stars: rawHotel?.stars ?? null,
    image,
    continent: rawHotel?.continent || null,
    country: rawHotel?.country || null,
    destination: rawHotel?.destination || null,
    estimatedMinPrice: rawHotel?.estimatedMinPrice ?? rawHotel?.minPrice ?? null,
    estimatedMinCurrency: rawHotel?.estimatedMinCurrency ?? rawHotel?.currency ?? null,
  };
}

function getRootPath(options = {}) {
  if (options.rootPath) return options.rootPath;

  const locale = normalizeLocale(options.locale)
    || getLocaleFromPath(options.pathname || window.location.pathname);

  return getHotelsRootPathFromLocale(locale);
}

function getPersistedQueryPath(options = {}) {
  const hotelsConfig = getHotelsConfig();
  return options.persistedQueryPath
    || options.persistedQueryUrl
    || options.endpoint
    || hotelsConfig.graphqlEndpoint;
}

function createRequestUrl(hotelCode, options = {}) {
  const persistedQueryPath = normalizeEndpointPath(getPersistedQueryPath(options));
  const rootPath = getRootPath(options);
  const hotelsConfig = getHotelsConfig();
  const graphqlHost = resolveGraphqlHost(options, hotelsConfig);

  const url = new URL(persistedQueryPath, graphqlHost);
  const normalizedCode = `${hotelCode}`.trim();
  url.pathname = `${url.pathname};rootPath=${rootPath};hotelCode=${normalizedCode}`;

  return {
    requestUrl: url,
    rootPath,
    persistedQueryPath: url.pathname,
  };
}

function readHotelFromResponse(payload) {
  const items = payload?.data?.hotelList?.items;
  if (!Array.isArray(items) || !items.length) return null;

  return normalizeHotel(items[0]);
}

export async function fetchHotelByCode(hotelCode, options = {}) {
  const normalizedCode = `${hotelCode || ''}`.trim();
  if (!normalizedCode) return null;

  const { requestUrl, rootPath, persistedQueryPath } = createRequestUrl(normalizedCode, options);
  const cacheKey = `${persistedQueryPath}|${rootPath}|${normalizedCode}`;
  const cached = GRAPHQL_REQUEST_CACHE.get(cacheKey);

  if (cached !== undefined) {
    return cached instanceof Promise ? cached : Promise.resolve(cached);
  }

  const requestPromise = fetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'same-origin',
  })
    .then(async (response) => {
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.warn(`[hotels-api] Hotel query failed (${response.status})`, {
          hotelCode: normalizedCode,
          requestUrl: requestUrl.toString(),
          rootPath,
        });
        return null;
      }

      const payload = await response.json().catch(() => null);
      const hotel = readHotelFromResponse(payload);
      if (!hotel) {
        // eslint-disable-next-line no-console
        console.warn('[hotels-api] Hotel not found for code', normalizedCode);
        return null;
      }

      return hotel;
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.warn('[hotels-api] Unexpected error fetching hotel', {
        hotelCode: normalizedCode,
        error,
      });
      return null;
    });

  GRAPHQL_REQUEST_CACHE.set(cacheKey, requestPromise);
  const result = await requestPromise;
  GRAPHQL_REQUEST_CACHE.set(cacheKey, result);
  return result;
}

export async function fetchHotelsByCodes(hotelCodes, options = {}) {
  const codes = (Array.isArray(hotelCodes) ? hotelCodes : [])
    .map((hotelCode) => `${hotelCode || ''}`.trim())
    .filter(Boolean);

  if (!codes.length) return [];

  const hotels = await Promise.all(codes.map((code) => fetchHotelByCode(code, options)));
  return hotels.filter(Boolean);
}

function normalizePriceResponse(payload) {
  const calendarPrices = Array.isArray(payload?.calendarPrices) ? payload.calendarPrices : [];
  const cheapestPrice = calendarPrices
    .filter((entry) => entry?.isAvailable && Number.isFinite(entry?.priceFrom))
    .sort((left, right) => left.priceFrom - right.priceFrom)[0];

  if (!cheapestPrice) return null;

  return {
    currency: payload?.currency || '',
    defaultOccupancy: payload?.defaultOccupancy || { adults: 2, children: [] },
    hotelId: payload?.hotelId || '',
    isAvailable: Boolean(cheapestPrice.isAvailable),
    mealPlanId: cheapestPrice.mealPlanId ?? null,
    mlos: cheapestPrice.mlos ?? null,
    priceFrom: cheapestPrice.priceFrom,
    priceFromWithoutOffers: cheapestPrice.priceFromWithoutOffers ?? null,
    roomTypeId: cheapestPrice.roomTypeId ?? null,
    stayDate: cheapestPrice.date || '',
  };
}

export async function fetchHotelPriceByCode(hotelCode, options = {}) {
  const normalizedCode = `${hotelCode || ''}`.trim();
  if (!normalizedCode) return null;

  const hotelsConfig = getHotelsConfig();
  const endpoint = options.priceFromEndpoint
    || options.endpoint
    || hotelsConfig.priceFromEndpoint;

  if (!endpoint) return null;

  const channel = options.channel || hotelsConfig.priceFromChannel;
  const countryCode = options.countryCode
    || getCountryCodeFromPath(options.pathname || window.location.pathname);
  const requestUrl = new URL(endpoint, window.location.origin);
  const cacheKey = `${requestUrl.toString()}|${normalizedCode}|${channel}|${countryCode}`;
  const cached = HOTEL_PRICE_REQUEST_CACHE.get(cacheKey);

  if (cached !== undefined) {
    return cached instanceof Promise ? cached : Promise.resolve(cached);
  }

  const body = {
    channel,
    countryCode,
    hotelId: normalizedCode,
  };

  const requestPromise = fetch(requestUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  })
    .then(async (response) => {
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.warn(`[hotels-api] Hotel price query failed (${response.status})`, {
          body,
          requestUrl: requestUrl.toString(),
        });
        return null;
      }

      const payload = await response.json().catch(() => null);
      const price = normalizePriceResponse(payload);
      if (!price) {
        // eslint-disable-next-line no-console
        console.warn('[hotels-api] No price available for hotel', normalizedCode);
        return null;
      }

      return price;
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.warn('[hotels-api] Unexpected error fetching hotel price', {
        body,
        error,
      });
      return null;
    });

  HOTEL_PRICE_REQUEST_CACHE.set(cacheKey, requestPromise);
  const result = await requestPromise;
  HOTEL_PRICE_REQUEST_CACHE.set(cacheKey, result);
  return result;
}
