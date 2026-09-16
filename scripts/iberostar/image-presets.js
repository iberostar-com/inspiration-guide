const BREAKPOINTS = [
  { key: 'xs', min: 360 },
  { key: 's', min: 576 },
  { key: 'm', min: 820 },
  { key: 'l', min: 1440 },
  { key: 'xl', min: 1920 },
];

const RETINA_MAX_WIDTH = 120;

const IMAGE_CROPS = {
  default: {
    xs: { w: 543 },
    s: { w: 787 },
    m: { w: 1200 },
    l: { w: 1200 },
    xl: { w: 1200 },
  },
  'article-content': {
    xs: { w: 543 },
    s: { w: 787 },
    m: { w: 1407 },
    l: { w: 805 },
    xl: { w: 805 },
  },
  'article-video-poster': {
    xs: { w: 543, ar: '16x9' },
    s: { w: 660, ar: '16x9' },
    m: { w: 774, ar: '16x9' },
    l: { w: 660, ar: '16x9' },
    xl: { w: 660, ar: '16x9' },
  },
  'article-main-image': {
    xs: { w: 543 },
    s: { w: 787 },
    m: { w: 805 },
    l: { w: 805 },
    xl: { w: 805 },
  },
  'article-author': {
    xs: { w: 40, ar: '1x1' },
    s: { w: 40, ar: '1x1' },
    m: { w: 40, ar: '1x1' },
    l: { w: 40, ar: '1x1' },
    xl: { w: 40, ar: '1x1' },
  },
  'article-content-inline': {
    xs: { w: 543 },
    s: { w: 787 },
    m: { w: 1407 },
    l: { w: 805 },
    xl: { w: 805 },
  },
  'hero-background': {
    xs: { w: 575 },
    s: { w: 819 },
    m: { w: 1439 },
    l: { w: 1919 },
    xl: { w: 1920 },
  },
  'hero-article-image': {
    xs: { w: 527 },
    s: { w: 771 },
    m: { w: 1375 },
    l: { w: 1855 },
    xl: { w: 1856 },
  },
  'hero-blog-image': {
    xs: { w: 527 },
    s: { w: 771 },
    m: { w: 896 },
    l: { w: 1216 },
    xl: { w: 1216 },
  },
  'hero-blog-icon': {
    xs: { w: 48 },
    s: { w: 48 },
    m: { w: 48 },
    l: { w: 56 },
    xl: { w: 56 },
  },
  'editorial-split-article': {
    xs: { w: 543, ar: '16x9' },
    s: { w: 787, ar: '16x9' },
    m: { w: 495, ar: '16x9' },
    l: { w: 495, ar: '16x9' },
    xl: { w: 495, ar: '16x9' },
  },
  'editorial-highlight-grid-home': {
    xs: { w: 543, ar: '4x3' },
    s: { w: 771, ar: '16x9' },
    m: { w: 580, ar: '4x3' },
    l: { w: 700, ar: '4x3' },
    xl: { w: 705, ar: '3x2' },
  },
  'editorial-highlight-grid-default': {
    xs: { w: 543 },
    s: { w: 386 },
    m: { w: 272 },
    l: { w: 272 },
    xl: { w: 272 },
  },
  'editorial-article-grid-card': {
    xs: { w: 543, ar: '4x3' },
    s: { w: 771, ar: '2x1' },
    m: { w: 448, ar: '3x2' },
    l: { w: 448, ar: '3x2' },
    xl: { w: 468, ar: '3x2' },
  },
  'featured-articles-latest': {
    xs: { w: 501, ar: '3x2' },
    s: { w: 745, ar: '3x2' },
    m: { w: 410, ar: '3x2' },
    l: { w: 410, ar: '3x2' },
    xl: { w: 410, ar: '3x2' },
  },
  'featured-articles-featured': {
    xs: { w: 501, ar: '3x2' },
    s: { w: 745, ar: '3x2' },
    m: { w: 603, ar: '3x2' },
    l: { w: 603, ar: '3x2' },
    xl: { w: 603, ar: '3x2' },
  },
  'cards-highlight': {
    xs: { w: 543, ar: '4x3' },
    s: { w: 671, ar: '4x3' },
    m: { w: 358, ar: '4x3' },
    l: { w: 358, ar: '4x3' },
    xl: { w: 358, ar: '4x3' },
  },
  'cards-overlay': {
    xs: { w: 523, ar: '2x1' },
    s: { w: 382, ar: '3x2' },
    m: { w: 363, ar: '3x2' },
    l: { w: 363, ar: '3x2' },
    xl: { w: 363, ar: '3x2' },
  },
  'cards-banner': {
    xs: { w: 300 },
    s: { w: 300 },
    m: { w: 300 },
    l: { w: 300 },
    xl: { w: 300 },
  },
  'category-card': {
    xs: { w: 310, ar: '1x1' },
    s: { w: 310, ar: '1x1' },
    m: { w: 336, ar: '1x1' },
    l: { w: 301, ar: '1x1' },
    xl: { w: 345, ar: '1x1' },
  },
  'category-carousel': {
    xs: { w: 314, ar: '3x4' },
    s: { w: 309, ar: '3x4' },
    m: { w: 453, ar: '3x4' },
    l: { w: 569, ar: '3x4' },
    xl: { w: 468, ar: '4x5' },
  },
  'blog-split-list-featured': {
    xs: { w: 552, ar: '4x3' },
    s: { w: 779, ar: '16x9' },
    m: { w: 951, ar: '4x3' },
    l: { w: 864, ar: '3x2' },
    xl: { w: 864, ar: '3x2' },
  },
  'blog-split-list-item': {
    xs: { w: 552, ar: '4x3' },
    s: { w: 779, ar: '16x9' },
    m: { w: 241, ar: '1x1' },
    l: { w: 336, ar: '4x3' },
    xl: { w: 496, ar: '2x1' },
  },
  'blog-split-list-author': {
    xs: { w: 32, ar: '1x1' },
    s: { w: 32, ar: '1x1' },
    m: { w: 40, ar: '1x1' },
    l: { w: 40, ar: '1x1' },
    xl: { w: 40, ar: '1x1' },
  },
  'hotel-mini-card-horizontal': {
    xs: { w: 128, ar: '4x3' },
    s: { w: 216, ar: '4x3' },
    m: { w: 216, ar: '4x3' },
    l: { w: 216, ar: '4x3' },
    xl: { w: 216, ar: '4x3' },
  },
  'hotel-mini-card-vertical': {
    xs: { w: 514, ar: '1x1' },
    s: { w: 336, ar: '3x4' },
    m: { w: 336, ar: '3x4' },
    l: { w: 336, ar: '3x4' },
    xl: { w: 351, ar: '3x4' },
  },
  'hotel-mini-card-vertical-grid': {
    xs: { w: 514, ar: '1x1' },
    s: { w: 370, ar: '3x4' },
    m: { w: 680, ar: '3x2' },
    l: { w: 336, ar: '3x4' },
    xl: { w: 336, ar: '3x4' },
  },
  'not-found-media': {
    xs: { w: 511, ar: '1x1' },
    s: { w: 635, ar: '1x1' },
    m: { w: 400, ar: '1x1' },
    l: { w: 520, ar: '1x1' },
    xl: { w: 520, ar: '1x1' },
  },
  'columns-image': {
    xs: { w: 543 },
    s: { w: 787 },
    m: { w: 588 },
    l: { w: 588 },
    xl: { w: 588 },
  },
};

function toRendition(breakpoint, crop, index) {
  const rendition = {
    width: crop.w <= RETINA_MAX_WIDTH ? crop.w * 2 : crop.w,
  };

  if (crop.ar) rendition.crop = `ratio-${crop.ar}`;
  if (index > 0) rendition.media = `(min-width: ${breakpoint.min}px)`;

  return rendition;
}

function buildPreset(crops) {
  const renditions = BREAKPOINTS
    .map((breakpoint, index) => ({ breakpoint, index }))
    .filter(({ breakpoint }) => crops[breakpoint.key])
    .reverse()
    .map(({ breakpoint, index }) => toRendition(breakpoint, crops[breakpoint.key], index));

  return {
    renditions,
    fallbackBreakpoints: renditions.map(({ media, width }) => (
      media ? { media, width: `${width}` } : { width: `${width}` }
    )),
  };
}

const IMAGE_PRESETS = Object.fromEntries(
  Object.entries(IMAGE_CROPS).map(([name, crops]) => [name, buildPreset(crops)]),
);

export default function getImagePreset(name) {
  return IMAGE_PRESETS[name] || IMAGE_PRESETS.default;
}
