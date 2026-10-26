const AEM_AUTHOR_HOST_PATTERN = /^author-p\d+-e\d+\.adobeaemcloud\.com$/i;
const DEFAULT_CONTENT_ROOT = '/content/inspiration-guide';
const PUBLIC_PAGE_PATTERN = /^\/[a-z]{2}-[a-z]{2}(?:\/|$)/i;
const AUTHOR_PAGE_SEGMENTS = {
  article: 'articles',
  category: 'category',
  tag: 'tag',
};

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

export function toPageHref(value, { pageType = '', resourcePath = '' } = {}) {
  const url = parsePageUrl(value);

  if (isAuthorEnvironment() && url && isInternalPagePath(url.pathname)) {
    const contentRoot = getAemContentRoot();
    const resource = parsePageUrl(`${resourcePath || ''}`.replace(/^urn:aemconnection:/, ''));
    let pathname = url.pathname.replace(/\.html$/i, '');

    if (resource?.pathname.startsWith(`${contentRoot}/`)) {
      pathname = resource.pathname.replace(/\/jcr:content(?:\/.*)?$/, '').replace(/\.html$/i, '');
    } else if (!pathname.startsWith(`${contentRoot}/`)) {
      const guide = pathname.match(/^(\/[a-z]{2}-[a-z]{2}\/inspiration-guide)(?:\/(.+?))?\/?$/i);
      const segment = Object.hasOwn(AUTHOR_PAGE_SEGMENTS, pageType)
        ? AUTHOR_PAGE_SEGMENTS[pageType] : '';
      if (guide && segment && guide[2]) {
        // The caller knows the destination type; never classify a flattened slug.
        const suffix = guide[2].startsWith(`${segment}/`) ? guide[2] : `${segment}/${guide[2]}`;
        pathname = `${contentRoot}${guide[1]}/${suffix}`;
      } else if ((guide && !guide[2]) || /^\/[a-z]{2}-[a-z]{2}\/?$/i.test(pathname)) {
        pathname = `${contentRoot}${pathname.replace(/\/$/, '')}`;
      }
    }

    if (pathname.startsWith(`${contentRoot}/`)) {
      return `${pathname}.html${url.search}${url.hash}`;
    }
  }

  return toPublicPagePath(value);
}

export function appendPageSegment(parentPage, segment, options) {
  const parentPath = `${parentPage || ''}`.trim();
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

    if (isAbsolute) return toPageHref(`${url.origin}${childHref}`, options);
    return toPageHref(childHref, options);
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
