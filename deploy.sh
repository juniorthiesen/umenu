#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/umenu/htdocs/umenu.com.br"
BRANCH="main"
EXPECTED_API_URL="VITE_API_URL=https://api.umenu.com.br"
HEALTH_URL="http://localhost:3333/health"

echo "==> Starting UMenu production deploy"

cd "$APP_DIR"

if [ ! -f ".env" ]; then
  echo "ERROR: .env not found at $APP_DIR/.env"
  echo "Create it manually before deploying. This script will not overwrite it."
  exit 1
fi

if ! grep -qx "$EXPECTED_API_URL" .env; then
  echo "ERROR: .env must contain exactly:"
  echo "$EXPECTED_API_URL"
  exit 1
fi

echo "==> Pulling latest $BRANCH"
git fetch origin
git pull origin "$BRANCH"

echo "==> Installing dependencies"
npm ci

echo "==> Building API and frontend"
npm run build

echo "==> Building and starting Docker services"
docker compose up -d --build

echo "==> Running database migrations"
docker compose exec -T api npx prisma migrate deploy

echo "==> Ensuring platform admin exists"
docker compose exec -T api npm run seed:admin

echo "==> Checking API health"
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    echo "==> API health check passed"
    echo "==> Deploy finished successfully"
    echo "Frontend: https://umenu.com.br"
    echo "API: https://api.umenu.com.br/health"
    exit 0
  fi

  echo "Health check attempt $attempt failed; retrying in 3s..."
  sleep 3
done

echo "ERROR: API health check failed after retries: $HEALTH_URL"
exit 1
