const PLACEHOLDER_CACHE = new Map();

function getLocaleRoot() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const locale = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  return locale ? `/${locale}` : '';
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

export async function getPlaceholder(key, fallback = '') {
  const paths = [
    `${getLocaleRoot()}/placeholders.json`,
    '/placeholders.json',
  ];

  const payloads = await Promise.all(paths.map((path) => fetchPlaceholders(path)));
  const value = payloads
    .map((payload) => getPlaceholderValue(payload, key))
    .find(Boolean);

  return value || fallback;
}

export default getPlaceholder;
