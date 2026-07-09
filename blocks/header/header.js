import { resolveFragmentPath } from '../../scripts/iberostar/fragments.js';
import { loadFragment } from '../fragment/fragment.js';

const DEFAULT_NAV_PATH = '/nav';
const DESKTOP = window.matchMedia('(width >= 1440px)');

const LOGO_MARK = `<svg class="nav-logo-mark" viewBox="0 0 48 34" width="24" height="17" aria-hidden="true" fill="none">
  <g stroke="#3aa496" stroke-width="2.4" stroke-linecap="round">
    <path d="M24 2v6"/>
    <path d="M13 5l2.5 5"/>
    <path d="M35 5l-2.5 5"/>
    <path d="M5 12l5 2.5"/>
    <path d="M43 12l-5 2.5"/>
    <path d="M10 23a14 14 0 0 1 28 0"/>
    <path d="M4 29c4 0 4 2.6 8 2.6s4-2.6 8-2.6 4 2.6 8 2.6 4-2.6 8-2.6"/>
  </g>
</svg>`;

function cellText(cell) {
  return cell?.textContent?.trim() || '';
}

function createIcon(name, extra) {
  const icon = document.createElement('i');
  icon.className = `ibh-icon-${name}${extra ? ` ${extra}` : ''}`;
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function createChevron(cls) {
  const icon = document.createElement('i');
  icon.className = `${cls} ibh-icon-keyboard-arrow-down`;
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function applyTarget(anchor, target) {
  if (target === '_blank') {
    anchor.target = '_blank';
    anchor.rel = 'noopener';
  }
}

function linkTarget(anchor) {
  return anchor?.getAttribute('target') || '';
}

// Reads the menu from the authored nav-item blocks (each is its own block, not a
// shared <ul>). A child flagged nav-item-view-all becomes the "Ver todos" target.
// The target attribute (self/blank) set by nav-item is carried over to each link.
function readSections(fragment) {
  return [...fragment.querySelectorAll('.nav-item')].map((item) => {
    const link = item.querySelector('.nav-item-link') || item.querySelector('.nav-item-content a');
    const children = [];
    let viewAllText = '';
    let viewAllHref = '#';
    let viewAllTarget = '';

    item.querySelectorAll('.nav-item-panel .nav-item-dropdown-item').forEach((li) => {
      const anchor = li.querySelector('a');
      if (!anchor) return;
      if (li.classList.contains('nav-item-view-all')) {
        viewAllText = cellText(anchor);
        viewAllHref = anchor.getAttribute('href') || '#';
        viewAllTarget = linkTarget(anchor);
      } else {
        children.push({
          label: cellText(anchor),
          href: anchor.getAttribute('href') || '#',
          target: linkTarget(anchor),
        });
      }
    });

    return {
      label: cellText(link),
      href: link?.getAttribute('href') || '#',
      target: linkTarget(link),
      viewAllText,
      viewAllHref,
      viewAllTarget,
      children,
    };
  });
}

// Parent item: inline trigger (chevron on desktop, arrow on mobile) + a panel that
// is a full-screen drill-down on mobile and a dropdown on desktop.
function buildItem(section, showRoot) {
  const item = document.createElement('div');
  item.className = 'nav-item';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-stripe nav-stripe--parent';
  trigger.setAttribute('aria-expanded', 'false');

  const label = document.createElement('span');
  label.className = 'nav-stripe-label';
  label.textContent = section.label;
  trigger.append(label, createChevron('nav-chevron nav-chevron--down'), createIcon('arrow-forward', 'nav-forward'));
  item.append(trigger);

  const panel = document.createElement('div');
  panel.className = 'nav-subpanel';

  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'nav-breadcrumb';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'nav-breadcrumb-back';
  back.append(createIcon('arrow-back'));
  const backLabel = document.createElement('span');
  backLabel.textContent = 'Inicio';
  back.append(backLabel);
  back.addEventListener('click', (event) => { event.stopPropagation(); showRoot(); });
  breadcrumb.append(back);
  panel.append(breadcrumb);

  const accordion = document.createElement('div');
  accordion.className = 'nav-accordion';
  section.children.forEach((child) => {
    const a = document.createElement('a');
    a.className = 'nav-stripe nav-stripe--direct';
    const span = document.createElement('span');
    span.className = 'nav-stripe-label';
    span.textContent = child.label;
    a.append(span);
    a.href = child.href;
    applyTarget(a, child.target);
    accordion.append(a);
  });

  // "Ver todos" comes from the authored nav-item fields, not auto-generated.
  if (section.viewAllText) {
    const viewAll = document.createElement('a');
    viewAll.className = 'nav-viewall';
    viewAll.href = section.viewAllHref || '#';
    applyTarget(viewAll, section.viewAllTarget);
    const viewAllLabel = document.createElement('span');
    viewAllLabel.textContent = section.viewAllText;
    viewAll.append(viewAllLabel, createIcon('arrow-forward'));
    accordion.append(viewAll);
  }

  panel.append(accordion);
  item.append(panel);

  return { item, trigger, panel };
}

export default async function decorate(block) {
  const primaryPath = resolveFragmentPath('nav', DEFAULT_NAV_PATH);
  const fragment = await loadFragment(primaryPath) || await loadFragment(DEFAULT_NAV_PATH);
  if (!fragment) return;

  const sections = readSections(fragment);

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.dataset.view = 'root';
  nav.setAttribute('aria-expanded', 'false');

  // ---- bar ----
  const bar = document.createElement('div');
  bar.className = 'nav-bar';

  // Brand/logos come from the authored header-brand block (Logo móvil / Logo desktop).
  const brandBlock = fragment.querySelector('.header-brand');
  const brandLink = brandBlock?.querySelector('.header-brand-link');
  const brand = document.createElement('a');
  brand.className = 'nav-brand';
  brand.href = brandLink?.getAttribute('href') || '/';
  brand.setAttribute('aria-label', brandLink?.getAttribute('aria-label') || 'Inspiration Guide');

  const mobileLogoEl = brandBlock?.querySelector('.header-brand-logo--mobile');
  const desktopLogoEl = brandBlock?.querySelector('.header-brand-logo--desktop');
  if (mobileLogoEl || desktopLogoEl) {
    if (mobileLogoEl) {
      mobileLogoEl.classList.add('nav-logo', 'nav-logo--mobile');
      brand.append(mobileLogoEl);
    }
    if (desktopLogoEl) {
      desktopLogoEl.classList.add('nav-logo', 'nav-logo--desktop');
      brand.append(desktopLogoEl);
    }
  } else {
    brand.innerHTML = `<span class="nav-logo nav-logo--mobile">${LOGO_MARK}</span>`
      + `<span class="nav-logo nav-logo--desktop">${LOGO_MARK}`
      + '<span class="nav-logo-word"><span class="nav-logo-word-a">Inspiration</span>'
      + '<span class="nav-logo-word-b">GUIDE</span></span></span>';
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-controls', 'nav');
  toggle.setAttribute('aria-label', 'Abrir menú');
  toggle.append(createIcon('menu', 'nav-menu-icon'), createIcon('close', 'nav-close-icon'));

  // ---- panel (overlay on mobile / inline on desktop) ----
  const panel = document.createElement('div');
  panel.className = 'nav-panel';

  const primary = document.createElement('div');
  primary.className = 'nav-primary';
  const listEl = document.createElement('div');
  listEl.className = 'nav-menu-list';

  const showRoot = () => {
    nav.dataset.view = 'root';
    nav.querySelectorAll('.nav-item').forEach((it) => {
      it.classList.remove('is-open');
      it.querySelector(':scope > .nav-stripe--parent').setAttribute('aria-expanded', 'false');
    });
  };

  const closeDesktop = (except) => {
    nav.querySelectorAll('.nav-item.is-open').forEach((it) => {
      if (it === except) return;
      it.classList.remove('is-open');
      it.querySelector(':scope > .nav-stripe--parent').setAttribute('aria-expanded', 'false');
    });
  };

  sections.forEach((section, index) => {
    if (section.children.length) {
      const { item, trigger } = buildItem(section, showRoot);
      trigger.addEventListener('click', () => {
        const open = item.classList.contains('is-open');
        if (DESKTOP.matches) {
          closeDesktop(item);
          item.classList.toggle('is-open', !open);
          trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
        } else if (open) {
          showRoot();
        } else {
          nav.dataset.view = String(index);
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
      listEl.append(item);
    } else {
      const a = document.createElement('a');
      a.className = 'nav-stripe nav-stripe--direct';
      const span = document.createElement('span');
      span.className = 'nav-stripe-label';
      span.textContent = section.label;
      a.append(span);
      a.href = section.href;
      applyTarget(a, section.target);
      listEl.append(a);
    }
  });
  primary.append(listEl);

  // ---- utilities ----
  const utilities = document.createElement('div');
  utilities.className = 'nav-utilities';

  const divider = () => Object.assign(document.createElement('span'), { className: 'nav-divider' });

  // DOM order = mobile order (Reservar / ESP); desktop reorders via flex.
  const hotelsLink = fragment.querySelector('.nav-hotels a, .nav-hotels-link a');
  if (hotelsLink) {
    const a = document.createElement('a');
    a.className = 'nav-stripe nav-stripe--direct nav-util nav-util--hotels';
    const span = document.createElement('span');
    span.className = 'nav-stripe-label';
    span.textContent = cellText(hotelsLink) || 'Reservar Hoteles';
    a.append(span);
    a.href = hotelsLink.getAttribute('href') || '#';
    applyTarget(a, linkTarget(hotelsLink));
    utilities.append(a, divider());
  }

  // Reuse the decorated nav-language trigger (Nando's block) as-is — keeps its
  // click handler and the modal it mounts on document.body.
  const languageEl = fragment.querySelector('.nav-language-rendered')
    || fragment.querySelector('.nav-language');
  if (languageEl) {
    languageEl.classList.add('nav-util', 'nav-util--lang');
    utilities.append(languageEl);
  }

  panel.append(primary, utilities);
  bar.append(brand, panel, toggle);
  nav.append(bar);

  // ---- open / close (mobile) ----
  const setOpen = (open) => {
    nav.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('nav-open', open && !DESKTOP.matches);
    if (!open) showRoot();
  };

  toggle.addEventListener('click', () => setOpen(nav.getAttribute('aria-expanded') !== 'true'));

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Escape') return;
    if (DESKTOP.matches) { closeDesktop(); return; }
    if (nav.getAttribute('aria-expanded') === 'true') {
      if (nav.dataset.view !== 'root') showRoot();
      else setOpen(false);
    }
  });

  // Desktop dropdowns open on click; close when clicking outside a nav item.
  document.addEventListener('click', (event) => {
    if (DESKTOP.matches && !event.target.closest('.nav-item')) closeDesktop();
  });

  DESKTOP.addEventListener('change', () => { setOpen(false); showRoot(); });

  block.textContent = '';
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(backdrop, nav);
  block.append(navWrapper);
}
