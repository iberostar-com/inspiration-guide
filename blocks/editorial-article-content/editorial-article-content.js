import { createResponsiveImage } from '../../scripts/iberostar/media.js';

function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('editorial-article-content-rendered'));
}

// --- Image item helpers ---

function isImageItem(row) {
  return row.getAttribute('data-aue-model') === 'editorial-content-image';
}

function getImageField(row) {
  const propEl = row.querySelector('[data-aue-prop="image"]');
  if (propEl) {
    return propEl.querySelector('img')?.src
      || propEl.querySelector('a[href]')?.getAttribute('href')?.trim()
      || propEl.textContent?.trim()
      || '';
  }
  // Positional fallback: first img in the row
  return row.querySelector('img')?.src || '';
}

function getImageAlt(row) {
  const propEl = row.querySelector('[data-aue-prop="imageAlt"]');
  if (propEl) return propEl.textContent?.trim() || '';
  return row.querySelector('img')?.alt?.trim() || '';
}

function getCaption(row) {
  const propEl = row.querySelector('[data-aue-prop="caption"]');
  if (propEl) return propEl.textContent?.trim() || '';
  // Positional fallback: second cell text
  const cells = [...row.children];
  const secondCell = cells[1] || cells[0]?.children[1];
  const text = secondCell?.textContent?.trim();
  return (text && !secondCell?.querySelector('img')) ? text : '';
}

function renderImageItem(row) {
  const src = getImageField(row);
  if (!src) return null;

  const alt = getImageAlt(row);
  const caption = getCaption(row);

  const figure = document.createElement('figure');
  figure.className = 'editorial-article-content-image';

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
    figcaption.className = 'editorial-article-content-caption';
    figcaption.textContent = caption;
    figure.append(figcaption);
  }

  return figure;
}

// --- Text item helpers ---

function getRichTextElement(row) {
  if (row.matches?.('[data-aue-prop="text"]')) return row;
  return row.querySelector?.('[data-aue-prop="text"]') || null;
}

function cloneChildren(source, target) {
  [...source.childNodes].forEach((child) => target.append(child.cloneNode(true)));
}

function appendCellContent(row, target) {
  [...row.children].forEach((cell) => {
    if (cell.children.length) {
      cloneChildren(cell, target);
      return;
    }

    const text = cell.textContent?.trim();
    if (text) {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      target.append(paragraph);
    }
  });
}

function renderTextRow(row, target) {
  const richText = getRichTextElement(row);
  if (richText) {
    cloneChildren(richText, target);
  } else {
    appendCellContent(row, target);
  }
}

// --- Source hiding ---

function hideSource(block) {
  getSourceRows(block).forEach((row) => {
    row.classList.add('editorial-article-content-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

// --- Main decorator ---

export default function decorate(block) {
  block.querySelector(':scope > .editorial-article-content-rendered')?.remove();

  const rows = getSourceRows(block);
  const article = document.createElement('article');
  article.className = 'editorial-article-content-rendered';

  rows.forEach((row) => {
    if (isImageItem(row)) {
      const figure = renderImageItem(row);
      if (figure) article.append(figure);
      return;
    }
    renderTextRow(row, article);
  });

  if (!article.children.length) return;

  hideSource(block);
  block.append(article);
}
