#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const querystring = require("querystring");

const DEFAULT_IMS_HOST = "ims-na1.adobelogin.com";
const DEFAULT_OAUTH_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
const DEFAULT_JWT_LIFETIME_SECONDS = 300;

async function main() {
  const mode = requiredEnv("AEM_IMS_AUTH_MODE");

  let result;

  if (mode === "oauth-s2s") {
    result = await getOAuthServerToServerToken();
  } else if (mode === "technical-account-jwt") {
    result = await getTechnicalAccountJwtToken();
  } else {
    throw new Error(
      "Unsupported AEM_IMS_AUTH_MODE. Supported values: oauth-s2s, technical-account-jwt"
    );
  }

  console.log(JSON.stringify(result, null, 2));
}

async function getOAuthServerToServerToken() {
  const tokenUrl = process.env.AEM_IMS_TOKEN_URL || DEFAULT_OAUTH_TOKEN_URL;
  const clientId = requiredEnv("AEM_IMS_CLIENT_ID");
  const clientSecret = requiredEnv("AEM_IMS_CLIENT_SECRET");
  const scopes = requiredEnv("AEM_IMS_SCOPES");

  const body = querystring.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: scopes
  });

  const response = await postForm(tokenUrl, body);

  return {
    mode: "oauth-s2s",
    token_type: response.token_type,
    expires_in: response.expires_in,
    access_token: response.access_token
  };
}

async function getTechnicalAccountJwtToken() {
  const credentials = loadServiceCredentials();
  const imsHost = credentials.imsEndpoint || process.env.AEM_IMS_ENDPOINT_HOST || DEFAULT_IMS_HOST;
  const lifetimeSeconds = parsePositiveInt(
    process.env.AEM_IMS_JWT_LIFETIME_SECONDS,
    DEFAULT_JWT_LIFETIME_SECONDS
  );

  const jwtToken = createSignedJwt({
    clientId: credentials.clientId,
    technicalAccountId: credentials.technicalAccountId,
    orgId: credentials.orgId,
    privateKey: credentials.privateKey,
    metaScopes: credentials.metaScopes,
    imsHost,
    lifetimeSeconds
  });

  const exchangeUrl = `https://${imsHost}/ims/exchange/jwt`;
  const body = querystring.stringify({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    jwt_token: jwtToken
  });

  const response = await postForm(exchangeUrl, body);

  return {
    mode: "technical-account-jwt",
    ims_host: imsHost,
    technical_account_id: credentials.technicalAccountId,
    expires_in: response.expires_in,
    access_token: response.access_token
  };
}

function loadServiceCredentials() {
  const rawCredentials = loadServiceCredentialsJson();
  const integration = rawCredentials.integration || rawCredentials;

  if (integration && integration.technicalAccount && integration.privateKey) {
    return {
      clientId: requiredValue(
        integration.technicalAccount.clientId,
        "integration.technicalAccount.clientId"
      ),
      clientSecret: requiredValue(
        integration.technicalAccount.clientSecret,
        "integration.technicalAccount.clientSecret"
      ),
      technicalAccountId: requiredValue(integration.id, "integration.id"),
      orgId: requiredValue(integration.org, "integration.org"),
      privateKey: requiredValue(integration.privateKey, "integration.privateKey"),
      metaScopes: splitCsv(requiredValue(integration.metascopes, "integration.metascopes")),
      imsEndpoint: requiredValue(integration.imsEndpoint, "integration.imsEndpoint")
    };
  }

  return {
    clientId: requiredEnv("AEM_IMS_CLIENT_ID"),
    clientSecret: requiredEnv("AEM_IMS_CLIENT_SECRET"),
    technicalAccountId: requiredEnv("AEM_IMS_TECHNICAL_ACCOUNT_ID"),
    orgId: requiredEnv("AEM_IMS_ORG_ID"),
    privateKey: requiredEnv("AEM_IMS_PRIVATE_KEY"),
    metaScopes: splitCsv(requiredEnv("AEM_IMS_METASCOPES")),
    imsEndpoint: process.env.AEM_IMS_ENDPOINT_HOST || DEFAULT_IMS_HOST
  };
}

function loadServiceCredentialsJson() {
  if (process.env.AEM_SERVICE_CREDENTIALS_FILE) {
    return JSON.parse(
      fs.readFileSync(process.env.AEM_SERVICE_CREDENTIALS_FILE, "utf8")
    );
  }

  if (process.env.AEM_SERVICE_CREDENTIALS_JSON) {
    return JSON.parse(process.env.AEM_SERVICE_CREDENTIALS_JSON);
  }

  if (process.env.AEM_SERVICE_CREDENTIALS_JSON_B64) {
    return JSON.parse(
      Buffer.from(process.env.AEM_SERVICE_CREDENTIALS_JSON_B64, "base64").toString("utf8")
    );
  }

  return null;
}

function createSignedJwt({
  clientId,
  technicalAccountId,
  orgId,
  privateKey,
  metaScopes,
  imsHost,
  lifetimeSeconds
}) {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const payload = {
    iss: orgId,
    sub: technicalAccountId,
    aud: `https://${imsHost}/c/${clientId}`,
    iat: now,
    exp: now + lifetimeSeconds
  };

  for (const metaScope of metaScopes) {
    payload[`https://${imsHost}/s/${metaScope}`] = true;
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createSign("RSA-SHA256")
    .update(signingInput)
    .end()
    .sign(privateKey);

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function postForm(url, body) {
  return requestJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body)
    }
  }, body);
}

function requestJson(url, options, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, options, (response) => {
      const chunks = [];

      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const rawBody = Buffer.concat(chunks).toString("utf8");
        let parsedBody = {};

        if (rawBody) {
          try {
            parsedBody = JSON.parse(rawBody);
          } catch (error) {
            reject(new Error(`Invalid JSON response (${response.statusCode}): ${rawBody}`));
            return;
          }
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP ${response.statusCode}: ${JSON.stringify(parsedBody)}`));
          return;
        }

        resolve(parsedBody);
      });
    });

    request.on("error", reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

function splitCsv(value) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function base64UrlEncode(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function parsePositiveInt(value, defaultValue) {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive integer value: ${value}`);
  }

  return parsed;
}

function requiredEnv(name) {
  return requiredValue(process.env[name], name);
}

function requiredValue(value, label) {
  if (!value) {
    throw new Error(`Missing required value: ${label}`);
  }
  return value;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
