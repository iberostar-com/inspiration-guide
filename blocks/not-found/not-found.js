import { getLocaleFromPath, getPlaceholder } from '../../scripts/iberostar/placeholders.js';

const INSPIRATION_GUIDE_SEGMENT = 'inspiration-guide';

// Bug 171636 — la 404 del microsite replica la de iberostar.com sin fastbooking.
// El bloque no es autorable: el 404.html trae los textos por defecto en ingles y
// aqui se sustituyen por los placeholders del locale que aparece en la URL.

function getHomeHref() {
  return `/${getLocaleFromPath()}/${INSPIRATION_GUIDE_SEGMENT}`;
}

function getText(element) {
  return element?.textContent.trim() || '';
}

function setText(element, text) {
  if (element && text) element.textContent = text;
}

function setPageTitle(text) {
  if (!text) return;
  document.title = text;
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', text);
}

// Enlace con flecha del UIKit
// (ibh-button--link ibh-button--underline-on-hover ibh-button--with-icon)
function decorateCta(link, text) {
  const label = document.createElement('span');
  label.className = 'not-found-link-text';
  label.textContent = text;

  const icon = document.createElement('i');
  icon.className = 'ibh-icon-arrow-forward';
  icon.setAttribute('aria-hidden', 'true');

  link.className = 'not-found-link';
  link.href = getHomeHref();
  link.replaceChildren(label, icon);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const [content, media] = [...block.querySelectorAll(':scope > div > div')];
  if (!content) return;

  content.className = 'not-found-content';
  if (media) media.className = 'not-found-media';
  block.replaceChildren(...[content, media].filter(Boolean));

  const title = content.querySelector('h1');
  const link = content.querySelector('a');
  const cta = link?.closest('p');
  const subtitle = [...content.querySelectorAll('p')].find((p) => p !== cta);
  const image = media?.querySelector('img');

  if (cta) cta.className = 'not-found-cta';
  if (subtitle) subtitle.className = 'not-found-subtitle';

  const [pageTitle, titleText, subtitleText, ctaText, imageAlt] = await Promise.all([
    getPlaceholder('notFoundPageTitle', document.title),
    getPlaceholder('notFoundTitle', getText(title)),
    getPlaceholder('notFoundSubtitle', getText(subtitle)),
    getPlaceholder('notFoundCta', getText(link)),
    getPlaceholder('notFoundImageAlt', image?.alt || ''),
  ]);

  setPageTitle(pageTitle);
  setText(title, titleText);
  setText(subtitle, subtitleText);
  if (link) decorateCta(link, ctaText);
  if (image && imageAlt) image.alt = imageAlt;
}
