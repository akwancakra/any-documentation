#!/bin/bash

# Script untuk build dan save Docker image
# Usage: ./build-and-save.sh [version]

VERSION=${1:-latest}
IMAGE_NAME="any-documentation"
TAR_FILE="${IMAGE_NAME}-${VERSION}.tar.gz"

echo "🏗️  Building Docker image: ${IMAGE_NAME}:${VERSION}"
docker build -t ${IMAGE_NAME}:${VERSION} .

if [ $? -eq 0 ]; then
    echo "✅ Build berhasil!"
    
    echo "💾 Saving image ke file: ${TAR_FILE}"
    docker save ${IMAGE_NAME}:${VERSION} | gzip > ${TAR_FILE}
    
    if [ $? -eq 0 ]; then
        echo "✅ Image berhasil disave!"
        echo "📁 File: ${TAR_FILE}"
        echo "📏 Size: $(du -h ${TAR_FILE} | cut -f1)"
        echo ""
        echo "📤 Untuk upload ke server:"
        echo "scp ${TAR_FILE} user@your-server.com:/home/user/"
        echo ""
        echo "🚀 Di server, jalankan:"
        echo "gunzip -c ${TAR_FILE} | docker load"
        echo "docker run -d -p 3000:3000 --name any-documentation-app --restart unless-stopped ${IMAGE_NAME}:${VERSION}"
    else
        echo "❌ Gagal save image"
        exit 1
    fi
else
    echo "❌ Build gagal"
    exit 1
fi 