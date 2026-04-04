# Any Documentation

Platform dokumentasi berbasis **MDX** (Fumadocs) dengan autentikasi lokal: **PostgreSQL**, **Prisma**, **NextAuth** (Credentials), **bcrypt**, dan **RBAC** (admin / user). Dibangun dengan **Next.js 15** (App Router) dan **React 19**.

<p align="center">
  <img
    src="public/images/landingpage-screenshot.png"
    alt="Cuplikan landing page Any Docs — hero, navigasi, dan grid dokumen terbaru"
    width="780"
  />
</p>

<p align="center">
  <strong>Any Docs</strong> — landing modern dengan tema gelap, pencarian cepat (<kbd>Ctrl</kbd>+<kbd>K</kbd> / <kbd>⌘K</kbd>), dan daftar dokumen MDX terbaru.
</p>

---

## Fitur utama

### Autentikasi & keamanan

- **PostgreSQL + Prisma** — user di database; password di-hash dengan bcrypt
- **RBAC** — admin (editor, dashboard, login logs) vs user (akses docs sesuai policy)
- **Login audit** — pencatatan login ke database (metadata request / device)

### Dashboard admin

- Statistik dokumen & aktivitas file
- **Login logs** — monitoring aktivitas login (`/dashboard/login-logs`)
- UI responsif & tema terang/gelap

### Platform dokumentasi

- **MDX** dengan komponen Fumadocs (Tabs, Accordion, Callout, dll.)
- **Pencarian** — dialog pencarian terintegrasi (Fumadocs UI)
- **Editor** — dua mode untuk admin: live preview (Tiptap) & split view (Monaco + preview)
- **Penyimpanan konten** — filesystem lokal atau **S3** (opsional)

---

## Persyaratan

- Node.js **18+**
- PostgreSQL **14+** (lokal atau Docker)
- `npm` / `pnpm` / `yarn`

## Quick start

```bash
git clone <repository-url>
cd any-documentation

cp env.template .env.local
# Isi: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL (lihat env.template)

# Postgres (contoh Docker):
# docker compose --profile with-postgres up -d

npm install
npm run db:migrate   # atau: npm run db:push
npm run db:seed      # user admin awal (lihat SEED_* di env)
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Variabel lingkungan (ringkas)

```env
DATABASE_URL=postgresql://USER:PASS@localhost:5432/wiki?schema=public
NEXTAUTH_SECRET=minimal-32-karakter-random
NEXTAUTH_URL=http://localhost:3000
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=changeme123
```

Detail lengkap: [`env.template`](./env.template), [`docs/ENVIRONMENT_VARIABLES.md`](./docs/ENVIRONMENT_VARIABLES.md).

---

## Skrip npm

| Skrip | Keterangan |
|--------|------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Build production (`prisma generate` + `next build`) |
| `npm run start` | Server production (`next start`) |
| `npm run lint` / `npm run lint:fix` | ESLint (Next.js) |
| `npm run type-check` | `tsc --noEmit` |
| `npm run db:*` | Prisma migrate / push / seed / studio |
| `npm run pm2:start` | Jalankan app dengan PM2 (`ecosystem.config.cjs`) |
| `npm run pm2:logs` | Tail log PM2 |
| `npm run pm2:reload` | Reload proses PM2 |

---

## Produksi & PM2

Setelah `npm run build`:

```bash
npm run pm2:start    # NODE_ENV=production via --env production
npm run pm2:logs
```

Konfigurasi: [`ecosystem.config.cjs`](./ecosystem.config.cjs) — log di folder `logs/` (di-ignore Git).

Alternatif tanpa PM2:

```bash
npm run build && npm run start
```

Docker (jika memakai image proyek ini):

```bash
docker build -t any-documentation .
docker run -p 3000:3000 --env-file .env any-documentation
```

---

## Struktur proyek (ringkas)

```
any-documentation/
├── src/app/                 # App Router: (home), (auth), docs, dashboard, editor, api
├── src/components/          # UI & shell bersama
├── src/lib/                 # Auth, MDX, storage docs (fs/S3), utilitas
├── content/docs/            # File MDX (dapat diabaikan Git untuk konten pribadi)
├── prisma/                  # Schema, migrasi, seed
├── public/images/           # Aset statis (termasuk screenshot landing di README)
├── ecosystem.config.cjs     # PM2
├── env.template
└── docs/                    # Panduan setup & environment
```

---

## Rute penting

| Rute | Deskripsi | Akses |
|------|-----------|--------|
| `/` | Landing | Publik |
| `/login` | Login | Publik |
| `/docs` | Dokumentasi MDX | Sesuai middleware / session |
| `/dashboard` | Dashboard admin | Admin |
| `/dashboard/login-logs` | Log login | Admin |
| `/editor/create`, `/editor/edit/...` | Editor MDX | Admin |

---

## Alur autentikasi (ringkas)

1. Email + password dikirim ke NextAuth Credentials.
2. User dicari di PostgreSQL (email unik, case-insensitive).
3. Password diverifikasi dengan `bcrypt.compare`.
4. Role dibaca dari `users.role` (`admin` | `user`).
5. Session JWT memuat `role` dan `id`; aktivitas login dapat dicatat ke tabel `login_logs` (Prisma).

---

## Editor dokumentasi

1. **Live preview** — [`src/app/editor/_components/editor.tsx`](./src/app/editor/_components/editor.tsx) (Tiptap + preview).
2. **Split view (kode)** — [`src/app/editor/_components/split-view-editor.tsx`](./src/app/editor/_components/split-view-editor.tsx) (Monaco + preview, AI enhance opsional).

Saat **buat dokumen baru**, dialog memilih tipe editor. **Edit** dokumen yang ada memakai split view.

---

## Komponen MDX (cuplikan)

Lihat [`src/mdx-components.tsx`](./src/mdx-components.tsx) dan dokumentasi Fumadocs. Contoh: `Accordion`, `Banner`, `Tabs`, `Steps`, `ImageZoom`, `PDFViewer`, `VideoViewer`, dll.

---

## Dokumentasi tambahan

| File | Isi |
|------|-----|
| [`docs/SETUP.md`](./docs/SETUP.md) | Setup cepat |
| [`docs/ADMIN_SETUP.md`](./docs/ADMIN_SETUP.md) | Peran admin |
| [`docs/ENVIRONMENT_VARIABLES.md`](./docs/ENVIRONMENT_VARIABLES.md) | Referensi env |
| [`docs/LOGIN_LOGGING.md`](./docs/LOGIN_LOGGING.md) | Login logging |

---

## Teknologi

- [Next.js](https://nextjs.org/docs) · [React](https://react.dev/)
- [NextAuth.js](https://next-auth.js.org/)
- [Fumadocs](https://fumadocs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/) · [TypeScript](https://www.typescriptlang.org/)

---

## Lisensi & kontribusi

Sesuai repositori ini. Untuk isu teknis: periksa log browser, log server, serta `DATABASE_URL` dan variabel `NEXTAUTH_*` di environment production.
