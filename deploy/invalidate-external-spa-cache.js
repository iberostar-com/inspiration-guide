#!/usr/bin/env node

const crypto = require("crypto");
const https = require("https");

const TARGETS = {
  "contact-center": "/bin/iberostar/cache/contact-center/invalidate",
  "booking-process": "/bin/iberostar/cache/booking-process/invalidate"
};

async function main() {
  const target = process.argv[2];
  const endpointPath = TARGETS[target];

  if (!endpointPath) {
    console.error("Usage: invalidate-external-spa-cache.js <contact-center|booking-process>");
    process.exit(1);
  }

  const authorUrl = requiredEnv("AEM_AUTHOR_URL");
  const accessToken = requiredEnv("AEM_ACCESS_TOKEN");
  const hmacSecret = requiredEnv("IBEROSTAR_EXTERNAL_SPA_INVALIDATION_HMAC_SECRET");

  const csrfResponse = await requestJson("GET", new URL("/libs/granite/csrf/token.json", authorUrl), {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json"
  });

  const csrfToken = csrfResponse.token;
  if (!csrfToken) {
    throw new Error("CSRF token response did not contain token");
  }

  const timestamp = new Date().toISOString();
  const nonce = crypto.randomUUID();
  const body = "";
  const bodyHash = sha256Hex(Buffer.from(body, "utf8"));
  const canonicalString = [
    "POST",
    endpointPath,
    timestamp,
    nonce,
    bodyHash
  ].join("\n");

  const signature = crypto
    .createHmac("sha256", hmacSecret)
    .update(canonicalString, "utf8")
    .digest("hex");

  const response = await requestJson("POST", new URL(endpointPath, authorUrl), {
    Authorization: `Bearer ${accessToken}`,
    "CSRF-Token": csrfToken,
    "X-Iberostar-Timestamp": timestamp,
    "X-Iberostar-Nonce": nonce,
    "X-Iberostar-Signature": signature,
    Accept: "application/json"
  });

  console.log(JSON.stringify(response, null, 2));
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function sha256Hex(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function requestJson(method, url, headers) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method,
        headers
      },
      (response) => {
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
      }
    );

    request.on("error", reject);
    request.end();
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
