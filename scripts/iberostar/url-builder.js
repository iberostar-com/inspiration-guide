const SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;

function getBaseUrl(base) {
  if (base) return base;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://www.iberostar.com';
}

export function buildUrl(pathOrUrl, base) {
  if (!pathOrUrl) return '';

  try {
    const candidate = `${pathOrUrl}`.trim();
    if (!candidate) return '';
    if (SCHEME_PATTERN.test(candidate) || candidate.startsWith('//')) {
      return new URL(candidate).href;
    }

    return new URL(candidate, getBaseUrl(base)).href;
  } catch (error) {
    return '';
  }
}

export function joinUrlSegments(...segments) {
  const filteredSegments = segments
    .flat()
    .filter(Boolean)
    .map((segment) => `${segment}`.trim())
    .filter(Boolean);

  if (!filteredSegments.length) return '';

  return filteredSegments
    .map((segment, index) => {
      if (index === 0) {
        return segment.replace(/\/+$/g, '');
      }

      return segment.replace(/^\/+|\/+$/g, '');
    })
    .join('/');
}

export default buildUrl;
