import { getMetadata } from '../../scripts/aem.js';
import { resolveFinalAlt } from '../../scripts/iberostar/image-alt.js';
import { createResponsiveImage } from '../../scripts/iberostar/media.js';

function getSourceRows(block) {
  return Array.from(block.children).filter((child) => !child.classList.contains('article-main-image-content'));
}

function hideSourceRows(block) {
  getSourceRows(block).forEach((row) => {
    row.classList.add('article-main-image-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

function getFieldByProp(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;

  return getSourceRows(block)
    .map((row) => {
      if (row.matches?.(selector)) {
        return row;
      }

      return row.querySelector?.(selector) || null;
    })
    .find(Boolean) || null;
}

function getFieldText(block, propName) {
  const field = getFieldByProp(block, propName);
  return field?.textContent?.trim() || '';
}

function getFieldImage(block, propName) {
  const field = getFieldByProp(block, propName);
  if (!field) return '';

  return field.querySelector('img')?.src
    || field.querySelector('a[href]')?.getAttribute('href')?.trim()
    || field.textContent?.trim()
    || '';
}

function getMetaValue(name, fallback = '') {
  const value = getMetadata(name)?.trim();
  return value || fallback;
}

function createText(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

export default function decorate(block) {
  const existing = block.querySelector(':scope > .article-main-image-content');
  if (existing) {
    existing.remove();
  }

  const imageOverride = getFieldImage(block, 'image');
  const imageAltOverride = getFieldText(block, 'imageAlt');
  const imageAutoAltOverride = getFieldText(block, 'image_autoalt') || getFieldText(block, 'imageAutoAlt');
  const captionOverride = getFieldText(block, 'caption');

  const imageSrc = imageOverride || getMetaValue('article-image');
  const imageAlt = resolveFinalAlt(
    imageAltOverride || getMetaValue('article-image-alt'),
    imageAutoAltOverride
      || getMetaValue('article-image-auto-alt')
      || getMetaValue('dc:alt')
      || getMetaValue('dc:description')
      || getMetaValue('jcr:title'),
  );
  const imageCaption = captionOverride
    || getMetaValue('article-image-caption')
    || getMetaValue('dc:description');

  hideSourceRows(block);

  if (!imageSrc) {
    return;
  }

  const content = document.createElement('div');
  content.className = 'article-main-image-content';

  const media = document.createElement('div');
  media.className = 'article-main-image-media';
  media.append(createResponsiveImage(imageSrc, imageAlt, {
    eager: true,
    preset: 'article-card-featured',
  }));

  content.append(media);

  if (imageCaption) {
    content.append(createText('p', 'article-main-image-caption', imageCaption));
  }

  block.append(content);
}
