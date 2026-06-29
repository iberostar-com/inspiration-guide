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

function getRowByIndex(block, index) {
  return getSourceRows(block)[index] || null;
}

function getImageSrc(block) {
  const propEl = getPropEl(block, 'image');
  if (propEl) {
    return propEl.querySelector('img')?.src
      || propEl.querySelector('a[href]')?.getAttribute('href')?.trim()
      || propEl.textContent?.trim()
      || '';
  }
  const row = getRowByIndex(block, 0);
  return row?.querySelector('img')?.src
    || row?.querySelector('a[href]')?.getAttribute('href')?.trim()
    || block.querySelector('img')?.src
    || '';
}

function getImageAlt(block) {
  const propEl = getPropEl(block, 'imageAlt');
  const authored = propEl?.textContent?.trim()
    || getRowByIndex(block, 1)?.textContent?.trim()
    || block.querySelector('img')?.alt?.trim()
    || '';
  return authored || getMetaContent('alt_es');
}

function getCaption(block) {
  const propEl = getPropEl(block, 'caption');
  const authored = propEl?.textContent?.trim()
    || getRowByIndex(block, 2)?.textContent?.trim()
    || '';
  return authored || getMetaContent('dc:description');
}

function getAlignment(block) {
  const propEl = getPropEl(block, 'alignment');
  const val = propEl?.textContent?.trim()
    || getRowByIndex(block, 3)?.textContent?.trim()
    || [...block.classList]
      .map((cls) => cls.match(/^(left|center|right)$/)?.[1])
      .find(Boolean)
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

  // Apply alignment variant class to the block
  block.classList.add(`article-content-image-${alignment}`);

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
