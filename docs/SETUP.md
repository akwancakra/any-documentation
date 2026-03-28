# Quick Setup — Wiki Docs

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm atau yarn

## Langkah

```bash
cp env.template .env.local
# Isi DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL di .env.local

# Postgres lokal (opsional):
# docker compose --profile with-postgres up -d

npm install
npm run db:migrate   # atau: npm run db:push
npm run db:seed      # user admin pertama (lihat SEED_* di .env)
npm run dev
```

Buka http://localhost:3000 — login dengan email/password dari seed (default: `admin@example.com` / `changeme123` setelah seed).

## Role admin

Role ditentukan oleh kolom `users.role` di PostgreSQL (`admin` atau `user`). Ubah lewat Prisma Studio (`npm run db:studio`) atau SQL.

## Troubleshooting

- **Login gagal** — pastikan migrasi + seed sudah jalan; cek `DATABASE_URL`.
- **Prisma error** — `npx prisma generate` lalu restart `npm run dev`.

Lihat juga [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) dan [ADMIN_SETUP.md](./ADMIN_SETUP.md).
