const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const COPY_TAGS = new Set(['p', 'h2', 'h3', 'h4']);

const FIELD_INDEX = {
  hero_icon: 0,
  hero_title: 1,
  hero_titleHeading: 2,
  hero_subtitle: 3,
  hero_subtitleHeading: 4,
};

function normalizeTagValue(value, fallback) {
  const normalized = `${value || fallback}`.trim().toLowerCase();

  const labelMap = {
    paragraph: 'p',
    'heading 1': 'h1',
    'heading 2': 'h2',
    'heading 3': 'h3',
    'heading 4': 'h4',
    'heading 5': 'h5',
    'heading 6': 'h6',
  };

  return labelMap[normalized] || normalized;
}

function sanitizeTag(tagName, fallback) {
  const normalized = normalizeTagValue(tagName, fallback);

  if (fallback === 'p') {
    return COPY_TAGS.has(normalized) ? normalized : 'p';
  }

  return HEADING_TAGS.has(normalized) ? normalized : fallback;
}

function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('hero-blog-content'));
}

function getCellFromRow(row) {
  if (!row) return null;

  const cells = [...row.children];

  if (cells.length > 1) {
    return cells[cells.length - 1];
  }

  return cells[0] || row;
}

function getPropFromSource(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;

  return getSourceRows(block)
    .map((row) => {
      if (row.matches?.(selector)) {
        return row;
      }

      return row.querySelector?.(selector) || null;
    })
    .find(Boolean) || null;
}

function getFieldElement(block, propName) {
  const byProp = getPropFromSource(block, propName);
  if (byProp) return byProp;

  const row = getSourceRows(block)[FIELD_INDEX[propName]];

  return getCellFromRow(row);
}

function getText(block, propName) {
  const el = getFieldElement(block, propName);
  return el?.textContent?.trim() || '';
}

function getHtml(block, propName) {
  const el = getFieldElement(block, propName);
  if (!el) return '';

  const semantic = el.querySelector('p, h1, h2, h3, h4, h5, h6');

  return semantic ? semantic.innerHTML.trim() : el.innerHTML.trim();
}

function createImage(src) {
  const img = document.createElement('img');

  img.src = src;
  img.alt = '';
  img.loading = 'eager';

  return img;
}

function getMedia(block, propName) {
  const el = getFieldElement(block, propName);
  if (!el) return null;

  if (el.matches?.('picture, svg')) {
    return el.cloneNode(true);
  }

  if (el.matches?.('img')) {
    return el.parentElement?.tagName?.toLowerCase() === 'picture'
      ? el.parentElement.cloneNode(true)
      : el.cloneNode(true);
  }

  const media = el.querySelector('picture, img, svg');

  if (media) {
    if (media.matches('img') && media.parentElement?.tagName?.toLowerCase() === 'picture') {
      return media.parentElement.cloneNode(true);
    }

    return media.cloneNode(true);
  }

  const href = el.querySelector('a')?.getAttribute('href');

  if (href && /\.(svg|png|jpe?g|webp)$/i.test(href)) {
    return createImage(href);
  }

  const text = el.textContent?.trim();

  if (text && /\.(svg|png|jpe?g|webp)$/i.test(text)) {
    return createImage(text);
  }

  return null;
}

function hideSource(block) {
  getSourceRows(block).forEach((row) => {
    row.classList.add('hero-blog-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

export default function decorate(block) {
  const existing = block.querySelector(':scope > .hero-blog-content');
  if (existing) existing.remove();

  const icon = getMedia(block, 'hero_icon');
  const titleText = getText(block, 'hero_title');
  const titleTag = sanitizeTag(getText(block, 'hero_titleHeading'), 'h1');

  const subtitleHtml = getHtml(block, 'hero_subtitle');
  const subtitleTag = sanitizeTag(getText(block, 'hero_subtitleHeading'), 'p');

  hideSource(block);

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
