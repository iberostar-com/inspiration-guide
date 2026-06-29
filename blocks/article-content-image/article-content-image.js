import { createResponsiveImage } from '../../scripts/iberostar/media.js';

function getImageSrc(block) {
  const propEl = block.querySelector('[data-aue-prop="image"]');
  if (propEl) {
    return propEl.querySelector('img')?.src
      || propEl.querySelector('a[href]')?.getAttribute('href')?.trim()
      || propEl.textContent?.trim()
      || '';
  }
  return block.querySelector('img')?.src || '';
}

function getImageAlt(block) {
  const propEl = block.querySelector('[data-aue-prop="imageAlt"]');
  if (propEl) return propEl.textContent?.trim() || '';
  return block.querySelector('img')?.alt?.trim() || '';
}

function getCaption(block) {
  const propEl = block.querySelector('[data-aue-prop="caption"]');
  if (propEl) return propEl.textContent?.trim() || '';
  return '';
}

// --- Main decorator ---

export default function decorate(block) {
  const src = getImageSrc(block);
  if (!src) return;

  const alt = getImageAlt(block);
  const caption = getCaption(block);

  // Hide source content (preserves UE instrumentation)
  [...block.children].forEach((row) => {
    row.classList.add('article-content-image-source');
    row.setAttribute('aria-hidden', 'true');
  });

  const figure = document.createElement('figure');
  figure.className = 'article-content-image-figure';

  const picture = createResponsiveImage(src, alt, {
    eager: false,
    breakpoints: [
      { width: '768' },
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
