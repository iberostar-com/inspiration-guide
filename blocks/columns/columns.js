import { applyImagePreset } from '../../scripts/iberostar/media.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const IMAGE_PRESET = 'columns-image';

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }

        const sourceImage = pic.querySelector('img');
        const applied = applyImagePreset(pic, { preset: IMAGE_PRESET });
        const appliedImage = applied?.querySelector?.('img');
        if (sourceImage && appliedImage && appliedImage !== sourceImage) {
          moveInstrumentation(sourceImage, appliedImage);
        }
      }
    });
  });
}
