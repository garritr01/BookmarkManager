#!/usr/bin/env bash
set -euo pipefail

# Where we'll drop creds
mkdir -p /app/auth

# 1) Gemini creds (required)
if [ -n "${GOOGLE_APPLICATION_CREDENTIALS_JSON:-}" ]; then
  echo "$GOOGLE_APPLICATION_CREDENTIALS_JSON" > /app/auth/geminiCreds.json
  export GOOGLE_APPLICATION_CREDENTIALS=/app/auth/geminiCreds.json
else
  echo >&2 "ERROR: GOOGLE_APPLICATION_CREDENTIALS_JSON is not set"
  exit 1
fi

# 2) Firebase creds (optional if you're using ADC)
if [ -n "${FIREBASE_ADMIN_JSON:-}" ]; then
  echo "$FIREBASE_ADMIN_JSON" > /app/auth/firebaseCreds.json
  export FIREBASE_ADMIN_JSON=/app/auth/firebaseCreds.json
else
  echo >&2 "ERROR: FIREBASE_ADMIN_JSON is not set"
  exit 1
fi

# 3) Logging creds (optional if you're using ADC for logging)
if [ -n "${LOGGER_ADMIN_JSON:-}" ]; then
  echo "$LOGGER_ADMIN_JSON" > /app/auth/loggingCreds.json
  export LOGGER_ADMIN_JSON=/app/auth/loggingCreds.json
else
  echo >&2 "ERROR: LOGGER_ADMIN_JSON is not set"
  exit 1
fi

# Finally, start Gunicorn
exec gunicorn run:app \
  --bind "0.0.0.0:${PORT:-8080}" \
  --workers 2 \
  --timeout 120
