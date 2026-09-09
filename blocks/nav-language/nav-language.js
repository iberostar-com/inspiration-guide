import { getTranslation } from '../../scripts/iberostar/i18n.js';
import { getLocaleFromPath } from '../../scripts/iberostar/placeholders.js';
import {
  CURRENCY_CHANGE_EVENT,
  getCurrencyDisplayName,
  getCurrencyMetadata,
  getSelectedCurrency,
  getSupportedCurrencies,
  isConversionAvailable,
  isCurrencySelectorEnabled,
  setSelectedCurrency,
} from '../../scripts/iberostar/currency.js';

const LOCALE_CODE = /^[a-z]{2}-[a-z]{2}$/i;
const GUIDE_SEGMENT = 'inspiration-guide';

let instanceCounter = 0;

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

function normalizeTarget(value = '') {
  const text = `${value}`.trim().toLowerCase();
  if (!text) return '_self';
  if (text === '_blank' || text.includes('nueva')) return '_blank';
  return '_self';
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
  return `/${locale}/${GUIDE_SEGMENT}/`;
}

function createOptionData(row) {
  const labelField = getPropElement(row, 'label');
  const linkField = getPropElement(row, 'link') || getPropElement(row, 'linkUrl');
  const targetField = getPropElement(row, 'target');
  const cells = [...row.children];

  let label = getTextFromField(labelField) || getTextFromField(cells[0]);
  let url = getHrefFromField(linkField) || getHrefFromField(cells[1]);
  const target = normalizeTarget(getTextFromField(targetField) || getTextFromField(cells[2]) || '_self');

  label = label?.trim() || '';
  url = resolveOptionUrl(url?.trim());

  if (!label) return null;
  return { label, url, target };
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

function buildTriggerText(langLabel, currencyCode) {
  const text = document.createElement('span');
  text.className = 'nav-language-trigger-text';

  const lang = document.createElement('span');
  lang.className = 'nav-language-trigger-lang';
  lang.textContent = langLabel;
  text.append(lang);

  if (currencyCode) {
    const separator = document.createElement('span');
    separator.className = 'nav-language-trigger-separator';
    separator.setAttribute('aria-hidden', 'true');
    separator.textContent = '|';

    const currency = document.createElement('span');
    currency.className = 'nav-language-trigger-currency';
    currency.textContent = currencyCode;

    text.append(separator, currency);
  }

  return text;
}

function buildTrigger(langLabel, currencyCode) {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-language-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'dialog');

  const chevron = document.createElement('span');
  chevron.className = 'nav-language-trigger-chevron';
  chevron.setAttribute('aria-hidden', 'true');

  trigger.append(buildTriggerText(langLabel, currencyCode), chevron);
  return trigger;
}

function buildTab(key, label, instanceId) {
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = 'nav-language-tab';
  tab.id = `nav-language-tab-${key}-${instanceId}`;
  tab.dataset.tab = key;
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-selected', 'false');
  tab.setAttribute('aria-controls', `nav-language-panel-${key}-${instanceId}`);
  tab.textContent = label;
  return tab;
}

function buildPanel(key, titleText, instanceId) {
  const panel = document.createElement('div');
  panel.className = 'nav-language-panel';
  panel.id = `nav-language-panel-${key}-${instanceId}`;
  panel.dataset.panel = key;
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `nav-language-tab-${key}-${instanceId}`);

  const title = document.createElement('h2');
  title.className = 'nav-language-modal-title';
  title.textContent = titleText;
  panel.append(title);

  return panel;
}

function buildCurrencyOption(code, displayName, selectedCurrency) {
  const metadata = getCurrencyMetadata(code);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-language-currency-button';
  button.dataset.currency = code;

  const name = document.createElement('span');
  name.className = 'nav-language-currency-name';
  name.textContent = displayName || metadata?.nameFallback || code;

  const codeLine = document.createElement('span');
  codeLine.className = 'nav-language-currency-code';
  codeLine.textContent = `${code}${metadata?.symbol ? ` - ${metadata.symbol}` : ''}`;

  button.append(name, codeLine);

  const isActive = code === selectedCurrency;
  button.classList.toggle('is-active', isActive);
  button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  return button;
}

/**
 * Nav Language Selector block: "ESP | EUR" trigger + modal with
 * Language / Currency tabs (aligned with iberostar.com behavior).
 * @param {Element} block The nav-language block element
 */
export default async function decorate(block) {
  instanceCounter += 1;
  const instanceId = instanceCounter;

  const optionRows = getOptionsRows(block);
  const options = optionRows.map(createOptionData).filter(Boolean);
  const activeOption = findActiveOption(options);

  // Block-level field rows (label / modalTitle) are everything that is not an option.
  const fieldRows = [...block.children].filter((child) => !optionRows.includes(child));

  const [
    modalTitleText,
    closeText,
    currencyTitleText,
    languageTabText,
    currencyTabText,
  ] = await Promise.all([
    getTranslation(
      'chooseLanguage',
      getTextFromField(getPropElement(block, 'modalHeading'))
        || getTextFromField(fieldRows[1])
        || 'Selecciona un idioma',
    ),
    getTranslation('close', 'Cerrar'),
    getTranslation('chooseCurrency', 'Selecciona una moneda'),
    getTranslation('languageTabLabel', 'Idioma'),
    getTranslation('currencyTabLabel', 'Moneda'),
  ]);

  const authoredLabel = getTextFromField(getPropElement(block, 'label'))
    || getTextFromField(fieldRows[0])
    || block.getAttribute('data-label');

  // Like iberostar.com, the trigger shows the full label of the active
  // language option ("English US | EUR"); authored label is the fallback.
  const currentLabel = activeOption?.label
    || authoredLabel
    || options[0]?.label
    || 'Español';

  const currencyEnabled = isCurrencySelectorEnabled();
  const selectedCurrency = currencyEnabled ? getSelectedCurrency() : '';

  // Hydrate page-level state (body dataset) without emitting or re-persisting.
  if (currencyEnabled) {
    setSelectedCurrency(selectedCurrency, { emit: false, persist: false });
  }

  // Keep authored source for UE instrumentation, but hide it visually.
  hideSourceRows([...block.children]);
  const rendered = createRenderedContainer(block);

  const updateTriggerCurrency = (code) => {
    const currencySpan = rendered.querySelector('.nav-language-trigger-currency');
    if (currencySpan) currencySpan.textContent = code;
  };

  const removeTriggerCurrency = () => {
    rendered.querySelector('.nav-language-trigger-separator')?.remove();
    rendered.querySelector('.nav-language-trigger-currency')?.remove();
  };

  // If only 0 or 1 options, render as link instead of modal.
  if (options.length <= 1) {
    const onlyOption = options[0];
    const triggerLink = document.createElement('a');
    triggerLink.className = 'nav-language-trigger nav-language-trigger-link';
    triggerLink.href = onlyOption?.url || '#';
    if (onlyOption?.target === '_blank') {
      triggerLink.target = '_blank';
      triggerLink.rel = 'noopener';
    }
    triggerLink.append(buildTriggerText(currentLabel, selectedCurrency));
    rendered.append(triggerLink);

    if (currencyEnabled) {
      document.addEventListener(CURRENCY_CHANGE_EVENT, (event) => {
        if (event.detail?.currency) updateTriggerCurrency(event.detail.currency);
      });
      isConversionAvailable().then((available) => {
        if (!available) removeTriggerCurrency();
      });
    }
    return;
  }

  const trigger = buildTrigger(currentLabel, selectedCurrency);

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

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'nav-language-modal-close';
  closeBtn.setAttribute('aria-label', closeText);

  const languagePanel = buildPanel('language', modalTitleText, instanceId);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'nav-language-modal-options';

  options.forEach((option) => {
    const optionLink = document.createElement('a');
    optionLink.href = option.url;
    if (option.target === '_blank') {
      optionLink.target = '_blank';
      optionLink.rel = 'noopener';
    }
    optionLink.className = 'nav-language-option-button';
    optionLink.textContent = option.label;

    if (option === activeOption) {
      optionLink.classList.add('is-active');
      optionLink.setAttribute('aria-current', 'true');
    }

    // Reflect the chosen language in the trigger before navigating.
    optionLink.addEventListener('click', () => {
      const langSpan = trigger.querySelector('.nav-language-trigger-lang');
      if (langSpan) langSpan.textContent = option.label;
    });

    optionsContainer.append(optionLink);
  });

  languagePanel.append(optionsContainer);

  let tablist = null;
  let currencyPanel = null;

  if (currencyEnabled) {
    tablist = document.createElement('div');
    tablist.className = 'nav-language-tabs';
    tablist.setAttribute('role', 'tablist');

    const languageTab = buildTab('language', languageTabText, instanceId);
    const currencyTab = buildTab('currency', currencyTabText, instanceId);
    tablist.append(languageTab, currencyTab);

    currencyPanel = buildPanel('currency', currencyTitleText, instanceId);
    currencyPanel.hidden = true;

    const currencyOptions = document.createElement('div');
    currencyOptions.className = 'nav-language-modal-options nav-language-modal-options-currency';

    const supportedCurrencies = getSupportedCurrencies();
    const displayNames = await Promise.all(
      supportedCurrencies.map((code) => getCurrencyDisplayName(code)),
    );
    supportedCurrencies.forEach((code, index) => {
      currencyOptions.append(buildCurrencyOption(code, displayNames[index], selectedCurrency));
    });
    currencyPanel.append(currencyOptions);

    const activateTab = (key) => {
      [languageTab, currencyTab].forEach((tab) => {
        const isSelected = tab.dataset.tab === key;
        tab.classList.toggle('is-active', isSelected);
        tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });
      languagePanel.hidden = key !== 'language';
      currencyPanel.hidden = key !== 'currency';
    };
    activateTab('language');

    tablist.addEventListener('click', (event) => {
      const tab = event.target.closest('.nav-language-tab');
      if (tab) activateTab(tab.dataset.tab);
    });

    // Currency selection: persist + emit, keep the modal open (AEM parity).
    currencyOptions.addEventListener('click', (event) => {
      const button = event.target.closest('.nav-language-currency-button');
      if (button?.dataset.currency) setSelectedCurrency(button.dataset.currency);
    });

    document.addEventListener(CURRENCY_CHANGE_EVENT, (event) => {
      const code = event.detail?.currency;
      if (!code) return;
      updateTriggerCurrency(code);
      [...currencyOptions.children].forEach((button) => {
        const isActive = button.dataset.currency === code;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    });
  }

  if (tablist) header.append(tablist);
  header.append(closeBtn);

  modal.append(header, languagePanel);
  if (currencyPanel) modal.append(currencyPanel);
  backdrop.append(modal);

  // Degrade to the language-only selector when exchange rates are unreachable
  // (e.g. CORS not yet enabled on the AEM publish tier).
  if (currencyEnabled) {
    isConversionAvailable().then((available) => {
      if (available) return;
      removeTriggerCurrency();
      tablist?.remove();
      currencyPanel?.remove();
      languagePanel.hidden = false;
    });
  }

  let keydownHandler;

  const getFocusable = () => [...modal.querySelectorAll('a[href], button:not([disabled])')]
    .filter((element) => !element.closest('[hidden]'));

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
