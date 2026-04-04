#!/bin/bash

# Script untuk deploy di server
# Usage: ./deploy-server.sh <tar-file> [port]

TAR_FILE=$1
PORT=${2:-3000}
IMAGE_NAME="any-documentation"
CONTAINER_NAME="any-documentation-app"

if [ -z "$TAR_FILE" ]; then
    echo "❌ Usage: ./deploy-server.sh <tar-file> [port]"
    echo "   Example: ./deploy-server.sh any-documentation-latest.tar.gz 3000"
    exit 1
fi

if [ ! -f "$TAR_FILE" ]; then
    echo "❌ File tidak ditemukan: $TAR_FILE"
    exit 1
fi

echo "🚀 Deploying ${TAR_FILE} pada port ${PORT}"

# Stop container lama jika ada
echo "🛑 Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Load image baru
echo "📦 Loading Docker image..."
if [[ $TAR_FILE == *.gz ]]; then
    gunzip -c $TAR_FILE | docker load
else
    docker load -i $TAR_FILE
fi

if [ $? -eq 0 ]; then
    echo "✅ Image loaded successfully!"
    
    # Jalankan container baru
    echo "🚀 Starting new container..."
    docker run -d \
        -p ${PORT}:3000 \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        $IMAGE_NAME:latest
    
    if [ $? -eq 0 ]; then
        echo "✅ Container started successfully!"
        echo "🌐 Aplikasi berjalan di: http://localhost:${PORT}"
        echo ""
        echo "📋 Useful commands:"
        echo "   docker logs $CONTAINER_NAME -f    # Lihat logs"
        echo "   docker stop $CONTAINER_NAME       # Stop container"
        echo "   docker restart $CONTAINER_NAME    # Restart container"
    else
        echo "❌ Gagal start container"
        exit 1
    fi
else
    echo "❌ Gagal load image"
    exit 1
fi 