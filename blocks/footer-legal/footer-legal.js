import { moveInstrumentation } from '../../scripts/scripts.js';

function getSourceRows(block) {
  const modelRows = [...block.querySelectorAll('[data-aue-model="footer-legal-item"]')]
    .filter((row) => !row.closest('.footer-legal-nav'));

  if (modelRows.length) {
    return modelRows;
  }

  const classRows = [...block.querySelectorAll('.footer-legal-item-source')]
    .filter((row) => !row.closest('.footer-legal-nav'));

  if (classRows.length) {
    return classRows;
  }

  return [...block.children].filter((row) => !row.classList.contains('footer-legal-nav'));
}

function getCellText(container, index) {
  const cells = [...container.children];
  return cells[index]?.textContent?.trim() || '';
}

function getPropElement(container, prop) {
  if (container?.matches?.(`[data-aue-prop="${prop}"]`)) return container;
  return container?.querySelector?.(`[data-aue-prop="${prop}"]`) || null;
}

function isChecked(row, prop, fallbackIndex) {
  const rawValue = getPropElement(row, prop)?.textContent?.trim()
    || getCellText(row, fallbackIndex);
  const text = rawValue.toLowerCase();
  return text === 'true' || text === 'on' || text === 'yes';
}

function normalizeTarget(value = '') {
  const text = `${value}`.trim().toLowerCase();
  if (!text) return '_blank';
  if (text === '_blank' || text.includes('nueva') || text === 'true' || text === 'on' || text === 'yes') {
    return '_blank';
  }
  return '_self';
}

function getHref(row) {
  const propEl = getPropElement(row, 'linkUrl');
  const anchor = propEl?.querySelector?.('a[href]') || row.querySelector?.('a[href]');
  if (anchor) return anchor.getAttribute('href')?.trim() || '#';
  return getCellText(row, 1) || '#';
}

function buildLinkItem(row) {
  const label = getPropElement(row, 'linkLabel')?.textContent?.trim() || getCellText(row, 0);
  if (!label) return null;

  const url = getHref(row);
  const target = normalizeTarget(
    getPropElement(row, 'linkTarget')?.textContent
    || getPropElement(row, 'linkNewTab')?.textContent
    || getCellText(row, 2),
  );
  const nofollow = isChecked(row, 'linkNofollow', 3);

  const li = document.createElement('li');
  li.className = 'footer-legal-item';

  const a = document.createElement('a');
  a.href = url;
  a.textContent = label;

  if (target === '_blank' && nofollow) {
    a.target = '_blank';
    a.rel = 'noopener nofollow';
  } else if (target === '_blank') {
    a.target = '_blank';
    a.rel = 'noopener';
  } else if (nofollow) {
    a.rel = 'nofollow';
  }

  moveInstrumentation(row, li);
  li.append(a);
  return li;
}

/**
 * Footer Legal — flat list of legal page links (Nota legal, Política de cookies, etc.).
 * Content model: each row = one legal link (label | url | newTab | nofollow).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = getSourceRows(block);
  if (!rows.length) return;

  const ul = document.createElement('ul');
  ul.className = 'footer-legal-list';

  rows.forEach((row) => {
    const li = buildLinkItem(row);
    if (li) ul.append(li);
  });

  const nav = document.createElement('nav');
  nav.className = 'footer-legal-nav';
  nav.setAttribute('aria-label', 'Legal');
  nav.append(ul);

  rows.forEach((row) => row.setAttribute('aria-hidden', 'true'));
  block.append(nav);
}
