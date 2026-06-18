/**
 * Topic Tag Cloud block
 * Renders tags as chips/pills
 * Supports manual contribution or auto-generation
 * @param {Element} block The block element
 */

/**
 * Extract tags from manually contributed rows
 * Expected structure from AEM: each row is a tag name
 */
function extractManualTags(block) {
  const rows = Array.from(block.querySelectorAll(':scope > div > div'));
  return rows
    .map((row) => row.textContent?.trim())
    .filter((tag) => tag && tag.length > 0);
}

/**
 * Generate tags auto (placeholder - requires Fetch from CF)
 * Real implementation in Fase 5 (lógica de datos)
 */
async function generateAutoTags(mode) {
  // Placeholder: return empty array
  // Real impl: fetch from /api/tags?mode=category&max=20
  // eslint-disable-next-line no-console
  console.warn(
    `[topic-tag-cloud] Auto mode '${mode}' not yet implemented. Use manual mode for now.`,
  );
  return [];
}

export default async function decorate(block) {
  const mode = block.getAttribute('data-mode') || 'manual';
  const maxTags = parseInt(block.getAttribute('data-max-tags') || '20', 10);
  const title = block.getAttribute('data-title') || 'Topics';

  const wrapper = document.createElement('div');
  wrapper.className = 'topic-tag-cloud';

  // Title
  if (title) {
    const h2 = document.createElement('h2');
    h2.textContent = title;
    h2.className = 'topic-tag-cloud-title';
    wrapper.appendChild(h2);
  }

  // Tag list
  const tagList = document.createElement('div');
  tagList.className = 'topic-tag-cloud-list';

  let tags = [];

  switch (mode) {
    case 'manual':
      tags = extractManualTags(block);
      break;
    case 'auto-category':
      // eslint-disable-next-line no-await-in-loop
      tags = await generateAutoTags('category', maxTags);
      break;
    case 'auto-frequency':
      // eslint-disable-next-line no-await-in-loop
      tags = await generateAutoTags('frequency', maxTags);
      break;
    default:
      tags = extractManualTags(block);
  }

  // Render tags
  tags.slice(0, maxTags).forEach((tag) => {
    const chip = document.createElement('a');
    chip.href = `/tag/${encodeURIComponent(tag.toLowerCase())}`;
    chip.className = 'tag-chip';
    chip.textContent = tag;
    chip.setAttribute('aria-label', `Filter by tag: ${tag}`);
    tagList.appendChild(chip);
  });

  wrapper.appendChild(tagList);
  block.replaceChildren(wrapper);
}
