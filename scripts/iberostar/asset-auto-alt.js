import { resolveAssetMetadataAlt } from './image-alt.js';

const IMAGE_AUTO_ALT_PROPS = {
  'article-image': 'article-image-auto-alt',
  article_image: 'article_imageautoalt',
  image: 'image_autoalt',
  logo: 'logo_autoalt',
  logoDesktop: 'logo_autoalt',
  media_image: 'media_imageautoalt',
  poster: 'poster_autoalt',
};

function firstString(...values) {
  return values
    .flat()
    .map((value) => `${value || ''}`.trim())
    .find(Boolean) || '';
}

function getAssetId(value = '') {
  try {
    const { pathname } = new URL(`${value || ''}`, window.location.href);
    const parts = pathname.split('/').filter(Boolean);
    const assetsIndex = parts.indexOf('assets');
    return assetsIndex >= 0 ? decodeURIComponent(parts[assetsIndex + 1] || '') : '';
  } catch (error) {
    return '';
  }
}

function getAssetHref(payload = {}) {
  const candidates = [
    payload.href,
    payload.url,
    payload.src,
    payload.value,
    payload.asset?.href,
    payload.asset?.url,
    payload.asset?.src,
    payload.asset?.['repo:resolveUrl'],
    payload.selection?.[0]?.href,
    payload.selection?.[0]?.url,
    payload.selection?.[0]?.src,
    payload.selection?.[0]?.['repo:resolveUrl'],
    payload.assets?.[0]?.href,
    payload.assets?.[0]?.url,
    payload.assets?.[0]?.src,
    payload.assets?.[0]?.['repo:resolveUrl'],
    payload.request?.value,
  ];

  return candidates
    .map((candidate) => (typeof candidate === 'string' ? candidate.trim() : ''))
    .find(Boolean) || '';
}

function getAssetIdFromPayload(payload = {}) {
  return firstString(
    payload['repo:assetId'],
    payload.asset?.['repo:assetId'],
    payload.selection?.[0]?.['repo:assetId'],
    payload.assets?.[0]?.['repo:assetId'],
    getAssetId(getAssetHref(payload)),
  );
}

function getMetadataUrl(payload = {}) {
  const href = getAssetHref(payload);
  const assetId = getAssetIdFromPayload(payload);
  if (!href || !assetId) return '';

  try {
    const url = new URL(href, window.location.href);
    return `${url.origin}/adobe/assets/${encodeURIComponent(assetId)}/metadata`;
  } catch (error) {
    return '';
  }
}

export function getAutoAltProp(imageProp = '') {
  return IMAGE_AUTO_ALT_PROPS[imageProp] || '';
}

export function isImageProp(prop = '') {
  return Boolean(getAutoAltProp(prop));
}

export function getAssetAutoAltFromPayload(payload = {}) {
  return resolveAssetMetadataAlt(payload)
    || resolveAssetMetadataAlt(payload.asset)
    || resolveAssetMetadataAlt(payload.selection?.[0])
    || resolveAssetMetadataAlt(payload.assets?.[0])
    || resolveAssetMetadataAlt(payload.value)
    || resolveAssetMetadataAlt(payload.request?.value)
    || '';
}

export async function getAssetAutoAltFromMetadataApi(detail = {}) {
  const metadataUrl = getMetadataUrl(detail);
  if (!metadataUrl) return '';

  const response = await fetch(metadataUrl);
  if (!response.ok) return '';

  return resolveAssetMetadataAlt(await response.json());
}

export function getAssetAutoAltFromContent(content = '', target = {}) {
  if (!content || !target?.resource || !target?.prop) return '';

  const doc = new DOMParser().parseFromString(content, 'text/html');
  const resource = doc.querySelector(`[data-aue-resource="${target.resource}"]`);
  const prop = resource?.querySelector(`[data-aue-prop="${target.prop}"]`);
  return prop?.querySelector('img')?.alt?.trim()
    || (prop?.matches('img') ? prop.alt?.trim() : '')
    || '';
}
