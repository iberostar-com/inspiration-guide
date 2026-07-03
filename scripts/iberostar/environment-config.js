const DEFAULT_CONFIG = {
  dynamicMedia: {
    enabled: false,
    imageServer: 'https://delivery-p179213-e1886364.adobeaemcloud.com',
    company: '',
    damRoot: '/content/dam',
    stripExtension: true,
    assetHost: 'https://publish-p179213-e1886364.adobeaemcloud.com',
  },
  hotels: {
    graphqlHost: 'https://publish-p179213-e1886364.adobeaemcloud.com',
    graphqlEndpoint: '/graphql/execute.json/iberostar-com/hotel-by-code',
    graphqlOperationName: 'HotelByCode',
    priceFromChannel: 'b2c-web',
    priceFromEndpoint: '',
  },
};

const CLOUD_ENVIRONMENT_OVERRIDES = [
  {
    key: 'stage',
    pattern: /-e1886364\./i,
    overrides: {
      hotels: {
        graphqlHost: 'https://publish-p179213-e1886364.adobeaemcloud.com',
      },
      dynamicMedia: {
        assetHost: 'https://publish-p179213-e1886364.adobeaemcloud.com',
        imageServer: 'https://delivery-p179213-e1886364.adobeaemcloud.com',
      },
    },
  },
  {
    key: 'dev',
    pattern: /-e1898042\./i,
    overrides: {
      hotels: {
        graphqlHost: 'https://publish-p179213-e1898042.adobeaemcloud.com',
      },
      dynamicMedia: {
        assetHost: 'https://publish-p179213-e1898042.adobeaemcloud.com',
        imageServer: 'https://delivery-p179213-e1898042.adobeaemcloud.com',
      },
    },
  },
];

const DEFAULT_CLOUD_ENVIRONMENT = 'stage';

const ENVIRONMENT_CONFIG = {
  local: {
    dynamicMedia: {
      enabled: false,
      imageServer: 'https://delivery-p179213-e1886364.adobeaemcloud.com',
      company: 'BALEARDEINVERSIONESFINANCIERASSL',
      damRoot: '/content/dam',
      stripExtension: true,
      assetHost: 'https://publish-p179213-e1886364.adobeaemcloud.com',
    },
  },
  author: {
    dynamicMedia: {
      enabled: false,
      imageServer: 'https://delivery-p179213-e1886364.adobeaemcloud.com',
      company: 'BALEARDEINVERSIONESFINANCIERASSL',
      damRoot: '/content/dam',
      stripExtension: true,
      assetHost: 'https://publish-p179213-e1886364.adobeaemcloud.com',
    },
  },
  preview: {
    dynamicMedia: {
      enabled: false,
      imageServer: 'https://delivery-p179213-e1886364.adobeaemcloud.com',
      company: 'BALEARDEINVERSIONESFINANCIERASSL',
      damRoot: '/content/dam',
      stripExtension: true,
      assetHost: 'https://publish-p179213-e1886364.adobeaemcloud.com',
    },
  },
  live: {
    dynamicMedia: {
      enabled: false,
      imageServer: 'https://delivery-p179213-e1886364.adobeaemcloud.com',
      company: 'BALEARDEINVERSIONESFINANCIERASSL',
      damRoot: '/content/dam',
      stripExtension: true,
      assetHost: 'https://publish-p179213-e1886364.adobeaemcloud.com',
    },
  },
};

function getConfiguredCloudEnvironment(hostname = window.location.hostname) {
  const fromQuery = new URLSearchParams(window.location.search).get('cloud-environment');
  if (fromQuery && CLOUD_ENVIRONMENT_OVERRIDES.some(({ key }) => key === fromQuery)) {
    return fromQuery;
  }

  const fromMeta = document.querySelector('meta[name="cloud-environment"]')?.content?.trim();
  if (fromMeta && CLOUD_ENVIRONMENT_OVERRIDES.some(({ key }) => key === fromMeta)) {
    return fromMeta;
  }

  const fromHostname = CLOUD_ENVIRONMENT_OVERRIDES
    .find(({ pattern }) => pattern.test(hostname))?.key;
  return fromHostname || DEFAULT_CLOUD_ENVIRONMENT;
}

function getCloudEnvironmentOverrides(hostname = window.location.hostname) {
  const configuredEnvironment = getConfiguredCloudEnvironment(hostname);
  return CLOUD_ENVIRONMENT_OVERRIDES
    .find(({ key }) => key === configuredEnvironment)?.overrides || {};
}

function getEnvironmentKey(hostname = window.location.hostname) {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'local';
  }

  if (/^author-p\d+-e\d+\./i.test(hostname)) {
    return 'author';
  }

  if (hostname.endsWith('.aem.page')) {
    return 'preview';
  }

  if (hostname.endsWith('.aem.live')) {
    return 'live';
  }

  return 'live';
}

function getEnvironmentConfig(hostname = window.location.hostname) {
  const key = getEnvironmentKey(hostname);
  const overrides = ENVIRONMENT_CONFIG[key] || {};
  const cloudOverrides = getCloudEnvironmentOverrides(hostname);

  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    ...cloudOverrides,
    dynamicMedia: {
      ...DEFAULT_CONFIG.dynamicMedia,
      ...(overrides.dynamicMedia || {}),
      ...(cloudOverrides.dynamicMedia || {}),
    },
    hotels: {
      ...DEFAULT_CONFIG.hotels,
      ...(overrides.hotels || {}),
      ...(cloudOverrides.hotels || {}),
    },
  };
}

export default getEnvironmentConfig;
