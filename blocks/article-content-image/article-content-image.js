import { createResponsiveImage } from '../../scripts/iberostar/media.js';

const ALIGNMENTS = ['left', 'center', 'right'];

function getMetaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function getSourceRows(block) {
  return [...block.children].filter(
    (child) => !child.classList.contains('article-content-image-figure'),
  );
}

function getPropEl(block, propName) {
  return block.querySelector(`[data-aue-prop="${propName}"]`) || null;
}

// In publish mode AEM bakes the imageAlt field value directly into <img alt="">.
// Caption and alignment appear as plain text rows (indices 1 and 2).
// We detect them by content: if a text row matches an alignment keyword → alignment,
// otherwise → caption. This avoids fragile positional-index assumptions.

function getTextRows(block) {
  return getSourceRows(block).filter((row) => !row.querySelector('picture, img'));
}

function getImageSrc(block) {
  const propEl = getPropEl(block, 'image');
  if (propEl) {
    return propEl.querySelector('img')?.src
      || propEl.querySelector('a[href]')?.getAttribute('href')?.trim()
      || propEl.textContent?.trim()
      || '';
  }
  return block.querySelector('picture img, img')?.src || '';
}

function getImageAlt(block) {
  // In UE mode: authored via data-aue-prop
  const propEl = getPropEl(block, 'imageAlt');
  if (propEl) return propEl.textContent?.trim() || '';
  // In publish mode: AEM bakes the alt into the <img> element directly
  return block.querySelector('img')?.alt?.trim() || getMetaContent('alt_es');
}

function getCaption(block) {
  // UE mode
  const propEl = getPropEl(block, 'caption');
  if (propEl) return propEl.textContent?.trim() || '';
  // Publish mode: find a text row whose content is NOT an alignment keyword
  const captionRow = getTextRows(block).find(
    (row) => !ALIGNMENTS.includes(row.textContent?.trim()),
  );
  return captionRow?.textContent?.trim() || getMetaContent('dc:description');
}

function getAlignment(block) {
  // UE mode
  const propEl = getPropEl(block, 'alignment');
  if (propEl) {
    const val = propEl.textContent?.trim();
    return ALIGNMENTS.includes(val) ? val : 'center';
  }
  // Publish mode: find a text row whose content IS an alignment keyword
  const alignRow = getTextRows(block).find(
    (row) => ALIGNMENTS.includes(row.textContent?.trim()),
  );
  const val = alignRow?.textContent?.trim()
    || [...block.classList].map((cls) => cls.match(/^(left|center|right)$/)?.[1]).find(Boolean)
    || 'center';
  return ALIGNMENTS.includes(val) ? val : 'center';
}

// --- Main decorator ---

export default function decorate(block) {
  const src = getImageSrc(block);
  if (!src) return;

  const alt = getImageAlt(block);
  const caption = getCaption(block);
  const alignment = getAlignment(block);

  // Hide source rows (preserves UE instrumentation)
  getSourceRows(block).forEach((row) => {
    row.classList.add('article-content-image-source');
    row.setAttribute('aria-hidden', 'true');
  });

  // Remove any previous alignment class before applying the new one (handles UE re-renders)
  ALIGNMENTS.forEach((a) => block.classList.remove(`article-content-image-${a}`));
  block.classList.add(`article-content-image-${alignment}`);

  // Remove previously rendered figure if decorator re-runs in UE
  block.querySelector('.article-content-image-figure')?.remove();

  const figure = document.createElement('figure');
  figure.className = 'article-content-image-figure';

  const picture = createResponsiveImage(src, alt, {
    eager: false,
    breakpoints: [
      { width: '750' },
      { media: '(min-width: 600px)', width: '900' },
      { media: '(min-width: 900px)', width: '1200' },
    ],
  });
  figure.append(picture);

  if (caption) {
    const figcaption = document.createElement('figcaption');
    figcaption.className = 'article-content-image-caption';
    figcaption.textContent = caption;
    figure.append(figcaption);
  }

  block.append(figure);
}
