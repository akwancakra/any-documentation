# Panduan Docker untuk CYS Wiki

Dokumen ini berisi petunjuk lengkap untuk menjalankan aplikasi CYS Wiki menggunakan Docker.

## Prerequisites

Pastikan Anda sudah menginstall:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start

### 1. Menggunakan Docker Compose (Recommended)

```bash
# Build dan jalankan aplikasi
docker-compose up --build

# Atau jalankan di background
docker-compose up -d --build
```

Aplikasi akan tersedia di: http://localhost:3000

### 2. Menggunakan Docker Manual

```bash
# Build image
docker build -t cys-wiki .

# Jalankan container
docker run -p 3000:3000 --name cys-wiki-app cys-wiki
```

## Perintah Berguna

### Docker Compose

```bash
# Lihat logs
docker-compose logs -f

# Stop aplikasi
docker-compose down

# Rebuild image
docker-compose build --no-cache

# Hapus semua containers dan volumes
docker-compose down -v --remove-orphans
```

### Docker Manual

```bash
# Lihat containers yang berjalan
docker ps

# Stop container
docker stop cys-wiki-app

# Hapus container
docker rm cys-wiki-app

# Hapus image
docker rmi cys-wiki

# Lihat logs container
docker logs cys-wiki-app -f
```

## Environment Variables

Anda bisa menambahkan environment variables dengan membuat file `.env` di root project:

```env
# .env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Tambahkan variabel lain sesuai kebutuhan
# NEXTAUTH_SECRET=your-secret-here
# NEXTAUTH_URL=http://localhost:3000
```

Kemudian update `docker-compose.yml`:

```yaml
services:
  cys-wiki:
    # ... konfigurasi lainnya
    env_file:
      - .env
```

## Troubleshooting

### Port sudah digunakan

Jika port 3000 sudah digunakan, ubah port di `docker-compose.yml`:

```yaml
ports:
  - "3001:3000" # Ubah ke port lain
```

### Build error

Jika ada error saat build, coba:

```bash
# Clear Docker cache
docker system prune -a

# Rebuild tanpa cache
docker-compose build --no-cache
```

### Memory issues

Jika build gagal karena memory, tambahkan swap atau tingkatkan memory limit Docker.

## Production Deployment

Untuk production, pastikan:

1. Set environment variables yang tepat
2. Gunakan reverse proxy (nginx/traefik)
3. Setup SSL certificate
4. Configure logging dan monitoring

### Contoh nginx config:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Development

Untuk development dengan hot reload, gunakan:

```bash
# Jalankan dalam mode development
docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules cys-wiki npm run dev
```

Atau buat `docker-compose.dev.yml`:

```yaml
version: "3.8"

services:
  cys-wiki-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev # Buat Dockerfile khusus untuk dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```

## Support

Jika mengalami masalah, periksa:

1. Docker logs: `docker-compose logs`
2. Container status: `docker ps -a`
3. Image build: `docker images`

Untuk bantuan lebih lanjut, buka issue di repository ini.
