#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GET_TOKEN_SCRIPT="$SCRIPT_DIR/get-aem-access-token.js"
INVALIDATE_SCRIPT="$SCRIPT_DIR/invalidate-external-spa-cache.js"

usage() {
  cat <<'USAGE'
Usage:
  run-external-spa-cache-invalidation.sh --target <contact-center|booking-process> --author-url <url> --hmac-secret <secret> [options]

Required:
  --target <value>                  contact-center | booking-process
  --author-url <value>              AEM Author base URL, e.g. https://author-pXXXXX-eXXXXX.adobeaemcloud.com
  --hmac-secret <value>             Shared HMAC secret used by the invalidation endpoint

Folder assumptions:
  - This wrapper expects these files in the same folder as the .sh script:
    - get-aem-access-token.js
    - invalidate-external-spa-cache.js

Authentication options:
  --access-token <value>            Reuse an existing IMS access token

If --access-token is not provided, the script obtains one automatically using get-aem-access-token.js.
Use either an explicit service credentials file or explicit IMS variables.

Service credentials file option:
  --auth-mode <value>               technical-account-jwt | oauth-s2s
  --credentials-file <path>         Path to the Adobe service credentials JSON file

Explicit IMS variables:
  --auth-mode <value>               technical-account-jwt | oauth-s2s
  --client-id <value>
  --client-secret <value>
  --scopes <value>                  For oauth-s2s
  --technical-account-id <value>    For technical-account-jwt
  --org-id <value>                  For technical-account-jwt
  --private-key-file <path>         PEM file for technical-account-jwt
  --metascopes <value>              Comma-separated metascopes for technical-account-jwt
  --ims-endpoint-host <value>       Optional, e.g. ims-na1.adobelogin.com
  --ims-token-url <value>           Optional, for oauth-s2s
  --jwt-lifetime-seconds <value>    Optional, for technical-account-jwt

Optional:
  --print-token                     Print the generated access token metadata before invalidation
  --help                            Show this help

Examples:
  run-external-spa-cache-invalidation.sh \
    --target booking-process \
    --author-url https://author-<env>.adobeaemcloud.com \
    --hmac-secret '<HMAC_SECRET>' \
    --auth-mode technical-account-jwt \
    --credentials-file /path/service-credential-<env>.json

  run-external-spa-cache-invalidation.sh \
    --target contact-center \
    --author-url https://author-<env>.adobeaemcloud.com \
    --hmac-secret '<HMAC_SECRET>' \
    --access-token '<ACCESS_TOKEN>'
USAGE
}

TARGET=""
AUTHOR_URL=""
HMAC_SECRET=""
ACCESS_TOKEN=""
AUTH_MODE=""
CREDENTIALS_FILE=""
CLIENT_ID=""
CLIENT_SECRET=""
SCOPES=""
TECHNICAL_ACCOUNT_ID=""
ORG_ID=""
PRIVATE_KEY_FILE=""
METASCOPES=""
IMS_ENDPOINT_HOST=""
IMS_TOKEN_URL=""
JWT_LIFETIME_SECONDS=""
PRINT_TOKEN="false"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --target)
      TARGET="${2:-}"
      shift 2
      ;;
    --author-url)
      AUTHOR_URL="${2:-}"
      shift 2
      ;;
    --hmac-secret)
      HMAC_SECRET="${2:-}"
      shift 2
      ;;
    --access-token)
      ACCESS_TOKEN="${2:-}"
      shift 2
      ;;
    --auth-mode)
      AUTH_MODE="${2:-}"
      shift 2
      ;;
    --credentials-file)
      CREDENTIALS_FILE="${2:-}"
      shift 2
      ;;
    --client-id)
      CLIENT_ID="${2:-}"
      shift 2
      ;;
    --client-secret)
      CLIENT_SECRET="${2:-}"
      shift 2
      ;;
    --scopes)
      SCOPES="${2:-}"
      shift 2
      ;;
    --technical-account-id)
      TECHNICAL_ACCOUNT_ID="${2:-}"
      shift 2
      ;;
    --org-id)
      ORG_ID="${2:-}"
      shift 2
      ;;
    --private-key-file)
      PRIVATE_KEY_FILE="${2:-}"
      shift 2
      ;;
    --metascopes)
      METASCOPES="${2:-}"
      shift 2
      ;;
    --ims-endpoint-host)
      IMS_ENDPOINT_HOST="${2:-}"
      shift 2
      ;;
    --ims-token-url)
      IMS_TOKEN_URL="${2:-}"
      shift 2
      ;;
    --jwt-lifetime-seconds)
      JWT_LIFETIME_SECONDS="${2:-}"
      shift 2
      ;;
    --print-token)
      PRINT_TOKEN="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ -z "$TARGET" ] || [ -z "$AUTHOR_URL" ] || [ -z "$HMAC_SECRET" ]; then
  echo "Missing required arguments." >&2
  usage >&2
  exit 1
fi

case "$TARGET" in
  contact-center|booking-process)
    ;;
  *)
    echo "Invalid --target value: $TARGET" >&2
    exit 1
    ;;
esac

if [ ! -f "$GET_TOKEN_SCRIPT" ] || [ ! -f "$INVALIDATE_SCRIPT" ]; then
  echo "Required Node scripts were not found in $SCRIPT_DIR" >&2
  exit 1
fi

if [ -z "$ACCESS_TOKEN" ]; then
  case "$AUTH_MODE" in
    technical-account-jwt)
      if [ -z "$CREDENTIALS_FILE" ] && { [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ] || [ -z "$TECHNICAL_ACCOUNT_ID" ] || [ -z "$ORG_ID" ] || [ -z "$PRIVATE_KEY_FILE" ] || [ -z "$METASCOPES" ]; }; then
        echo "For technical-account-jwt, provide --credentials-file or the explicit IMS parameters (--client-id, --client-secret, --technical-account-id, --org-id, --private-key-file, --metascopes)." >&2
        exit 1
      fi
      ;;
    oauth-s2s)
      if [ -z "$CREDENTIALS_FILE" ] && { [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ] || [ -z "$SCOPES" ]; }; then
        echo "For oauth-s2s, provide --credentials-file if your JSON supports it, or pass --client-id, --client-secret and --scopes." >&2
        exit 1
      fi
      ;;
    '')
      ;;
    *)
      echo "Unsupported --auth-mode value: $AUTH_MODE" >&2
      exit 1
      ;;
  esac
fi

export AEM_AUTHOR_URL="$AUTHOR_URL"
export IBEROSTAR_EXTERNAL_SPA_INVALIDATION_HMAC_SECRET="$HMAC_SECRET"

if [ -z "$ACCESS_TOKEN" ]; then
  if [ -z "$AUTH_MODE" ]; then
    echo "--auth-mode is required when --access-token is not provided." >&2
    exit 1
  fi

  export AEM_IMS_AUTH_MODE="$AUTH_MODE"

  if [ -n "$CREDENTIALS_FILE" ]; then
    export AEM_SERVICE_CREDENTIALS_FILE="$CREDENTIALS_FILE"
  fi

  if [ -n "$CLIENT_ID" ]; then
    export AEM_IMS_CLIENT_ID="$CLIENT_ID"
  fi

  if [ -n "$CLIENT_SECRET" ]; then
    export AEM_IMS_CLIENT_SECRET="$CLIENT_SECRET"
  fi

  if [ -n "$SCOPES" ]; then
    export AEM_IMS_SCOPES="$SCOPES"
  fi

  if [ -n "$TECHNICAL_ACCOUNT_ID" ]; then
    export AEM_IMS_TECHNICAL_ACCOUNT_ID="$TECHNICAL_ACCOUNT_ID"
  fi

  if [ -n "$ORG_ID" ]; then
    export AEM_IMS_ORG_ID="$ORG_ID"
  fi

  if [ -n "$PRIVATE_KEY_FILE" ]; then
    if [ ! -f "$PRIVATE_KEY_FILE" ]; then
      echo "Private key file not found: $PRIVATE_KEY_FILE" >&2
      exit 1
    fi
    export AEM_IMS_PRIVATE_KEY="$(cat "$PRIVATE_KEY_FILE")"
  fi

  if [ -n "$METASCOPES" ]; then
    export AEM_IMS_METASCOPES="$METASCOPES"
  fi

  if [ -n "$IMS_ENDPOINT_HOST" ]; then
    export AEM_IMS_ENDPOINT_HOST="$IMS_ENDPOINT_HOST"
  fi

  if [ -n "$IMS_TOKEN_URL" ]; then
    export AEM_IMS_TOKEN_URL="$IMS_TOKEN_URL"
  fi

  if [ -n "$JWT_LIFETIME_SECONDS" ]; then
    export AEM_IMS_JWT_LIFETIME_SECONDS="$JWT_LIFETIME_SECONDS"
  fi

  TOKEN_RESPONSE="$(node "$GET_TOKEN_SCRIPT")"

  if [ "$PRINT_TOKEN" = "true" ]; then
    echo "$TOKEN_RESPONSE"
  fi

  ACCESS_TOKEN="$(printf '%s' "$TOKEN_RESPONSE" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const parsed=JSON.parse(s);if(!parsed.access_token){process.exit(2)}process.stdout.write(parsed.access_token)})")"
fi

export AEM_ACCESS_TOKEN="$ACCESS_TOKEN"

node "$INVALIDATE_SCRIPT" "$TARGET"
