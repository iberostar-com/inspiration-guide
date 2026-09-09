import { createResponsiveImage, resolveAssetUrl } from '../../scripts/iberostar/media.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
const ALIGNMENTS = ['left', 'center', 'right'];
const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

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

function getRowValue(row) {
  if (!row) return '';

  const directSource = row.querySelector('source[src]')?.getAttribute('src')
    || row.querySelector('video[src]')?.getAttribute('src');
  if (directSource) return directSource;

  const datasetSource = row.dataset?.src
    || row.dataset?.videoSrc
    || row.dataset?.assetReference
    || row.getAttribute('data-src')
    || row.getAttribute('data-video-src');
  if (datasetSource) return datasetSource;

  const link = row.querySelector('a[href]')?.getAttribute('href');
  if (link) return link;

  return row.textContent?.trim() || '';
}

function getVideoUrl(block) {
  const videoField = getPropElementByNames(block, ['videoDam', 'youtubeVideoId', 'videoCf', 'video']);
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
  if (textSource) {
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

function getVideoType(block) {
  const typeField = getPropElement(block, 'videoType');
  const value = typeField?.textContent?.trim().toLowerCase() || '';
  if (['dam', 'youtube'].includes(value)) return value;

  // In CDN pages data-aue-prop can be stripped; fallback to authored row order.
  const fallbackType = getRowValue(getSourceRows(block)[0]).toLowerCase();
  if (['dam', 'youtube'].includes(fallbackType)) return fallbackType;

  return ['dam', 'youtube'].includes(value) ? value : 'dam';
}

function getFieldValue(block, propNames) {
  const field = getPropElementByNames(block, propNames);
  if (!field) return '';

  const directSource = field.querySelector('source[src]')?.getAttribute('src')
    || field.querySelector('video[src]')?.getAttribute('src');
  if (directSource) return directSource;

  const datasetSource = field.dataset?.src
    || field.dataset?.videoSrc
    || field.dataset?.assetReference
    || field.getAttribute('data-src')
    || field.getAttribute('data-video-src');
  if (datasetSource) return datasetSource;

  const links = [...field.querySelectorAll('a[href]')].map((link) => link.getAttribute('href'));
  if (links[0]) return links[0];

  return field.textContent?.trim() || '';
}

function getVideoReference(block) {
  const videoType = getVideoType(block);
  const fromProps = videoType === 'youtube'
    ? getFieldValue(block, ['youtubeVideoId', 'videoCf', 'video'])
    : getFieldValue(block, ['videoDam', 'videoCf', 'video']);

  if (fromProps) return fromProps;

  const sourceRows = getSourceRows(block);
  if (videoType === 'youtube') {
    return getRowValue(sourceRows[2]) || getRowValue(sourceRows[1]);
  }

  return getRowValue(sourceRows[1]) || getRowValue(sourceRows[2]);
}

function isLikelyVideoUrl(url) {
  if (!url) return false;
  if (VIDEO_EXTENSIONS.test(url)) return true;
  return /\/content\/dam\//.test(url) && !/\.(json|html?|md|txt)(\?.*)?$/i.test(url);
}

function parseJsonForVideo(value) {
  if (typeof value === 'string') {
    if (VIDEO_EXTENSIONS.test(value)) return value;
    return '';
  }
  if (!value || typeof value !== 'object') return '';
  const values = Object.values(value);
  return values
    .map((entry) => parseJsonForVideo(entry))
    .find(Boolean) || '';
}

function extractVideoFromHtml(html) {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const source = doc.querySelector('source[src]')?.getAttribute('src')
    || doc.querySelector('video[src]')?.getAttribute('src');
  if (source) return source;

  return [...doc.querySelectorAll('a[href]')]
    .map((a) => a.getAttribute('href'))
    .find((href) => VIDEO_EXTENSIONS.test(href)) || '';
}

async function fetchResolvedVideo(candidateUrl) {
  if (!candidateUrl) return '';

  try {
    const response = await fetch(candidateUrl);
    if (!response.ok) return '';

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('video/')) return candidateUrl;

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return parseJsonForVideo(data);
    }

    if (contentType.includes('text/html')) {
      const html = await response.text();
      return extractVideoFromHtml(html);
    }
  } catch (e) {
    // Ignore resolution failures and fallback to the next candidate.
  }

  return '';
}

async function resolveVideoUrl(videoRef) {
  if (!videoRef) return '';

  if (isLikelyVideoUrl(videoRef)) return videoRef;

  const candidates = [
    videoRef,
    `${videoRef}.json`,
  ];

  const resolutions = await Promise.all(candidates.map((url) => fetchResolvedVideo(url)));
  return resolutions.find(Boolean) || '';
}

function getYoutubeId(input) {
  const value = (input || '').trim();
  if (!value) return '';
  if (YOUTUBE_ID_REGEX.test(value)) return value;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();

    if (host.endsWith('youtu.be')) {
      const candidate = parsed.pathname.split('/').filter(Boolean)[0] || '';
      return YOUTUBE_ID_REGEX.test(candidate) ? candidate : '';
    }

    if (host.includes('youtube.com')) {
      const queryId = parsed.searchParams.get('v') || '';
      if (YOUTUBE_ID_REGEX.test(queryId)) return queryId;

      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const embedIndex = pathParts.findIndex((part) => ['embed', 'shorts', 'live'].includes(part));
      if (embedIndex >= 0) {
        const candidate = pathParts[embedIndex + 1] || '';
        return YOUTUBE_ID_REGEX.test(candidate) ? candidate : '';
      }
    }
  } catch (e) {
    // Non-URL values may still be valid IDs.
  }

  const match = value.match(/(?:v=|youtu\.be\/|youtube\.com\/(?:embed|shorts|live)\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] || '';
}

function createYoutubeEmbedUrl(videoId, autoplay = false) {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });
  if (autoplay) params.set('autoplay', '1');
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
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

  const icon = document.createElement('span');
  icon.className = 'article-content-video-play-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '\u25B6';

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

  // Restore the original poster state when playback completes.
  video.addEventListener('ended', () => {
    video.replaceWith(poster);
  }, { once: true });

  poster.replaceWith(video);
  video.play().catch(() => {
    // Native controls remain available when the browser blocks autoplay.
  });
}

function activateYoutube(figure, youtubeId) {
  const poster = figure.querySelector('.article-content-video-poster');
  if (!poster || !youtubeId) return;

  const iframe = document.createElement('iframe');
  iframe.src = createYoutubeEmbedUrl(youtubeId, true);
  iframe.className = 'article-content-video-embed';
  iframe.title = 'YouTube video player';
  iframe.loading = 'lazy';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  poster.replaceWith(iframe);
}

export default async function decorate(block) {
  const videoRef = getVideoReference(block) || getVideoUrl(block);
  const youtubeId = getYoutubeId(videoRef);
  const videoUrl = youtubeId ? '' : await resolveVideoUrl(videoRef);
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

  if (!videoRef && !videoUrl && !posterSrc && !caption) return;

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

    if (videoUrl || videoRef) {
      const playLabel = await getTranslation('playVideo', 'Play video');
      const playButton = createPlayButton(playLabel);
      playButton.addEventListener('click', async () => {
        if (youtubeId) {
          activateYoutube(figure, youtubeId);
          return;
        }

        const resolvedUrl = videoUrl || await resolveVideoUrl(videoRef);
        if (!resolvedUrl) return;
        activateVideo(figure, resolveAssetUrl(resolvedUrl));
      });
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
