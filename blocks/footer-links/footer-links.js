import { moveInstrumentation } from '../../scripts/scripts.js';

let accordionCount = 0;

function getSourceRows(block) {
  return [...block.children].filter((row) => !row.classList.contains('footer-links-rendered'));
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
 * Footer Links block — renders a column title with an accordion-style
 * toggle on mobile and a flat list on tablet/desktop.
 * Content model: row[0] = title, row[1..n] = link items.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = getSourceRows(block);
  if (!rows.length) return;

  const titleRow = rows[0];
  const titleText = getCellText(titleRow, 0);
  const itemRows = rows.slice(1);

  accordionCount += 1;
  const listId = `footer-links-list-${accordionCount}`;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'footer-accordion-toggle';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', listId);

  const titleSpan = document.createElement('span');
  titleSpan.className = 'footer-column-title';
  titleSpan.textContent = titleText;

  const chevron = document.createElement('span');
  chevron.className = 'footer-accordion-chevron';
  chevron.setAttribute('aria-hidden', 'true');

  btn.append(titleSpan, chevron);
  moveInstrumentation(titleRow, btn);

  const ul = document.createElement('ul');
  ul.id = listId;

  itemRows.forEach((row) => {
    const li = buildLinkItem(row);
    if (li) ul.append(li);
  });

  const rendered = document.createElement('div');
  rendered.className = 'footer-links-rendered';
  rendered.append(btn, ul);

  rows.forEach((row) => row.setAttribute('aria-hidden', 'true'));
  block.append(rendered);

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });
}
