const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const COPY_TAGS = new Set(['p', 'h2', 'h3', 'h4']);

function sanitizeTag(tagName, fallback) {
  const normalizedTag = `${tagName || fallback}`.trim().toLowerCase();

  if (fallback === 'p') {
    return COPY_TAGS.has(normalizedTag) ? normalizedTag : 'p';
  }

  return HEADING_TAGS.has(normalizedTag) ? normalizedTag : fallback;
}

function getSourceArea(block) {
  return [...block.children].filter((child) => !child.classList.contains('hero-blog-content'));
}

function getPropElement(block, propName) {
  const sourceArea = getSourceArea(block);

  for (const source of sourceArea) {
    const prop = source.querySelector(`[data-aue-prop="${propName}"]`);
    if (prop) return prop;
  }

  return null;
}

function getPropText(block, propName) {
  const prop = getPropElement(block, propName);
  return prop?.textContent?.trim() || '';
}

function getPropHtml(block, propName) {
  const prop = getPropElement(block, propName);
  if (!prop) return '';

  const semanticChild = prop.querySelector('p, h1, h2, h3, h4, h5, h6');
  return semanticChild ? semanticChild.innerHTML.trim() : prop.innerHTML.trim();
}

function getPropMedia(block, propName) {
  const prop = getPropElement(block, propName);
  if (!prop) return null;

  const media = prop.querySelector('picture, img, svg');
  if (media) return media.cloneNode(true);

  const link = prop.querySelector('a');
  const href = link?.getAttribute('href');

  if (href && /\.(svg|png|jpe?g|webp)$/i.test(href)) {
    const img = document.createElement('img');
    img.src = href;
    img.alt = '';
    img.loading = 'eager';
    return img;
  }

  const text = prop.textContent?.trim();

  if (text && /\.(svg|png|jpe?g|webp)$/i.test(text)) {
    const img = document.createElement('img');
    img.src = text;
    img.alt = '';
    img.loading = 'eager';
    return img;
  }

  return null;
}

function hideSourceRows(block) {
  getSourceArea(block).forEach((source) => {
    source.classList.add('hero-blog-source');
  });
}

export default function decorate(block) {
  const existingContent = block.querySelector(':scope > .hero-blog-content');
  if (existingContent) existingContent.remove();

  const icon = getPropMedia(block, 'hero_icon');
  const titleText = getPropText(block, 'hero_title');
  const titleTag = sanitizeTag(getPropText(block, 'hero_titleHeading'), 'h1');
  const subtitleHtml = getPropHtml(block, 'hero_subtitle');
  const subtitleTag = sanitizeTag(getPropText(block, 'hero_subtitleHeading'), 'p');

  hideSourceRows(block);

  const content = document.createElement('div');
  content.className = 'hero-blog-content';

  const topRow = document.createElement('div');
  topRow.className = 'hero-blog-top-row';

  if (icon) {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'hero-blog-icon';
    iconWrapper.append(icon);
    topRow.append(iconWrapper);
  }

  if (titleText) {
    const title = document.createElement(titleTag);
    title.className = 'hero-blog-title';
    title.textContent = titleText;
    topRow.append(title);
  }

  if (topRow.childNodes.length) {
    content.append(topRow);
  }

  if (subtitleHtml) {
    const subtitle = document.createElement(subtitleTag);
    subtitle.className = 'hero-blog-subtitle';
    subtitle.innerHTML = subtitleHtml;
    content.append(subtitle);
  }

  block.append(content);
}