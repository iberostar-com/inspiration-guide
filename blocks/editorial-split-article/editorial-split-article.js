import { createResponsiveImage } from '../../scripts/iberostar/media.js';

function findImage(block) {
  return block.querySelector('img')?.src || '';
}

function findText(block, selector, fallback = '') {
  return block.querySelector(selector)?.textContent?.trim() || fallback;
}

export default function decorate(block) {
  const eyebrow = block.getAttribute('data-eyebrow') || findText(block, 'h4', 'Featured');
  const title = block.getAttribute('data-title') || findText(block, 'h2', 'Editorial article');
  const summary = block.getAttribute('data-summary') || findText(block, 'p', '');
  const link = block.getAttribute('data-link') || '#';
  const image = findImage(block);

  const wrapper = document.createElement('article');
  wrapper.className = 'editorial-split-article';

  if (image) {
    const media = document.createElement('div');
    media.className = 'editorial-split-media';
    media.append(createResponsiveImage(image, title, { preset: 'editorial-split' }));
    wrapper.append(media);
  }

  const body = document.createElement('div');
  body.className = 'editorial-split-body';

  const eyebrowEl = document.createElement('p');
  eyebrowEl.className = 'editorial-split-eyebrow';
  eyebrowEl.textContent = eyebrow;

  const h2 = document.createElement('h2');
  const anchor = document.createElement('a');
  anchor.href = link;
  anchor.textContent = title;
  h2.append(anchor);

  body.append(eyebrowEl, h2);

  if (summary) {
    const p = document.createElement('p');
    p.textContent = summary;
    body.append(p);
  }

  wrapper.append(body);
  block.replaceChildren(wrapper);
}
