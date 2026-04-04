# Production deployment guide

End-to-end notes for deploying **Any Documentation** to a production server with Docker.

## Prerequisites

- **Docker** and **Docker Compose** on the server
- **Git** to clone the repository
- **Domain** (optional; IP works for testing)
- **TLS certificate** (recommended for HTTPS)

## Server setup

### 1. Install Docker & Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose plugin (or standalone binary per Docker docs)
sudo apt-get update && sudo apt-get install docker-compose-plugin
```

### 2. Clone the repository

```bash
git clone https://github.com/your-username/cys-fumadocs.git
cd cys-fumadocs
```

## Configuration

### 1. Environment variables

```bash
cp env.template .env
# Edit values for production (database, NextAuth, etc.)
nano .env
```

**Minimum example (add database + NextAuth for real deployments):**

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.com
```

### 2. Domain (optional)

If you use the bundled `nginx.conf`, set `server_name`:

```nginx
server_name your-domain.com www.your-domain.com;
```

## Deployment options

### Option 1: App on port 3000

```bash
./deploy.sh
```

**URL:** `http://SERVER_IP:3000`

### Option 2: Nginx reverse proxy (ports 80/443)

```bash
docker compose --profile with-nginx up -d --build
```

**URL:** `http://SERVER_IP` or `http://your-domain.com`

## Layout on the server

```
cys-fumadocs/
├── content/            # MDX files (often volume-mounted)
├── public/             # Static assets (often volume-mounted)
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── deploy.sh
└── .env
```

## Operations

### Basics

```bash
docker compose logs -f app
docker compose down
docker compose restart app
./deploy.sh
docker compose pull && docker compose up -d
```

### Content

```bash
nano content/docs/your-file.mdx
cp image.png public/docs/images/
```

Content visibility depends on your **storage** (`fs` vs `S3`) and **Next.js caching / revalidation** settings. After file changes, you may need a short wait or a manual revalidate if configured.

### Monitoring

```bash
docker compose ps
docker stats
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
journalctl -u docker -f
```

## Dynamic content

With **dynamic rendering** and storage-backed docs, new MDX files can appear **without** rebuilding the image, subject to:

1. Files written where the app reads them (local volume or S3 sync).
2. Route handlers calling `revalidatePath` / `revalidateTag` where applicable.

## Security

### Nginx headers (example)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### Rate limiting (example)

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

### TLS

1. Obtain a certificate (e.g. Let’s Encrypt).
2. Enable HTTPS in `nginx.conf`.
3. Point certificate paths to real files.

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Logs

```bash
docker compose logs -f app
docker compose logs -f nginx
docker compose logs --tail=100 app
```

## Troubleshooting

1. **Port 3000 in use**

   ```bash
   sudo lsof -i :3000
   sudo kill -9 PID
   ```

2. **Docker permission denied**

   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Container fails**

   ```bash
   docker compose logs app
   docker compose down && docker compose up -d --build
   ```

4. **Stale content**

   ```bash
   docker compose exec app ls -la /app/content
   docker compose restart app
   ```

### Resource limits (optional)

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
```

## Production checklist

- [ ] Docker & Compose installed
- [ ] `.env` complete (`DATABASE_URL`, `NEXTAUTH_*`, etc.)
- [ ] DNS points to server (if using a domain)
- [ ] TLS configured
- [ ] Firewall allows 80, 443, 22 as needed
- [ ] Backups for DB and/or `content/`
- [ ] Log rotation / monitoring

## Support

1. `docker compose logs -f`
2. `curl -I http://localhost:3000/`
3. `docker compose restart`
4. Full rebuild: `./deploy.sh`

---

**Happy deploying** — tune caching and revalidation for your workload so doc updates behave as you expect.
