# Docker — Any Documentation

Run Any Documentation with Docker and Docker Compose.

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick start

### 1. Docker Compose (recommended)

```bash
docker compose up --build

# Or in the background
docker compose up -d --build
```

The app is available at http://localhost:3000

### 2. Docker only

```bash
docker build -t any-documentation .

docker run -p 3000:3000 --name any-documentation-app any-documentation
```

## Useful commands

### Docker Compose

```bash
docker compose logs -f
docker compose down
docker compose build --no-cache
docker compose down -v --remove-orphans
```

### Docker CLI

```bash
docker ps
docker stop any-documentation-app
docker rm any-documentation-app
docker rmi any-documentation
docker logs any-documentation-app -f
```

## Environment variables

Create a `.env` file in the project root:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
# NEXTAUTH_SECRET=...
# NEXTAUTH_URL=http://localhost:3000
# DATABASE_URL=...
```

Wire it in `docker-compose.yml` if needed:

```yaml
services:
  any-documentation:
    env_file:
      - .env
```

## Troubleshooting

### Port already in use

Change the host port in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"
```

### Build errors

```bash
docker system prune -a
docker compose build --no-cache
```

### Out of memory

Add swap or increase Docker’s memory limit.

## Production checklist

1. Set all required environment variables (database, NextAuth, etc.).
2. Use a reverse proxy (nginx, Traefik).
3. Enable TLS.
4. Configure logging and monitoring.

### Example nginx location block

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

## Development with hot reload

For local dev, prefer `npm run dev` on the host. Optionally mount the repo into a container (ensure `node_modules` handling matches your setup).

## Support

1. `docker compose logs`
2. `docker ps -a`
3. `docker images`

Open an issue on the repository if problems persist.
