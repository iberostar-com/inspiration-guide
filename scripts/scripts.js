import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';
import { decorateRichtext } from './editor-support-rte.js';
import { decoratePageLinks } from './iberostar/page-links.js';
import { getContentLocale } from './iberostar/date-format.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

function applyPageMetadataState() {
  const pageType = document.querySelector('meta[name="page-type"]')?.content?.trim();

  if (!pageType || pageType === 'default') {
    return;
  }

  document.body.dataset.pageType = pageType;
  document.body.classList.add(`page-${pageType}`);
}

function getPageType() {
  return document.querySelector('meta[name="page-type"]')?.content?.trim() || 'default';
}

function isArticleLayoutSection(section) {
  return section.classList.contains('article-main') || section.classList.contains('article-sidebar');
}

function buildArticleLayoutShell(layoutSections) {
  if (!layoutSections.length) {
    return;
  }

  const shell = document.createElement('div');
  shell.className = 'article-layout-shell';

  const mainColumn = document.createElement('div');
  mainColumn.className = 'article-layout-main';

  const sidebarColumn = document.createElement('aside');
  sidebarColumn.className = 'article-layout-sidebar';

  shell.append(mainColumn, sidebarColumn);
  layoutSections[0].before(shell);

  layoutSections.forEach((section) => {
    if (section.classList.contains('article-sidebar')) {
      sidebarColumn.append(section);
      return;
    }

    mainColumn.append(section);
  });

  if (!mainColumn.children.length || !sidebarColumn.children.length) {
    shell.replaceWith(...layoutSections);
  }
}

function isArticleLayout(main) {
  return getPageType() === 'article'
    || Boolean(main.querySelector(':scope > .section.article-main, :scope > .section.article-sidebar'));
}

function applyArticleTwoColumnLayout(main) {
  const isUniversalEditorPage = main.querySelector(':scope > [data-aue-resource]');
  if (!isArticleLayout(main)) {
    return;
  }

  document.body.classList.add('page-article');

  if (isUniversalEditorPage) {
    main.classList.add('article-layout-author');
    return;
  }

  const sections = [...main.querySelectorAll(':scope > div.section')];
  let index = 0;

  while (index < sections.length) {
    if (isArticleLayoutSection(sections[index])) {
      const layoutGroup = [];

      while (index < sections.length && isArticleLayoutSection(sections[index])) {
        layoutGroup.push(sections[index]);
        index += 1;
      }

      buildArticleLayoutShell(layoutGroup);
    } else {
      index += 1;
    }
  }
}

const SIDEBAR_ANCHOR_SELECTOR = '.article-main-image, .article-content-image';

/**
 * Aligns the top of the sticky sidebar with the first image of the article.
 * The offset is exposed as `--article-sidebar-offset` and only used on wide viewports.
 * @param {Element} shell The article layout shell
 */
function updateArticleSidebarOffset(container, anchorSelector) {
  const isTwoColumn = window.matchMedia('(width >= 1440px)').matches;
  const anchor = container.querySelector(anchorSelector);

  if (!isTwoColumn || !anchor) {
    container.style.removeProperty('--article-sidebar-offset');
    return;
  }

  // the main column is start aligned, so its position does not change with the offset applied
  const offset = anchor.getBoundingClientRect().top - container.getBoundingClientRect().top;

  container.style.setProperty('--article-sidebar-offset', `${Math.max(0, Math.round(offset))}px`);
}

/**
 * Keeps the sticky sidebar aligned when the article content reflows.
 * @param {Element} main The main element
 */
function initArticleSidebarAlignment(main) {
  const shells = [...main.querySelectorAll(':scope > .article-layout-shell')];
  const authorMain = main.classList.contains('article-layout-author') ? main : null;
  if (!shells.length && !authorMain) return;

  const update = () => {
    shells.forEach((shell) => updateArticleSidebarOffset(shell, `.article-layout-main ${SIDEBAR_ANCHOR_SELECTOR}`));
    if (authorMain) updateArticleSidebarOffset(authorMain, SIDEBAR_ANCHOR_SELECTOR);
  };
  update();

  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => update());
    shells.forEach((shell) => observer.observe(shell.querySelector('.article-layout-main')));
    if (authorMain) observer.observe(authorMain);
  }

  window.addEventListener('resize', update);
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  decorateRichtext(main);
  buildAutoBlocks(main);
  decorateSections(main);
  applyArticleTwoColumnLayout(main);
  decorateBlocks(main);
  decorateButtons(main);
  decoratePageLinks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = getContentLocale();
  decorateTemplateAndTheme();
  applyPageMetadataState();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
    decoratePageLinks(main);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const pageType = getPageType();
  const isFragmentPage = pageType === 'fragment';

  if (!isFragmentPage) {
    const header = doc.querySelector('header');
    loadHeader(header).then(() => decoratePageLinks(header));
  }

  const main = doc.querySelector('main');
  await loadSections(main);
  decoratePageLinks(main);
  initArticleSidebarAlignment(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  if (!isFragmentPage) {
    const footer = doc.querySelector('footer');
    loadFooter(footer).then(() => decoratePageLinks(footer));
  }

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadCSS(`${window.hlx.codeBasePath}/styles/ibh-icons.css`);
  loadFonts();

  // Consent (OneTrust) must be in place before Tealium loads in the delayed phase.
  import('./iberostar/analytics.js').then((analytics) => analytics.initConsent());

  // Universal Editor support: only load when the document is instrumented.
  if (document.querySelector('[data-aue-resource]') || window.location.href.includes('.aem.page')) {
    // eslint-disable-next-line import/no-cycle
    import('./editor-support.js');
  }
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
