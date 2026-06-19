const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const COPY_TAGS = new Set(['p', 'h2', 'h3', 'h4', 'h5', 'h6']);

function getRows(block) {
  return [...block.children];
}

function getCells(block) {
  return getRows(block).flatMap((row) => (row.children.length ? [...row.children] : [row]));
}

function sanitizeTag(tagName, fallback) {
  const normalizedTag = `${tagName || fallback}`.trim().toLowerCase();
  if (fallback === 'p') return COPY_TAGS.has(normalizedTag) ? normalizedTag : 'p';
  return HEADING_TAGS.has(normalizedTag) ? normalizedTag : fallback;
}

function getRichText(cell) {
  if (!cell) return '';
  const semanticChild = cell.querySelector('p, h1, h2, h3, h4, h5, h6');
  return semanticChild ? semanticChild.innerHTML.trim() : cell.innerHTML.trim();
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

  const icon = iconCell?.querySelector('picture, img, svg');
  if (icon) {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'hero-blog-icon';
    iconWrapper.append(iconCell);
    content.append(iconWrapper);
  }

  if (titleText) {
    const title = document.createElement(titleTag);
    title.className = 'hero-blog-title';
    title.textContent = titleText;
    content.append(title);
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
