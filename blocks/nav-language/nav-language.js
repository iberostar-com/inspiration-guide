import { getTranslation } from '../../scripts/iberostar/i18n.js';
import { getLocaleFromPath } from '../../scripts/iberostar/placeholders.js';

const LOCALE_CODE = /^[a-z]{2}-[a-z]{2}$/i;
const GUIDE_SEGMENT = 'inspiration-guide';

function getPropElement(container, prop) {
  if (container?.matches?.(`[data-aue-prop="${prop}"]`)) return container;
  return container?.querySelector?.(`[data-aue-prop="${prop}"]`) || null;
}

function getTextFromField(field) {
  return field?.textContent?.trim() || '';
}

function getHrefFromField(field) {
  const anchor = field?.querySelector?.('a[href]');
  if (anchor) return anchor.getAttribute('href')?.trim() || '';
  return getTextFromField(field) || '';
}

function looksLikeUrl(value) {
  return /^(https?:)?\/\//i.test(value) || value.startsWith('/');
}

function isOptionRow(row) {
  if (getPropElement(row, 'label') && getPropElement(row, 'link')) return true;
  const cells = [...row.children];
  if (cells.length < 2) return false;
  const value = getTextFromField(cells[1]);
  return Boolean(row.querySelector('a[href]')) || looksLikeUrl(value) || LOCALE_CODE.test(value);
}

function getOptionsRows(block) {
  // Priority 1: Universal Editor multifield items
  const modelRows = [...block.querySelectorAll('[data-aue-model="nav-language-option"]')];
  if (modelRows.length) return modelRows;

  // Priority 2: direct children that look like an option row (label + url).
  // This deliberately skips block-level field rows (label / modalTitle).
  return [...block.children].filter(isOptionRow);
}

function normalizePathname(value) {
  try {
    return new URL(value, window.location).pathname.replace(/\/$/, '') || '/';
  } catch (error) {
    return '';
  }
}

/**
 * Resolves an authored option value into a navigable URL.
 * A bare locale code (e.g. "es-es") is expanded to the locale-first
 * Inspiration Guide home for the current environment (e.g. "/es-es/inspiration-guide/").
 * Any value that already looks like a path or URL is returned unchanged.
 * @param {string} value The authored value (locale code or full path/URL)
 * @returns {string}
 */
function resolveOptionUrl(value) {
  const raw = (value || '').trim();
  if (!raw) return '#';
  if (!LOCALE_CODE.test(raw)) return raw;

  const locale = raw.toLowerCase();
  return `/${GUIDE_SEGMENT}/${locale}/`;
}

function createOptionData(row) {
  const labelField = getPropElement(row, 'label');
  const linkField = getPropElement(row, 'link') || getPropElement(row, 'linkUrl');
  const cells = [...row.children];

  let label = getTextFromField(labelField) || getTextFromField(cells[0]);
  let url = getHrefFromField(linkField) || getHrefFromField(cells[1]);

  label = label?.trim() || '';
  url = resolveOptionUrl(url?.trim());

  if (!label) return null;
  return { label, url };
}

/**
 * Returns the option that matches the current page locale/path, if any.
 * @param {Array<{label:string,url:string}>} options
 * @returns {{label:string,url:string}|undefined}
 */
function findActiveOption(options) {
  const currentLocale = getLocaleFromPath();
  const currentPath = normalizePathname(window.location.pathname);

  const byLocale = options.find((option) => {
    const optionPath = normalizePathname(option.url);
    return optionPath !== '/' && getLocaleFromPath(optionPath) === currentLocale;
  });
  if (byLocale) return byLocale;

  return options.find((option) => normalizePathname(option.url) === currentPath);
}

function hideSourceRows(rows) {
  rows.forEach((row) => {
    row.classList.add('nav-language-source-row');
    row.setAttribute('aria-hidden', 'true');
  });
}

function createRenderedContainer(block) {
  const existing = block.querySelector(':scope > .nav-language-rendered');
  if (existing) existing.remove();

  const rendered = document.createElement('div');
  rendered.className = 'nav-language-rendered';
  block.classList.add('nav-language-enhanced');
  block.append(rendered);
  return rendered;
}

function buildTrigger(labelText) {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-language-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'dialog');

  const text = document.createElement('span');
  text.className = 'nav-language-trigger-text';
  text.textContent = labelText;

  const chevron = document.createElement('span');
  chevron.className = 'nav-language-trigger-chevron';
  chevron.setAttribute('aria-hidden', 'true');

  trigger.append(text, chevron);
  return trigger;
}

/**
 * Nav Language Selector block: modal trigger + language options modal.
 * @param {Element} block The nav-language block element
 */
export default async function decorate(block) {
  const optionRows = getOptionsRows(block);
  const options = optionRows.map(createOptionData).filter(Boolean);
  const activeOption = findActiveOption(options);

  // Block-level field rows (label / modalTitle) are everything that is not an option.
  const fieldRows = [...block.children].filter((child) => !optionRows.includes(child));

  const [modalTitleText, closeText] = await Promise.all([
    getTranslation(
      'chooseLanguage',
      getTextFromField(getPropElement(block, 'modalHeading'))
        || getTextFromField(fieldRows[1])
        || 'Selecciona un idioma',
    ),
    getTranslation('close', 'Cerrar'),
  ]);

  const authoredLabel = getTextFromField(getPropElement(block, 'label'))
    || getTextFromField(fieldRows[0])
    || block.getAttribute('data-label');

  const currentLabel = authoredLabel
    || activeOption?.label
    || options[0]?.label
    || 'ES';

  // Keep authored source for UE instrumentation, but hide it visually.
  hideSourceRows([...block.children]);
  const rendered = createRenderedContainer(block);

  // If only 0 or 1 options, render as link instead of modal.
  if (options.length <= 1) {
    const onlyOption = options[0];
    const triggerLink = document.createElement('a');
    triggerLink.className = 'nav-language-trigger nav-language-trigger-link';
    triggerLink.href = onlyOption?.url || '#';
    triggerLink.textContent = currentLabel;
    rendered.append(triggerLink);
    return;
  }

  const trigger = buildTrigger(currentLabel);

  // Modal backdrop (mounted on <body> so fixed positioning is never clipped).
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-language-modal-backdrop';
  backdrop.hidden = true;
  backdrop.setAttribute('aria-hidden', 'true');

  const modal = document.createElement('div');
  modal.className = 'nav-language-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', modalTitleText);
  modal.setAttribute('tabindex', '-1');

  const header = document.createElement('div');
  header.className = 'nav-language-modal-header';

  const title = document.createElement('h2');
  title.className = 'nav-language-modal-title';
  title.textContent = modalTitleText;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'nav-language-modal-close';
  closeBtn.setAttribute('aria-label', closeText);

  header.append(title, closeBtn);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'nav-language-modal-options';

  options.forEach((option) => {
    const optionLink = document.createElement('a');
    optionLink.href = option.url;
    optionLink.className = 'nav-language-option-button';
    optionLink.textContent = option.label;

    if (option === activeOption) {
      optionLink.classList.add('is-active');
      optionLink.setAttribute('aria-current', 'true');
    }

    // Reflect the chosen language in the trigger before navigating.
    optionLink.addEventListener('click', () => {
      trigger.querySelector('.nav-language-trigger-text').textContent = option.label;
    });

    optionsContainer.append(optionLink);
  });

  modal.append(header, optionsContainer);
  backdrop.append(modal);

  let keydownHandler;

  const getFocusable = () => [...modal.querySelectorAll('a[href], button:not([disabled])')];

  const closeModal = () => {
    backdrop.hidden = true;
    backdrop.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-language-modal-open');
    trigger.focus();
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
  };

  const openModal = () => {
    backdrop.hidden = false;
    backdrop.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-language-modal-open');
    (getFocusable()[0] || modal).focus();

    keydownHandler = (event) => {
      if (event.key === 'Escape') {
        closeModal();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', keydownHandler);
  };

  trigger.addEventListener('click', () => {
    if (trigger.getAttribute('aria-expanded') === 'true') {
      closeModal();
    } else {
      openModal();
    }
  });

  closeBtn.addEventListener('click', closeModal);

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      closeModal();
    }
  });

  rendered.append(trigger);
  document.body.append(backdrop);
}
