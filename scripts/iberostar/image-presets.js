const ARTICLE_CARD_RENDITIONS = [
  {
    media: '(min-width: 900px)',
    crop: 'IG-Article-Card-Desktop',
    width: 900,
    height: 600,
  },
  {
    media: '(min-width: 600px)',
    crop: 'IG-Article-Card-Tablet',
    width: 720,
    height: 540,
  },
  {
    crop: 'IG-Article-Card-Mobile',
    width: 640,
    height: 480,
  },
];

const CATEGORY_CARD_RENDITIONS = [
  {
    media: '(min-width: 900px)',
    crop: 'IG-Category-Card-Desktop',
    width: 640,
    height: 800,
  },
  {
    crop: 'IG-Category-Card-Mobile',
    width: 520,
    height: 650,
  },
];

const HOTEL_CARD_RENDITIONS = [
  {
    media: '(min-width: 900px)',
    crop: 'IG-Hotel-Card-Desktop',
    width: 900,
    height: 600,
  },
  {
    crop: 'IG-Hotel-Card-Mobile',
    width: 640,
    height: 480,
  },
];

const IMAGE_PRESETS = {
  default: {
    renditions: [
      {
        media: '(min-width: 900px)',
        width: 1200,
      },
      {
        width: 750,
      },
    ],
    fallbackBreakpoints: [{ media: '(min-width: 900px)', width: '1200' }, { width: '750' }],
  },
  'article-card': {
    renditions: ARTICLE_CARD_RENDITIONS,
    fallbackBreakpoints: [{ media: '(min-width: 900px)', width: '900' }, { width: '640' }],
  },
  'article-card-featured': {
    renditions: [
      {
        media: '(min-width: 900px)',
        crop: 'IG-Article-Featured-Desktop',
        width: 1400,
        height: 840,
      },
      {
        media: '(min-width: 600px)',
        crop: 'IG-Article-Featured-Tablet',
        width: 960,
        height: 720,
      },
      {
        crop: 'IG-Article-Featured-Mobile',
        width: 720,
        height: 900,
      },
    ],
    fallbackBreakpoints: [{ media: '(min-width: 900px)', width: '1200' }, { width: '750' }],
  },
  'blog-split-list-featured': {
    renditions: [
      {
        media: '(min-width: 900px)',
        crop: 'IG-Blog-Split-Featured-Desktop',
        width: 1440,
        height: 960,
      },
      {
        media: '(min-width: 600px)',
        crop: 'IG-Blog-Split-Featured-Tablet',
        width: 960,
        height: 720,
      },
      {
        crop: 'IG-Blog-Split-Featured-Mobile',
        width: 720,
        height: 900,
      },
    ],
    fallbackBreakpoints: [{ media: '(min-width: 900px)', width: '1200' }, { width: '750' }],
  },
  'blog-split-list-item': {
    renditions: ARTICLE_CARD_RENDITIONS,
    fallbackBreakpoints: [{ width: '600' }],
  },
  'blog-split-list-author': {
    renditions: [
      {
        width: 80,
        height: 80,
        fit: 'crop,0',
      },
    ],
    fallbackBreakpoints: [{ width: '80' }],
  },
  'cards-highlight': {
    renditions: ARTICLE_CARD_RENDITIONS,
    fallbackBreakpoints: [{ width: '750' }],
  },
  'category-card': {
    renditions: CATEGORY_CARD_RENDITIONS,
    fallbackBreakpoints: [{ width: '600' }],
  },
  'category-carousel': {
    renditions: [
      {
        crop: 'IG-Category-Carousel',
        width: 360,
        height: 360,
      },
    ],
    fallbackBreakpoints: [{ width: '300' }],
  },
  'editorial-split': {
    renditions: [
      {
        media: '(min-width: 900px)',
        crop: 'IG-Editorial-Split-Desktop',
        width: 1100,
        height: 880,
      },
      {
        crop: 'IG-Editorial-Split-Mobile',
        width: 720,
        height: 900,
      },
    ],
    fallbackBreakpoints: [{ width: '750' }],
  },
  'hotel-card': {
    renditions: HOTEL_CARD_RENDITIONS,
    fallbackBreakpoints: [{ width: '750' }],
  },
  'hotel-mini-card-horizontal': {
    renditions: [
      {
        crop: 'IG-Hotel-Mini-Horizontal',
        width: 432,
        height: 306,
      },
    ],
    fallbackBreakpoints: [{ width: '432' }],
  },
  'hotel-mini-card-vertical': {
    renditions: [
      {
        media: '(min-width: 900px)',
        crop: 'IG-Hotel-Mini-Vertical-Desktop',
        width: 720,
        height: 960,
      },
      {
        crop: 'IG-Hotel-Mini-Vertical-Mobile',
        width: 640,
        height: 854,
      },
    ],
    fallbackBreakpoints: [{ width: '750' }],
  },
};

export default function getImagePreset(name) {
  return IMAGE_PRESETS[name] || IMAGE_PRESETS.default;
}
