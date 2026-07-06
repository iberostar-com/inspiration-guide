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
  const icon = document.createElement('i');
  icon.className = 'hero-article-detail-icon ibh-icon-schedule';
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function createShareIcon() {
  const icon = document.createElement('i');
  icon.className = 'hero-article-detail-icon ibh-icon-share';
  icon.setAttribute('aria-hidden', 'true');
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
      const authorMedia = createResponsiveImage(
        authorImage,
        authorName ? `Foto de ${authorName}` : '',
        {
          eager: true,
          breakpoints: [{ width: '96' }],
        },
      );
      authorMedia.classList.add('hero-article-detail-author-image');
      author.append(authorMedia);
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

  block.append(content);
}
