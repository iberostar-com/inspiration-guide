import { toClassName } from '../../scripts/aem.js';
import { buildUrl } from '../../scripts/iberostar/url-builder.js';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function getRows(block) {
  return [...block.children];
}

function getCells(row) {
  return row.children.length ? [...row.children] : [row];
}

function sanitizeHeadingTag(tagName, fallback = 'h2') {
  const normalizedTag = `${tagName || fallback}`.trim().toLowerCase();
  return HEADING_TAGS.has(normalizedTag) ? normalizedTag : fallback;
}

function parseConfigRow(row) {
  const cells = getCells(row);
  if (cells.length < 3) return null;

  return {
    classes: (cells[3]?.textContent || '')
      .split(',')
      .map((className) => toClassName(className))
      .filter(Boolean),
    tagHeading: sanitizeHeadingTag(cells[2]?.textContent, 'h3'),
    title: cells[0]?.textContent.trim() || '',
    titleHeading: sanitizeHeadingTag(cells[1]?.textContent, 'h2'),
  };
}

function parseTagRow(row) {
  const cells = getCells(row);
  const label = cells[0]?.textContent.trim() || cells[1]?.querySelector('a')?.textContent.trim() || '';
  const rawUrl = cells[1]?.querySelector('a')?.href || cells[1]?.textContent.trim() || '';

  if (!label && !rawUrl) return null;

  return {
    label,
    url: buildUrl(rawUrl),
  };
}

export default function decorate(block) {
  const rows = getRows(block);
  const firstRowConfig = parseConfigRow(rows[0]);
  const config = firstRowConfig || {
    classes: [],
    tagHeading: 'h3',
    title: block.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim() || '',
    titleHeading: block.querySelector('h1, h2, h3, h4, h5, h6')?.tagName.toLowerCase() || 'h2',
  };
  const tagRows = firstRowConfig ? rows.slice(1) : rows;
  const tags = tagRows.map(parseTagRow).filter(Boolean);

  if (!tags.length) return;

  config.classes.forEach((className) => block.classList.add(className));

  const fragment = document.createDocumentFragment();

  if (config.title) {
    const heading = document.createElement(config.titleHeading);
    heading.className = 'topic-tag-cloud-title';
    heading.textContent = config.title;
    fragment.append(heading);
  }

  const listHeading = document.createElement(config.tagHeading);
  listHeading.className = 'topic-tag-cloud-list-heading';
  listHeading.textContent = 'Topics';
  fragment.append(listHeading);

  const list = document.createElement('ul');
  list.className = 'topic-tag-cloud-list';

  tags.forEach((tag) => {
    const item = document.createElement('li');
    item.className = 'topic-tag-cloud-item';

    const tagElement = tag.url ? document.createElement('a') : document.createElement('span');
    tagElement.className = 'topic-tag-cloud-tag';
    tagElement.textContent = tag.label || tag.url;
    if (tag.url && tagElement instanceof HTMLAnchorElement) tagElement.href = tag.url;

    item.append(tagElement);
    list.append(item);
  });

  fragment.append(list);
  block.replaceChildren(fragment);
}
