import { createOptimizedPicture } from '../aem.js';
import getImagePreset from './image-presets.js';

const DELIVERY_HOST_REGEXP = /^delivery-p\d+-e\d+\.adobeaemcloud\.com$/i;
const OPENAPI_PATHS = ['/adobe/assets/', '/adobe/dynamicmedia/deliver/'];
const CLASSIC_PATH_SEGMENT = '/is/image/';

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
    && OPENAPI_PATHS.some((path) => source.pathname.includes(path));
}

// Classic Scene7/Dynamic Media "IS/Image" format, e.g. GraphQL `_dmS7Url` values.
// Not tied to the delivery-p*-e* host since Scene7 image servers vary per company.
export function isDynamicMediaClassicUrl(url = '') {
  const source = getUrl(url);
  if (!source || !/^https?:$/i.test(source.protocol)) return false;

  return source.pathname.includes(CLASSIC_PATH_SEGMENT);
}

export function isExternalImageUrl(url = '') {
  const source = normalizeSource(url);
  return /^https?:\/\//i.test(source);
}

function buildClassicImageUrl(source, options = {}) {
  const {
    width, height, quality = 80, format,
  } = options;

  if (width) source.searchParams.set('wid', `${width}`);
  if (height) source.searchParams.set('hei', `${height}`);
  if (width && height) source.searchParams.set('fit', 'crop,0');
  if (quality) source.searchParams.set('qlt', `${quality}`);
  if (format) source.searchParams.set('fmt', format);

  return source.toString();
}

function buildOpenApiImageUrl(source, options = {}) {
  const {
    width, height, quality = 80, format, crop,
  } = options;

  if (width) source.searchParams.set('width', `${width}`);
  if (height) source.searchParams.set('height', `${height}`);
  if (quality) source.searchParams.set('quality', `${quality}`);
  if (format) source.searchParams.set('format', format);
  if (crop) source.searchParams.set('smartcrop', crop);

  return source.toString();
}

export function buildDynamicMediaImageUrl(url, options = {}) {
  const source = getUrl(url);
  if (!source) return normalizeSource(url);

  if (isDynamicMediaOpenApiUrl(url)) return buildOpenApiImageUrl(source, options);
  if (isDynamicMediaClassicUrl(url)) return buildClassicImageUrl(source, options);

  return normalizeSource(url);
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

  if (isDynamicMediaOpenApiUrl(source) || isDynamicMediaClassicUrl(source)) {
    return createDynamicMediaPicture({ ...options, url: source });
  }

  if (isExternalImageUrl(source)) {
    const image = document.createElement('img');
    image.src = source;
    image.alt = `${options.alt || ''}`.trim();
    image.loading = options.eager ? 'eager' : 'lazy';
    image.decoding = 'async';
    return image;
  }

  return createOptimizedPicture(
    source,
    `${options.alt || ''}`.trim(),
    Boolean(options.eager),
    options.breakpoints,
  );
}
