import { tagTitle } from './tag-label.js';

const REQUEST_CACHE = new Map();
let taxonomyPromise = null;
const CATEGORY_ID_ROOT_PATTERN = /^(?:category|categories|categoria|categorias|categorías)(\/|$)/i;
const TAG_ID_ROOT_PATTERN = /^(?:tag|tags)(\/|$)/i;

function localeSegment() {
  const segment = window.location.pathname
    .split('/')
    .filter(Boolean)
    .find((part) => /^[a-z]{2}-[a-z]{2}$/i.test(part));
  return segment ? segment.toLowerCase() : '';
}

function slugifySegment(value) {
  return `${value || ''}`
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Canonical key for a tag/category landing path: `/tag/<slug>` or `/category/<path>`.
function keyFromPath(path) {
  const match = `${path || ''}`
    .split(/[?#]/)[0]
    .match(/\/(tag|category)\/(.+?)(?:\.plain)?(?:\.html?)?\/?$/i);
  if (!match) return '';

  const rest = match[2].split('/').map(slugifySegment).filter(Boolean).join('/');
  return rest ? `/${match[1].toLowerCase()}/${rest}` : '';
}

// Canonical key for a tag/category id: `inspiration-guide:tags/x` -> `/tag/x`,
// `inspiration-guide:categorías/destinos/x` -> `/category/destinos/x`.
function keyFromId(id) {
  const raw = `${id || ''}`.split(',')[0].trim();
  const body = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1) : raw;
  if (!body) return '';

  if (CATEGORY_ID_ROOT_PATTERN.test(body)) {
    const rest = body
      .replace(CATEGORY_ID_ROOT_PATTERN, '')
      .split('/')
      .map(slugifySegment)
      .filter(Boolean)
      .join('/');
    return rest ? `/category/${rest}` : '';
  }

  const leaf = body.replace(TAG_ID_ROOT_PATTERN, '').split('/').filter(Boolean).pop();
  const slug = slugifySegment(leaf);
  return slug ? `/tag/${slug}` : '';
}

// Canonical `/tag/<slug>` or `/category/<path>` key for either shape, so callers
// that only need the taxonomy path (e.g. the analytics Content Grouping) can
// reuse this parsing synchronously, without loading the published index.
export function taxonomyKey(value) {
  return /\/(tag|category)\//i.test(`${value || ''}`)
    ? keyFromPath(value)
    : keyFromId(value);
}

function fetchIndex(url) {
  if (REQUEST_CACHE.has(url)) return REQUEST_CACHE.get(url);

  const promise = fetch(url, { headers: { Accept: 'application/json' } })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);

  REQUEST_CACHE.set(url, promise);
  return promise;
}

// Loads the published index once and maps every tag/category landing to its Title.
// Fails soft (empty map) when the index is unreachable, e.g. inside Universal Editor.
async function loadTaxonomy() {
  if (taxonomyPromise) return taxonomyPromise;

  taxonomyPromise = (async () => {
    const locale = localeSegment();
    const localePrefix = locale ? new RegExp(`^/${locale}(?:/|$)`, 'i') : null;
    const payload = await fetchIndex('/query-index.json');
    const map = new Map();

    (payload?.data || []).forEach((row) => {
      const path = `${row.path || ''}`;
      if (localePrefix && !localePrefix.test(path)) return;

      const key = keyFromPath(path);
      const title = `${row.title || ''}`.trim();
      if (key && title && !map.has(key)) map.set(key, title);
    });

    return map;
  })();

  return taxonomyPromise;
}

// Title of the landing page for a tag/category id or landing path, or '' when the
// page does not exist. Callers pair it with their own slug-derived fallback.
export async function taxonomyTitle(value) {
  const key = taxonomyKey(value);
  if (!key) return '';

  const map = await loadTaxonomy();
  return map.get(key) || '';
}

// Landing Title when it exists, otherwise the slug-derived label.
export async function tagDisplayTitle(value) {
  return (await taxonomyTitle(value)) || tagTitle(value);
}

export default tagDisplayTitle;
