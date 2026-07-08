const HEADING_TAGS = new Set(['h1', 'h2', 'h3']);

function getSourceRows(block) {
  return [...block.children].filter((row) => !row.classList.contains('tag-header-rendered'));
}

function propText(block, prop) {
  return block.querySelector(`[data-aue-prop="${prop}"]`)?.textContent?.trim() || '';
}

function sanitizeHeading(value, fallback) {
  const tag = `${value || fallback}`.trim().toLowerCase();
  return HEADING_TAGS.has(tag) ? tag : fallback;
}

function getCurrentTag() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const idx = segments.indexOf('tag');
  if (idx < 0) return '';
  return decodeURIComponent(segments[idx + 1] || '').replace(/\.html?$/i, '');
}

function tagLabel(slug) {
  const text = `${slug || ''}`.replace(/[-_]+/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

export default function decorate(block) {
  const rows = getSourceRows(block);
  const levels = rows
    .map((row) => row.textContent?.trim().toLowerCase())
    .filter((text) => HEADING_TAGS.has(text));
  const headingTag = sanitizeHeading(propText(block, 'titleHeading') || levels[0], 'h1');

  const authored = propText(block, 'title')
    || rows.find((row) => {
      const text = row.textContent?.trim().toLowerCase();
      return text && !HEADING_TAGS.has(text);
    })?.textContent?.trim()
    || '';
  const title = authored || tagLabel(getCurrentTag());

  rows.forEach((row) => {
    row.classList.add('tag-header-source');
    row.setAttribute('aria-hidden', 'true');
  });

  const rendered = document.createElement('div');
  rendered.className = 'tag-header-rendered';

  const heading = document.createElement('div');
  heading.className = 'tag-header-heading';

  const titleEl = document.createElement(headingTag);
  titleEl.className = 'tag-header-title';
  titleEl.textContent = title;

  heading.append(titleEl);
  rendered.append(heading);
  block.append(rendered);
}
