// Datos de taxonomia ecommerce de hoteles para analytics (GA4/Tealium).
// Mismo origen de datos que la home clasica de iberostar.com
// (ui.frontend/site/analytics/data-cache.js en el repo de AEM): un JSON
// estatico en el DAM mantenido por el equipo de analytics, indexado por
// hotel_sku (codigo de hotel con padding a 2 digitos).
const HOTELS_DATA_PATH = '/content/dam/iberostar-com/shared-data/analytics/hotels_data.json';

const HOTELS_DATA_CACHE = new Map();

function normalizeNameLookup(value) {
  return `${value || ''}`
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function fetchHotelsAnalyticsData(origin = '') {
  const cacheKey = origin || 'same-origin';
  if (!HOTELS_DATA_CACHE.has(cacheKey)) {
    const requestPromise = fetch(`${origin}${HOTELS_DATA_PATH}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    })
      .then(async (response) => {
        if (!response.ok) {
          // eslint-disable-next-line no-console
          console.warn('[hotels-analytics-data] Request failed', {
            status: response.status,
            url: `${origin}${HOTELS_DATA_PATH}`,
          });
          return {};
        }
        const payload = await response.json().catch(() => null);
        return payload && typeof payload === 'object' ? payload : {};
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('[hotels-analytics-data] Request failed', {
          error,
          url: `${origin}${HOTELS_DATA_PATH}`,
        });
        return {};
      });
    HOTELS_DATA_CACHE.set(cacheKey, requestPromise);
  }
  return HOTELS_DATA_CACHE.get(cacheKey);
}

export async function getAnalyticsHotelData(hotelCode, { origin = '', hotelName = '' } = {}) {
  const hotelsData = await fetchHotelsAnalyticsData(origin);
  const normalizedCode = `${hotelCode || ''}`.trim();

  if (normalizedCode) {
    const bySku = hotelsData[normalizedCode] || hotelsData[normalizedCode.padStart(2, '0')];
    if (bySku) return bySku;
  }

  // Igual que getHotelByName del site clasico: fallback por nombre para
  // codigos que no coinciden con el hotel_sku del JSON.
  const lookupName = normalizeNameLookup(hotelName);
  if (!lookupName) return null;

  const match = Object.values(hotelsData).find((hotel) => [
    hotel?.product_name,
    hotel?.hotel_name,
    hotel?.hotel_short_name,
  ].some((name) => normalizeNameLookup(name) === lookupName));

  return match || null;
}
