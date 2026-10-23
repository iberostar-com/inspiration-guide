/**
 * Topic Tag Cloud block
 * Shows a cloud of topic tags as outlined pill chips.
 *
 * Sources:
 * 1. Authored AEM tags (DOM field row) when useArticleTags is false
 * 2. Article page tags (meta[name="article-tags"]) when useArticleTags is true
 * 3. Empty selected source renders nothing
 *
 * Limit: 20 tags maximum.
 */

import { appendPageSegment } from '../../scripts/iberostar/page-links.js';
import { tagDisplayTitle } from '../../scripts/iberostar/taxonomy.js';

const MAX_TAGS = 20;
const FIELD_POSITIONS = {
  tagParentPage: 2,
  tags: 3,
  title: 0,
  useArticleTags: 1,
};

function tagSlug(tagPath) {
  const raw = `${tagPath || ''}`.trim();
  const name = raw.includes(':') ? raw.split(':').pop() : raw;
  return name.split('/').pop().toLowerCase();
}

function parseTagList(value) {
  if (!value) return [];
  return value
    .split(/[,;|\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function getPageTags() {
  const content = document.querySelector('meta[name="article-tags"]')?.content?.trim() || '';
  return parseTagList(content);
}

function getSourceRows(block) {
  return [...block.children]
    .filter((row) => !row.classList.contains('topic-tag-cloud-rendered'));
}

function getPropElement(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  return getSourceRows(block)
    .map((row) => (row.matches?.(selector) ? row : row.querySelector?.(selector)))
    .find(Boolean) || null;
}

function getPositionalField(block, propName) {
  const row = getSourceRows(block)[FIELD_POSITIONS[propName]];
  if (!row) return null;

  const cells = [...row.children];
  return cells[cells.length - 1] || row;
}

function getTextValue(block, propName, legacyAttr = '') {
  const prop = getPropElement(block, propName);
  if (prop) return prop.textContent?.trim() || '';

  const legacyValue = legacyAttr ? block.getAttribute(legacyAttr) : null;
  if (legacyValue !== null) return legacyValue.trim();

  return getPositionalField(block, propName)?.textContent?.trim() || '';
}

function getHrefValue(field) {
  return field?.querySelector?.('a[href]')?.getAttribute('href')?.trim()
    || field?.getAttribute?.('href')?.trim()
    || field?.textContent?.trim()
    || '';
}

function getBooleanValue(block, propName, legacyAttr = '') {
  return getTextValue(block, propName, legacyAttr).toLowerCase() === 'true';
}

function getListValues(field) {
  const items = [...(field?.querySelectorAll?.('li') || [])]
    .map((item) => item.textContent?.trim())
    .filter(Boolean);
  return items.length ? items : parseTagList(field?.textContent || '');
}

function getAuthoredTags(block) {
  const tagsField = getPropElement(block, 'tags');
  if (tagsField) return getListValues(tagsField);

  const legacyTags = block.getAttribute('data-tags');
  if (legacyTags !== null) return parseTagList(legacyTags);

  const hasLegacyConfig = block.hasAttribute('data-title')
    || block.hasAttribute('data-use-article-tags');
  const rows = getSourceRows(block);
  const positionalField = hasLegacyConfig
    ? rows[0]
    : rows[rows.length >= 4 ? FIELD_POSITIONS.tags : 2];

  return getListValues(positionalField);
}

function getTagParentPage(block) {
  const prop = getPropElement(block, 'tagParentPage');
  if (prop) return getHrefValue(prop);

  const legacyValue = block.getAttribute('data-tag-parent-page');
  if (legacyValue !== null) return legacyValue.trim();

  const rows = getSourceRows(block);
  return rows.length >= 4 ? getHrefValue(rows[FIELD_POSITIONS.tagParentPage]) : '';
}

function buildChips(tags, tagParentPage) {
  const visible = tags.filter((tagPath) => tagSlug(tagPath) !== '').slice(0, MAX_TAGS);

  // The chip label prefers the Title of the tag landing page; tagDisplayTitle
  // falls back to the slug-derived label when that page does not exist.
  return Promise.all(visible.map(async (tagPath) => {
    const label = await tagDisplayTitle(tagPath);
    const chip = document.createElement('a');
    chip.className = 'topic-tag-cloud-chip';
    chip.href = appendPageSegment(tagParentPage, tagSlug(tagPath));
    chip.textContent = label;
    chip.setAttribute('rel', 'tag');

    // SEO: cada tag va dentro de un h3 (Bug 167097)
    const heading = document.createElement('h3');
    heading.className = 'topic-tag-cloud-chip-heading';
    heading.append(chip);
    return heading;
  }));
}

function getLanguageRoot() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const locale = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  return locale ? `/${locale}` : '';
}

export default async function decorate(block) {
  const previous = block.querySelector(':scope > .topic-tag-cloud-rendered');
  if (previous) previous.remove();

  const title = getTextValue(block, 'title', 'data-title');
  const useArticleTags = getBooleanValue(block, 'useArticleTags', 'data-use-article-tags');
  const tags = useArticleTags ? getPageTags() : getAuthoredTags(block);

  // Preserve Universal Editor instrumentation while hiding source rows.
  getSourceRows(block).forEach((row) => {
    row.classList.add('topic-tag-cloud-source');
    row.setAttribute('aria-hidden', 'true');
  });

  if (!tags.length) return;

  const languageRoot = getLanguageRoot();
  const tagParentPage = getTagParentPage(block)
    || `${languageRoot}/inspiration-guide`;
  const rendered = document.createElement('div');
  rendered.className = 'topic-tag-cloud-rendered';

  if (title) {
    // SEO: el título del módulo es un h2 (Bug 167097)
    const label = document.createElement('h2');
    label.className = 'topic-tag-cloud-label';
    label.textContent = title;
    rendered.append(label);
  }

  const list = document.createElement('div');
  list.className = 'topic-tag-cloud-list';
  (await buildChips(tags, tagParentPage)).forEach((chip) => list.append(chip));

  if (!list.children.length) return;

  rendered.append(list);
  block.append(rendered);
}
