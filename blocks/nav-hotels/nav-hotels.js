/**
 * Nav Hotels Link block: single CTA link rendered inside the header nav.
 * Structure from AEM: cells[0]=linkText, cells[1]=link
 * @param {Element} block The nav-hotels block element
 */
export default function decorate(block) {
  const cells = Array.from(block.querySelectorAll(':scope > div > div'));
  const linkText = cells[0]?.textContent.trim() || '';
  const link = cells[1]?.textContent.trim() || '#';

  const a = document.createElement('a');
  a.href = link;
  a.textContent = linkText;

  block.replaceChildren(a);
}
