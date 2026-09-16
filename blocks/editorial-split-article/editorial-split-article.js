import { applyImagePreset } from '../../scripts/iberostar/media.js';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3']);

function getSourceRows(block) {
  return [...block.children]
    .filter((row) => !row.classList.contains('editorial-split-article-rendered'));
}

function propElement(block, prop) {
  return block.querySelector(`[data-aue-prop="${prop}"]`) || null;
}

function propText(block, prop) {
  return propElement(block, prop)?.textContent?.trim() || '';
}

function sanitizeHeading(value, fallback) {
  const tag = `${value || fallback}`.trim().toLowerCase();
  return HEADING_TAGS.has(tag) ? tag : fallback;
}

function cloneChildren(source, target) {
  [...source.childNodes].forEach((node) => target.append(node.cloneNode(true)));
}

function isRichRow(row) {
  const cell = row.querySelector(':scope > div') || row;
  if (cell.querySelector('picture, img, ul, ol, h2, h3, h4, blockquote')) return true;
  return cell.children.length > 1;
}

function decorateFigures(body) {
  body.querySelectorAll('img').forEach((img) => {
    if (img.closest('figure')) return;

    const picture = img.closest('picture') || img;
    const paragraph = picture.closest('p');
    const target = paragraph && paragraph.textContent.trim() === '' ? paragraph : picture;
    const caption = img.getAttribute('alt')?.trim() || '';

    const figure = document.createElement('figure');
    figure.className = 'editorial-split-article-figure';

    const imageBox = document.createElement('div');
    imageBox.className = 'editorial-split-article-image';

    target.replaceWith(figure);
    imageBox.append(picture);
    figure.append(imageBox);

    if (caption) {
      const figcaption = document.createElement('figcaption');
      figcaption.className = 'editorial-split-article-caption';
      figcaption.textContent = caption;
      figure.append(figcaption);
    }
  });
}

export default function decorate(block) {
  const rows = getSourceRows(block);

  const headingLevel = rows
    .map((row) => row.textContent?.trim().toLowerCase())
    .find((text) => HEADING_TAGS.has(text));
  const titleHeading = sanitizeHeading(propText(block, 'titleHeading') || headingLevel, 'h2');

  const bodyProp = propElement(block, 'text');
  const bodyRow = rows.find(isRichRow);
  const bodySource = bodyProp || (bodyRow ? bodyRow.querySelector(':scope > div') || bodyRow : null);

  const plainRows = rows.filter((row) => {
    if (isRichRow(row)) return false;
    const text = row.textContent?.trim();
    return text && !HEADING_TAGS.has(text.toLowerCase());
  });
  const eyebrow = propText(block, 'eyebrow') || plainRows[0]?.textContent?.trim() || '';
  const title = propText(block, 'title') || plainRows[1]?.textContent?.trim() || '';

  if (!eyebrow && !title && !bodySource) return;

  rows.forEach((row) => {
    row.classList.add('editorial-split-article-source');
    row.setAttribute('aria-hidden', 'true');
  });

  const rendered = document.createElement('div');
  rendered.className = 'editorial-split-article-rendered';

  if (eyebrow || title) {
    const heading = document.createElement('div');
    heading.className = 'editorial-split-article-heading';

    if (eyebrow) {
      const eyebrowEl = document.createElement('p');
      eyebrowEl.className = 'editorial-split-article-eyebrow';
      eyebrowEl.textContent = eyebrow;
      heading.append(eyebrowEl);
    }

    if (title) {
      const titleEl = document.createElement(titleHeading);
      titleEl.className = 'editorial-split-article-title';
      titleEl.textContent = title;
      heading.append(titleEl);
    }

    rendered.append(heading);
  }

  if (bodySource) {
    const content = document.createElement('div');
    content.className = 'editorial-split-article-content';

    const body = document.createElement('div');
    body.className = 'editorial-split-article-body';
    cloneChildren(bodySource, body);
    decorateFigures(body);

    content.append(body);
    rendered.append(content);
  }

  block.append(rendered);

  rendered.querySelectorAll('.editorial-split-article-image').forEach((imageBox) => {
    applyImagePreset(imageBox, { preset: 'editorial-split-article' });
  });
}
