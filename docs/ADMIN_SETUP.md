# Admin & user roles

**Admin** access (document editor, uploads, full dashboard, login logs) vs **user** (limited per middleware) is determined by the **`role`** column on the `users` table in PostgreSQL.

## Supported values

- `admin` — full access including `/editor`, `/api/save-file`, etc.
- `user` — regular user (per rules in `middleware.ts`)

## Changing a role

### Prisma Studio (easiest)

```bash
npm run db:studio
```

Open the **User** model and edit `role` for the target email.

### SQL

```sql
UPDATE users SET role = 'admin' WHERE email = 'person@example.com';
```

### New users

1. In Studio: **Add record** — `email` is required; `passwordHash` must be a **bcrypt** hash (never store plaintext passwords).
2. Or add a small script using `bcrypt.hash` + `prisma.user.create` (optional `npm run db:add-user`).

## Initial seed

`npm run db:seed` creates or updates one admin user (email/password from `SEED_*` env vars). Change the production password immediately after first deploy.

## Security notes

- Passwords are stored only as **bcrypt hashes** in `password_hash`.
- Sessions use NextAuth **JWT**; use a strong, unique `NEXTAUTH_SECRET` per environment.
