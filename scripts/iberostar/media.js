import { createOptimizedPicture } from '../aem.js';
import DYNAMIC_MEDIA_CONFIG from './dynamic-media-config.js';
import getEnvironmentConfig from './environment-config.js';
import getImagePreset from './image-presets.js';

const DEFAULT_BREAKPOINTS = [{ width: '750' }];
const DAM_EXTENSION_REGEXP = /\.[a-z0-9]+$/i;
const DAM_PATH_PREFIX = '/content/dam/';
const DYNAMIC_MEDIA_PATH_SEGMENT = '/is/image/';

export function isRemoteImage(src = '') {
  return /^https?:\/\//.test(src);
}

function getMetaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function normalizeBoolean(value, fallback = false) {
  if (!value) return fallback;
  return ['true', '1', 'yes'].includes(value.toLowerCase());
}

function normalizeImageOptions(eagerOrOptions, breakpoints) {
  if (eagerOrOptions && typeof eagerOrOptions === 'object' && !Array.isArray(eagerOrOptions)) {
    return {
      eager: false,
      breakpoints: DEFAULT_BREAKPOINTS,
      ...eagerOrOptions,
    };
  }

  return {
    eager: Boolean(eagerOrOptions),
    breakpoints: breakpoints || DEFAULT_BREAKPOINTS,
  };
}

function createImage(src, alt, eager) {
  const image = document.createElement('img');
  image.src = src;
  image.alt = alt;
  image.loading = eager ? 'eager' : 'lazy';
  return image;
}

function normalizeSource(src = '') {
  const value = `${src || ''}`.trim();
  if (!value || value.toLowerCase() === 'undefined') return '';
  return value;
}

function isDamAssetPath(src = '') {
  const normalized = normalizeSource(src);
  if (!normalized) return false;

  if (isRemoteImage(normalized)) {
    try {
      return new URL(normalized, window.location).pathname.startsWith(DAM_PATH_PREFIX);
    } catch (error) {
      return false;
    }
  }

  return normalized.startsWith(DAM_PATH_PREFIX);
}

function notifyImageUnavailable(image) {
  image.dispatchEvent(new CustomEvent('media:image-unavailable', { bubbles: true }));
}

function attachImageFallback(image, fallbackSrc) {
  const fallback = normalizeSource(fallbackSrc);
  if (!fallback) {
    image.addEventListener('error', () => {
      notifyImageUnavailable(image);
    });
    return;
  }

  image.addEventListener('error', () => {
    if (image.dataset.imageFallbackApplied === 'true') {
      notifyImageUnavailable(image);
      return;
    }

    image.dataset.imageFallbackApplied = 'true';
    image.src = fallback;
  });
}

function getDynamicMediaConfig(options = {}) {
  const environmentConfig = getEnvironmentConfig();
  const environmentDynamicMedia = environmentConfig.dynamicMedia || {};
  const forcedEnabled = typeof options.dynamicMediaEnabled === 'boolean'
    ? options.dynamicMediaEnabled
    : null;

  return {
    enabled: forcedEnabled ?? normalizeBoolean(
      getMetaContent('dynamic-media-enabled'),
      normalizeBoolean(
        `${window.hlx?.dynamicMediaEnabled || ''}`,
        environmentDynamicMedia.enabled ?? DYNAMIC_MEDIA_CONFIG.enabled,
      ),
    ),
    imageServer: getMetaContent('dynamic-media-image-server')
      || window.hlx?.dynamicMediaImageServer
      || environmentDynamicMedia.imageServer
      || DYNAMIC_MEDIA_CONFIG.imageServer,
    company: getMetaContent('dynamic-media-company')
      || window.hlx?.dynamicMediaCompany
      || environmentDynamicMedia.company
      || DYNAMIC_MEDIA_CONFIG.company,
    damRoot: getMetaContent('dynamic-media-dam-root')
      || window.hlx?.dynamicMediaDamRoot
      || environmentDynamicMedia.damRoot
      || DYNAMIC_MEDIA_CONFIG.damRoot,
    stripExtension: normalizeBoolean(
      getMetaContent('dynamic-media-strip-extension'),
      normalizeBoolean(
        `${window.hlx?.dynamicMediaStripExtension || ''}`,
        environmentDynamicMedia.stripExtension ?? DYNAMIC_MEDIA_CONFIG.stripExtension,
      ),
    ),
    assetHost: getMetaContent('aem-assets-host')
      || window.hlx?.aemAssetsHost
      || environmentDynamicMedia.assetHost
      || '',
  };
}

function resolveDamAssetUrl(src, config) {
  const normalized = normalizeSource(src);
  if (!normalized || !isDamAssetPath(normalized)) return normalized;

  if (isRemoteImage(normalized)) return normalized;

  const assetHost = `${config.assetHost || ''}`.replace(/\/$/, '');
  if (!assetHost) return normalized;

  return `${assetHost}${normalized}`;
}

export function resolveAssetUrl(src) {
  return resolveDamAssetUrl(src, getDynamicMediaConfig());
}

export function isDynamicMediaImage(src = '') {
  if (!isRemoteImage(src)) return false;

  try {
    const url = new URL(src, window.location);
    const { pathname } = url;
    // Detect both traditional IS/Image format and new Adobe Assets format
    return pathname.includes(DYNAMIC_MEDIA_PATH_SEGMENT)
      || pathname.includes('/adobe/assets/');
  } catch (error) {
    return false;
  }
}

function getDamAssetPath(src, config) {
  let pathname = '';

  try {
    pathname = new URL(src, window.location).pathname;
  } catch (error) {
    pathname = src;
  }

  const damRoot = config.damRoot.replace(/\/$/, '');
  if (!pathname.startsWith(`${damRoot}/`)) return '';

  const assetPath = pathname.slice(damRoot.length + 1);
  return config.stripExtension ? assetPath.replace(DAM_EXTENSION_REGEXP, '') : assetPath;
}

function encodeAssetPath(assetPath) {
  return assetPath
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function resolveDynamicMediaBaseUrl(src, config) {
  if (isDynamicMediaImage(src)) return src;

  if (!config.imageServer || !config.company) return '';

  const assetPath = getDamAssetPath(src, config);
  if (!assetPath) return '';

  const imageServer = config.imageServer.replace(/\/$/, '');
  const company = encodeURIComponent(config.company);
  return `${imageServer}/${company}/${encodeAssetPath(assetPath)}`;
}

function setSmartCrop(url, cropName) {
  if (!cropName) return;

  const pathParts = url.pathname.split('/');
  const assetName = pathParts.pop();
  const baseAssetName = assetName.split(':')[0];
  pathParts.push(`${baseAssetName}:${encodeURIComponent(cropName)}`);
  url.pathname = pathParts.join('/');
}

function setImageServingParams(url, rendition) {
  if (rendition.width) url.searchParams.set('wid', rendition.width);
  if (rendition.height) url.searchParams.set('hei', rendition.height);
  if (rendition.width && rendition.height) url.searchParams.set('fit', rendition.fit || 'crop,0');

  Object.entries(rendition.modifiers || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
}

function buildDynamicMediaUrl(baseUrl, rendition = {}) {
  try {
    const url = new URL(baseUrl, window.location);

    // If this is an Adobe Assets Dynamic Media URL, handle it specially
    const { pathname } = url;
    if (pathname.includes('/adobe/assets/')) {
      // For Adobe Assets URLs, preserve existing smart crop if present
      // and allow rendition crop to override
      if (rendition.crop && rendition.crop !== '') {
        url.searchParams.set('smartcrop', rendition.crop);
      }
      // Set width/height as needed for the rendition
      if (rendition.width) url.searchParams.set('width', rendition.width);
      if (rendition.height) url.searchParams.set('height', rendition.height);
    } else {
      // Traditional IS/Image format
      setSmartCrop(url, rendition.crop);
      setImageServingParams(url, rendition);
    }

    // Apply any additional modifiers
    Object.entries(rendition.modifiers || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  } catch (error) {
    // If URL parsing fails, return as-is with basic parameters
    return baseUrl;
  }
}

function createDynamicMediaPictureFromValidUrl(dynamicMediaUrl, alt, options, preset) {
  const renditions = preset.renditions || [];
  if (!renditions.length) {
    return createImage(dynamicMediaUrl, alt, options.eager);
  }

  const picture = document.createElement('picture');
  const sourceRenditions = renditions.filter((rendition) => rendition.media);
  const defaultRendition = renditions.find((rendition) => !rendition.media)
    || renditions[renditions.length - 1];
  const fallbackUrl = buildDynamicMediaUrl(dynamicMediaUrl, {});

  sourceRenditions.forEach((rendition) => {
    const source = document.createElement('source');
    source.media = rendition.media;
    source.srcset = buildDynamicMediaUrl(dynamicMediaUrl, rendition);
    picture.append(source);
  });

  const image = createImage(
    buildDynamicMediaUrl(dynamicMediaUrl, defaultRendition),
    alt,
    options.eager,
  );
  attachImageFallback(image, dynamicMediaUrl);
  image.addEventListener('error', () => {
    if (image.dataset.imageFallbackApplied === 'true') return;
    if (image.dataset.dynamicMediaFallback === 'true') return;

    image.dataset.dynamicMediaFallback = 'true';
    picture.querySelectorAll('source').forEach((source) => source.remove());
    image.src = fallbackUrl;
  });

  picture.append(image);
  return picture;
}

function createDynamicMediaPicture(src, alt, options, preset, config) {
  // If src is already a valid Dynamic Media image, use it directly
  if (isDynamicMediaImage(src)) {
    return createDynamicMediaPictureFromValidUrl(src, alt, options, preset);
  }

  // Otherwise, try to build the Dynamic Media URL from the asset path
  const dynamicMediaUrl = resolveDynamicMediaBaseUrl(src, config);
  if (!dynamicMediaUrl) return null;

  return createDynamicMediaPictureFromValidUrl(dynamicMediaUrl, alt, options, preset);
}

export function createResponsiveImage(src, alt, eagerOrOptions, breakpoints) {
  const normalizedSrc = normalizeSource(src);
  const imageAlt = alt || '';
  const options = normalizeImageOptions(eagerOrOptions, breakpoints);
  const preset = getImagePreset(options.preset);
  const fallbackBreakpoints = options.breakpoints
    || preset.fallbackBreakpoints
    || DEFAULT_BREAKPOINTS;
  const dynamicMediaConfig = getDynamicMediaConfig(options);

  if (!normalizedSrc) {
    const placeholder = document.createElement('span');
    placeholder.className = 'media-image-unavailable';
    return placeholder;
  }

  if (dynamicMediaConfig.enabled) {
    const dynamicMediaPicture = createDynamicMediaPicture(
      normalizedSrc,
      imageAlt,
      options,
      preset,
      dynamicMediaConfig,
    );
    if (dynamicMediaPicture) {
      return dynamicMediaPicture;
    }
  }

  // For non-Dynamic Media images, resolve DAM asset URLs
  const resolvedSrc = resolveDamAssetUrl(normalizedSrc, dynamicMediaConfig);

  if (isRemoteImage(resolvedSrc) || isDamAssetPath(resolvedSrc)) {
    const image = createImage(resolvedSrc, imageAlt, options.eager);
    attachImageFallback(image, '');
    return image;
  }

  const optimizedPicture = createOptimizedPicture(
    resolvedSrc,
    imageAlt,
    options.eager,
    fallbackBreakpoints,
  );
  const optimizedImage = optimizedPicture.querySelector('img');

  if (optimizedImage) {
    optimizedImage.addEventListener('error', () => {
      if (optimizedImage.dataset.optimizedFallbackApplied === 'true') {
        notifyImageUnavailable(optimizedImage);
        return;
      }

      optimizedImage.dataset.optimizedFallbackApplied = 'true';
      optimizedPicture.querySelectorAll('source').forEach((source) => source.remove());
      optimizedImage.src = resolvedSrc;
    });
  }

  return optimizedPicture;
}
