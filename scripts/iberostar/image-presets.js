// Smart crops are temporarily disabled until the exact Dynamic Media crop
// names are confirmed. Uncomment each crop property only after verification.
const ARTICLE_CARD_RENDITIONS = [
  {
    media: '(min-width: 900px)',
    // crop: 'IG-Article-Card-Desktop',
    width: 900,
    height: 600,
  },
  {
    media: '(min-width: 600px)',
    // crop: 'IG-Article-Card-Tablet',
    width: 720,
    height: 540,
  },
  {
    // crop: 'IG-Article-Card-Mobile',
    width: 640,
    height: 480,
  },
];

const CATEGORY_CARD_RENDITIONS = [
  {
    media: '(min-width: 900px)',
    // crop: 'IG-Category-Card-Desktop',
    width: 640,
    height: 800,
  },
  {
    // crop: 'IG-Category-Card-Mobile',
    width: 520,
    height: 650,
  },
];

const HOTEL_CARD_RENDITIONS = [
  {
    media: '(min-width: 900px)',
    // crop: 'IG-Hotel-Card-Desktop',
    width: 900,
    height: 600,
  },
  {
    // crop: 'IG-Hotel-Card-Mobile',
    width: 640,
    height: 480,
  },
];

const ARTICLE_CONTENT_RENDITIONS = [
  {
    media: '(min-width: 900px)',
    // crop: 'IG-Article-Content-Desktop',
    width: 1200,
    height: 800,
  },
  {
    media: '(min-width: 600px)',
    // crop: 'IG-Article-Content-Tablet',
    width: 900,
    height: 600,
  },
  {
    // crop: 'IG-Article-Content-Mobile',
    width: 750,
    height: 500,
  },
];

const ARTICLE_VIDEO_POSTER_RENDITIONS = [
  {
    media: '(min-width: 900px)',
    // crop: 'IG-Article-Video-Desktop',
    width: 1200,
    height: 675,
  },
  {
    // crop: 'IG-Article-Video-Mobile',
    width: 768,
    height: 432,
  },
];

const ARTICLE_AUTHOR_RENDITIONS = [
  {
    // crop: 'IG-Article-Author',
    width: 96,
    height: 96,
    fit: 'crop,0',
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
  'article-content': {
    renditions: ARTICLE_CONTENT_RENDITIONS,
    fallbackBreakpoints: [
      { media: '(min-width: 900px)', width: '1200' },
      { media: '(min-width: 600px)', width: '900' },
      { width: '750' },
    ],
  },
  'article-video-poster': {
    renditions: ARTICLE_VIDEO_POSTER_RENDITIONS,
    fallbackBreakpoints: [{ media: '(min-width: 900px)', width: '1200' }, { width: '768' }],
  },
  'article-author': {
    renditions: ARTICLE_AUTHOR_RENDITIONS,
    fallbackBreakpoints: [{ width: '96' }],
  },
  'article-card-featured': {
    renditions: [
      {
        media: '(min-width: 900px)',
        // crop: 'IG-Article-Featured-Desktop',
        width: 1400,
        height: 840,
      },
      {
        media: '(min-width: 600px)',
        // crop: 'IG-Article-Featured-Tablet',
        width: 960,
        height: 720,
      },
      {
        // crop: 'IG-Article-Featured-Mobile',
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
        // crop: 'IG-Blog-Split-Featured-Desktop',
        width: 1440,
        height: 960,
      },
      {
        media: '(min-width: 600px)',
        // crop: 'IG-Blog-Split-Featured-Tablet',
        width: 960,
        height: 720,
      },
      {
        // crop: 'IG-Blog-Split-Featured-Mobile',
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
        // crop: 'IG-Category-Carousel',
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
        // crop: 'IG-Editorial-Split-Desktop',
        width: 1100,
        height: 880,
      },
      {
        // crop: 'IG-Editorial-Split-Mobile',
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
        // crop: 'IG-Hotel-Mini-Horizontal',
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
        // crop: 'IG-Hotel-Mini-Vertical-Desktop',
        width: 720,
        height: 960,
      },
      {
        // crop: 'IG-Hotel-Mini-Vertical-Mobile',
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
