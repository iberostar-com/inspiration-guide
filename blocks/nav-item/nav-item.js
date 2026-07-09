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
  const label = cellText(propElement(el, 'label') || cells[0]);
  const link = cellLink(propElement(el, 'link') || cells[1]);
  return { label, link };
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
  let configRows = rows.filter((row) => !isChildRow(row));

  // target select: its value renders as plain text (_self/_blank), no data-aue-prop.
  const targetEl = propElement(block, 'target')
    || configRows.find((row) => /^(_self|_blank|misma pesta|nueva pesta)/i.test(cellText(row)));
  const target = /blank|nueva/i.test(cellText(targetEl)) ? '_blank' : '_self';
  if (targetEl) {
    configRows = configRows.filter((row) => row !== targetEl && !row.contains?.(targetEl));
  }

  const label = cellText(propElement(block, 'label') || configRows[0]);
  const link = cellLink(propElement(block, 'link') || configRows[1]);

  let children = childRows.map(readChild);
  if (!childRows.length && configRows.length > 2) {
    children = configRows.slice(2).map((row) => {
      const cells = [...row.children];
      return { label: cellText(cells[0]), link: cellLink(cells[1]) };
    });
  }

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
      if (child.label.toLowerCase().includes('ver todos')) {
        li.classList.add('nav-item-view-all');
      }

      const anchor = document.createElement('a');
      anchor.href = child.link || '#';
      anchor.textContent = child.label;
      applyTarget(anchor, target);
      li.append(anchor);
      list.append(li);
    });

    panel.append(list);
    block.append(panel);
  }
}
