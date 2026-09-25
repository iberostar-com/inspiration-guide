const LOCALES = ['de-de', 'en-gb', 'en-us', 'es-es', 'fr-fr', 'pt-br'];
const X_DEFAULT_LOCALE = 'en-us';
const INDEX_URL = '/query-index.json';

let alternatesPromise = null;

function hreflangTag(locale) {
  const [language, market] = locale.split('-');
  return language === 'en' && market === 'gb' ? 'en-GB' : language;
}

function currentLocale() {
  const [segment = ''] = window.location.pathname.split('/').filter(Boolean);
  const locale = segment.toLowerCase();
  return LOCALES.includes(locale) ? locale : '';
}

function alternateOrigin() {
  const href = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
  try {
    return new URL(href, window.location.origin).origin;
  } catch (error) {
    return window.location.origin;
  }
}

function normalizePath(value) {
  const path = `${value || ''}`.trim();
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

async function publishedPaths() {
  try {
    const response = await fetch(INDEX_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const payload = await response.json();
    return new Set((payload?.data || []).map((row) => normalizePath(row.path)));
  } catch (error) {
    return null;
  }
}

async function resolveAlternates() {
  const locale = currentLocale();
  if (!locale) return new Map();

  const path = normalizePath(window.location.pathname);
  const relative = path.slice(`/${locale}`.length);
  const paths = await publishedPaths();
  if (!paths || !paths.has(path)) return new Map();

  const alternates = new Map();
  LOCALES.forEach((target) => {
    const targetPath = `/${target}${relative}`;
    if (paths.has(targetPath)) alternates.set(target, targetPath);
  });
  return alternates;
}

export function localeAlternates() {
  if (!alternatesPromise) alternatesPromise = resolveAlternates();
  return alternatesPromise;
}

export default async function decorateHreflang() {
  if (document.head.querySelector('link[hreflang]')) return;

  const alternates = await localeAlternates();
  if (!alternates.size) return;

  const origin = alternateOrigin();
  const seen = new Set();
  const links = [];
  let xDefault = null;

  alternates.forEach((targetPath, locale) => {
    const tag = hreflangTag(locale);
    if (seen.has(tag)) return;
    seen.add(tag);

    const url = `${origin}${targetPath}`;
    links.push({ tag, url });
    if (locale === X_DEFAULT_LOCALE) xDefault = { tag: 'x-default', url };
  });

  if (!links.length) return;
  if (xDefault) links.push(xDefault);

  const fragment = document.createDocumentFragment();
  links.forEach(({ tag, url }) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', tag);
    link.setAttribute('href', url);
    fragment.append(link);
  });
  document.head.append(fragment);
}
