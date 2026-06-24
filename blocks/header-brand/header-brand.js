const FIELD_INDEX = {
  logo: 0,
  logoAlt: 1,
  link: 2,
  label: 3,
};

function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('header-brand-content'));
}

function getFieldElement(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  const rows = getSourceRows(block);

  const byProp = rows
    .map((row) => (row.matches?.(selector) ? row : row.querySelector?.(selector)))
    .find(Boolean);

  if (byProp) {
    return byProp;
  }

  return rows[FIELD_INDEX[propName]] || null;
}

function getText(block, propName, fallback = '') {
  return getFieldElement(block, propName)?.textContent?.trim() || fallback;
}

function getLogo(block) {
  const element = getFieldElement(block, 'logo');
  if (!element) return null;

  const picture = element.querySelector('picture');
  if (picture) {
    return picture.cloneNode(true);
  }

  const image = element.querySelector('img');
  if (image) {
    return image.cloneNode(true);
  }

  return null;
}

function hideSource(block) {
  getSourceRows(block).forEach((row) => row.classList.add('header-brand-source'));
}

export default function decorate(block) {
  block.querySelector(':scope > .header-brand-content')?.remove();

  const linkUrl = getText(block, 'link', '/');
  const label = getText(block, 'label', 'Inspiration Guide');
  const logoAlt = getText(block, 'logoAlt', label);
  const logo = getLogo(block);

  hideSource(block);

  const content = document.createElement('div');
  content.className = 'header-brand-content';

  const link = document.createElement('a');
  link.href = linkUrl;
  link.className = 'header-brand-link';
  link.setAttribute('aria-label', label);

  if (logo) {
    const image = logo.matches('img') ? logo : logo.querySelector('img');
    if (image) {
      image.alt = logoAlt;
      image.loading = 'eager';
    }
    link.append(logo);
  } else {
    const text = document.createElement('span');
    text.className = 'header-brand-label';
    text.textContent = label;
    link.append(text);
  }

  content.append(link);
  block.append(content);
}
