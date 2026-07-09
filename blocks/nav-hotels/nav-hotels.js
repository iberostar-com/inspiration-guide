/**
 * Nav Hotels Link block: single CTA link rendered inside the header nav.
 * Structure from AEM: cells[0]=linkText, cells[1]=link, cells[2]=target
 * @param {Element} block The nav-hotels block element
 */
export default function decorate(block) {
  const cells = Array.from(block.querySelectorAll(':scope > div > div'));
  const linkText = cells[0]?.textContent.trim() || '';
  const link = cells[1]?.textContent.trim() || '#';
  const targetCell = block.querySelector('[data-aue-prop="target"]') || cells[2];
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
