# Any Documentation

An **MDX** documentation platform (Fumadocs) with local authentication: **PostgreSQL**, **Prisma**, **NextAuth** (Credentials), **bcrypt**, and **RBAC** (admin / user). Built with **Next.js 15** (App Router) and **React 19**.

<p align="center">
  <img
    src="public/images/landingpage-screenshot.png"
    alt="Any Docs landing page — hero, navigation, and latest docs grid"
    width="780"
  />
</p>

<p align="center">
  <strong>Any Docs</strong> — modern landing with dark theme, quick search (<kbd>Ctrl</kbd>+<kbd>K</kbd> / <kbd>⌘K</kbd>), and latest MDX documents.
</p>

---

## Highlights

### Authentication & security

- **PostgreSQL + Prisma** — users in the database; passwords hashed with bcrypt
- **RBAC** — admin (editor, dashboard, login logs) vs user (doc access per middleware rules)
- **Login audit** — sign-in events stored in the database (request/device metadata)

### Admin dashboard

- Document stats & file activity
- **Login logs** — monitor sign-ins (`/dashboard/login-logs`)
- Responsive UI & light/dark theme

### Documentation platform

- **MDX** with Fumadocs components (Tabs, Accordion, Callout, etc.)
- **Search** — integrated search dialog (Fumadocs UI)
- **Editor** — two modes for admins: live preview (Tiptap) & split view (Monaco + preview)
- **Content storage** — local filesystem or **S3** (optional)

---

## Requirements

- Node.js **18+**
- PostgreSQL **14+** (local or Docker)
- `npm`, `pnpm`, or `yarn`

## Quick start

```bash
git clone <repository-url>
cd any-documentation

cp env.template .env.local
# Set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL (see env.template)

# Postgres (Docker example):
# docker compose --profile with-postgres up -d

npm install
npm run db:migrate   # or: npm run db:push
npm run db:seed      # initial admin user (see SEED_* in env)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment (minimal)

```env
DATABASE_URL=postgresql://USER:PASS@localhost:5432/wiki?schema=public
NEXTAUTH_SECRET=at-least-32-random-characters
NEXTAUTH_URL=http://localhost:3000
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=changeme123
```

Full reference: [`env.template`](./env.template), [`docs/ENVIRONMENT_VARIABLES.md`](./docs/ENVIRONMENT_VARIABLES.md).

---

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm run start` | Production server (`next start`) |
| `npm run lint` / `npm run lint:fix` | ESLint (Next.js) |
| `npm run type-check` | `tsc --noEmit` |
| `npm run db:*` | Prisma migrate / push / seed / studio |
| `npm run pm2:start` | Run app with PM2 (`ecosystem.config.cjs`) |
| `npm run pm2:logs` | Tail PM2 logs |
| `npm run pm2:reload` | Reload PM2 process |

---

## Production & PM2

After `npm run build`:

```bash
npm run pm2:start    # NODE_ENV=production via --env production
npm run pm2:logs
```

Config: [`ecosystem.config.cjs`](./ecosystem.config.cjs) — logs under `logs/` (gitignored).

Without PM2:

```bash
npm run build && npm run start
```

Docker (if using this repo’s image):

```bash
docker build -t any-documentation .
docker run -p 3000:3000 --env-file .env any-documentation
```

---

## Project layout (overview)

```
any-documentation/
├── src/app/                 # App Router: (home), (auth), docs, dashboard, editor, api
├── src/components/          # Shared UI & shell
├── src/lib/                 # Auth, MDX, docs storage (fs/S3), utilities
├── content/docs/            # MDX files (may be gitignored for private content)
├── prisma/                  # Schema, migrations, seed
├── public/images/           # Static assets (incl. README screenshot)
├── ecosystem.config.cjs     # PM2
├── env.template
└── docs/                    # Setup & environment guides
```

---

## Main routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing | Public |
| `/login` | Sign in | Public |
| `/docs` | MDX docs | Per middleware / session |
| `/dashboard` | Admin dashboard | Admin |
| `/dashboard/login-logs` | Login logs | Admin |
| `/editor/create`, `/editor/edit/...` | MDX editor | Admin |

---

## Authentication flow (short)

1. Email + password are sent to NextAuth Credentials.
2. User is looked up in PostgreSQL (unique email, case-insensitive).
3. Password is verified with `bcrypt.compare`.
4. Role is read from `users.role` (`admin` | `user`).
5. JWT session carries `role` and `id`; sign-in events can be written to the `login_logs` table (Prisma).

---

## Documentation editors

1. **Live preview** — [`src/app/editor/_components/editor.tsx`](./src/app/editor/_components/editor.tsx) (Tiptap + preview).
2. **Split view (code)** — [`src/app/editor/_components/split-view-editor.tsx`](./src/app/editor/_components/split-view-editor.tsx) (Monaco + preview, optional AI enhance).

When **creating** a new document, a dialog selects the editor type. **Editing** an existing document uses split view.

---

## MDX components

See [`src/mdx-components.tsx`](./src/mdx-components.tsx) and Fumadocs docs. Examples: `Accordion`, `Banner`, `Tabs`, `Steps`, `ImageZoom`, `PDFViewer`, `VideoViewer`, etc.

---

## Further documentation

| File | Topics |
|------|--------|
| [`docs/SETUP.md`](./docs/SETUP.md) | Quick setup |
| [`docs/ADMIN_SETUP.md`](./docs/ADMIN_SETUP.md) | Admin roles |
| [`docs/ENVIRONMENT_VARIABLES.md`](./docs/ENVIRONMENT_VARIABLES.md) | Environment reference |
| [`docs/LOGIN_LOGGING.md`](./docs/LOGIN_LOGGING.md) | Login logging |

---

## Stack

- [Next.js](https://nextjs.org/docs) · [React](https://react.dev/)
- [NextAuth.js](https://next-auth.js.org/)
- [Fumadocs](https://fumadocs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/) · [TypeScript](https://www.typescriptlang.org/)

---

## License & support

Per this repository. For issues: check browser and server logs, and verify `DATABASE_URL` and `NEXTAUTH_*` in production.
