#!/bin/sh
# Build the images and run the whole Playwright suite against app + postgres in docker compose.
set -e
cd "$(dirname "$0")/.."
docker compose --profile e2e down -v --remove-orphans >/dev/null 2>&1 || true
docker compose --profile e2e build
set +e
docker compose --profile e2e up --abort-on-container-exit --exit-code-from e2e
code=$?
docker compose --profile e2e down -v --remove-orphans >/dev/null 2>&1
exit $code
