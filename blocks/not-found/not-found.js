import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { toPageHref } from '../../scripts/iberostar/page-links.js';
import { getLocaleFromPath, getPlaceholder } from '../../scripts/iberostar/placeholders.js';

// Bug 171636 — la 404 del microsite replica la de iberostar.com sin fastbooking.
//
// El bloque es autorable en Universal Editor (ver _not-found.json) y 404.html lo usa como
// pagina de error generica: con window.isErrorPage activo busca la pagina 404 contribuida en
// AEM (/{locale}/inspiration-guide/404) y pinta sus textos e imagen. Si no existe, usa los
// placeholders del locale y los valores por defecto que trae 404.html.

const INSPIRATION_GUIDE_SEGMENT = 'inspiration-guide';
const NOT_FOUND_PAGE_NAME = '404';
const DEFAULT_LOCALE = 'en-us';
const TEXT_FIELDS = ['title', 'subtitle'];
const RENDERED_SELECTOR = ':scope > .not-found-content, :scope > .not-found-media';
const IMAGE_PRESET = 'not-found-media';

function getText(element) {
  return element?.textContent?.trim() || '';
}

function isUrlLike(text) {
  return /^(\/|https?:\/\/|#)/i.test(text);
}

function getHomeHref() {
  return `/${getLocaleFromPath()}/${INSPIRATION_GUIDE_SEGMENT}`;
}

function getNotFoundPagePath(locale) {
  return `/${locale}/${INSPIRATION_GUIDE_SEGMENT}/${NOT_FOUND_PAGE_NAME}`;
}

function setPageTitle(text) {
  if (!text) return;
  document.title = text;
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', text);
}

function getSourceRows(block) {
  return [...block.children].filter((row) => !row.matches('.not-found-content, .not-found-media'));
}

function getCell(row) {
  return row.querySelector(':scope > div') || row;
}

function getPropName(cell) {
  const prop = cell.matches('[data-aue-prop]') ? cell : cell.querySelector('[data-aue-prop]');
  return prop?.getAttribute('data-aue-prop') || '';
}

// Celda de cada campo. En el editor se identifican por data-aue-prop; en la entrega publicada
// por su contenido, porque las filas de los campos vacios no se renderizan y la posicion no
// es fiable.
function readFields(rows) {
  const fields = {};
  const texts = [];

  rows.map(getCell).forEach((cell) => {
    const prop = getPropName(cell);
    if (prop) {
      fields[prop] = cell;
    } else if (cell.querySelector('img')) {
      fields.image = fields.image || cell;
    } else if (cell.querySelector('a[href]') || isUrlLike(getText(cell))) {
      fields.cta = fields.cta || cell;
    } else if (getText(cell)) {
      texts.push(cell);
    }
  });

  const missingTextFields = TEXT_FIELDS.filter((name) => !fields[name]);
  texts.forEach((cell, index) => {
    if (missingTextFields[index]) fields[missingTextFields[index]] = cell;
  });

  return fields;
}

function readCta(cell) {
  const link = cell?.querySelector('a[href]');
  const href = link?.getAttribute('href')?.trim() || getText(cell);
  const text = getText(link);

  return {
    href: href && href !== '#' ? toPageHref(href) : '',
    // sin texto contribuido la entrega pinta la propia URL como texto del enlace
    text: text && text !== href && !isUrlLike(text) ? text : '',
  };
}

function hideSourceRows(block) {
  getSourceRows(block).forEach((row) => {
    row.classList.add('not-found-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

async function fetchNotFoundPage(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;

    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    const block = doc.querySelector('main .not-found');
    if (!block) return null;

    return {
      block,
      title: doc.title?.trim() || '',
      href: new URL(path, window.location.href).href,
    };
  } catch (error) {
    return null;
  }
}

// Pagina 404 contribuida del locale de la URL o, si no existe, la del locale por defecto
async function loadAuthoredPage() {
  const locales = [...new Set([getLocaleFromPath(), DEFAULT_LOCALE])];
  return locales.reduce(
    async (previous, locale) => (await previous) || fetchNotFoundPage(getNotFoundPagePath(locale)),
    Promise.resolve(null),
  );
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

// Enlace con flecha del UIKit
// (ibh-button--link ibh-button--underline-on-hover ibh-button--with-icon)
function createCta(href, text) {
  const link = document.createElement('a');
  link.className = 'not-found-link';
  link.href = href;

  const icon = document.createElement('i');
  icon.className = 'ibh-icon-arrow-forward';
  icon.setAttribute('aria-hidden', 'true');

  link.append(createTextElement('span', 'not-found-link-text', text), icon);

  const wrapper = document.createElement('p');
  wrapper.className = 'not-found-cta';
  wrapper.append(link);
  return wrapper;
}

function renderContent({ title, subtitle, cta }) {
  const content = document.createElement('div');
  content.className = 'not-found-content';

  if (title) content.append(createTextElement('h1', 'not-found-title', title));
  if (subtitle) content.append(createTextElement('p', 'not-found-subtitle', subtitle));
  if (cta.text) content.append(createCta(cta.href, cta.text));

  return content;
}

function createPicture(img, alt, baseHref) {
  const src = new URL(img.getAttribute('src') || '', baseHref);
  const original = img.closest('picture') || img;

  const media = createResponsiveImage(
    src.toString(),
    alt,
    {
      eager: true,
      preset: IMAGE_PRESET,
      damPath: img.dataset.damPath || img.getAttribute('data-dam-path') || '',
    },
  );
  const optimizedImg = media.tagName === 'IMG' ? media : media.querySelector('img');

  if (optimizedImg) {
    optimizedImg.setAttribute('loading', 'eager');
    optimizedImg.setAttribute('fetchpriority', 'high');
    ['width', 'height'].forEach((attr) => {
      const value = img.getAttribute(attr);
      if (value) optimizedImg.setAttribute(attr, value);
    });
    moveInstrumentation(img, optimizedImg);
  }

  original.remove();
  return media;
}

function renderMedia(img, alt, baseHref) {
  const media = document.createElement('div');
  media.className = 'not-found-media';
  media.append(createPicture(img, alt, baseHref));
  return media;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  block.querySelectorAll(RENDERED_SELECTOR).forEach((element) => element.remove());

  const isErrorPage = window.isErrorPage === true;
  const authored = isErrorPage ? await loadAuthoredPage() : null;
  const hasAuthoredContent = Boolean(authored) || !isErrorPage;

  // Prioridad: pagina contribuida > placeholders del locale > valores por defecto de 404.html
  const authoredRows = authored ? getSourceRows(authored.block) : [];
  const authoredFields = readFields(isErrorPage ? authoredRows : getSourceRows(block));
  const defaultFields = isErrorPage ? readFields(getSourceRows(block)) : {};

  const cta = readCta(authoredFields.cta);
  const defaultCta = readCta(defaultFields.cta);
  const authoredImage = authoredFields.image?.querySelector('img');
  const defaultImage = defaultFields.image?.querySelector('img');
  const image = authoredImage || defaultImage;
  if (authoredImage && defaultImage) (defaultImage.closest('picture') || defaultImage).remove();

  const [pageTitle, title, subtitle, ctaText, defaultImageAlt] = await Promise.all([
    authored?.title || getPlaceholder('notFoundPageTitle', document.title),
    getText(authoredFields.title) || getPlaceholder('notFoundTitle', getText(defaultFields.title)),
    hasAuthoredContent
      ? getText(authoredFields.subtitle)
      : getPlaceholder('notFoundSubtitle', getText(defaultFields.subtitle)),
    cta.text || getPlaceholder('notFoundCta', defaultCta.text),
    getPlaceholder('notFoundImageAlt', defaultImage?.alt || ''),
  ]);

  hideSourceRows(block);

  const content = renderContent({
    title,
    subtitle,
    cta: { href: cta.href || getHomeHref(), text: ctaText },
  });
  const media = image
    ? renderMedia(
      image,
      authoredImage ? authoredImage.alt : defaultImageAlt,
      authoredImage ? authored?.href || window.location.href : window.location.href,
    )
    : null;

  block.append(...[content, media].filter(Boolean));

  if (isErrorPage) setPageTitle(pageTitle);
}
