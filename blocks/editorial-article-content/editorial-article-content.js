function getSourceRows(block) {
  return [...block.children].filter((child) => !child.classList.contains('editorial-article-content-rendered'));
}

function getRichTextElement(block) {
  return getSourceRows(block)
    .map((row) => (row.matches?.('[data-aue-prop="text"]') ? row : row.querySelector?.('[data-aue-prop="text"]')))
    .find(Boolean) || null;
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

  const richText = getRichTextElement(block);
  if (richText) {
    cloneChildren(richText, article);
  } else {
    getSourceRows(block).forEach((row) => appendCellContent(row, article));
  }

  if (!article.children.length) return;

  hideSource(block);
  block.append(article);
}
