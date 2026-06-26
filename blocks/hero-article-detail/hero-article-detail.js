import { getMetadata } from '../../scripts/aem.js';
import { createResponsiveImage } from '../../scripts/iberostar/media.js';

function getSourceRows(block) {
  return Array.from(block.children).filter((child) => !child.classList.contains('hero-article-detail-content'));
}

function getSourceFields(block) {
  const rows = getSourceRows(block);
  const direct = rows.flatMap((row) => Array.from(row.children));

  if (direct.length > 1) {
    return direct;
  }

  if (direct.length === 1) {
    const nested = Array.from(direct[0].children);
    if (nested.length) {
      return nested;
    }
  }

  return direct;
}

function hideSourceRows(block) {
  getSourceRows(block).forEach((row) => {
    row.classList.add('hero-article-detail-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

function getFieldByProp(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;

  return getSourceRows(block)
    .map((row) => {
      if (row.matches?.(selector)) {
        return row;
      }

      return row.querySelector?.(selector) || null;
    })
    .find(Boolean) || null;
}

function getFieldText(block, propName) {
  const field = getFieldByProp(block, propName);
  return field?.textContent?.trim() || '';
}

function getFieldImage(block, propName) {
  const field = getFieldByProp(block, propName);
  if (!field) return '';

  return field.querySelector('img')?.src
    || field.querySelector('a[href]')?.getAttribute('href')?.trim()
    || field.textContent?.trim()
    || '';
}

function getMetaValue(name, fallback = '') {
  const value = getMetadata(name)?.trim();
  return value || fallback;
}

function toCategoryLabel(rawValue) {
  const source = `${rawValue || ''}`.trim();
  if (!source) return '';

  const first = source.split(',')[0].trim();
  const withoutNamespace = first.includes(':') ? first.split(':')[1] : first;
  const segment = withoutNamespace.split('/')[0].trim();
  const normalized = segment.replace(/[-_]+/g, ' ');

  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

function toDisplayDate(value) {
  if (!value) return '';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return `${value}`.toUpperCase();
  }

  const locale = document.documentElement.lang || 'es-ES';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed).toUpperCase();
}

function createClockIcon() {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  icon.setAttribute('viewBox', '0 0 16 16');
  icon.setAttribute('aria-hidden', 'true');
  icon.classList.add('hero-article-detail-icon');

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '8');
  circle.setAttribute('cy', '8');
  circle.setAttribute('r', '6.5');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', 'currentColor');
  circle.setAttribute('stroke-width', '1.4');

  const hand = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  hand.setAttribute('d', 'M8 4.4v3.8l2.6 1.7');
  hand.setAttribute('fill', 'none');
  hand.setAttribute('stroke', 'currentColor');
  hand.setAttribute('stroke-width', '1.4');
  hand.setAttribute('stroke-linecap', 'round');
  hand.setAttribute('stroke-linejoin', 'round');

  icon.append(circle, hand);
  return icon;
}

function createShareIcon() {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  icon.setAttribute('viewBox', '0 0 16 16');
  icon.setAttribute('aria-hidden', 'true');
  icon.classList.add('hero-article-detail-icon');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M8 2.2l3 3.1-.95.95L8.65 4.8v5.5h-1.3V4.8L5.95 6.25 5 5.3 8 2.2zm-4.5 8.5h9v2.9h-9v-2.9z');
  path.setAttribute('fill', 'currentColor');

  icon.append(path);
  return icon;
}

function createText(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

export default function decorate(block) {
  const existing = block.querySelector(':scope > .hero-article-detail-content');
  if (existing) {
    existing.remove();
  }

  const fields = getSourceFields(block);

  const title = getMetaValue('jcr:title')
    || getMetaValue('og:title')
    || fields[2]?.textContent?.trim()
    || 'Article';
  const subtitle = getMetaValue('jcr:description')
    || getMetaValue('description')
    || getMetaValue('og:description')
    || fields[3]?.textContent?.trim()
    || '';

  const authorName = getMetaValue('article-author-name');
  const authorDescription = getMetaValue('article-author-description');
  const authorImage = getMetaValue('article-author-image');
  const category = toCategoryLabel(getMetaValue('article-category'));
  const publicationDate = toDisplayDate(getMetaValue('article-publication-date'));
  const readTime = getMetaValue('article-read-time').toUpperCase();
  const imageOverride = getFieldImage(block, 'image');
  const imageAltOverride = getFieldText(block, 'imageAlt');
  const articleImage = imageOverride || getMetaValue('article-image');
  const articleImageAlt = imageAltOverride || getMetaValue('article-image-alt') || title;

  hideSourceRows(block);

  const content = document.createElement('div');
  content.className = 'hero-article-detail-content';

  const heading = document.createElement('div');
  heading.className = 'hero-article-detail-heading';
  heading.append(createText('h1', 'hero-article-detail-title', title));

  if (subtitle) {
    heading.append(createText('p', 'hero-article-detail-subtitle', subtitle));
  }

  content.append(heading);

  const info = document.createElement('div');
  info.className = 'hero-article-detail-info';

  if (authorName || authorImage || authorDescription) {
    const author = document.createElement('div');
    author.className = 'hero-article-detail-author';

    if (authorImage) {
      const image = document.createElement('img');
      image.className = 'hero-article-detail-author-image';
      image.src = authorImage;
      image.alt = authorName ? `Foto de ${authorName}` : '';
      image.loading = 'eager';
      author.append(image);
    }

    const authorText = document.createElement('div');
    authorText.className = 'hero-article-detail-author-text';

    if (authorName) {
      authorText.append(createText('p', 'hero-article-detail-author-name', authorName));
    }

    if (authorDescription) {
      authorText.append(createText('p', 'hero-article-detail-author-description', authorDescription));
    }

    if (authorText.childElementCount > 0) {
      author.append(authorText);
    }

    info.append(author);
  }

  const actions = document.createElement('div');
  actions.className = 'hero-article-detail-actions';

  const metadata = document.createElement('div');
  metadata.className = 'hero-article-detail-metadata';

  if (category) {
    metadata.append(createText('span', 'hero-article-detail-chip', category));
  }

  if (publicationDate) {
    metadata.append(createText('span', 'hero-article-detail-date', publicationDate));
  }

  if (readTime) {
    const reading = document.createElement('span');
    reading.className = 'hero-article-detail-reading-time';
    reading.append(createClockIcon(), createText('span', 'hero-article-detail-reading-text', readTime));
    metadata.append(reading);
  }

  actions.append(metadata);

  const shareButton = document.createElement('button');
  shareButton.type = 'button';
  shareButton.className = 'hero-article-detail-share';
  shareButton.setAttribute('aria-label', 'Compartir articulo');
  shareButton.append(createShareIcon());
  shareButton.addEventListener('click', async () => {
    const shareData = {
      title,
      text: subtitle || title,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // continue to clipboard fallback
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch {
        // no-op
      }
    }
  });

  actions.append(shareButton);

  info.append(actions);
  content.append(info);

  if (articleImage) {
    const mediaWrapper = document.createElement('div');
    mediaWrapper.className = 'hero-article-detail-media';

    mediaWrapper.append(createResponsiveImage(articleImage, articleImageAlt, {
      eager: true,
      preset: 'article-card-featured',
    }));

    content.append(mediaWrapper);
  }

  block.append(content);
}
