import { createOptimizedPicture } from '../aem.js';
import DYNAMIC_MEDIA_CONFIG from './dynamic-media-config.js';
import getEnvironmentConfig from './environment-config.js';
import getImagePreset from './image-presets.js';

const DEFAULT_BREAKPOINTS = [{ width: '750' }];
const DAM_EXTENSION_REGEXP = /\.[a-z0-9]+$/i;
const DAM_PATH_PREFIX = '/content/dam/';
const DYNAMIC_MEDIA_PATH_SEGMENT = '/is/image/';
const DYNAMIC_MEDIA_DELIVERY_PATH = '/adobe/dynamicmedia/deliver/';
const ADOBE_ASSETS_PATH = '/adobe/assets/';
const MEDIA_RESOLUTION_CACHE = new Map();

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
      ...eagerOrOptions,
    };
  }

  return {
    eager: Boolean(eagerOrOptions),
    breakpoints,
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
  const value = `${typeof src === 'object' ? src.src : src || ''}`.trim();
  if (!value || value.toLowerCase() === 'undefined') return '';
  return value;
}

function getSourceDamPath(src, options = {}) {
  const sourcePath = typeof src === 'object' ? src.damPath : '';
  return normalizeSource(options.damPath || sourcePath);
}

function isCrossOriginImage(src = '') {
  if (!isRemoteImage(src)) return false;

  try {
    return new URL(src, window.location).origin !== window.location.origin;
  } catch (error) {
    return true;
  }
}

function isVectorImage(src = '') {
  const normalized = `${src || ''}`.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.startsWith('data:image/svg')) return true;

  try {
    return new URL(normalized, window.location).pathname.endsWith('.svg');
  } catch (error) {
    return normalized.split('?')[0].endsWith('.svg');
  }
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
    resolverEndpoint: getMetaContent('dynamic-media-resolver-endpoint')
      || window.hlx?.dynamicMediaResolverEndpoint
      || environmentDynamicMedia.resolverEndpoint
      || '',
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

function isDynamicMediaSource(src = '') {
  if (!isRemoteImage(src)) return false;

  try {
    const url = new URL(src, window.location);
    const { pathname } = url;
    return pathname.includes(DYNAMIC_MEDIA_PATH_SEGMENT)
      || pathname.includes(ADOBE_ASSETS_PATH)
      || pathname.includes(DYNAMIC_MEDIA_DELIVERY_PATH);
  } catch (error) {
    return false;
  }
}

function getMediaResolverUrl(src, config, damPath = '') {
  const resolverSource = damPath || src;
  if (!config.resolverEndpoint) return '';

  try {
    const url = new URL(config.resolverEndpoint, window.location);
    if (isDamAssetPath(resolverSource)) {
      const sourceUrl = new URL(resolverSource, window.location);
      url.searchParams.set('path', sourceUrl.pathname);
    } else if (isDynamicMediaSource(resolverSource)) {
      url.searchParams.set('url', resolverSource);
    } else {
      return '';
    }
    return url.toString();
  } catch (error) {
    return '';
  }
}

function getResolvedMediaMetadata(src, config, damPath = '') {
  const requestUrl = getMediaResolverUrl(src, config, damPath);
  if (!requestUrl) return Promise.resolve({});

  if (MEDIA_RESOLUTION_CACHE.has(requestUrl)) {
    return MEDIA_RESOLUTION_CACHE.get(requestUrl);
  }

  const request = fetch(requestUrl, {
    headers: { Accept: 'application/json' },
    credentials: 'omit',
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => payload || {})
    .catch(() => ({}));

  MEDIA_RESOLUTION_CACHE.set(requestUrl, request);
  return request;
}

export function resolveImageAlt(explicitAlt = '', metadata = {}) {
  const providedAlt = `${explicitAlt || ''}`.trim();
  if (providedAlt) return providedAlt;

  const alt = `${metadata?.alt || ''}`.trim();
  if (alt) return alt;

  const title = `${metadata?.title || ''}`.trim();
  if (title) return title;

  const description = `${metadata?.description || ''}`.trim();
  if (description) return description;

  return '';
}

function resolveImageAltFromMetadata(metadata = {}) {
  return resolveImageAlt('', metadata);
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
  return isDynamicMediaSource(src);
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

    const { pathname } = url;
    const isAdobeDeliveryUrl = pathname.includes(ADOBE_ASSETS_PATH)
      || pathname.includes(DYNAMIC_MEDIA_DELIVERY_PATH);

    if (isAdobeDeliveryUrl) {
      // Adobe Assets Delivery uses query parameters for image transformations.
      if (rendition.crop && rendition.crop !== '') {
        url.searchParams.set('smartcrop', rendition.crop);
      }
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

function replacePictureContent(picture, dynamicMediaPicture) {
  picture.replaceChildren(...dynamicMediaPicture.childNodes);
  picture.dataset.dynamicMediaResolved = 'true';
}

function resolvePictureFromDamPath(picture, src, alt, options, preset, config, damPath = '') {
  getResolvedMediaMetadata(src, config, damPath).then((metadata) => {
    const resolvedUrl = metadata?.delivery?.url || metadata?.url || '';
    if (!picture.isConnected || picture.dataset.dynamicMediaResolved === 'true') return;

    const fallbackAlt = resolveImageAltFromMetadata(metadata);
    const resolvedAlt = alt && alt.trim() ? alt : fallbackAlt;
    const fallbackImage = picture.querySelector('img');
    if (fallbackImage && resolvedAlt) fallbackImage.alt = resolvedAlt;
    if (metadata?.status !== 'resolved' || !resolvedUrl || !isDynamicMediaImage(resolvedUrl)) return;

    const dynamicMediaPicture = createDynamicMediaPictureFromValidUrl(
      resolvedUrl,
      resolvedAlt,
      options,
      preset,
    );
    if (dynamicMediaPicture?.tagName === 'PICTURE') {
      replacePictureContent(picture, dynamicMediaPicture);
    }
  });
}

function resolvePictureFromDynamicMediaUrl(picture, src, alt, options, preset, config) {
  getResolvedMediaMetadata(src, config).then((metadata) => {
    if (!picture.isConnected || picture.dataset.dynamicMediaResolved === 'true') return;

    const resolvedUrl = metadata?.delivery?.url || metadata?.url || '';
    const resolvedAlt = resolveImageAlt(alt, metadata);
    const currentImage = picture.querySelector('img');
    if (currentImage && resolvedAlt) currentImage.alt = resolvedAlt;
    if (metadata?.status !== 'resolved' || !resolvedUrl || !isDynamicMediaImage(resolvedUrl)) return;

    const dynamicMediaPicture = createDynamicMediaPictureFromValidUrl(
      resolvedUrl,
      resolvedAlt,
      options,
      preset,
    );
    if (dynamicMediaPicture?.tagName === 'PICTURE') {
      replacePictureContent(picture, dynamicMediaPicture);
    }
  });
}

export function createResponsiveImage(src, alt, eagerOrOptions, breakpoints) {
  const normalizedSrc = normalizeSource(src);
  const options = normalizeImageOptions(eagerOrOptions, breakpoints);
  const damPath = getSourceDamPath(src, options);
  const hasDamPath = isDamAssetPath(damPath);
  const imageAlt = resolveImageAlt(alt);
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

  if (isVectorImage(normalizedSrc)) {
    return createImage(normalizedSrc, imageAlt, options.eager);
  }

  if (isDynamicMediaImage(normalizedSrc) && !hasDamPath) {
    const dynamicMediaPicture = createDynamicMediaPicture(
      normalizedSrc,
      imageAlt,
      options,
      preset,
      dynamicMediaConfig,
    );
    if (dynamicMediaPicture?.tagName === 'PICTURE') {
      resolvePictureFromDynamicMediaUrl(
        dynamicMediaPicture,
        normalizedSrc,
        imageAlt,
        options,
        preset,
        dynamicMediaConfig,
      );
    }
    return dynamicMediaPicture;
  }

  // For non-Dynamic Media images, resolve DAM asset URLs
  const sourcePath = hasDamPath ? damPath : normalizedSrc;
  const resolvedSrc = resolveDamAssetUrl(sourcePath, dynamicMediaConfig);

  if (hasDamPath || isDamAssetPath(normalizedSrc)) {
    const fallbackPicture = createOptimizedPicture(
      resolvedSrc,
      imageAlt,
      options.eager,
      fallbackBreakpoints,
    );
    resolvePictureFromDamPath(
      fallbackPicture,
      normalizedSrc,
      imageAlt,
      options,
      preset,
      dynamicMediaConfig,
      hasDamPath ? damPath : '',
    );
    return fallbackPicture;
  }

  if (isCrossOriginImage(resolvedSrc)) {
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

function getPictureElement(element) {
  if (element?.tagName === 'PICTURE') return element;
  return element?.querySelector?.('picture') || null;
}

export function applyImagePreset(element, options = {}) {
  const picture = getPictureElement(element);
  const image = picture?.querySelector('img');
  if (!picture || !image) return element;

  const src = image.getAttribute('src') || '';
  if (!src || isVectorImage(src)) return picture;

  const alt = image.getAttribute('alt') || '';
  const rebuilt = createResponsiveImage(src, alt, options);
  if (rebuilt?.tagName !== 'PICTURE') return picture;

  [...picture.attributes].forEach((attribute) => {
    rebuilt.setAttribute(attribute.name, attribute.value);
  });
  picture.replaceWith(rebuilt);

  return rebuilt;
}
