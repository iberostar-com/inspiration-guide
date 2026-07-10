const CHILD_MODEL = 'nav-item-child';

function cellText(cell) {
  return cell?.textContent?.trim() || '';
}

function cellLink(cell) {
  const anchor = cell?.querySelector?.('a[href]');
  return anchor?.getAttribute('href')?.trim() || cellText(cell);
}

function propElement(root, prop) {
  if (root?.matches?.(`[data-aue-prop="${prop}"]`)) return root;
  return root?.querySelector?.(`[data-aue-prop="${prop}"]`) || null;
}

function isChildRow(row) {
  return !!(row.matches?.(`[data-aue-model="${CHILD_MODEL}"]`)
    || row.querySelector?.(`[data-aue-model="${CHILD_MODEL}"]`));
}

function readChild(row) {
  const el = row.matches?.(`[data-aue-model="${CHILD_MODEL}"]`)
    ? row
    : row.querySelector(`[data-aue-model="${CHILD_MODEL}"]`) || row;
  const cells = [...el.children];
  const targetCell = (el.querySelector('[data-aue-prop="target"]'))
    || cells.find((cell) => /^_(self|blank)$/i.test(cell.textContent?.trim() || ''));
  const label = cellText(propElement(el, 'label') || cells[0]);
  const link = cellLink(propElement(el, 'link') || cells[1]);
  const target = /blank|nueva/i.test(cellText(targetCell)) ? '_blank' : '_self';
  return { label, link, target };
}

function applyTarget(anchor, target) {
  if (target === '_blank') {
    anchor.target = '_blank';
    anchor.rel = 'noopener';
  }
}

export default function decorate(block) {
  const rows = [...block.children];
  const childRows = rows.filter(isChildRow);
  const nonChild = rows.filter((row) => !isChildRow(row));
  const authored = childRows.length > 0;

  // Local mock (no nav-item-child rows): field rows have 1 cell, child rows have 2.
  const fieldRows = authored ? nonChild : nonChild.filter((row) => row.children.length < 2);
  const positionalChildren = authored ? [] : nonChild.filter((row) => row.children.length >= 2);

  // Selects (target, viewAllTarget) render their value (_self/_blank) as plain text
  // with no data-aue-prop; separate them from the text/link fields, keeping order.
  const selectRows = fieldRows.filter((row) => /^_(self|blank)$/i.test(cellText(row)));
  const target = /blank/i.test(cellText(selectRows[0])) ? '_blank' : '_self';
  const viewAllTarget = /blank/i.test(cellText(selectRows[1])) ? '_blank' : '_self';

  const textFields = fieldRows.filter((row) => !selectRows.includes(row));
  const label = cellText(propElement(block, 'label') || textFields[0]);
  const link = cellLink(propElement(block, 'link') || textFields[1]);
  const viewAllText = cellText(propElement(block, 'viewAllText') || textFields[2]);
  const viewAllLink = cellLink(propElement(block, 'viewAllLink') || textFields[3]);

  const children = authored
    ? childRows.map(readChild)
    : positionalChildren.map((row) => {
      const cells = [...row.children];
      const targetCell = cells.find((cell) => /^_(self|blank)$/i.test(cell.textContent?.trim() || ''));
      const rest = cells.filter((cell) => cell !== targetCell);
      return {
        label: cellText(rest[0]),
        link: cellLink(rest[1]),
        target: /blank/i.test(cellText(targetCell)) ? '_blank' : '_self',
      };
    });

  const hasChildren = children.length > 0;

  rows.forEach((row) => {
    row.classList.add('nav-item-source');
    row.setAttribute('aria-hidden', 'true');
  });

  const content = document.createElement('div');
  content.className = 'nav-item-content';

  const linkEl = document.createElement('a');
  linkEl.className = 'nav-item-link';
  linkEl.href = link || children[0]?.link || '#';
  linkEl.textContent = label;
  applyTarget(linkEl, target);
  content.append(linkEl);

  if (hasChildren) {
    block.classList.add('nav-item-has-children');
    block.setAttribute('aria-expanded', 'false');

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-item-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', `Toggle ${label} submenu`);
    toggle.innerHTML = '<i class="ibh-icon-keyboard-arrow-down" aria-hidden="true"></i>';
    content.append(toggle);
  }

  block.append(content);

  if (hasChildren) {
    const panel = document.createElement('div');
    panel.className = 'nav-item-panel';

    const list = document.createElement('ul');
    list.className = 'nav-item-dropdown';

    children.forEach((child) => {
      const li = document.createElement('li');
      li.className = 'nav-item-dropdown-item';
      const anchor = document.createElement('a');
      anchor.href = child.link || '#';
      anchor.textContent = child.label;
      applyTarget(anchor, child.target);
      li.append(anchor);
      list.append(li);
    });

    if (viewAllText) {
      const li = document.createElement('li');
      li.className = 'nav-item-dropdown-item nav-item-view-all';
      const anchor = document.createElement('a');
      anchor.href = viewAllLink || '#';
      anchor.textContent = viewAllText;
      applyTarget(anchor, viewAllTarget);
      li.append(anchor);
      list.append(li);
    }

    panel.append(list);
    block.append(panel);
  }
}
