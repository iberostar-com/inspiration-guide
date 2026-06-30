import { createResponsiveImage } from '../../scripts/iberostar/media.js';

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

function getSourceRows(block) {
  return [...block.children]
    .filter((child) => !child.classList.contains('editorial-article-content-rendered'));
}

function getPropElement(row, propName) {
  if (row.matches?.(`[data-aue-prop="${propName}"]`)) return row;
  return row.querySelector?.(`[data-aue-prop="${propName}"]`) || null;
}

function isTableItem(row) {
  return row.getAttribute('data-aue-model') === 'editorial-content-table'
    || Boolean(getPropElement(row, 'titleHeading') && row.querySelector('table'));
}

function isVideoItem(row) {
  return row.getAttribute('data-aue-model') === 'editorial-content-video'
    || Boolean(getPropElement(row, 'videoCf'));
}

function getPropText(row, propName) {
  return getPropElement(row, propName)?.textContent?.trim() || '';
}

// --- Table item helpers ---

function normalizeThead(table) {
  if (table.querySelector(':scope > thead')) return;

  const tbody = table.querySelector(':scope > tbody');
  const firstRow = tbody
    ? tbody.querySelector(':scope > tr:first-child')
    : table.querySelector(':scope > tr:first-child');

  if (!firstRow) return;

  [...firstRow.querySelectorAll(':scope > td')].forEach((td) => {
    const th = document.createElement('th');
    [...td.attributes].forEach((attr) => th.setAttribute(attr.name, attr.value));
    th.append(...td.childNodes);
    td.replaceWith(th);
  });

  const thead = document.createElement('thead');
  thead.append(firstRow);
  table.prepend(thead);
}

function normalizeTbody(table) {
  const nakedRows = [...table.querySelectorAll(':scope > tr')];
  if (!nakedRows.length) return;

  const existingTbody = table.querySelector(':scope > tbody');
  const tbody = existingTbody || document.createElement('tbody');
  nakedRows.forEach((row) => tbody.append(row));
  if (!existingTbody) table.append(tbody);
}

function buildCaption(title, headingValue) {
  const headingTag = ['h2', 'h3'].includes(headingValue) ? headingValue : 'h2';
  const caption = document.createElement('caption');
  const heading = document.createElement(headingTag);
  heading.textContent = title;
  caption.append(heading);
  return caption;
}

function renderTableItem(row) {
  const textField = getPropElement(row, 'text');
  const table = textField?.querySelector('table') || row.querySelector('table');
  if (!table) return null;

  const renderedTable = table.cloneNode(true);
  normalizeThead(renderedTable);
  normalizeTbody(renderedTable);

  const title = getPropText(row, 'title');
  if (title) {
    renderedTable.querySelector('caption')?.remove();
    renderedTable.prepend(buildCaption(title, getPropText(row, 'titleHeading')));
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'editorial-article-content-table';
  wrapper.append(renderedTable);
  return wrapper;
}

// --- Video item helpers ---

function getVideoUrl(row) {
  const videoField = getPropElement(row, 'videoCf');
  const directSource = videoField?.querySelector('source[src]')?.getAttribute('src')
    || videoField?.querySelector('video[src]')?.getAttribute('src');
  if (directSource) return directSource;

  const fieldLinks = [...(videoField?.querySelectorAll('a[href]') || [])];
  const videoLink = fieldLinks.find((link) => VIDEO_EXTENSIONS.test(link.getAttribute('href')));
  if (videoLink) return videoLink.getAttribute('href');
  if (fieldLinks[0]) return fieldLinks[0].getAttribute('href');

  const fallbackSource = row.querySelector('source[src]')?.getAttribute('src')
    || row.querySelector('video[src]')?.getAttribute('src');
  if (fallbackSource) return fallbackSource;

  const fallbackLink = [...row.querySelectorAll('a[href]')]
    .find((link) => VIDEO_EXTENSIONS.test(link.getAttribute('href')));
  return fallbackLink?.getAttribute('href') || '';
}

function getPosterSrc(row) {
  const posterField = getPropElement(row, 'poster');
  if (posterField) {
    return posterField.querySelector('img')?.src
      || posterField.querySelector('a[href]')?.getAttribute('href')?.trim()
      || posterField.textContent?.trim()
      || '';
  }

  return getPropElement(row, 'videoCf')?.querySelector('img')?.src || '';
}

function createPlayButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'editorial-article-content-video-play';
  button.setAttribute('aria-label', 'Reproducir vídeo');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 56 56');
  svg.setAttribute('aria-hidden', 'true');

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '28');
  circle.setAttribute('cy', '28');
  circle.setAttribute('r', '28');
  circle.setAttribute('fill', 'rgba(255,255,255,0.92)');

  const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  triangle.setAttribute('d', 'M22 18l20 10-20 10z');
  triangle.setAttribute('fill', '#1b2828');

  svg.append(circle, triangle);
  button.append(svg);
  return button;
}

function activateVideo(wrapper, videoUrl) {
  const poster = wrapper.querySelector('.editorial-article-content-video-poster');
  if (!poster) return;

  const video = document.createElement('video');
  video.src = videoUrl;
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  video.className = 'editorial-article-content-video-player';
  poster.replaceWith(video);
  video.play().catch(() => {
    // Autoplay can be blocked; native controls remain available for manual playback.
  });
}

function renderVideoItem(row) {
  const videoUrl = getVideoUrl(row);
  if (!videoUrl) return null;

  const wrapper = document.createElement('figure');
  wrapper.className = 'editorial-article-content-video';

  const poster = document.createElement('div');
  poster.className = 'editorial-article-content-video-poster';

  const posterSrc = getPosterSrc(row);
  if (posterSrc) {
    poster.append(createResponsiveImage(posterSrc, getPropText(row, 'caption'), {
      breakpoints: [{ width: '768' }, { media: '(min-width: 900px)', width: '1200' }],
    }));
  }

  const playButton = createPlayButton();
  playButton.addEventListener('click', () => activateVideo(wrapper, videoUrl));
  poster.append(playButton);
  wrapper.append(poster);

  const caption = getPropText(row, 'caption');
  if (caption) {
    const figcaption = document.createElement('figcaption');
    figcaption.className = 'editorial-article-content-caption';
    figcaption.textContent = caption;
    wrapper.append(figcaption);
  }

  return wrapper;
}

// --- Text item helpers ---

function cloneChildren(source, target) {
  [...source.childNodes].forEach((child) => target.append(child.cloneNode(true)));
}

function appendCellContent(row, target) {
  [...row.children].forEach((cell) => {
    if (cell.children.length) {
      cloneChildren(cell, target);
      return;
    }

    const text = cell.textContent?.trim();
    if (text) {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      target.append(paragraph);
    }
  });
}

function renderTextRow(row, target) {
  const richText = getPropElement(row, 'text');
  if (richText) {
    cloneChildren(richText, target);
  } else {
    appendCellContent(row, target);
  }
}

function hideSource(block) {
  getSourceRows(block).forEach((row) => {
    row.classList.add('editorial-article-content-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

export default function decorate(block) {
  block.querySelector(':scope > .editorial-article-content-rendered')?.remove();

  const article = document.createElement('article');
  article.className = 'editorial-article-content-rendered';

  getSourceRows(block).forEach((row) => {
    if (isTableItem(row)) {
      const table = renderTableItem(row);
      if (table) article.append(table);
      return;
    }

    if (isVideoItem(row)) {
      const video = renderVideoItem(row);
      if (video) article.append(video);
      return;
    }

    renderTextRow(row, article);
  });

  if (!article.children.length) return;

  hideSource(block);
  block.append(article);
}
