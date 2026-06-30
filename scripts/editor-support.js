import {
  decorateBlock,
  decorateBlocks,
  decorateIcons,
  decorateSections,
  loadBlock,
  loadSections,
} from './aem.js';
import { decorateRichtext } from './editor-support-rte.js';
import { decoratePageLinks } from './iberostar/page-links.js';
// eslint-disable-next-line import/no-cycle
import { decorateButtons } from './scripts.js';

async function applyChanges(event) {
  // redecorate default content and blocks on patches (sections, blocks)
  const { detail } = event;

  const resource = detail?.request?.target?.resource // update, patch components
    || detail?.request?.target?.container?.resource // update, patch, add to a container
    || detail?.request?.to?.container?.resource; // move in a container
  if (!resource) return false;
  const updates = detail?.response?.updates;
  if (!updates.length) return false;
  const { content } = updates[0];
  if (!content) return false;

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const element = doc.querySelector(`[data-aue-resource="${resource}"]`);
  if (element) {
    const block = element.parentElement?.closest('.block[data-aue-resource]') || element?.closest('.block[data-aue-resource]');
    if (block) {
      const blockResource = block.getAttribute('data-aue-resource');
      const newBlock = doc.querySelector(`[data-aue-resource="${blockResource}"]`);
      if (newBlock) {
        // existing block updated
        const existingBlock = document.querySelector(`[data-aue-resource="${blockResource}"]`);
        if (existingBlock) {
          newBlock.classList.add('block');
          newBlock.setAttribute('data-block-name', existingBlock.dataset.blockName);
          newBlock.setAttribute('data-block-status', 'initialized');
          existingBlock.insertAdjacentElement('afterend', newBlock);
          decorateRichtext(newBlock);
          decorateButtons(newBlock);
          decorateIcons(newBlock);
          decorateBlock(newBlock);
          await loadBlock(newBlock);
          decoratePageLinks(newBlock);
          existingBlock.remove();
          return true;
        }
      }
    } else {
      // sections and default content
      const newPath = element.dataset.aueResource;
      const elementParent = document.querySelector(`[data-aue-resource="${newPath}"]`);
      if (elementParent) {
        const parentEl = elementParent.parentElement;
        elementParent.insertAdjacentElement('afterend', element);
        decorateRichtext(element);
        decorateButtons(element);
        decorateIcons(element);
        decorateSections(parentEl);
        decorateBlocks(parentEl);
        await loadSections(parentEl);
        decoratePageLinks(element);
        elementParent.remove();
        return true;
      }
    }
  }
  return false;
}

async function handleEditorUpdate(event) {
  const applied = await applyChanges(event);
  if (!applied) window.location.reload();
}

document.querySelector('main')?.addEventListener('aue:content-patch', handleEditorUpdate);
document.querySelector('main')?.addEventListener('aue:content-update', handleEditorUpdate);
document.querySelector('main')?.addEventListener('aue:content-add', handleEditorUpdate);
document.querySelector('main')?.addEventListener('aue:content-move', handleEditorUpdate);
document.querySelector('main')?.addEventListener('aue:content-remove', handleEditorUpdate);
