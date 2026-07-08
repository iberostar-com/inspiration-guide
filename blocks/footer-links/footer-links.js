import { moveInstrumentation } from '../../scripts/scripts.js';

function getCellText(container, index) {
  const cells = [...container.children];
  return cells[index]?.textContent?.trim() || '';
}

function getPropElement(container, prop) {
  if (container?.matches?.(`[data-aue-prop="${prop}"]`)) return container;
  return container?.querySelector?.(`[data-aue-prop="${prop}"]`) || null;
}

function getModelElement(container, model) {
  if (container?.matches?.(`[data-aue-model="${model}"]`)) return container;
  return container?.querySelector?.(`[data-aue-model="${model}"]`) || null;
}

function getLinksContainer(group) {
  return getPropElement(group, 'links') || group.querySelector?.('[data-aue-prop="links"]') || null;
}

function getBoolFromRow(row, prop, fallbackIndex) {
  const propEl = getPropElement(row, prop);
  const text = (propEl?.textContent?.trim() || getCellText(row, fallbackIndex)).toLowerCase();
  return text === 'true' || text === 'on' || text === 'yes';
}

function getHrefFromRow(row, prop, fallbackIndex) {
  const propEl = getPropElement(row, prop);
  const anchor = propEl?.querySelector?.('a[href]') || row.querySelector?.('a[href]');
  if (anchor) return anchor.getAttribute('href')?.trim() || '#';
  return getCellText(row, fallbackIndex) || '#';
}

function buildLinkItem(row) {
  const label = getPropElement(row, 'linkLabel')?.textContent?.trim() || getCellText(row, 0);
  if (!label) return null;

  const url = getHrefFromRow(row, 'linkUrl', 1);
  const newTab = getBoolFromRow(row, 'linkNewTab', 2);
  const nofollow = getBoolFromRow(row, 'linkNofollow', 3);

  const li = document.createElement('li');
  li.className = 'footer-links-item';
  const a = document.createElement('a');
  a.href = url;
  a.textContent = label;

  if (newTab && nofollow) {
    a.target = '_blank';
    a.rel = 'noopener nofollow';
  } else if (newTab) {
    a.target = '_blank';
    a.rel = 'noopener';
  } else if (nofollow) {
    a.rel = 'nofollow';
  }

  moveInstrumentation(row, li);
  li.append(a);
  return li;
}

function collectGroups(block) {
  const groups = [...block.querySelectorAll('[data-aue-model="footer-links-group"]')]
    .filter((group) => !group.closest('.footer-links-rendered'));

  if (groups.length) {
    return groups.map((group) => ({
      titleElement: getPropElement(group, 'title') || group,
      sourceNodes: [group],
      linkRows: [...group.querySelectorAll('[data-aue-model="footer-link-item"]')],
      linksContainer: getLinksContainer(group),
    }));
  }

  const classGroups = [...block.querySelectorAll('.footer-links-group')]
    .filter((group) => !group.closest('.footer-links-rendered'));

  if (classGroups.length) {
    return classGroups.map((group) => ({
      titleElement: group.querySelector('.footer-links-group-title') || group.firstElementChild || group,
      sourceNodes: [group],
      linkRows: [...group.querySelectorAll('.footer-link-item')],
      linksContainer: group.querySelector('.footer-links-links') || null,
    }));
  }

  // Legacy fallback: first row is title, remaining rows are links.
  const rows = [...block.children].filter((row) => !row.classList.contains('footer-links-rendered'));
  if (!rows.length) return [];

  const titleRow = rows[0];
  return [{
    titleElement: getPropElement(titleRow, 'title') || titleRow,
    sourceNodes: rows,
    linkRows: rows.slice(1),
    linksContainer: null,
  }];
}

/**
 * Footer Links block — renders multiple list groups (title + links)
 * with CSS-driven accordion behavior on mobile.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const groups = collectGroups(block);
  if (!groups.length) return;

  const rendered = document.createElement('div');
  rendered.className = 'footer-links-rendered';

  groups.forEach((group) => {
    const titleText = group.titleElement?.textContent?.trim() || '';
    const details = document.createElement('details');
    details.className = 'footer-links-group';
    details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'footer-accordion-toggle';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'footer-column-title';
    titleSpan.textContent = titleText;

    const chevron = document.createElement('span');
    chevron.className = 'footer-accordion-chevron';
    chevron.setAttribute('aria-hidden', 'true');

    summary.append(titleSpan, chevron);
    moveInstrumentation(group.titleElement, summary);

    const ul = document.createElement('ul');
    ul.className = 'footer-links-list';

    const linkRows = group.linksContainer
      ? [...group.linksContainer.children]
      : group.linkRows;

    linkRows.forEach((row) => {
      const li = buildLinkItem(getModelElement(row, 'footer-link-item') || row);
      if (li) ul.append(li);
    });

    details.append(summary, ul);
    rendered.append(details);

    group.sourceNodes.forEach((node) => node.setAttribute('aria-hidden', 'true'));
  });

  block.append(rendered);
}
