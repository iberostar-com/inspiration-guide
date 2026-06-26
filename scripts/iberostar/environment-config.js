const DEFAULT_CONFIG = {
  dynamicMedia: {
    enabled: false,
    imageServer: '',
    company: '',
    damRoot: '/content/dam',
    stripExtension: true,
  },
};

const ENVIRONMENT_CONFIG = {
  local: {
    dynamicMedia: {
      enabled: false,
      imageServer: 'https://delivery-p179213-e1898042.adobeaemcloud.com',
      company: 'BALEARDEINVERSIONESFINANCIERASSL',
      damRoot: '/content/dam',
      stripExtension: true,
    },
  },
  author: {
    dynamicMedia: {
      enabled: false,
      imageServer: 'https://delivery-p179213-e1898042.adobeaemcloud.com',
      company: 'BALEARDEINVERSIONESFINANCIERASSL',
      damRoot: '/content/dam',
      stripExtension: true,
    },
  },
  preview: {
    dynamicMedia: {
      enabled: false,
      imageServer: 'https://delivery-p179213-e1898042.adobeaemcloud.com',
      company: 'BALEARDEINVERSIONESFINANCIERASSL',
      damRoot: '/content/dam',
      stripExtension: true,
    },
  },
  live: {
    dynamicMedia: {
      enabled: false,
      imageServer: 'https://delivery-p179213-e1898042.adobeaemcloud.com',
      company: 'BALEARDEINVERSIONESFINANCIERASSL',
      damRoot: '/content/dam',
      stripExtension: true,
    },
  },
};

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

  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    dynamicMedia: {
      ...DEFAULT_CONFIG.dynamicMedia,
      ...(overrides.dynamicMedia || {}),
    },
  };
}

export default getEnvironmentConfig;
