import { resolveFinalAlt } from '../../scripts/iberostar/image-alt.js';

const FIELD_INDEX = {
  logo: 0,
  logoDesktop: 1,
  logoAlt: 2,
  link: 3,
  label: 4,
};

function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('header-brand-content'));
}

function getCellFromRow(row) {
  if (!row) return null;

  const cells = [...row.children];

  if (cells.length > 1) {
    return cells[cells.length - 1];
  }

  return cells[0] || row;
}

function getFallbackFields(block) {
  const rows = getSourceRows(block);
  const directFields = rows.map(getCellFromRow).filter(Boolean);

  if (directFields.length >= Object.keys(FIELD_INDEX).length) {
    return directFields;
  }

  if (directFields.length === 1) {
    const nestedFields = [...directFields[0].children];

    if (nestedFields.length >= Object.keys(FIELD_INDEX).length) {
      return nestedFields;
    }
  }

  return directFields;
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

  return getFallbackFields(block)[FIELD_INDEX[propName]] || null;
}

function getText(block, propName, fallback = '') {
  return getFieldElement(block, propName)?.textContent?.trim() || fallback;
}

function getLogo(block, propName) {
  const element = getFieldElement(block, propName);
  if (!element) return null;

  if (element.matches?.('picture')) {
    return element.cloneNode(true);
  }

  if (element.matches?.('img')) {
    return element.cloneNode(true);
  }

  const picture = element.querySelector('picture');
  if (picture) {
    return picture.cloneNode(true);
  }

  const image = element.querySelector('img');
  if (image) {
    return image.cloneNode(true);
  }

  const href = element.querySelector('a')?.getAttribute('href');
  if (href && /\.(svg|png|jpe?g|webp)$/i.test(href)) {
    const fallbackImage = document.createElement('img');
    fallbackImage.src = href;
    return fallbackImage;
  }

  const text = element.textContent?.trim();
  if (text && /\.(svg|png|jpe?g|webp)$/i.test(text)) {
    const fallbackImage = document.createElement('img');
    fallbackImage.src = text;
    return fallbackImage;
  }

  return null;
}

// The link field has no data-aue-prop, so positional indexing is fragile when
// optional fields (logoAlt) have no source row. Find the real link: the source
// anchor that is not wrapping a logo image.
function getLinkUrl(block, fallback) {
  const byProp = getFieldElement(block, 'link');
  const propHref = byProp?.querySelector?.('a[href]')?.getAttribute('href')
    || byProp?.textContent?.trim();
  if (propHref && /^(\/|https?:|#)/.test(propHref)) return propHref;

  const anchor = getSourceRows(block)
    .flatMap((row) => [...(row.querySelectorAll?.('a[href]') || [])])
    .find((a) => !a.querySelector('img, picture'));
  return anchor?.getAttribute('href') || fallback;
}

function hideSource(block) {
  getSourceRows(block).forEach((row) => row.classList.add('header-brand-source'));
}

export default function decorate(block) {
  block.querySelector(':scope > .header-brand-content')?.remove();

  const linkUrl = getLinkUrl(block, '/');
  const label = getText(block, 'label', 'Inspiration Guide');
  const logoAlt = resolveFinalAlt(
    block.querySelector('[data-aue-prop="logoAlt"]')?.textContent?.trim() || label,
    block.querySelector('[data-aue-prop="logo_autoalt"]')?.textContent?.trim()
      || block.querySelector('[data-aue-prop="logoAutoAlt"]')?.textContent?.trim()
      || '',
  );
  const authoredMobile = getLogo(block, 'logo');
  const authoredDesktop = getLogo(block, 'logoDesktop');
  const mobileLogo = authoredMobile || authoredDesktop?.cloneNode(true);
  const desktopLogo = authoredDesktop || authoredMobile?.cloneNode(true);

  hideSource(block);

  const content = document.createElement('div');
  content.className = 'header-brand-content';

  const link = document.createElement('a');
  link.href = linkUrl;
  link.className = 'header-brand-link';
  link.setAttribute('aria-label', label);

  const appendLogo = (logo, modifier) => {
    if (!logo) return;
    // Strip authoring instrumentation from the rendered copy so Universal Editor
    // doesn't list it as a second logo (the hidden source rows keep theirs).
    [logo, ...logo.querySelectorAll('*')].forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (attr.name.startsWith('data-aue-')) el.removeAttribute(attr.name);
      });
    });
    const image = logo.matches('img') ? logo : logo.querySelector('img');
    if (image) {
      image.alt = logoAlt;
      image.loading = 'eager';
    }
    const wrapper = document.createElement('span');
    wrapper.className = `header-brand-logo header-brand-logo-${modifier}`;
    wrapper.append(logo);
    link.append(wrapper);
  };

  if (mobileLogo || desktopLogo) {
    appendLogo(mobileLogo, 'mobile');
    appendLogo(desktopLogo, 'desktop');
  } else {
    const text = document.createElement('span');
    text.className = 'header-brand-label';
    text.textContent = label;
    link.append(text);
  }

  content.append(link);
  block.append(content);
}
