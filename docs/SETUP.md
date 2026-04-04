# Quick setup — Any Documentation

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Steps

```bash
cp env.template .env.local
# Set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL in .env.local

# Local Postgres (optional):
# docker compose --profile with-postgres up -d

npm install
npm run db:migrate   # or: npm run db:push
npm run db:seed      # first admin user (see SEED_* in env)
npm run dev
```

Open http://localhost:3000 — sign in with the seeded email/password (defaults depend on your `.env`; see `env.template`).

## Admin role

The role is stored in the `users.role` column in PostgreSQL (`admin` or `user`). Change it via Prisma Studio (`npm run db:studio`) or SQL.

## Troubleshooting

- **Login fails** — ensure migrations + seed ran; check `DATABASE_URL`.
- **Prisma errors** — run `npx prisma generate`, then restart `npm run dev`.

See also [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) and [ADMIN_SETUP.md](./ADMIN_SETUP.md).
