/**
 * Form block with variants
 * Supports: default, newsletter
 * @param {Element} block The form block element
 */

/**
 * Newsletter form decoration
 * Ensures gray background, email field, checkbox, submit
 */
function decorateNewsletterForm(block) {
  block.classList.add('form-newsletter');

  // Find or create form element
  let form = block.querySelector('form');
  if (!form) {
    form = document.createElement('form');
    form.method = block.getAttribute('data-method') || 'POST';
    form.action = block.getAttribute('data-action') || '/api/newsletter';
    block.appendChild(form);
  }

  // Ensure form attributes
  form.method = form.method || 'POST';
  form.action = form.action || block.getAttribute('data-action') || '/api/newsletter';

  // Process form fields
  const emailField = form.querySelector('input[type="email"]');
  if (emailField) {
    emailField.placeholder = emailField.placeholder || 'Enter your email';
    emailField.required = true;
    emailField.className = 'form-field-email';
  }

  // Legal checkbox
  const legalCheckbox = form.querySelector('input[type="checkbox"]');
  if (legalCheckbox) {
    legalCheckbox.required = true;
    legalCheckbox.className = 'form-field-checkbox';

    // Create label if doesn't exist
    const existingLabel = form.querySelector(`label[for="${legalCheckbox.id || ''}"]`);
    if (!existingLabel && legalCheckbox.id) {
      const label = document.createElement('label');
      label.htmlFor = legalCheckbox.id;
      label.textContent = 'I agree to receive newsletters';
      label.className = 'form-field-label';
      legalCheckbox.parentElement.insertBefore(label, legalCheckbox.nextSibling);
    }
  }

  // Submit button
  const submit = form.querySelector('button[type="submit"]');
  if (submit) {
    submit.textContent = submit.textContent || 'Subscribe';
    submit.className = 'form-submit-button';
  }
}

/**
 * Default form decoration (minimal)
 */
function decorateDefaultForm(block) {
  block.classList.add('form-default');

  let form = block.querySelector('form');
  if (!form) {
    form = document.createElement('form');
    form.method = block.getAttribute('data-method') || 'POST';
    form.action = block.getAttribute('data-action') || '';
    block.appendChild(form);
  }

  form.method = form.method || 'POST';
}

export default async function decorate(block) {
  const variant = block.getAttribute('data-variant') || 'default';

  if (variant === 'newsletter') {
    decorateNewsletterForm(block);
  } else {
    decorateDefaultForm(block);
  }
}
