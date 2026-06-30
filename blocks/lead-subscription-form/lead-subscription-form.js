const DEFAULT_PLACEHOLDER = 'Escribe aquí tu email';
const DEFAULT_SUBMIT_LABEL = 'Suscribirme';

/**
 * Lead Subscription Form block: title + description + email field + legal checkbox
 * Structure from AEM: cells[0]=title, cells[1]=description, cells[2]=legalText (richtext),
 * cells[3]=background (select: white/grey)
 * @param {Element} block The lead-subscription-form block element
 */
export default async function decorate(block) {
  const cells = Array.from(block.querySelectorAll(':scope > div > div'));

  const title = cells[0]?.textContent.trim() || '';
  const description = cells[1]?.textContent.trim() || '';
  const legalHTML = cells[2]?.innerHTML.trim() || '';
  const background = (cells[3]?.textContent.trim() || 'grey').toLowerCase();

  block.classList.add(`lead-subscription-form-${background === 'white' ? 'white' : 'grey'}`);

  const content = document.createElement('div');
  content.className = 'lead-subscription-form-content';
  if (title) {
    const h2 = document.createElement('h2');
    h2.textContent = title;
    content.appendChild(h2);
  }
  if (description) {
    const p = document.createElement('p');
    p.textContent = description;
    content.appendChild(p);
  }

  const form = document.createElement('form');
  form.className = 'lead-subscription-form-form';

  const fields = document.createElement('div');
  fields.className = 'lead-subscription-form-fields';

  const emailField = document.createElement('input');
  emailField.type = 'email';
  emailField.name = 'email';
  emailField.required = true;
  emailField.placeholder = DEFAULT_PLACEHOLDER;
  fields.appendChild(emailField);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = DEFAULT_SUBMIT_LABEL;
  fields.appendChild(submit);

  form.appendChild(fields);

  if (legalHTML) {
    const label = document.createElement('label');
    label.className = 'lead-subscription-form-legal';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'legal';
    checkbox.required = true;
    label.appendChild(checkbox);

    const legalSpan = document.createElement('span');
    legalSpan.innerHTML = legalHTML;
    label.appendChild(legalSpan);

    form.appendChild(label);
  }

  block.replaceChildren(content, form);
}
