#!/bin/bash

# Production Deployment Script untuk CYS Wiki
set -e

echo "🚀 Starting CYS Wiki Production Deployment..."

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker tidak terinstall. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose tidak terinstall. Please install Docker Compose first."
    exit 1
fi

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker-compose down || true

# Remove old images and clear cache
echo "🗑️  Clearing Docker cache and removing old images..."
docker system prune -f
docker rmi cys-wiki_app:latest || true

# Pull latest changes (jika deploying dari git)
# echo "📥 Pulling latest changes..."
# git pull origin main

# Build and start containers (force rebuild without cache)
echo "🏗️  Building containers without cache..."
docker-compose build --no-cache app

echo "🚀 Starting containers..."
docker-compose up -d --force-recreate

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo "🔍 Performing health check..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy and running!"
    echo "🌐 Access your app at: http://localhost:3000"
else
    echo "❌ Health check failed. Checking logs..."
    docker-compose logs app
    exit 1
fi

# Show running containers
echo "📋 Running containers:"
docker-compose ps

echo "🎉 Deployment completed successfully!"
echo ""
echo "📝 Management Commands:"
echo "  View logs:     docker-compose logs -f app"
echo "  Stop app:      docker-compose down"
echo "  Restart app:   docker-compose restart app"
echo "  Update app:    ./deploy.sh"
echo ""
echo "📂 Content files are mounted at ./content/"
echo "   You can edit MDX files directly and they will update automatically!" 