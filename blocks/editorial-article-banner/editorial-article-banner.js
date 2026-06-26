const FIELD_ORDER = ['title', 'description', 'linkText', 'link'];

function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('editorial-article-banner-rendered'));
}

function getCells(row) {
  if (!row) return [];
  if (row.children.length > 1) return [...row.children];

  const nested = [...(row.children[0]?.children || [])];
  return nested.length ? nested : [...row.children];
}

function getPropElement(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  return getSourceRows(block)
    .map((row) => (row.matches?.(selector) ? row : row.querySelector?.(selector)))
    .find(Boolean) || null;
}

function getPositionalField(block, propName) {
  const index = FIELD_ORDER.indexOf(propName);
  if (index < 0) return null;

  const cells = getSourceRows(block).flatMap((row) => getCells(row));
  return cells[index] || null;
}

function getTextValue(block, propName, legacyAttr = '', fallback = '') {
  return getPropElement(block, propName)?.textContent?.trim()
    || block.getAttribute(legacyAttr)?.trim()
    || getPositionalField(block, propName)?.textContent?.trim()
    || fallback;
}

function getHrefValue(block, propName, legacyAttr = '') {
  const field = getPropElement(block, propName) || getPositionalField(block, propName);
  const href = field?.querySelector?.('a[href]')?.getAttribute('href')?.trim();
  return href
    || block.getAttribute(legacyAttr)?.trim()
    || field?.textContent?.trim()
    || '';
}

function getLinkText(block) {
  const linkText = getTextValue(block, 'linkText', 'data-link-text');
  if (linkText) return linkText;

  const linkField = getPropElement(block, 'link') || getPositionalField(block, 'link');
  const linkAnchorText = linkField?.querySelector?.('a[href]')?.textContent?.trim();
  if (linkAnchorText) return linkAnchorText;

  return linkField?.textContent?.trim() || '';
}

function hideSource(block) {
  getSourceRows(block).forEach((row) => {
    row.classList.add('editorial-article-banner-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

export default async function decorate(block) {
  block.querySelector(':scope > .editorial-article-banner-rendered')?.remove();

  const title = getTextValue(block, 'title', 'data-title');
  const description = getTextValue(block, 'description', 'data-description');
  const linkUrl = getHrefValue(block, 'link', 'data-link');
  const linkText = getLinkText(block);

  const wrapper = document.createElement('div');
  wrapper.className = 'editorial-article-banner-rendered';

  const content = document.createElement('div');
  content.className = 'editorial-article-banner-content';

  if (title) {
    content.append(createTextElement('p', 'editorial-article-banner-title', title));
  }

  if (description) {
    content.append(createTextElement('p', 'editorial-article-banner-description', description));
  }

  if (content.children.length) {
    wrapper.append(content);
  }

  if (linkUrl && linkText) {
    const link = document.createElement('a');
    link.className = 'editorial-article-banner-link';
    link.href = linkUrl;
    link.textContent = linkText;
    wrapper.append(link);
  }

  if (!wrapper.children.length) return;

  hideSource(block);
  block.append(wrapper);
}
