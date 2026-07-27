import getEnvironmentConfig from './environment-config.js';
import { getAnalyticsHotelData } from './hotels-analytics-data.js';

const DEFAULT_LOCALE_HYPHENATED = 'en-us';
const GRAPHQL_REQUEST_CACHE = new Map();
const HOTEL_PRICE_REQUEST_CACHE = new Map();
const HOTEL_API_WARNINGS = new Set();

const GRAPHQL_QUERY_PATH = '/graphql/execute.json/iberostar-com/HotelByCode';

const GRAPHQL_ORIGINS_BY_HOST = {
  'aem-grspre.iberostar.com': '',
  'aem-grsdev.iberostar.com': '',
  'aem-grsqa.iberostar.com': '',

  // 'main--inspiration-guide--iberostar-com.aem.live': 'https://publish-p179213-e1886364.adobeaemcloud.com',
  // 'main--inspiration-guide--iberostar-com.aem.page': 'https://publish-p179213-e1886364.adobeaemcloud.com',

  // 'main--inspiration-guide-dev--iberostar-com.aem.live': 'https://publish-p179213-e1898042.adobeaemcloud.com',
  // 'main--inspiration-guide-dev--iberostar-com.aem.page': 'https://publish-p179213-e1898042.adobeaemcloud.com',
};

function warnOnce(key, message, details = null) {
  if (HOTEL_API_WARNINGS.has(key)) return;
  HOTEL_API_WARNINGS.add(key);

  // eslint-disable-next-line no-console
  if (details) console.warn(message, details);
  // eslint-disable-next-line no-console
  else console.warn(message);
}

function getMetaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function isHotelApiDebugEnabled() {
  const fromQuery = new URLSearchParams(window.location.search).get('hotel-api-debug');
  if (fromQuery) {
    return fromQuery === '1' || fromQuery.toLowerCase() === 'true';
  }

  const fromMeta = getMetaContent('hotel-api-debug');
  return fromMeta === '1' || fromMeta.toLowerCase() === 'true';
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
    priceFromChannel: getMetaContent('hotel-price-channel')
      || configuredHotels.priceFromChannel
      || 'b2c-web',
    priceFromEndpoint: getMetaContent('hotel-price-endpoint')
      || configuredHotels.priceFromEndpoint
      || '',
  };
}

function normalizeLocaleTag(locale) {
  const value = `${locale || ''}`.trim().toLowerCase().replace('_', '-');
  if (/^[a-z]{2}-[a-z]{2}$/.test(value)) return value;
  return DEFAULT_LOCALE_HYPHENATED;
}

function normalizeAemLocale(locale) {
  return normalizeLocaleTag(locale).replace('-', '_');
}

export function getLocaleFromPath(pathname = window.location.pathname) {
  const segments = `${pathname || ''}`.split('/').filter(Boolean);
  const localeSegment = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  return normalizeLocaleTag(localeSegment);
}

export function getLocaleTagFromPath(pathname = window.location.pathname) {
  return getLocaleFromPath(pathname);
}

export function getAemLocaleFromPath(pathname = window.location.pathname) {
  return normalizeAemLocale(getLocaleFromPath(pathname));
}

export function getCountryCodeFromPath(pathname = window.location.pathname) {
  const localeTag = getLocaleFromPath(pathname);
  const [, market = 'us'] = localeTag.split('-');
  return market.toUpperCase();
}

export function getHotelsRootPathFromLocale(locale) {
  const normalizedLocale = normalizeAemLocale(locale || DEFAULT_LOCALE_HYPHENATED);
  return `/content/dam/iberostar-com/${normalizedLocale}`;
}

export function getGraphqlOrigin() {
  const configuredOrigin = window.iberostarConfig?.graphqlOrigin;
  const { graphqlHost } = getHotelsConfig();

  if (configuredOrigin !== undefined) {
    return configuredOrigin;
  }

  if (graphqlHost) {
    return graphqlHost;
  }

  const { hostname } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'https://publish-p179213-e1886364.adobeaemcloud.com';
  }

  return GRAPHQL_ORIGINS_BY_HOST[hostname] ?? '';
}

export function buildHotelByCodeUrl({ rootPath, hotelCode }) {
  const origin = getGraphqlOrigin();

  return `${origin}${GRAPHQL_QUERY_PATH};rootPath=${rootPath};hotelCode=${hotelCode}`;
}

export function isValidHotelCode(value) {
  return /^[A-Za-z0-9_-]{1,20}$/.test(`${value || ''}`.trim());
}

function normalizeHotelStars(value) {
  if (Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }

  if (value && typeof value === 'object') {
    return normalizeHotelStars(
      value.stars
      ?? value.value
      ?? value.count
      ?? value.number,
    );
  }

  return null;
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
    stars: normalizeHotelStars(rawHotel?.stars),
    image,
    continent: rawHotel?.continent || null,
    country: rawHotel?.country || null,
    destination: rawHotel?.destination || null,
    estimatedMinPrice: rawHotel?.estimatedMinPrice ?? rawHotel?.minPrice ?? null,
    estimatedMinCurrency: rawHotel?.estimatedMinCurrency ?? rawHotel?.currency ?? null,
    // Taxonomia ecommerce: HotelByCode no expone estos campos, asi que la
    // fuente real es hotels_data.json del DAM (ver enrichHotelWithAnalyticsData);
    // si algun dia la query los devuelve, quedan como fallback.
    brand: rawHotel?.brand || null,
    category: rawHotel?.category || null,
    subcategory: rawHotel?.subcategory || null,
    segment: rawHotel?.segment || null,
    subsegment: rawHotel?.subsegment || null,
    isOnlyAdults: rawHotel?.isOnlyAdults ?? null,
    headquarter: rawHotel?.headquarter || null,
    countryCode: rawHotel?.countryCode || null,
    area: rawHotel?.area || null,
    zone: rawHotel?.zone || null,
    city: rawHotel?.city || null,
  };
}

function firstFilled(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') ?? null;
}

// HotelByCode devuelve continent/country como fragment references (objetos);
// para analytics solo sirven como texto plano.
function textOrNull(value) {
  return typeof value === 'string' && value.trim() ? value : null;
}

// Completa la taxonomia ecommerce del hotel con hotels_data.json del DAM,
// la misma fuente que usan las metricas de la home clasica de iberostar.com.
// El mapeo de campos replica el del site clasico (recommended-hotels-grid.js
// del repo de AEM); en concreto product_market se envia como subcategory.
async function enrichHotelWithAnalyticsData(hotel) {
  const analyticsData = await getAnalyticsHotelData(hotel.code, {
    origin: getGraphqlOrigin(),
    hotelName: hotel.title,
  }).catch(() => null);

  if (!analyticsData) {
    warnOnce(
      `analytics-data-not-found:${hotel.code}`,
      '[hotels-api] No analytics taxonomy data for hotel',
      hotel.code,
    );
    return hotel;
  }

  const enriched = {
    ...hotel,
    stars: hotel.stars ?? normalizeHotelStars(analyticsData.hotel_stars),
    continent: firstFilled(analyticsData.destination_continent, textOrNull(hotel.continent)),
    country: firstFilled(analyticsData.destination_country, textOrNull(hotel.country)),
    brand: firstFilled(analyticsData.hotel_brand, hotel.brand),
    category: firstFilled(analyticsData.product_category, hotel.category),
    subcategory: firstFilled(analyticsData.product_market, hotel.subcategory),
    segment: firstFilled(analyticsData.hotel_segment, hotel.segment),
    subsegment: firstFilled(analyticsData.hotel_subsegment, hotel.subsegment),
    isOnlyAdults: firstFilled(analyticsData.hotel_is_only_adults, hotel.isOnlyAdults),
    headquarter: firstFilled(analyticsData.hotel_headquarter_final, hotel.headquarter),
    countryCode: firstFilled(analyticsData.destination_country_code, hotel.countryCode),
    area: firstFilled(analyticsData.destination_area, hotel.area),
    zone: firstFilled(analyticsData.destination_zone, hotel.zone),
    city: firstFilled(analyticsData.destination_city, hotel.city),
  };

  if (isHotelApiDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.info('[hotels-api] Hotel enriched with analytics data', {
      analyticsData,
      enriched,
      hotelCode: hotel.code,
    });
  }

  return enriched;
}

function getRootPath(options = {}) {
  if (options.rootPath) return options.rootPath;

  const locale = options.locale
    || getLocaleFromPath(options.pathname || window.location.pathname);

  return getHotelsRootPathFromLocale(locale);
}

function createRequestUrl(hotelCode, options = {}) {
  const rootPath = getRootPath(options);
  const normalizedCode = `${hotelCode || ''}`.trim();
  const requestUrl = buildHotelByCodeUrl({
    hotelCode: normalizedCode,
    rootPath,
  });

  return {
    requestUrl,
    rootPath,
  };
}

function readHotelFromResponse(payload) {
  if (Array.isArray(payload?.errors) && payload.errors.length) {
    warnOnce(
      `graphql-payload-errors:${payload.errors[0]?.message || 'unknown'}`,
      '[hotels-api] GraphQL request failed',
      { errors: payload.errors },
    );
    return null;
  }

  const items = payload?.data?.hotelList?.items;
  if (!Array.isArray(items) || !items.length) return null;

  return normalizeHotel(items[0]);
}

export async function fetchHotelByCode(hotelCode, options = {}) {
  const normalizedHotelCode = `${hotelCode || ''}`.trim();
  if (!isValidHotelCode(normalizedHotelCode)) {
    warnOnce(
      `invalid-hotel-code:${normalizedHotelCode}`,
      '[hotels-api] Invalid hotelCode, skipping hotel fetch',
      { hotelCode },
    );
    return null;
  }

  const { requestUrl, rootPath } = createRequestUrl(normalizedHotelCode, options);
  const cacheKey = requestUrl;
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
        warnOnce(
          `graphql-response-failed:${response.status}:${requestUrl}`,
          '[hotels-api] GraphQL request failed',
          {
            hotelCode: normalizedHotelCode,
            requestUrl,
            rootPath,
            status: response.status,
          },
        );
        return null;
      }

      const payload = await response.json().catch(() => null);
      const hotel = readHotelFromResponse(payload);
      if (!hotel) {
        warnOnce(
          `hotel-not-found:${normalizedHotelCode}`,
          '[hotels-api] Hotel not found for code',
          normalizedHotelCode,
        );
        return null;
      }

      return enrichHotelWithAnalyticsData(hotel);
    })
    .catch((error) => {
      warnOnce(
        `graphql-fetch-error:${requestUrl}`,
        '[hotels-api] GraphQL request failed',
        {
          hotelCode: normalizedHotelCode,
          error,
          requestUrl,
        },
      );
      return null;
    });

  GRAPHQL_REQUEST_CACHE.set(cacheKey, requestPromise);
  const result = await requestPromise;
  GRAPHQL_REQUEST_CACHE.set(cacheKey, result);
  return result;
}

export async function fetchHotelsByCodes(hotelCodes, options = {}) {
  const uniqueCodes = [...new Set((Array.isArray(hotelCodes) ? hotelCodes : [])
    .map((hotelCode) => `${hotelCode || ''}`.trim())
    .filter((hotelCode) => {
      const valid = isValidHotelCode(hotelCode);
      if (!valid) {
        warnOnce(
          `invalid-hotel-code-list:${hotelCode}`,
          '[hotels-api] Invalid hotelCode, skipping hotel fetch',
          { hotelCode },
        );
      }
      return valid;
    }))];

  if (!uniqueCodes.length) return [];

  const hotels = await Promise.all(uniqueCodes.map((code) => fetchHotelByCode(code, options)));
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
  if (!isValidHotelCode(normalizedCode)) return null;

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

  if (isHotelApiDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.info('[hotels-api] Price request', {
      body,
      endpoint: requestUrl.toString(),
    });
  }

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
        warnOnce(
          `price-query-failed:${response.status}:${requestUrl.toString()}`,
          `[hotels-api] Hotel price query failed (${response.status})`,
          {
            body,
            requestUrl: requestUrl.toString(),
          },
        );
        return null;
      }

      const payload = await response.json().catch(() => null);
      const price = normalizePriceResponse(payload);

      if (isHotelApiDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.info('[hotels-api] Price response', {
          normalizedPrice: price,
          payload,
        });
      }

      if (!price) {
        warnOnce(
          `price-not-available:${normalizedCode}`,
          '[hotels-api] No price available for hotel',
          normalizedCode,
        );
        return null;
      }

      return price;
    })
    .catch((error) => {
      warnOnce(
        `price-unexpected-error:${requestUrl.toString()}:${normalizedCode}`,
        '[hotels-api] Unexpected error fetching hotel price',
        {
          body,
          error,
        },
      );
      return null;
    });

  HOTEL_PRICE_REQUEST_CACHE.set(cacheKey, requestPromise);
  const result = await requestPromise;
  HOTEL_PRICE_REQUEST_CACHE.set(cacheKey, result);
  return result;
}
