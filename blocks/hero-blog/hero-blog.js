const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const COPY_TAGS = new Set(['p', 'h2', 'h3', 'h4']);

function sanitizeTag(tagName, fallback) {
  const normalizedTag = `${tagName || fallback}`.trim().toLowerCase();

  if (fallback === 'p') {
    return COPY_TAGS.has(normalizedTag) ? normalizedTag : 'p';
  }

  return HEADING_TAGS.has(normalizedTag) ? normalizedTag : fallback;
}

function getRows(block) {
  return [...block.children];
}

function getCellValue(row) {
  if (!row) return '';
  const cell = row.children?.[1] || row.children?.[0] || row;
  return cell?.textContent?.trim() || '';
}

function getCellElement(row) {
  if (!row) return null;
  return row.children?.[1] || row.children?.[0] || row;
}

function getRichTextValue(row) {
  const cell = getCellElement(row);
  if (!cell) return '';

  const semanticChild = cell.querySelector('p, h1, h2, h3, h4, h5, h6');
  return semanticChild ? semanticChild.innerHTML.trim() : cell.innerHTML.trim();
}

function getIconElement(row) {
  const cell = getCellElement(row);
  if (!cell) return null;

  const media = cell.querySelector('picture, img, svg');
  if (media) return media.cloneNode(true);

  const link = cell.querySelector('a');
  const href = link?.getAttribute('href');

  if (href && /\.(svg|png|jpe?g|webp)$/i.test(href)) {
    const img = document.createElement('img');
    img.src = href;
    img.alt = '';
    img.loading = 'eager';
    return img;
  }

  const text = cell.textContent?.trim();
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
  const rows = getRows(block);

  const iconRow = rows[0];
  const titleRow = rows[1];
  const titleHeadingRow = rows[2];
  const subtitleRow = rows[3];
  const subtitleHeadingRow = rows[4];

  const titleText = getCellValue(titleRow);
  const titleTag = sanitizeTag(getCellValue(titleHeadingRow), 'h1');
  const subtitleHtml = getRichTextValue(subtitleRow);
  const subtitleTag = sanitizeTag(getCellValue(subtitleHeadingRow), 'p');

  const wrapper = document.createElement('div');
  wrapper.className = 'hero-blog-content';

  const topRow = document.createElement('div');
  topRow.className = 'hero-blog-top-row';

  const icon = getIconElement(iconRow);
  if (icon) {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'hero-blog-icon';
    iconWrapper.append(icon);
    topRow.append(iconWrapper);
  }

  if (titleText) {
    const titleEl = document.createElement(titleTag);
    titleEl.className = 'hero-blog-title';
    titleEl.textContent = titleText;
    topRow.append(titleEl);
  }

  wrapper.append(topRow);

  if (subtitleHtml) {
    const subtitleEl = document.createElement(subtitleTag);
    subtitleEl.className = 'hero-blog-subtitle';
    subtitleEl.innerHTML = subtitleHtml;
    wrapper.append(subtitleEl);
  }

  block.textContent = '';
  block.append(wrapper);
}