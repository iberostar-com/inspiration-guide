import { createOptimizedPicture } from '../aem.js';
import getImagePreset from './image-presets.js';

const DELIVERY_HOST_REGEXP = /^delivery-p\d+-e\d+\.adobeaemcloud\.com$/i;
const DYNAMIC_MEDIA_PATHS = ['/adobe/assets/', '/is/image/', '/adobe/dynamicmedia/deliver/'];

function normalizeSource(url = '') {
  return `${url || ''}`.trim();
}

function getUrl(url) {
  try {
    return new URL(url, window.location.href);
  } catch (error) {
    return null;
  }
}

export function isDynamicMediaOpenApiUrl(url = '') {
  const source = getUrl(url);
  if (!source || !/^https?:$/i.test(source.protocol)) return false;

  return DELIVERY_HOST_REGEXP.test(source.hostname)
    && DYNAMIC_MEDIA_PATHS.some((path) => source.pathname.includes(path));
}

export function isExternalImageUrl(url = '') {
  const source = normalizeSource(url);
  return /^https?:\/\//i.test(source);
}

export function buildDynamicMediaImageUrl(url, options = {}) {
  const source = getUrl(url);
  if (!source || !isDynamicMediaOpenApiUrl(url)) return normalizeSource(url);

  const {
    width,
    height,
    quality = 80,
    format,
    crop,
  } = options;

  if (width) source.searchParams.set('width', `${width}`);
  if (height) source.searchParams.set('height', `${height}`);
  if (quality) source.searchParams.set('quality', `${quality}`);
  if (format) source.searchParams.set('format', format);
  if (crop) source.searchParams.set('smartcrop', crop);

  return source.toString();
}

function getImageOptions(options = {}) {
  const preset = getImagePreset(options.preset);
  return {
    eager: Boolean(options.eager),
    fetchpriority: options.fetchpriority || '',
    className: options.className || '',
    preset,
  };
}

export function createDynamicMediaPicture(options = {}) {
  const source = normalizeSource(options.url || options.src);
  if (!source) return document.createElement('span');

  const {
    eager,
    fetchpriority,
    className,
    preset,
  } = getImageOptions(options);
  const renditions = preset.renditions || [];
  const picture = document.createElement('picture');
  if (className) picture.className = className;

  renditions.filter((rendition) => rendition.media).forEach((rendition) => {
    const sourceElement = document.createElement('source');
    sourceElement.media = rendition.media;
    sourceElement.srcset = buildDynamicMediaImageUrl(source, {
      width: rendition.width,
      height: rendition.height,
      crop: rendition.crop,
      quality: options.quality,
      format: options.format,
    });
    picture.append(sourceElement);
  });

  const defaultRendition = renditions.find((rendition) => !rendition.media)
    || renditions[renditions.length - 1]
    || {};
  const image = document.createElement('img');
  image.src = buildDynamicMediaImageUrl(source, {
    width: defaultRendition.width,
    height: defaultRendition.height,
    crop: defaultRendition.crop,
    quality: options.quality,
    format: options.format,
  });
  image.alt = `${options.alt || ''}`.trim();
  image.loading = eager ? 'eager' : 'lazy';
  image.decoding = 'async';
  if (fetchpriority) image.setAttribute('fetchpriority', fetchpriority);
  picture.append(image);

  return picture;
}

export function createResponsiveImage(options = {}) {
  const source = normalizeSource(options.src || options.url);
  if (!source) return document.createElement('span');

  if (isDynamicMediaOpenApiUrl(source)) {
    return createDynamicMediaPicture({ ...options, url: source });
  }

  return createOptimizedPicture(
    source,
    `${options.alt || ''}`.trim(),
    Boolean(options.eager),
    options.breakpoints,
  );
}
