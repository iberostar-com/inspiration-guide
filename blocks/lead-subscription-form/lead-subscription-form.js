import { getClientCountry } from '../../scripts/iberostar/client-country.js';

const DEFAULTS = {
  placeholder: 'Escribe aquí tu email',
  submitLabel: 'Suscribirme',
  errorGeneric: 'Ha habido un error. Por favor, inténtalo de nuevo más tarde.',
  errorEmail: 'Por favor, introduce una dirección de correo electrónico válida',
  errorCheck: 'Por favor, acepta nuestros Términos y Condiciones.',
  successTitle: '¡Gracias por suscribirte!',
  successDescription: 'Revisa tu bandeja de correo para confirmar tu email.',
};

const NEWSLETTER_PATH = '/bin/catalog/mulesoft/newsletter';
const AEM_CLOUD_PUBLISH_ORIGIN = 'https://publish-p179213-e1886364.adobeaemcloud.com';
const RESET_DELAY = 5000;

function getText(cell, fallback = '') {
  return cell?.textContent.trim() || fallback;
}

function getHtml(cell, fallback = '') {
  return cell?.innerHTML.trim() || fallback;
}

function getGroupedText(cell) {
  if (!cell) {
    return [];
  }

  const values = Array.from(cell.children)
    .map((child) => child.textContent.trim())
    .filter(Boolean);

  return values.length ? values : [cell.textContent.trim()].filter(Boolean);
}

function getBackgroundVariant(value) {
  const normalized = value.trim().toLowerCase();
  return normalized === 'white' ? 'white' : 'grey';
}

function isEdgeDeliveryHost(hostname) {
  return hostname.endsWith('.aem.live') || hostname.endsWith('.aem.page');
}

function isLocalHost(hostname) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
}

function shouldUseAemPublishOrigin(url) {
  if (url.pathname !== NEWSLETTER_PATH) {
    return false;
  }

  return isEdgeDeliveryHost(window.location.hostname) || isLocalHost(window.location.hostname);
}
function buildNewsletterUrl() {
  let url = new URL(NEWSLETTER_PATH, window.location.origin);
  if (shouldUseAemPublishOrigin(url)) {
    url = new URL(NEWSLETTER_PATH, AEM_CLOUD_PUBLISH_ORIGIN);
  }

  return url.toString();
}

function isEmailValid(input) {
  const value = input?.value.trim().toLowerCase() || '';

  if (!value || /\s/.test(value)) {
    return false;
  }

  const parts = value.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;
  if (!localPart || !domain) {
    return false;
  }

  const dotIndex = domain.lastIndexOf('.');
  return dotIndex > 0 && dotIndex < domain.length - 1;
}

function createAlert(type, text) {
  const alert = document.createElement('p');
  alert.className = `lead-subscription-form-alert lead-subscription-form-alert-${type}`;
  alert.setAttribute('role', 'alert');
  alert.setAttribute('aria-live', 'assertive');
  alert.hidden = true;
  alert.textContent = text;
  return alert;
}

function showError(state, type) {
  const error = state.errors[type];
  if (!error) {
    return;
  }

  error.hidden = false;

  if (type === 'email') {
    state.emailField?.focus();
  }

  if (type === 'check') {
    state.checkbox?.focus();
  }
}

function resetErrors(state) {
  Object.values(state.errors).forEach((error) => {
    if (error) {
      error.hidden = true;
    }
  });
}

function setLoading(state, isLoading) {
  state.isSubmitting = isLoading;

  if (isLoading) {
    state.submit.setAttribute('disabled', '');
    state.submit.setAttribute('aria-busy', 'true');
  } else {
    state.submit.removeAttribute('disabled');
    state.submit.setAttribute('aria-busy', 'false');
  }
}

function resetModule(state) {
  state.form.reset();
  resetErrors(state);
  state.success.hidden = true;
  state.form.hidden = false;
  setLoading(state, false);
}

function startResetTimer(state) {
  if (state.resetTimer) {
    clearTimeout(state.resetTimer);
  }

  state.resetTimer = setTimeout(() => resetModule(state), RESET_DELAY);
}

function handleSuccess(state) {
  const email = state.emailField.value.trim().toLowerCase();

  state.form.hidden = true;
  state.success.hidden = false;
  state.block.dispatchEvent(new CustomEvent('ibs:newsletter:success', {
    bubbles: false,
    detail: { email },
  }));
  startResetTimer(state);
}

function handleFailure(state, type = 'generic') {
  const email = state.emailField.value.trim().toLowerCase();

  showError(state, type);
  state.block.dispatchEvent(new CustomEvent('ibs:newsletter:error', {
    bubbles: false,
    detail: {
      errorType: type,
      email,
    },
  }));
  startResetTimer(state);
}

async function submitNewsletter(state) {
  try {
    setLoading(state, true);

    const country = await getClientCountry();
    const response = await fetch(buildNewsletterUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: state.emailField.value.trim().toLowerCase(),
        pagePath: window.location.pathname,
        country,
        countryIso2: country.toUpperCase(),
      }),
    });

    if (response.ok) {
      handleSuccess(state);
      return;
    }

    handleFailure(state, 'generic');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Newsletter error:', error);
    handleFailure(state, 'generic');
  } finally {
    if (!state.form.hidden) {
      setLoading(state, false);
    }
  }
}

function bindEvents(state) {
  state.form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (state.isSubmitting) {
      return;
    }

    resetErrors(state);

    if (!isEmailValid(state.emailField)) {
      showError(state, 'email');
      return;
    }

    if (state.checkbox && !state.checkbox.checked) {
      showError(state, 'check');
      return;
    }

    submitNewsletter(state);
  });
}

function buildForm(block, config) {
  const form = document.createElement('form');
  form.className = 'lead-subscription-form-form';
  form.noValidate = true;

  const fields = document.createElement('div');
  fields.className = 'lead-subscription-form-fields';

  const emailField = document.createElement('input');
  emailField.type = 'email';
  emailField.name = 'email';
  emailField.required = true;
  emailField.placeholder = config.placeholder;
  emailField.setAttribute('aria-label', config.placeholder);
  fields.append(emailField);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = config.submitLabel;
  submit.setAttribute('aria-busy', 'false');
  fields.append(submit);

  form.append(fields);

  const errors = {
    generic: createAlert('generic', config.errorGeneric),
    email: createAlert('email', config.errorEmail),
    check: createAlert('check', config.errorCheck),
  };
  form.append(errors.generic, errors.email, errors.check);

  let checkbox;
  if (config.legalHTML) {
    const label = document.createElement('label');
    label.className = 'lead-subscription-form-legal';

    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'legal';
    label.append(checkbox);

    const legalSpan = document.createElement('span');
    legalSpan.innerHTML = config.legalHTML;
    label.append(legalSpan);

    form.append(label);
  }

  const success = document.createElement('div');
  success.className = 'lead-subscription-form-success';
  success.hidden = true;

  if (config.successTitle) {
    const title = document.createElement('p');
    title.className = 'lead-subscription-form-success-title';
    title.textContent = config.successTitle;
    success.append(title);
  }

  if (config.successDescription) {
    const description = document.createElement('p');
    description.className = 'lead-subscription-form-success-description';
    description.textContent = config.successDescription;
    success.append(description);
  }

  bindEvents({
    block,
    form,
    emailField,
    checkbox,
    submit,
    errors,
    success,
    config,
    isSubmitting: false,
    resetTimer: null,
  });

  return { form, success };
}

/**
 * Lead Subscription Form block.
 * Source rows are kept in place for Universal Editor and hidden via CSS.
 * @param {Element} block The lead-subscription-form block element
 */
export default async function decorate(block) {
  const sourceRows = Array.from(block.children);
  const cells = Array.from(block.querySelectorAll(':scope > div > div'));
  const settings = getGroupedText(cells[3]);

  const config = {
    title: getText(cells[0]),
    description: getText(cells[1]),
    legalHTML: getHtml(cells[2]),
    background: getBackgroundVariant(settings[0] || getText(cells[3], 'grey')),
    placeholder: settings[1] || getText(cells[4], DEFAULTS.placeholder),
    submitLabel: settings[2] || getText(cells[5], DEFAULTS.submitLabel),
    errorGeneric: settings[3] || getText(cells[6], DEFAULTS.errorGeneric),
    errorEmail: settings[4] || getText(cells[7], DEFAULTS.errorEmail),
    errorCheck: settings[5] || getText(cells[8], DEFAULTS.errorCheck),
    successTitle: settings[6] || getText(cells[9], DEFAULTS.successTitle),
    successDescription: settings[7] || getText(cells[10], DEFAULTS.successDescription),
  };

  block.classList.remove('lead-subscription-form-grey', 'lead-subscription-form-white');
  block.classList.add(`lead-subscription-form-${config.background}`);
  sourceRows.forEach((row) => row.classList.add('lead-subscription-form-source'));

  const rendered = document.createElement('div');
  rendered.className = 'lead-subscription-form-rendered';

  const content = document.createElement('div');
  content.className = 'lead-subscription-form-content';
  if (config.title) {
    const h2 = document.createElement('h2');
    h2.textContent = config.title;
    content.append(h2);
  }
  if (config.description) {
    const p = document.createElement('p');
    p.textContent = config.description;
    content.append(p);
  }

  const formArea = document.createElement('div');
  formArea.className = 'lead-subscription-form-form-area';
  const { form, success } = buildForm(block, config);
  formArea.append(form, success);

  rendered.append(content, formArea);
  block.append(rendered);
}
