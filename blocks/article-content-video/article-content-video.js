import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
const ALIGNMENTS = ['left', 'center', 'right'];

function getSourceRows(block) {
  return [...block.children]
    .filter((child) => !child.classList.contains('article-content-video-figure'));
}

function getPropElement(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  return getSourceRows(block)
    .map((row) => (row.matches?.(selector) ? row : row.querySelector?.(selector)))
    .find(Boolean) || null;
}

function getPropElementByNames(block, propNames) {
  return propNames
    .map((propName) => getPropElement(block, propName))
    .find(Boolean) || null;
}

function getVideoUrl(block) {
  const videoField = getPropElementByNames(block, ['videoCf', 'video']);
  const directSource = videoField?.querySelector('source[src]')?.getAttribute('src')
    || videoField?.querySelector('video[src]')?.getAttribute('src');
  if (directSource) return directSource;

  const datasetSource = videoField?.dataset?.src
    || videoField?.dataset?.videoSrc
    || videoField?.dataset?.assetReference
    || videoField?.getAttribute('data-src')
    || videoField?.getAttribute('data-video-src');
  if (datasetSource) return datasetSource;

  const textSource = videoField?.textContent?.trim();
  if (textSource && (/^https?:\/\//i.test(textSource) || textSource.startsWith('/'))) {
    return textSource;
  }

  const fieldLinks = [...(videoField?.querySelectorAll('a[href]') || [])];
  const videoLink = fieldLinks.find((link) => VIDEO_EXTENSIONS.test(link.getAttribute('href')));
  if (videoLink) return videoLink.getAttribute('href');
  if (fieldLinks[0]) return fieldLinks[0].getAttribute('href');

  const fallbackSource = block.querySelector('source[src]')?.getAttribute('src')
    || block.querySelector('video[src]')?.getAttribute('src');
  if (fallbackSource) return fallbackSource;

  return [...block.querySelectorAll('a[href]')]
    .map((link) => link.getAttribute('href'))
    .find((href) => VIDEO_EXTENSIONS.test(href)) || '';
}

function getPosterImage(block) {
  const posterField = getPropElementByNames(block, ['poster', 'posterImage']);
  return posterField?.querySelector('img')
    || getSourceRows(block).map((row) => row.querySelector('img')).find(Boolean)
    || null;
}

function getPosterSrc(block) {
  const posterField = getPropElementByNames(block, ['poster', 'posterImage']);
  return getPosterImage(block)?.src
    || posterField?.querySelector('a[href]')?.getAttribute('href')?.trim()
    || posterField?.dataset?.src
    || posterField?.dataset?.assetReference
    || posterField?.textContent?.trim()
    || '';
}

function getPosterAlt(block) {
  const altField = getPropElementByNames(block, ['posterAlt', 'videoAlt']);
  return altField?.textContent?.trim()
    || getPosterImage(block)?.alt?.trim()
    || '';
}

function getCaption(block) {
  const captionField = getPropElement(block, 'caption');
  if (captionField) return captionField.textContent?.trim() || '';

  const textRows = getSourceRows(block).filter((row) => (
    !row.querySelector('img, picture, video, source, a[href]')
  )).filter((row) => !ALIGNMENTS.includes(row.textContent?.trim()));
  return textRows.at(-1)?.textContent?.trim() || '';
}

function getAlignment(block) {
  const alignField = getPropElement(block, 'alignment');
  if (alignField) {
    const val = alignField.textContent?.trim().toLowerCase();
    return ALIGNMENTS.includes(val) ? val : 'center';
  }

  const textRows = getSourceRows(block).filter((row) => (
    !row.querySelector('img, picture, video, source, a[href]')
  ));
  const alignRow = textRows.find((row) => ALIGNMENTS.includes(row.textContent?.trim()));
  const val = alignRow?.textContent?.trim() || 'center';
  return ALIGNMENTS.includes(val) ? val : 'center';
}

function createPlayButton(label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'article-content-video-play';
  button.setAttribute('aria-label', label);

  const icon = document.createElement('i');
  icon.className = 'ibh-icon-play-arrow';
  icon.setAttribute('aria-hidden', 'true');

  button.append(icon);
  return button;
}

function activateVideo(figure, videoUrl) {
  const poster = figure.querySelector('.article-content-video-poster');
  if (!poster) return;

  const video = document.createElement('video');
  video.src = videoUrl;
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  video.muted = false;
  video.className = 'article-content-video-player';
  poster.replaceWith(video);
  video.play().catch(() => {
    // Native controls remain available when the browser blocks autoplay.
  });
}

export default async function decorate(block) {
  const videoUrl = getVideoUrl(block);
  const posterSrc = getPosterSrc(block);
  const posterAlt = getPosterAlt(block);
  const caption = getCaption(block);
  const alignment = getAlignment(block);

  getSourceRows(block).forEach((row) => {
    row.classList.add('article-content-video-source');
    row.setAttribute('aria-hidden', 'true');
  });

  block.querySelector(':scope > .article-content-video-figure')?.remove();
  ALIGNMENTS.forEach((a) => block.classList.remove(`article-content-video-${a}`));
  block.classList.add(`article-content-video-${alignment}`);

  if (!videoUrl && !posterSrc && !caption) return;

  const figure = document.createElement('figure');
  figure.className = 'article-content-video-figure';

  if (videoUrl || posterSrc) {
    const poster = document.createElement('div');
    poster.className = 'article-content-video-poster';
    if (posterSrc) {
      poster.append(createResponsiveImage(posterSrc, posterAlt, {
        breakpoints: [
          { width: '768' },
          { media: '(min-width: 900px)', width: '1200' },
        ],
      }));
    }

    if (videoUrl) {
      const playLabel = await getTranslation('playVideo', 'Play video');
      const playButton = createPlayButton(playLabel);
      playButton.addEventListener('click', () => activateVideo(figure, videoUrl));
      poster.append(playButton);
    }
    figure.append(poster);
  }

  if (caption) {
    const figcaption = document.createElement('figcaption');
    figcaption.className = 'article-content-video-caption';
    figcaption.textContent = caption;
    figure.append(figcaption);
  }

  block.append(figure);
}
