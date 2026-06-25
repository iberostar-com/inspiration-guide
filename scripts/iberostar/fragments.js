import { getMetadata } from '../aem.js';

const INSPIRATION_GUIDE_SEGMENT = '/inspiration-guide';

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
  const segmentIndex = normalizedPath.indexOf(INSPIRATION_GUIDE_SEGMENT);

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

export function resolveFragmentPath(metaName, fallbackPath) {
  const metaValue = getMetadata(metaName);

  if (metaValue) {
    return normalizeFragmentPath(metaValue);
  }

  const inspirationGuideRoot = getInspirationGuideRoot();

  if (!inspirationGuideRoot || isFragmentPath(inspirationGuideRoot, metaName)) {
    return fallbackPath;
  }

  return `${inspirationGuideRoot}/${metaName}`;
}
