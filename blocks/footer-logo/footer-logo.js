/**
 * Footer Logo — container block for the Header Brand child block.
 * Adds the 'in-footer' modifier to the nested header-brand element so CSS can
 * style the logo differently here versus in the site header.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  block.querySelector('.header-brand')?.classList.add('in-footer');
}
