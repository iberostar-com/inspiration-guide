function getPropElement(container, prop) {
  if (container?.matches?.(`[data-aue-prop="${prop}"]`)) return container;
  return container?.querySelector?.(`[data-aue-prop="${prop}"]`) || null;
}

function getTextFromField(field) {
  return field?.textContent?.trim() || '';
}

function getHrefFromField(field) {
  const anchor = field?.querySelector?.('a[href]');
  if (anchor) return anchor.getAttribute('href')?.trim() || '#';
  return getTextFromField(field) || '#';
}

function getOptionsRows(block) {
  const modelRows = [...block.querySelectorAll('[data-aue-model="nav-language-option"]')];
  if (modelRows.length) return modelRows;
  return [...block.children];
}

function createOptionData(row) {
  const labelField = getPropElement(row, 'label');
  const linkField = getPropElement(row, 'link');

  const cells = [...row.children];
  const label = getTextFromField(labelField) || cells[0]?.textContent?.trim() || '';
  const url = getHrefFromField(linkField) || cells[1]?.textContent?.trim() || '#';

  if (!label) return null;
  return { label, url };
}

function createOption(data) {
  const { label, url } = data;

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
  const currentLabel = getTextFromField(getPropElement(block, 'label'))
    || block.getAttribute('data-label')
    || 'ESP';
  const rows = getOptionsRows(block);
  const options = rows.map(createOptionData).filter(Boolean);

  rows.forEach((row) => row.setAttribute('aria-hidden', 'true'));

  const triggerLabel = document.createElement('span');
  triggerLabel.className = 'nav-language-trigger-label';
  triggerLabel.textContent = currentLabel;

  if (options.length <= 1) {
    const onlyOption = options[0];
    const triggerLink = document.createElement('a');
    triggerLink.className = 'nav-language-trigger nav-language-trigger-link';
    triggerLink.href = onlyOption?.url || '#';
    triggerLink.append(triggerLabel);

    block.replaceChildren(triggerLink);
    return;
  }

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-language-trigger nav-drop';
  trigger.setAttribute('aria-expanded', 'false');

  const triggerIcon = document.createElement('i');
  triggerIcon.className = 'nav-language-trigger-icon ibh-icon-keyboard-arrow-down';
  triggerIcon.setAttribute('aria-hidden', 'true');

  trigger.append(triggerLabel, triggerIcon);

  const menu = document.createElement('ul');
  menu.className = 'nav-language-menu';
  options.forEach((option) => menu.append(createOption(option)));

  trigger.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });

  block.replaceChildren(trigger, menu);
}
