function getSourceRows(block) {
  return [...block.children].filter((row) => !row.classList.contains('article-content-quote-rendered'));
}

function getPropElement(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  return getSourceRows(block)
    .map((row) => (row.matches?.(selector) ? row : row.querySelector?.(selector)))
    .find(Boolean) || null;
}

function getQuoteContent(block) {
  const textEl = getPropElement(block, 'text');
  if (textEl) return textEl.cloneNode(true);
  // Positional fallback: use first source row content
  const first = getSourceRows(block)[0];
  return first ? first.cloneNode(true) : null;
}

function getAttribution(block) {
  const el = getPropElement(block, 'attribution');
  return el?.textContent?.trim() || '';
}

// --- Main decorator ---

export default function decorate(block) {
  block.querySelector(':scope > .article-content-quote-rendered')?.remove();

  const content = getQuoteContent(block);
  if (!content) return;

  // Hide source rows (preserve UE instrumentation)
  getSourceRows(block).forEach((row) => {
    row.classList.add('article-content-quote-source');
    row.setAttribute('aria-hidden', 'true');
  });

  const blockquote = document.createElement('blockquote');
  blockquote.className = 'article-content-quote-rendered';

  // Move text content nodes into the blockquote
  [...content.childNodes].forEach((node) => blockquote.append(node.cloneNode(true)));

  const attribution = getAttribution(block);
  if (attribution) {
    // Se usa  (no <footer>) para evitar que doc.querySelector('footer')
    // en scripts.js confunda este elemento con el footer global del layout.
    const attributionEl = document.createElement('cite');
    attributionEl.className = 'article-content-quote-attribution';
    attributionEl.textContent = attribution;
    blockquote.append(attributionEl);
  }

  block.append(blockquote);
}
