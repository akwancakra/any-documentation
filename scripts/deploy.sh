#!/bin/bash

# Production deployment script for Any Documentation
# Prisma: setelah deploy pertama dengan Postgres, jalankan migrasi di dalam container:
#   docker compose exec app npx prisma migrate deploy
# (atau docker-compose jika memakai binary lama)
set -e

echo "🚀 Starting Any Documentation production deployment..."

compose() {
  if docker compose version &> /dev/null; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

if ! command -v docker &> /dev/null; then
    echo "❌ Docker tidak terinstall. Install Docker terlebih dahulu."
    exit 1
fi

if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose tidak tersedia (perlu plugin \"docker compose\" atau binary docker-compose)."
    exit 1
fi

echo "⏹️  Stopping existing containers..."
compose down || true

if [ "${DOCKER_PRUNE:-}" = "1" ]; then
  echo "🗑️  DOCKER_PRUNE=1 — menjalankan docker image prune..."
  docker image prune -f
fi

echo "🗑️  Removing previous app image tag (jika ada)..."
docker rmi any-documentation_app:latest 2>/dev/null || true

# Pull latest changes (jika deploying dari git)
# echo "📥 Pulling latest changes..."
# git pull origin main

echo "🏗️  Building app image..."
compose build --no-cache app

echo "🚀 Starting containers..."
compose up -d --force-recreate

echo "⏳ Waiting for services to start..."
sleep 30

echo "🔍 Performing health check..."
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy and running!"
    echo "🌐 Access your app at: http://localhost:3000"
else
    echo "❌ Health check failed. Checking logs..."
    compose logs app
    exit 1
fi

echo "📋 Running containers:"
compose ps

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📝 Database (PostgreSQL): jika pakai profile with-postgres, jalankan migrasi sekali:"
echo "     compose exec app npx prisma migrate deploy"
echo ""
echo "📝 Management commands (ganti \"compose\" dengan \"docker compose\" atau \"docker-compose\"):"
echo "  View logs:     compose logs -f app"
echo "  Stop app:      compose down"
echo "  Restart app:   compose restart app"
echo "  Update app:    ./deploy.sh   atau   ./scripts/deploy.sh"
echo ""
echo "📂 Content files are mounted at ./content/"
echo "   Pastikan NEXTAUTH_URL di .env sama dengan URL publik (HTTPS) di belakang Nginx."
