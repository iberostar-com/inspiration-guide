function createOption(row) {
  const cells = [...row.children];
  const label = cells[0]?.textContent?.trim() || '';
  const url = cells[1]?.textContent?.trim() || '#';

  const li = document.createElement('li');
  li.className = 'nav-language-menu-item';
  const a = document.createElement('a');
  a.href = url;
  a.textContent = label;
  li.append(a);
  return li;
}

/**
 * Nav Language Selector block: dropdown trigger (current language) + list of
 * language options (collection items).
 * @param {Element} block The nav-language block element
 */
export default function decorate(block) {
  const currentLabel = block.getAttribute('data-label') || 'ESP';
  const rows = [...block.children];

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-language-trigger nav-drop';
  trigger.textContent = currentLabel;
  trigger.setAttribute('aria-expanded', 'false');

  const menu = document.createElement('ul');
  menu.className = 'nav-language-menu';
  rows.forEach((row) => menu.append(createOption(row)));

  trigger.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });

  block.replaceChildren(trigger, menu);
}
