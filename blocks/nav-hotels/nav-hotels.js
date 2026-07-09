/**
 * Nav Hotels Link block: single CTA link rendered inside the header nav.
 * Structure from AEM: cells[0]=linkText, cells[1]=link, cells[2]=target
 * @param {Element} block The nav-hotels block element
 */
export default function decorate(block) {
  const cells = Array.from(block.querySelectorAll(':scope > div > div'));
  // In the author, linkText + link render as a single <a href="{link}">{linkText}</a>;
  // in a local mock they are separate text cells. The target select renders _self/_blank.
  const anchor = block.querySelector('a[href]');
  const targetCell = block.querySelector('[data-aue-prop="target"]')
    || cells.find((cell) => /^_(self|blank)$/i.test(cell.textContent.trim()));
  const rest = cells.filter((cell) => cell !== targetCell);

  const linkText = (anchor?.textContent || rest[0]?.textContent || '').trim();
  const link = anchor?.getAttribute('href') || rest[1]?.textContent.trim() || '#';
  const blank = /blank|nueva/i.test(targetCell?.textContent || '');

  const a = document.createElement('a');
  a.href = link;
  a.textContent = linkText;
  if (blank) {
    a.target = '_blank';
    a.rel = 'noopener';
  }

  block.replaceChildren(a);
}
