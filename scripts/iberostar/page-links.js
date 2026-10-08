const AEM_AUTHOR_HOST_PATTERN = /^author-p\d+-e\d+\.adobeaemcloud\.com$/i;
const DEFAULT_CONTENT_ROOT = '/content/inspiration-guide';
const PUBLIC_PAGE_PATTERN = /^\/[a-z]{2}-[a-z]{2}(?:\/|$)/i;
const INSPIRATION_GUIDE_ARTICLE_ROUTE_PATTERN = /^\/([a-z]{2}-[a-z]{2})\/inspiration-guide\/articles?\/(.+)$/i;

function getAemContentRoot() {
  const pathMatch = window.location.pathname.match(/^\/content\/[^/]+/);
  if (pathMatch) return pathMatch[0];

  const resource = document.querySelector('[data-aue-resource^="urn:aemconnection:/content/"]')
    ?.getAttribute('data-aue-resource')
    ?.replace(/^urn:aemconnection:/, '');

  return resource?.match(/^\/content\/[^/]+/)?.[0] || DEFAULT_CONTENT_ROOT;
}

function isAuthorEnvironment() {
  return AEM_AUTHOR_HOST_PATTERN.test(window.location.hostname)
    || window.location.pathname.startsWith('/content/');
}

function isCdnManagedPublishEnvironment() {
  const { hostname } = window.location;
  return !hostname.endsWith('.aem.live')
    && !hostname.endsWith('.aem.page')
    && hostname !== 'localhost'
    && hostname !== '127.0.0.1';
}

function isExternalUrl(url) {
  return url.origin !== window.location.origin
    && !url.hostname.endsWith('.adobeaemcloud.com');
}

function parsePageUrl(value) {
  const raw = `${value || ''}`.trim();
  if (!raw || raw.startsWith('#')) return null;

  try {
    const url = new URL(raw, window.location.origin);
    if (!['http:', 'https:'].includes(url.protocol) || isExternalUrl(url)) return null;
    return url;
  } catch {
    return null;
  }
}

function isInternalPagePath(pathname) {
  return pathname.startsWith(`${getAemContentRoot()}/`)
    || PUBLIC_PAGE_PATTERN.test(pathname);
}

export function toPublicPagePath(value) {
  const url = parsePageUrl(value);
  if (!url || !isInternalPagePath(url.pathname)) return `${value || ''}`.trim();

  const contentRoot = getAemContentRoot();
  const pathname = url.pathname.startsWith(`${contentRoot}/`)
    ? url.pathname.slice(contentRoot.length)
    : url.pathname;

  return `${pathname.replace(/\.html$/, '')}${url.search}${url.hash}`;
}

function toPrettyInspirationGuidePath(value) {
  const url = parsePageUrl(value);
  if (!url || !PUBLIC_PAGE_PATTERN.test(url.pathname)) return value;

  const match = url.pathname.replace(/\.html$/i, '').match(INSPIRATION_GUIDE_ARTICLE_ROUTE_PATTERN);
  if (!match) return value;

  const [, locale, slugPath] = match;
  return `/${locale}/inspiration-guide/${slugPath}${url.search}${url.hash}`;
}

export function toPageHref(value) {
  const publicPath = toPublicPagePath(value);
  const url = parsePageUrl(publicPath);

  if (!isAuthorEnvironment() || !url || !PUBLIC_PAGE_PATTERN.test(url.pathname)) {
    if (!isCdnManagedPublishEnvironment()) return publicPath;
    return toPrettyInspirationGuidePath(publicPath);
  }

  const pathname = url.pathname.replace(/\.html$/, '');
  return `${getAemContentRoot()}${pathname}.html${url.search}${url.hash}`;
}

export function appendPageSegment(parentPage, segment) {
  const parentPath = toPublicPagePath(parentPage);
  const normalizedSegment = `${segment || ''}`.trim();
  const isAbsolute = /^https?:\/\//i.test(parentPath);

  if (!parentPath || !normalizedSegment) return '';

  try {
    const url = new URL(parentPath, window.location.origin);
    if (!['http:', 'https:'].includes(url.protocol)) return '';

    const hasHtmlExtension = /\.html$/i.test(url.pathname);
    const parentPathname = url.pathname.replace(/\.html$/i, '').replace(/\/$/, '');
    const childPathname = `${parentPathname}/${encodeURIComponent(normalizedSegment)}${hasHtmlExtension ? '.html' : ''}`;
    const childHref = `${childPathname}${url.search}${url.hash}`;

    if (isAbsolute) return `${url.origin}${childHref}`;
    return toPageHref(childHref);
  } catch {
    return '';
  }
}

export function decoratePageLinks(root) {
  root?.querySelectorAll?.('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    const resolvedHref = toPageHref(href);
    if (resolvedHref && resolvedHref !== href) link.setAttribute('href', resolvedHref);
  });
}
