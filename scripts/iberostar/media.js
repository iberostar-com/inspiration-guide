import { createOptimizedPicture } from '../aem.js';
import DYNAMIC_MEDIA_CONFIG from './dynamic-media-config.js';
import getEnvironmentConfig from './environment-config.js';
import getImagePreset from './image-presets.js';

const DEFAULT_BREAKPOINTS = [{ width: '750' }];
const DAM_EXTENSION_REGEXP = /\.[a-z0-9]+$/i;
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

function attachImageFallback(image, fallbackSrc) {
  if (!fallbackSrc) return;

  image.addEventListener('error', () => {
    if (image.dataset.imageFallbackApplied === 'true') return;

    image.dataset.imageFallbackApplied = 'true';
    image.src = fallbackSrc;
  });
}

function getDynamicMediaConfig() {
  const environmentConfig = getEnvironmentConfig();
  const environmentDynamicMedia = environmentConfig.dynamicMedia || {};

  return {
    enabled: normalizeBoolean(
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
  };
}

export function isDynamicMediaImage(src = '') {
  if (!isRemoteImage(src)) return false;

  try {
    return new URL(src, window.location).pathname.includes(DYNAMIC_MEDIA_PATH_SEGMENT);
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
  const url = new URL(baseUrl, window.location);
  setSmartCrop(url, rendition.crop);
  setImageServingParams(url, rendition);
  return url.toString();
}

function createDynamicMediaPicture(src, alt, options, preset, config) {
  const dynamicMediaUrl = resolveDynamicMediaBaseUrl(src, config);
  if (!dynamicMediaUrl) return null;

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
  attachImageFallback(image, src);
  image.addEventListener('error', () => {
    if (image.dataset.dynamicMediaFallback === 'true') return;

    image.dataset.dynamicMediaFallback = 'true';
    picture.querySelectorAll('source').forEach((source) => source.remove());
    image.src = fallbackUrl;
  });

  picture.append(image);
  return picture;
}

export function createResponsiveImage(src, alt, eagerOrOptions, breakpoints) {
  const imageAlt = alt || '';
  const options = normalizeImageOptions(eagerOrOptions, breakpoints);
  const preset = getImagePreset(options.preset);
  const fallbackBreakpoints = options.breakpoints
    || preset.fallbackBreakpoints
    || DEFAULT_BREAKPOINTS;
  const dynamicMediaConfig = getDynamicMediaConfig();

  if (dynamicMediaConfig.enabled) {
    const dynamicMediaPicture = createDynamicMediaPicture(
      src,
      imageAlt,
      options,
      preset,
      dynamicMediaConfig,
    );
    if (dynamicMediaPicture) {
      return dynamicMediaPicture;
    }
  }

  if (isRemoteImage(src)) {
    return createImage(src, imageAlt, options.eager);
  }

  const optimizedPicture = createOptimizedPicture(
    src,
    imageAlt,
    options.eager,
    fallbackBreakpoints,
  );
  const optimizedImage = optimizedPicture.querySelector('img');

  if (optimizedImage) {
    optimizedImage.addEventListener('error', () => {
      if (optimizedImage.dataset.optimizedFallbackApplied === 'true') return;

      optimizedImage.dataset.optimizedFallbackApplied = 'true';
      optimizedPicture.querySelectorAll('source').forEach((source) => source.remove());
      optimizedImage.src = src;
    });
  }

  return optimizedPicture;
}
