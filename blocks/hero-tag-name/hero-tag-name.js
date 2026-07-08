const HEADING_TAGS = new Set(['h1', 'h2', 'h3']);

function getSourceRows(block) {
  return [...block.children].filter((row) => !row.classList.contains('hero-tag-name-rendered'));
}

function propText(block, prop) {
  return block.querySelector(`[data-aue-prop="${prop}"]`)?.textContent?.trim() || '';
}

function sanitizeHeading(value, fallback) {
  const tag = `${value || fallback}`.trim().toLowerCase();
  return HEADING_TAGS.has(tag) ? tag : fallback;
}

function getPageMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function normalizeSlug(value) {
  const first = `${value || ''}`.split(/[|,;]/)[0].trim().toLowerCase();
  if (!first) return '';
  const afterNamespace = first.includes(':') ? first.split(':').pop() : first;
  return afterNamespace.split('/').pop().trim();
}

function getCurrentTag() {
  const fromMeta = normalizeSlug(
    getPageMeta('article-tags')
      || getPageMeta('article-category')
      || getPageMeta('article-category-path'),
  );
  if (fromMeta) return fromMeta;

  const segments = window.location.pathname.split('/').filter(Boolean);
  const idx = Math.max(segments.indexOf('tag'), segments.indexOf('category'));
  if (idx < 0) return '';
  return decodeURIComponent(segments[idx + 1] || '').replace(/\.html?$/i, '').toLowerCase();
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
    row.classList.add('hero-tag-name-source');
    row.setAttribute('aria-hidden', 'true');
  });

  const rendered = document.createElement('div');
  rendered.className = 'hero-tag-name-rendered';

  const heading = document.createElement('div');
  heading.className = 'hero-tag-name-heading';

  const titleEl = document.createElement(headingTag);
  titleEl.className = 'hero-tag-name-title';
  titleEl.textContent = title;

  heading.append(titleEl);
  rendered.append(heading);
  block.append(rendered);
}
