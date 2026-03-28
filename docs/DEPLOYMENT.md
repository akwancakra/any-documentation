# 🚀 Production Deployment Guide

Guide lengkap untuk deploy **CYS Fumadocs** ke production server menggunakan Docker.

## 📋 Prerequisites

- Server dengan **Docker** dan **Docker Compose** terinstall
- **Git** untuk clone repository
- **Domain** (optional, bisa pakai IP)
- **SSL Certificate** (optional untuk HTTPS)

## 🛠️ Setup Server

### 1. Install Docker & Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone Repository

```bash
git clone https://github.com/your-username/cys-fumadocs.git
cd cys-fumadocs
```

## ⚙️ Configuration

### 1. Environment Variables

```bash
# Copy template environment
cp env-template.txt .env

# Edit environment variables
nano .env
```

**Minimum required variables:**

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1
```

### 2. Domain Configuration (Optional)

Edit `nginx.conf` jika menggunakan custom domain:

```nginx
server_name your-domain.com www.your-domain.com;
```

## 🚀 Deployment Options

### Option 1: Simple Deployment (Port 3000)

Deploy aplikasi langsung di port 3000:

```bash
# Run deployment script
./deploy.sh
```

**Akses aplikasi:** `http://server-ip:3000`

### Option 2: With Nginx Reverse Proxy (Port 80/443)

Deploy dengan Nginx untuk production-ready setup:

```bash
# Deploy dengan Nginx
docker-compose --profile with-nginx up -d --build
```

**Akses aplikasi:** `http://server-ip` atau `http://your-domain.com`

## 📁 File Structure di Server

```
cys-fumadocs/
├── content/           # 📝 MDX files (volume mounted)
├── public/           # 🖼️ Static files (volume mounted)
├── docker-compose.yml # 🐳 Docker configuration
├── Dockerfile        # 🏗️ App build instructions
├── nginx.conf        # 🌐 Nginx configuration
├── deploy.sh         # 🚀 Deployment script
└── .env             # ⚙️ Environment variables
```

## 🔧 Management Commands

### Basic Operations

```bash
# View logs
docker-compose logs -f app

# Stop application
docker-compose down

# Restart application
docker-compose restart app

# Update application (rebuild)
./deploy.sh

# Update application (no rebuild)
docker-compose pull && docker-compose up -d
```

### Content Management

```bash
# Edit MDX files directly
nano content/docs/your-file.mdx

# Add new images
cp image.png public/docs/images/

# Content akan update otomatis dalam 30 detik!
```

### System Monitoring

```bash
# Check container status
docker-compose ps

# Check resource usage
docker stats

# Health check
curl http://localhost:3000/api/health

# View system logs
journalctl -u docker -f
```

## 🔄 File Updates - INSTANT!

Dengan **dynamic rendering**, file baru akan **langsung muncul**:

1. **Upload MDX baru** → `content/docs/new-file.mdx`
2. **Langsung akses** → `http://your-domain.com/docs/new-file`
3. **Auto-refresh** → Cache 30 detik, update otomatis

**No rebuild needed!** ⚡

## 🛡️ Security Considerations

### 1. Nginx Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 2. Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

### 3. SSL/HTTPS Setup

1. **Obtain SSL certificate** (Let's Encrypt recommended)
2. **Uncomment HTTPS section** in `nginx.conf`
3. **Update certificate paths**

```bash
# Let's Encrypt example
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📊 Monitoring & Logs

### Application Logs

```bash
# Real-time logs
docker-compose logs -f app

# Specific service logs
docker-compose logs -f nginx

# Last 100 lines
docker-compose logs --tail=100 app
```

### Health Monitoring

```bash
# Check application health
curl http://localhost:3000/api/health

# Monitor uptime
while true; do curl -s http://localhost:3000/api/health | jq '.status'; sleep 10; done
```

## 🚨 Troubleshooting

### Common Issues

1. **Port 3000 already in use**

   ```bash
   sudo lsof -i :3000
   sudo kill -9 PID
   ```

2. **Docker permission denied**

   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Container won't start**

   ```bash
   docker-compose logs app
   docker-compose down && docker-compose up -d --build
   ```

4. **Content not updating**

   ```bash
   # Check volume mounts
   docker-compose exec app ls -la /app/content

   # Clear app cache
   docker-compose restart app
   ```

### Performance Optimization

1. **Enable Gzip compression** (Already configured in nginx.conf)
2. **Static file caching** (Already configured)
3. **Resource limits** (Add to docker-compose.yml if needed)

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
```

## 🎯 Production Checklist

- [ ] **Docker & Docker Compose** installed
- [ ] **Environment variables** configured
- [ ] **Domain/DNS** pointing to server (if using custom domain)
- [ ] **SSL certificate** obtained (for HTTPS)
- [ ] **Firewall rules** configured (ports 80, 443, 22)
- [ ] **Backup strategy** implemented for content files
- [ ] **Monitoring** setup (logs, health checks)
- [ ] **Security headers** enabled in Nginx

## 🆘 Support

Jika ada masalah deployment:

1. **Check logs:** `docker-compose logs -f`
2. **Health check:** `curl http://localhost:3000/api/health`
3. **Restart services:** `docker-compose restart`
4. **Full rebuild:** `./deploy.sh`

---

✨ **Happy Deploying!** Aplikasi akan jalan di server dengan **instant file updates** dan **production-ready** configuration!
