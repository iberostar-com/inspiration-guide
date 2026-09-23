import { loadCSS, loadScript } from '../../scripts/aem.js';
import { createResponsiveImage, resolveAssetUrl } from '../../scripts/iberostar/media.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';
import { resolveFinalAlt } from '../../scripts/iberostar/image-alt.js';

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
const IMAGE_EXTENSIONS = /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i;
const ALIGNMENTS = ['left', 'center', 'right'];
const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

function cleanUrl(value = '') {
  return `${value || ''}`
    .trim()
    .replace(/&amp;/g, '&');
}

function getUrlFromSrcset(value = '') {
  return cleanUrl(value).split(',')[0]?.trim().split(/\s+/)[0] || '';
}

function getUrlFromText(value = '') {
  return cleanUrl(value).match(/https?:\/\/[^\s<>"')]+|\/content\/dam\/[^\s<>"')]+|\/adobe\/assets\/[^\s<>"')]+/i)?.[0] || '';
}

function isUrlLike(value = '') {
  return Boolean(getUrlFromText(value)) || /^https?:\/\//i.test(cleanUrl(value));
}

// Universal Editor renders an unresolved `reference` as a localized label
// ("Recurso remoto"), which must never be used as an asset reference.
function isAssetReference(value = '') {
  const url = cleanUrl(value);
  if (!url) return false;
  return /^https?:\/\//i.test(url) || url.startsWith('/');
}

function getContentText(element) {
  const text = element?.textContent?.trim() || '';
  return isUrlLike(text) ? '' : text;
}

function getReferenceUrl(element) {
  if (!element) return '';

  const source = element.querySelector?.('source[src]')?.getAttribute('src')
    || element.querySelector?.('video[src]')?.getAttribute('src')
    || element.querySelector?.('img[src]')?.getAttribute('src')
    || element.querySelector?.('source[srcset]')?.getAttribute('srcset')
    || '';
  const sourceUrl = source.includes(' ') ? getUrlFromSrcset(source) : cleanUrl(source);
  if (sourceUrl) return sourceUrl;

  const attrs = [
    'href',
    'src',
    'data-href',
    'data-src',
    'data-video-src',
    'data-asset-reference',
    'data-repo-resolve-url',
  ];
  const attrUrl = attrs
    .map((attr) => cleanUrl(element.getAttribute?.(attr)))
    .find(Boolean);
  if (attrUrl) return attrUrl;

  const link = element.querySelector?.('a[href]')?.getAttribute('href') || '';
  return cleanUrl(link) || getUrlFromText(element.textContent || '');
}

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

  const referenceUrl = getReferenceUrl(row);
  if (referenceUrl) return referenceUrl;

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

  return getContentText(row);
}

function getVideoUrl(block) {
  const videoField = getPropElementByNames(block, ['videoDam', 'youtubeVideoId', 'videoCf', 'video']);
  const referenceUrl = getReferenceUrl(videoField);
  if (referenceUrl) return referenceUrl;

  const directSource = videoField?.querySelector('source[src]')?.getAttribute('src')
    || videoField?.querySelector('video[src]')?.getAttribute('src');
  if (directSource) return directSource;

  const datasetSource = videoField?.dataset?.src
    || videoField?.dataset?.videoSrc
    || videoField?.dataset?.assetReference
    || videoField?.getAttribute('data-src')
    || videoField?.getAttribute('data-video-src');
  if (datasetSource) return datasetSource;

  const textSource = getContentText(videoField);
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

  const referenceUrl = getReferenceUrl(field);
  if (referenceUrl) return referenceUrl;

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

  return getContentText(field);
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

function getVideoReference(block) {
  const videoType = getVideoType(block);
  const fromProps = videoType === 'youtube'
    ? getFieldValue(block, ['youtubeVideoId', 'videoCf', 'video'])
    : getFieldValue(block, ['videoDam', 'videoCf', 'video']);

  const isValidRef = (value) => (videoType === 'youtube'
    ? Boolean(getYoutubeId(value))
    : isAssetReference(value));

  if (isValidRef(fromProps)) return fromProps;

  const sourceRows = getSourceRows(block);
  const positional = videoType === 'youtube'
    ? [getRowValue(sourceRows[2]), getRowValue(sourceRows[1])]
    : [getRowValue(sourceRows[1]), getRowValue(sourceRows[2])];

  return positional.find(isValidRef) || '';
}

function isLikelyVideoUrl(url) {
  if (!url) return false;
  if (VIDEO_EXTENSIONS.test(url)) return true;
  return /\/content\/dam\//.test(url) && !/\.(json|html?|md|txt)(\?.*)?$/i.test(url);
}

// Dynamic Media exposes videos as a player page (`/play`) meant to be iframed,
// not as a directly playable media file.
function isDynamicMediaPlayerUrl(url = '') {
  const value = cleanUrl(url);
  if (!/^https?:\/\//i.test(value)) return false;

  try {
    return /\/adobe\/assets\/.+\/play$/.test(new URL(value).pathname);
  } catch (e) {
    return false;
  }
}

function getDynamicMediaBaseUrl(playerUrl = '') {
  const value = cleanUrl(playerUrl);
  if (!isDynamicMediaPlayerUrl(value)) return '';

  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/play$/, '');
    return url.toString();
  } catch (e) {
    return '';
  }
}

async function loadDynamicMediaPlayer(playerUrl = '') {
  const value = cleanUrl(playerUrl);
  if (!isDynamicMediaPlayerUrl(value)) return null;

  try {
    const { origin } = new URL(value);
    await Promise.all([
      loadCSS(`${origin}/adobe/assets/urn:aaid:aem:dmviewers-html5-css/as/core-player.css`),
      loadScript(`${origin}/adobe/assets/urn:aaid:aem:dmviewers-html5/as/VideoPlayer.js`),
    ]);
    await loadScript(`${origin}/adobe/assets/urn:aaid:aem:dmviewers-html5/as/CorePlayer.js`);
    return window.dmViewers || null;
  } catch (e) {
    return null;
  }
}

function isVideoLikeUrl(url = '') {
  return isLikelyVideoUrl(url)
    || isDynamicMediaPlayerUrl(url)
    || Boolean(getYoutubeId(url));
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

function getPosterPicture(block) {
  const posterField = getPropElementByNames(block, ['poster', 'posterImage']);
  return posterField?.querySelector('picture')
    || getSourceRows(block).map((row) => row.querySelector('picture')).find(Boolean)
    || null;
}

function getAssetUrlFromRoot(root) {
  const img = root?.querySelector?.('img');
  const source = root?.querySelector?.('source[srcset]');
  const link = root?.querySelector?.('a[href]');

  return cleanUrl(img?.getAttribute('src') || img?.src)
    || getUrlFromSrcset(source?.getAttribute('srcset'))
    || cleanUrl(link?.getAttribute('href'))
    || cleanUrl(root?.dataset?.src)
    || cleanUrl(root?.dataset?.assetReference)
    || getUrlFromText(root?.textContent || '');
}

function getPosterSrc(block, excludeUrl = '') {
  const posterField = getPropElementByNames(block, ['poster', 'posterImage']);
  if (posterField) return getAssetUrlFromRoot(posterField);

  // Without `data-aue-prop` every row looks alike, so discard the video rows
  // and prefer a URL that actually looks like an image.
  const candidates = getSourceRows(block)
    .map((row) => getAssetUrlFromRoot(row))
    .filter(Boolean)
    .filter((url) => url !== excludeUrl && !isVideoLikeUrl(url));

  return candidates.find((url) => IMAGE_EXTENSIONS.test(url)) || candidates[0] || '';
}

function getPosterAlt(block) {
  const altField = getPropElementByNames(block, ['posterAlt', 'videoAlt']);
  const autoAltField = getPropElementByNames(block, ['poster_autoalt', 'posterAutoAlt', 'videoAutoAlt']);
  return resolveFinalAlt(
    getContentText(altField),
    getContentText(autoAltField) || getContentText({ textContent: getPosterImage(block)?.alt || '' }),
  );
}

function isBooleanText(value = '') {
  return ['true', 'false', 'yes', 'no', '1', '0'].includes(`${value}`.trim().toLowerCase());
}

function getAutoplay(block) {
  const fieldValue = getFieldValue(block, ['autoplay']);
  if (isBooleanText(fieldValue)) {
    return ['true', 'yes', '1'].includes(fieldValue.trim().toLowerCase());
  }

  const rowValue = getSourceRows(block)
    .map((row) => getRowValue(row))
    .find((value) => isBooleanText(value));
  if (isBooleanText(rowValue)) {
    return ['true', 'yes', '1'].includes(rowValue.trim().toLowerCase());
  }

  return true;
}

function getCaption(block) {
  const captionField = getPropElement(block, 'caption');
  if (captionField) return getContentText(captionField);

  const textRows = getSourceRows(block).filter((row) => (
    !row.querySelector('img, picture, video, source, a[href]')
    && ![
      'videoType', 'videoDam', 'youtubeVideoId', 'alignment', 'autoplay',
      'poster', 'posterImage', 'posterAlt', 'poster_autoalt', 'posterAutoAlt', 'videoAutoAlt',
    ].includes(row.dataset?.aueProp)
    && !getUrlFromText(row.textContent || '')
    && !isBooleanText(row.textContent)
  )).filter((row) => !ALIGNMENTS.includes(row.textContent?.trim()));
  return getContentText(textRows.at(-1));
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

function createPictureFromSource(sourcePicture, alt) {
  if (!sourcePicture) return null;

  const picture = sourcePicture.cloneNode(true);
  const img = picture.querySelector('img');
  if (img) {
    img.alt = alt;
    img.loading = 'lazy';
    img.decoding = 'async';
  }
  return picture;
}

function activateVideo(figure, videoUrl, autoplay = true) {
  const poster = figure.querySelector('.article-content-video-poster');
  if (!poster) return;

  const video = document.createElement('video');
  video.src = videoUrl;
  video.controls = true;
  video.autoplay = autoplay;
  video.playsInline = true;
  video.muted = false;
  video.className = 'article-content-video-player';

  // Restore the original poster state when playback completes.
  video.addEventListener('ended', () => {
    video.replaceWith(poster);
  }, { once: true });

  poster.replaceWith(video);
  if (autoplay) {
    video.play().catch(() => {
      // Native controls remain available when the browser blocks autoplay.
    });
  }
}

function activateEmbed(figure, src, title, autoplay = false) {
  const poster = figure.querySelector('.article-content-video-poster');
  if (!poster || !src) return;

  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.className = 'article-content-video-embed';
  iframe.title = title;
  iframe.loading = 'lazy';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  if (autoplay && !/[?&]autoplay=/.test(src)) {
    iframe.src = `${src}${src.includes('?') ? '&' : '?'}autoplay=1`;
  }
  iframe.allowFullscreen = true;
  poster.replaceWith(iframe);
}

async function activateDynamicMediaPlayer(figure, playerUrl, title, autoplay = true) {
  const poster = figure.querySelector('.article-content-video-poster');
  const baseUrl = getDynamicMediaBaseUrl(playerUrl);
  if (!poster || !baseUrl) return;

  const container = document.createElement('div');
  const playerId = `article-content-video-player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  container.id = playerId;
  container.className = 'article-content-video-embed';
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', title);
  poster.replaceWith(container);

  const dmViewers = await loadDynamicMediaPlayer(playerUrl);
  if (!dmViewers?.VideoPlayer || !dmViewers?.CorePlayer) {
    container.replaceWith(poster);
    activateEmbed(figure, playerUrl, title, autoplay);
    return;
  }

  try {
    const player = await dmViewers.VideoPlayer.init(playerId, {
      sources: {
        DASH: `${baseUrl}/manifest.mpd`,
        HLS: `${baseUrl}/manifest.m3u8`,
      },
      posterImage: `${baseUrl}/as/thumbnail.jpeg?width=${window.innerWidth}&height=${window.innerHeight}`,
      solution: 'polaris',
      autoplay,
      controls: true,
      isLetterBoxed: false,
    });
    player.setupPlayer(dmViewers.CorePlayer);
  } catch (e) {
    container.replaceWith(poster);
    activateEmbed(figure, playerUrl, title, autoplay);
  }
}

export default async function decorate(block) {
  const videoCandidate = getVideoReference(block) || getVideoUrl(block);
  const youtubeId = getYoutubeId(videoCandidate);
  const videoRef = youtubeId || isAssetReference(videoCandidate) ? videoCandidate : '';
  // Resolution stays lazy (on play) so the poster never waits on a network round-trip.
  const videoUrl = !youtubeId && isLikelyVideoUrl(videoRef) ? videoRef : '';
  // Dynamic Media serves videos as an embeddable player page.
  const embedUrl = isDynamicMediaPlayerUrl(videoRef) ? videoRef : '';
  const posterSrc = getPosterSrc(block, videoRef);
  const posterAlt = getPosterAlt(block);
  const posterPicture = getPosterPicture(block);
  const caption = getCaption(block);
  const alignment = getAlignment(block);
  const autoplay = getAutoplay(block);

  getSourceRows(block).forEach((row) => {
    row.classList.add('article-content-video-source');
    row.setAttribute('aria-hidden', 'true');
  });

  block.querySelector(':scope > .article-content-video-figure')?.remove();
  ALIGNMENTS.forEach((a) => block.classList.remove(`article-content-video-${a}`));
  block.classList.add(`article-content-video-${alignment}`);

  if (!videoRef && !posterSrc && !posterPicture && !caption) return;

  const figure = document.createElement('figure');
  figure.className = 'article-content-video-figure';

  if (videoRef || posterSrc || posterPicture) {
    const poster = document.createElement('div');
    poster.className = 'article-content-video-poster';
    if (posterPicture || posterSrc) {
      const picture = createPictureFromSource(posterPicture, posterAlt)
        || createResponsiveImage(posterSrc, posterAlt, {
          breakpoints: [
            { width: '768' },
            { media: '(min-width: 900px)', width: '1200' },
          ],
        });
      poster.append(picture);
    }

    if (videoRef) {
      const playLabel = await getTranslation('playVideo', 'Play video');
      const playButton = createPlayButton(playLabel);
      playButton.addEventListener('click', async () => {
        if (youtubeId) {
          activateEmbed(figure, createYoutubeEmbedUrl(youtubeId, autoplay), 'YouTube video player');
          return;
        }

        if (embedUrl) {
          await activateDynamicMediaPlayer(figure, embedUrl, caption || 'Video player', autoplay);
          return;
        }

        const resolvedUrl = videoUrl || await resolveVideoUrl(videoRef);
        if (!resolvedUrl) return;
        activateVideo(figure, resolveAssetUrl(resolvedUrl), autoplay);
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
