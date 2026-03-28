#!/bin/bash

# Auto-rebuild script untuk production container
# Script ini monitor perubahan file di content/docs dan auto-rebuild container

WATCH_DIR="./content/docs"
CONTAINER_NAME="cys-wiki-app"
COMPOSE_FILE="docker-compose.yml"

echo "🔄 Starting auto-rebuild monitor..."
echo "📁 Watching directory: $WATCH_DIR"
echo "🐳 Container: $CONTAINER_NAME"
echo ""

# Function to rebuild container
rebuild_container() {
    echo "📦 Rebuilding container due to file changes..."
    echo "⏰ $(date): Starting rebuild"
    
    # Stop current container
    docker-compose -f $COMPOSE_FILE down
    
    # Rebuild and start
    docker-compose -f $COMPOSE_FILE up --build -d
    
    if [ $? -eq 0 ]; then
        echo "✅ $(date): Container rebuilt successfully!"
        echo "🌐 App available at: http://localhost:3000"
    else
        echo "❌ $(date): Container rebuild failed!"
    fi
    echo ""
}

# Check if inotifywait is available (Linux)
if command -v inotifywait &> /dev/null; then
    echo "🐧 Using inotifywait (Linux file watcher)"
    
    # Monitor file changes using inotifywait
    inotifywait -m -r -e create,delete,modify,move --format '%w%f %e' "$WATCH_DIR" |
    while read file event; do
        if [[ "$file" == *.mdx ]]; then
            echo "📝 $(date): Detected change in $file ($event)"
            rebuild_container
        fi
    done

# Check if fswatch is available (macOS)
elif command -v fswatch &> /dev/null; then
    echo "🍎 Using fswatch (macOS file watcher)"
    
    # Monitor file changes using fswatch
    fswatch -o "$WATCH_DIR" |
    while read num; do
        echo "📝 $(date): Detected changes in $WATCH_DIR"
        rebuild_container
    done

# Fallback: Simple polling method
else
    echo "⚠️  No file watcher found, using polling method"
    echo "💡 Install inotify-tools (Linux) or fswatch (macOS) for better performance"
    echo ""
    
    # Get initial file count
    LAST_COUNT=$(find "$WATCH_DIR" -name "*.mdx" | wc -l)
    LAST_HASH=$(find "$WATCH_DIR" -name "*.mdx" -exec stat -c %Y {} \; | sort | md5sum)
    
    while true; do
        sleep 5  # Check every 5 seconds
        
        CURRENT_COUNT=$(find "$WATCH_DIR" -name "*.mdx" | wc -l)
        CURRENT_HASH=$(find "$WATCH_DIR" -name "*.mdx" -exec stat -c %Y {} \; | sort | md5sum)
        
        if [ "$CURRENT_COUNT" != "$LAST_COUNT" ] || [ "$CURRENT_HASH" != "$LAST_HASH" ]; then
            echo "📝 $(date): Detected file changes in $WATCH_DIR"
            rebuild_container
            
            LAST_COUNT=$CURRENT_COUNT
            LAST_HASH=$CURRENT_HASH
        fi
    done
fi 