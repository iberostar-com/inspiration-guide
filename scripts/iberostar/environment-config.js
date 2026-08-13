const DEFAULT_CONFIG = {
  analytics: {
    // PENDIENTE (bloquea salida a produccion): ID de produccion del
    // domain-script de OneTrust para el dominio del microsite. Pedir al
    // administrador de la cuenta OneTrust de Iberostar (via Merkle). Hasta
    // entonces todos los entornos usan el ID de TEST.
    // Se puede sobreescribir sin deploy con la metadata de pagina
    // "onetrust-domain-script" (ver getAnalyticsConfig en analytics.js).
    oneTrustDomainScript: '0198196f-018a-77f9-919f-10391def3fda-test',
    // Huella Tealium. Merkle debe confirmar si dev/qa usan otra URL o si el
    // entorno se resuelve por profile dentro de Tealium iQ (plan 3.1).
    // Override sin deploy via metadata "tealium-utag-src".
    utagSrc: 'https://tags.iberostar.com/core/prod/utag.js',
  },
  dynamicMedia: {
    enabled: false,
    imageServer: 'https://delivery-p179213-e1886364.adobeaemcloud.com',
    company: 'BALEARDEINVERSIONESFINANCIERASSL',
    damRoot: '/content/dam',
    stripExtension: true,
    assetHost: 'https://publish-p179213-e1886364.adobeaemcloud.com',
  },
  hotels: {
    graphqlHost: 'https://publish-p179213-e1886364.adobeaemcloud.com',
    graphqlEndpoint: '/graphql/execute.json/iberostar-com/HotelByCode',
    graphqlOperationName: 'HotelByCode',
    priceFromChannel: 'b2c-web',
    priceFromEndpoint: 'https://gisapim.iberostar.com/mule/ae/price-from',
  },
  currency: {
    // PENDIENTE (no bloquea deploy): el JSON de tasas responde 200 en publish
    // pero sin cabeceras CORS para origenes EDS; hay que ampliar la politica
    // CORS de publish a /content/dam/iberostar-com/shared-data/jsons/*. Hasta
    // entonces el selector degrada automaticamente a solo-idioma.
    // Overrides sin deploy: metadata "currency-exchange-rates-endpoint" y
    // kill-switch metadata "currency-selector: off".
    enabled: true,
    exchangeRatesEndpoint: 'https://publish-p179213-e1886364.adobeaemcloud.com/content/dam/iberostar-com/shared-data/jsons/currency-exchange-rates.json',
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
      // currency: el endpoint de stage ya es el de DEFAULT_CONFIG; no se
      // repite aqui para que el fixture local (ENVIRONMENT_CONFIG.local)
      // no quede pisado por el override cloud por defecto.
      dynamicMedia: {
        enabled: false,
        assetHost: 'https://publish-p179213-e1886364.adobeaemcloud.com',
        imageServer: 'https://delivery-p179213-e1886364.adobeaemcloud.com',
      },
    },
  },
  {
    key: 'dev',
    pattern: /(?:-e1898042\.|(?:main|dev)--inspiration-guide-dev--iberostar-com\.aem\.(?:live|page)$)/i,
    overrides: {
      hotels: {
        graphqlHost: 'https://publish-p179213-e1898042.adobeaemcloud.com',
      },
      currency: {
        exchangeRatesEndpoint: 'https://publish-p179213-e1898042.adobeaemcloud.com/content/dam/iberostar-com/shared-data/jsons/currency-exchange-rates.json',
      },
      dynamicMedia: {
        enabled: false,
        assetHost: 'https://publish-p179213-e1898042.adobeaemcloud.com',
        imageServer: 'https://delivery-p179213-e1898042.adobeaemcloud.com',
      },
    },
  },
  {
    key: 'qa',
    pattern: /(?:-e1898096\.|(?:main|qa)--inspiration-guide-qa--iberostar-com\.aem\.(?:live|page)$)/i,
    overrides: {
      hotels: {
        graphqlHost: 'https://publish-p179213-e1898096.adobeaemcloud.com',
      },
      currency: {
        exchangeRatesEndpoint: 'https://publish-p179213-e1898096.adobeaemcloud.com/content/dam/iberostar-com/shared-data/jsons/currency-exchange-rates.json',
      },
      dynamicMedia: {
        enabled: false,
        assetHost: 'https://publish-p179213-e1898096.adobeaemcloud.com',
        imageServer: 'https://delivery-p179213-e1898096.adobeaemcloud.com',
      },
    },
  },
];

const DEFAULT_CLOUD_ENVIRONMENT = 'stage';

const ENVIRONMENT_CONFIG = {
  local: {
    currency: {
      // Fixture local (mismo shape que el JSON del DAM): el publish todavia
      // no expone CORS para ese path, asi que en localhost usamos una copia.
      exchangeRatesEndpoint: '/drafts/currency-exchange-rates.json',
    },
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
    analytics: {
      ...DEFAULT_CONFIG.analytics,
      ...(overrides.analytics || {}),
      ...(cloudOverrides.analytics || {}),
    },
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
    currency: {
      ...DEFAULT_CONFIG.currency,
      ...(overrides.currency || {}),
      ...(cloudOverrides.currency || {}),
    },
  };
}

export default getEnvironmentConfig;
