function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('editorial-article-content-rendered'));
}

// --- Text item helpers ---

function getRichTextElement(row) {
  if (row.matches?.('[data-aue-prop="text"]')) return row;
  return row.querySelector?.('[data-aue-prop="text"]') || null;
}

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
  const richText = getRichTextElement(row);
  if (richText) {
    cloneChildren(richText, target);
  } else {
    appendCellContent(row, target);
  }
}

// --- Source hiding ---

function hideSource(block) {
  getSourceRows(block).forEach((row) => {
    row.classList.add('editorial-article-content-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

// --- Main decorator ---

export default function decorate(block) {
  block.querySelector(':scope > .editorial-article-content-rendered')?.remove();

  const rows = getSourceRows(block);
  const article = document.createElement('article');
  article.className = 'editorial-article-content-rendered';

  rows.forEach((row) => {
    renderTextRow(row, article);
  });

  if (!article.children.length) return;

  hideSource(block);
  block.append(article);
}
