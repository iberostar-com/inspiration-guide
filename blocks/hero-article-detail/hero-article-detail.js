import { getMetadata } from '../../scripts/aem.js';
import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { formatDate, hasValidDate } from '../../scripts/iberostar/date-format.js';
import { tagDisplayTitle } from '../../scripts/iberostar/taxonomy.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';

async function copyLink(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // noop
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

function showShareFeedback(button, message) {
  const container = button.closest('.hero-article-detail-actions') || button.parentElement;
  container?.querySelector('.hero-article-detail-share-feedback')?.remove();

  const feedback = document.createElement('span');
  feedback.className = 'hero-article-detail-share-feedback';
  feedback.setAttribute('role', 'status');
  feedback.textContent = message;
  container?.append(feedback);
  window.setTimeout(() => feedback.remove(), 2500);
}

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

// The category metadata holds a hierarchical tag id such as
// `inspiration-guide:categorías/destinos/islas-baleares`; the concrete category
// is the last segment, never the tag tree root.
function toCategoryLabel(rawValue) {
  const source = `${rawValue || ''}`.trim();
  if (!source) return '';

  return tagDisplayTitle(source.split(',')[0]);
}

function toDisplayDate(value) {
  if (!value) return '';
  if (!hasValidDate(value)) return `${value}`.toUpperCase();

  return formatDate(value).toUpperCase();
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

export default async function decorate(block) {
  const existing = block.querySelector(':scope > .hero-article-detail-content');
  if (existing) {
    existing.remove();
  }

  const fields = getSourceFields(block);

  const title = fields[2]?.textContent?.trim()
    || getMetaValue('jcr:title')
    || getMetaValue('og:title')
    || 'Article';
  const subtitle = fields[3]?.textContent?.trim()
    || getMetaValue('jcr:description')
    || getMetaValue('description')
    || getMetaValue('og:description')
    || '';

  const authorName = getMetaValue('article-author-name');
  const authorDescription = getMetaValue('article-author-description');
  const authorImage = getMetaValue('article-author-image');
  const category = await toCategoryLabel(getMetaValue('article-category'));
  const publicationDate = toDisplayDate(getMetaValue('article-publication-date'));
  const readTime = getMetaValue('article-read-time').toUpperCase();
  const shareLabel = await getTranslation('shareArticle', 'Compartir artículo');

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
        authorName,
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
  shareButton.setAttribute('aria-label', shareLabel);
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
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    const copied = await copyLink(window.location.href);
    if (copied) {
      showShareFeedback(shareButton, await getTranslation('shareLinkCopied', 'Enlace copiado'));
    }
  });

  actions.append(shareButton);

  info.append(actions);
  content.append(info);

  block.append(content);
}
