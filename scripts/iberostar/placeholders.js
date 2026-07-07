const PLACEHOLDER_CACHE = new Map();
const PLACEHOLDER_WARNINGS = new Set();
const DEFAULT_LOCALE = 'en-us';

function warnOnce(key, message) {
  if (PLACEHOLDER_WARNINGS.has(key)) return;
  PLACEHOLDER_WARNINGS.add(key);
  // eslint-disable-next-line no-console
  console.warn(message);
}

export function getLocaleFromPath(pathname = window.location.pathname) {
  const segments = `${pathname || ''}`.split('/').filter(Boolean);
  const locale = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  return locale ? locale.toLowerCase() : DEFAULT_LOCALE;
}

function normalizeKey(value) {
  return `${value || ''}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function getRows(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
}

function getRowKey(row) {
  return row.key || row.Key || row.name || row.Name || row.placeholder || row.Placeholder || '';
}

function getRowValue(row) {
  if (!row) return '';
  return row.text || row.Text || row.value || row.Value || row.copy || row.Copy || '';
}

async function fetchPlaceholders(path) {
  if (PLACEHOLDER_CACHE.has(path)) return PLACEHOLDER_CACHE.get(path);

  const promise = fetch(path, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'same-origin',
  })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);

  PLACEHOLDER_CACHE.set(path, promise);
  return promise;
}

function getPlaceholderValue(payload, key) {
  const normalizedKey = normalizeKey(key);
  if (!normalizedKey) return '';

  const row = getRows(payload).find((item) => normalizeKey(getRowKey(item)) === normalizedKey);
  return getRowValue(row);
}

function getLocaleRoot(locale = getLocaleFromPath()) {
  const normalizedLocale = getLocaleFromPath(`/${locale}`);
  return `/${normalizedLocale}`;
}

export async function loadPlaceholders(locale = getLocaleFromPath()) {
  const normalizedLocale = getLocaleFromPath(`/${locale}`);
  const cacheKey = `locale:${normalizedLocale}`;

  if (PLACEHOLDER_CACHE.has(cacheKey)) {
    return PLACEHOLDER_CACHE.get(cacheKey);
  }

  const requestPromise = (async () => {
    const localizedPath = `${getLocaleRoot(normalizedLocale)}/placeholders.json`;
    const localizedPayload = await fetchPlaceholders(localizedPath);
    if (localizedPayload) return localizedPayload;

    const globalPayload = await fetchPlaceholders('/placeholders.json');
    if (globalPayload) return globalPayload;

    warnOnce(
      `load-failed:${normalizedLocale}`,
      '[placeholders] Failed to load placeholders, using fallback',
    );
    return {};
  })();

  PLACEHOLDER_CACHE.set(cacheKey, requestPromise);
  return requestPromise;
}

export async function getPlaceholder(key, fallback = '') {
  const payload = await loadPlaceholders();
  const value = getPlaceholderValue(payload, key);

  return value || fallback;
}

export default getPlaceholder;
