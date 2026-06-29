/**
 * Topic Tag Cloud block
 * Container block — each child row is a topic-tag item
 * Renders tags as outlined pill chips
 * @param {Element} block The block element
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

function getSourceRows(block) {
  return [...block.children].filter((row) => !row.classList.contains('topic-tag-cloud-rendered'));
}

export default function decorate(block) {
  const title = block.getAttribute('data-title') || '';
  const rows = getSourceRows(block);

  const rendered = document.createElement('div');
  rendered.className = 'topic-tag-cloud-rendered';

  if (title) {
    const label = document.createElement('p');
    label.className = 'topic-tag-cloud-label';
    label.textContent = title;
    rendered.append(label);
  }

  const tagList = document.createElement('div');
  tagList.className = 'topic-tag-cloud-list';

  rows.forEach((row) => {
    const cells = [...row.children];
    const tagText = cells[0]?.textContent?.trim();
    const tagUrl = cells[1]?.textContent?.trim();

    if (!tagText) return;

    const chip = document.createElement('a');
    chip.className = 'topic-tag-cloud-chip';
    chip.textContent = tagText;
    chip.href = tagUrl || `/tag/${encodeURIComponent(tagText.toLowerCase())}`;
    if (!tagUrl) chip.setAttribute('rel', 'tag');
    moveInstrumentation(row, chip);
    tagList.append(chip);
  });

  rendered.append(tagList);
  block.append(rendered);

  // Hide source rows — preserve DOM nodes for UE instrumentation
  rows.forEach((row) => {
    row.classList.add('topic-tag-cloud-source');
  });
}
