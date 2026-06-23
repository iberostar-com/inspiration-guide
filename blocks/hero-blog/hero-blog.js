const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const COPY_TAGS = new Set(['p', 'h2', 'h3', 'h4']);

function getRows(block) {
  return [...block.children];
}

function getCells(block) {
  return getRows(block).flatMap((row) => (row.children.length ? [...row.children] : [row]));
}

function sanitizeTag(tagName, fallback) {
  const normalizedTag = `${tagName || fallback}`.trim().toLowerCase();

  if (fallback === 'p') {
    return COPY_TAGS.has(normalizedTag) ? normalizedTag : 'p';
  }

  return HEADING_TAGS.has(normalizedTag) ? normalizedTag : fallback;
}

function getRichText(cell) {
  if (!cell) return '';

  const semanticChild = cell.querySelector('p, h1, h2, h3, h4, h5, h6');
  return semanticChild ? semanticChild.innerHTML.trim() : cell.innerHTML.trim();
}

function getIconElement(iconCell) {
  if (!iconCell) return null;

  const media = iconCell.querySelector('picture, img, svg');
  if (media) return media;

  const link = iconCell.querySelector('a');
  const href = link?.getAttribute('href');

  if (href && /\.(svg|png|jpe?g|webp)$/i.test(href)) {
    const img = document.createElement('img');
    img.src = href;
    img.alt = '';
    img.loading = 'eager';
    return img;
  }

  const text = iconCell.textContent?.trim();

  if (text && /\.(svg|png|jpe?g|webp)$/i.test(text)) {
    const img = document.createElement('img');
    img.src = text;
    img.alt = '';
    img.loading = 'eager';
    return img;
  }

  return null;
}

export default function decorate(block) {
  const cells = getCells(block);

  const iconCell = cells[0];
  const titleCell = cells[1];
  const titleHeadingCell = cells[2];
  const subtitleCell = cells[3];
  const subtitleHeadingCell = cells[4];

  const titleText = titleCell?.textContent.trim()
    || block.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim()
    || '';

  const titleTag = sanitizeTag(titleHeadingCell?.textContent, 'h1');

  const subtitleHtml = getRichText(subtitleCell);
  const subtitleTag = sanitizeTag(subtitleHeadingCell?.textContent, 'p');

  const content = document.createElement('div');
  content.className = 'hero-blog-content';

  const headingRow = document.createElement('div');
  headingRow.className = 'hero-blog-heading-row';

  const icon = getIconElement(iconCell);
  if (icon) {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'hero-blog-icon';
    iconWrapper.append(icon);
    headingRow.append(iconWrapper);
  }

  if (titleText) {
    const title = document.createElement(titleTag);
    title.className = 'hero-blog-title';
    title.textContent = titleText;
    headingRow.append(title);
  }

  if (headingRow.childNodes.length) {
    content.append(headingRow);
  }

  if (subtitleHtml) {
    const subtitle = document.createElement(subtitleTag);
    subtitle.className = 'hero-blog-subtitle';
    subtitle.innerHTML = subtitleHtml;
    content.append(subtitle);
  }

  if (!content.childNodes.length) return;

  block.replaceChildren(content);
}