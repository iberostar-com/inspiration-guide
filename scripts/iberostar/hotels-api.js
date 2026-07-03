const DEFAULT_PERSISTED_QUERY_PATH = '/graphql/execute.json/iberostar-com/hotel-by-code';
const DEFAULT_LOCALE = 'en_us';
const DEFAULT_OPERATION_NAME = 'HotelByCode';

const HOTEL_REQUEST_CACHE = new Map();

function normalizeLocale(locale) {
  return `${locale || ''}`.trim().toLowerCase().replace('-', '_');
}

export function getLocaleFromPath(pathname = window.location.pathname) {
  const segments = `${pathname || ''}`.split('/').filter(Boolean);
  const localeSegment = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  const locale = normalizeLocale(localeSegment);

  return locale || DEFAULT_LOCALE;
}

export function getHotelsRootPathFromLocale(locale) {
  const normalizedLocale = normalizeLocale(locale) || DEFAULT_LOCALE;
  return `/content/dam/iberostar-com/${normalizedLocale}/content-fragments/fichas/hotels`;
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
  return options.persistedQueryPath
    || options.persistedQueryUrl
    || options.endpoint
    || DEFAULT_PERSISTED_QUERY_PATH;
}

function createRequestUrl(hotelCode, options = {}) {
  const persistedQueryPath = getPersistedQueryPath(options);
  const rootPath = getRootPath(options);
  const operationName = options.operationName || DEFAULT_OPERATION_NAME;

  const url = new URL(persistedQueryPath, window.location.origin);
  url.searchParams.set('rootPath', rootPath);
  url.searchParams.set('hotelCode', `${hotelCode}`.trim());
  url.searchParams.set('operationName', operationName);

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
  const cached = HOTEL_REQUEST_CACHE.get(cacheKey);

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

  HOTEL_REQUEST_CACHE.set(cacheKey, requestPromise);
  const result = await requestPromise;
  HOTEL_REQUEST_CACHE.set(cacheKey, result);
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
