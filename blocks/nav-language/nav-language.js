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
  // Priority 1: Universal Editor multifield items
  const modelRows = [...block.querySelectorAll('[data-aue-model="nav-language-option"]')];
  if (modelRows.length) return modelRows;

  // Priority 2: All direct children (fallback for previewed/plain HTML content)
  return [...block.children].filter((child) => {
    // Skip rows that only contain a title/label field
    const hasLabel = getPropElement(child, 'label');
    const hasLink = getPropElement(child, 'link');
    // If it has both AUE props, it's a complete option row
    if (hasLabel && hasLink) return true;
    // If it has 2+ cells, treat as option row
    return child.children.length >= 2;
  });
}

function createOptionData(row) {
  const labelField = getPropElement(row, 'label');
  const linkField = getPropElement(row, 'link');

  const cells = [...row.children];
  
  // Try AUE fields first, then fall back to cells
  let label = getTextFromField(labelField);
  let url = getHrefFromField(linkField);
  
  // Fallback to cell positions if no AUE fields
  if (!label && cells[0]) {
    label = getTextFromField(cells[0]);
  }
  if (!url && cells[1]) {
    url = getHrefFromField(cells[1]);
  }

  // Trim and validate
  label = label?.trim() || '';
  url = url?.trim() || '#';

  if (!label) return null;
  return { label, url };
}

/**
 * Nav Language Selector block: modal trigger + language options modal.
 * @param {Element} block The nav-language block element
 */
export default function decorate(block) {
  // Get current language label
  const currentLabel = getTextFromField(getPropElement(block, 'label'))
    || block.getAttribute('data-label')
    || 'ESP';
  
  // Extract all option rows
  const rows = getOptionsRows(block);
  const options = rows.map(createOptionData).filter(Boolean);

  // Hide source rows but preserve content
  rows.forEach((row) => row.setAttribute('aria-hidden', 'true'));

  // If only 0 or 1 options, render as link instead of modal
  if (options.length <= 1) {
    const onlyOption = options[0];
    const triggerLink = document.createElement('a');
    triggerLink.className = 'nav-language-trigger nav-language-trigger-link';
    triggerLink.href = onlyOption?.url || '#';
    triggerLink.textContent = currentLabel;
    block.replaceChildren(triggerLink);
    return;
  }

  // Create trigger button
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-language-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.textContent = currentLabel;

  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-language-modal-backdrop';
  backdrop.hidden = true;
  backdrop.setAttribute('aria-hidden', 'true');

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'nav-language-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Seleccionar idioma');

  // Modal header
  const header = document.createElement('div');
  header.className = 'nav-language-modal-header';

  const title = document.createElement('h2');
  title.className = 'nav-language-modal-title';
  title.textContent = 'Selecciona un idioma';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'nav-language-modal-close';
  closeBtn.setAttribute('aria-label', 'Cerrar');
  closeBtn.textContent = '✕';

  header.append(title, closeBtn);

  // Modal options grid
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'nav-language-modal-options';

  options.forEach((option) => {
    const optionBtn = document.createElement('a');
    optionBtn.href = option.url;
    optionBtn.className = 'nav-language-option-button';
    optionBtn.textContent = option.label;
    optionsContainer.append(optionBtn);
  });

  modal.append(header, optionsContainer);
  backdrop.append(modal);

  // Event: Open/close modal via button
  trigger.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    if (!expanded) {
      backdrop.hidden = false;
      backdrop.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');
      modal.focus();
    } else {
      backdrop.hidden = true;
      backdrop.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  // Event: Close via close button
  closeBtn.addEventListener('click', () => {
    backdrop.hidden = true;
    backdrop.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  });

  // Event: Close via backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.hidden = true;
      backdrop.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  });

  // Event: Close via Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !backdrop.hidden) {
      backdrop.hidden = true;
      backdrop.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  });

  block.replaceChildren(trigger, backdrop);
}
