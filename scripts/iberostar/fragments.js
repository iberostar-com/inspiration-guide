import { getMetadata } from '../aem.js';

const INSPIRATION_GUIDE_SEGMENT = '/inspiration-guide';
const LOCALE_PATTERN = /\/(?:([a-z]{2}-[a-z]{2}))\/inspiration-guide(?:\/|$)/i;

export function normalizeFragmentPath(path) {
  if (!path) return '';

  const { pathname } = new URL(path, window.location);

  if (!pathname.startsWith('/content/')) {
    return pathname;
  }

  const [, , , ...sitePath] = pathname.split('/');
  return sitePath.length ? `/${sitePath.join('/')}` : '/';
}

function getInspirationGuideRoot(pathname = window.location.pathname) {
  const normalizedPath = pathname.replace(/\/$/, '');
  const segmentIndex = normalizedPath.lastIndexOf(INSPIRATION_GUIDE_SEGMENT);

  if (segmentIndex < 0) {
    return '';
  }

  return normalizeFragmentPath(
    normalizedPath.slice(0, segmentIndex + INSPIRATION_GUIDE_SEGMENT.length),
  );
}

function isFragmentPath(rootPath, fragmentName) {
  const normalizedPath = normalizeFragmentPath(window.location.pathname).replace(/\/$/, '');
  return normalizedPath === `${rootPath}/${fragmentName}`;
}

function getLocaleFallbackPath(fragmentName) {
  const normalizedPath = normalizeFragmentPath(window.location.pathname);
  const localeMatch = normalizedPath.match(LOCALE_PATTERN);

  if (!localeMatch?.[1]) {
    return '';
  }

  return `/${localeMatch[1].toLowerCase()}${INSPIRATION_GUIDE_SEGMENT}/${fragmentName}`;
}

function normalizeMicrositeFragmentPath(path, fragmentName) {
  const normalizedPath = normalizeFragmentPath(path).replace(/\/$/, '');
  const inspirationGuideRoot = getInspirationGuideRoot();

  if (!normalizedPath || !inspirationGuideRoot) {
    return normalizedPath;
  }

  const fragmentPattern = new RegExp(`^/(?:[a-z]{2}-[a-z]{2}/)?${fragmentName}$`, 'i');
  if (fragmentPattern.test(normalizedPath)) {
    return `${inspirationGuideRoot}/${fragmentName}`;
  }

  return normalizedPath;
}

export function resolveFragmentPath(metaName, fallbackPath) {
  const metaValue = getMetadata(metaName);

  if (metaValue) {
    return normalizeMicrositeFragmentPath(metaValue, metaName);
  }

  const inspirationGuideRoot = getInspirationGuideRoot();

  if (!inspirationGuideRoot || isFragmentPath(inspirationGuideRoot, metaName)) {
    return getLocaleFallbackPath(metaName) || fallbackPath;
  }

  return `${inspirationGuideRoot}/${metaName}`;
}
