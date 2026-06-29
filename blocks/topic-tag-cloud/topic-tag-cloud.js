/**
 * Topic Tag Cloud block
 * Shows a cloud of topic tags as outlined pill chips.
 *
 * Sources (in priority order):
 * 1. Authored AEM tags (data-tags attribute) when useArticleTags is false
 * 2. Article page tags (meta[name="article-tags"]) when useArticleTags is true
 *    or when no tags are contributed and the block is on an article page
 * 3. Falls back to empty (nothing rendered)
 *
 * Limit: 20 tags maximum.
 */

const MAX_TAGS = 20;

function tagLabel(tagPath) {
  // "inspiration-guide:adventure" → "Adventure"
  const raw = `${tagPath || ''}`.trim();
  const name = raw.includes(':') ? raw.split(':').pop() : raw;
  const slug = name.split('/').pop();
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

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

function buildChips(tags, languageRoot) {
  return tags.slice(0, MAX_TAGS).map((tagPath) => {
    const label = tagLabel(tagPath);
    const slug = tagSlug(tagPath);
    const chip = document.createElement('a');
    chip.className = 'topic-tag-cloud-chip';
    chip.href = `${languageRoot}/inspiration-guide/tag/${encodeURIComponent(slug)}`;
    chip.textContent = label;
    chip.setAttribute('rel', 'tag');
    return chip;
  });
}

function getLanguageRoot() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  return segments.length >= 2 ? `/${segments[0]}/${segments[1]}` : '';
}

export default function decorate(block) {
  const title = block.getAttribute('data-title') || '';
  const useArticleTags = block.getAttribute('data-use-article-tags') === 'true';
  const authoredTags = parseTagList(block.getAttribute('data-tags') || '');

  let tags;
  if (useArticleTags || !authoredTags.length) {
    tags = getPageTags();
  } else {
    tags = authoredTags;
  }

  // Clear source rows
  [...block.children].forEach((row) => row.classList.add('topic-tag-cloud-source'));

  if (!tags.length) return;

  const languageRoot = getLanguageRoot();
  const rendered = document.createElement('div');
  rendered.className = 'topic-tag-cloud-rendered';

  if (title) {
    const label = document.createElement('p');
    label.className = 'topic-tag-cloud-label';
    label.textContent = title;
    rendered.append(label);
  }

  const list = document.createElement('div');
  list.className = 'topic-tag-cloud-list';
  buildChips(tags, languageRoot).forEach((chip) => list.append(chip));

  rendered.append(list);
  block.append(rendered);
}
