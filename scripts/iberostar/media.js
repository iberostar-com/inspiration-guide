import { createOptimizedPicture } from '../aem.js';

export function isRemoteImage(src = '') {
  return /^https?:\/\//.test(src);
}

export function createResponsiveImage(src, alt = '', eager = false, breakpoints = [{ width: '750' }]) {
  if (isRemoteImage(src)) {
    const image = document.createElement('img');
    image.src = src;
    image.alt = alt;
    image.loading = eager ? 'eager' : 'lazy';
    return image;
  }

  return createOptimizedPicture(src, alt, eager, breakpoints);
}
