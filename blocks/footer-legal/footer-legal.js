import { moveInstrumentation } from '../../scripts/scripts.js';

function getSourceRows(block) {
  return [...block.children].filter((row) => !row.classList.contains('footer-legal-nav'));
}

function getCellText(row, index) {
  const cells = [...row.children];
  return cells[index]?.textContent?.trim() || '';
}

function isChecked(row, index) {
  const text = getCellText(row, index).toLowerCase();
  return text === 'true' || text === 'on' || text === 'yes';
}

function buildLinkItem(row) {
  const label = getCellText(row, 0);
  if (!label) return null;

  const url = getCellText(row, 1) || '#';
  const newTab = isChecked(row, 2);
  const nofollow = isChecked(row, 3);

  const li = document.createElement('li');
  li.className = 'footer-legal-item';

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
