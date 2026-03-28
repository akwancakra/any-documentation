# Environment Variables

Ringkasan variabel yang dipakai aplikasi wiki (autentikasi database lokal).

## Wajib

| Variable | Deskripsi |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL, contoh `postgresql://user:pass@host:5432/db?schema=public` |
| `NEXTAUTH_SECRET` | Secret untuk JWT NextAuth (minimal ~32 karakter acak) |
| `NEXTAUTH_URL` | URL publik app, contoh `http://localhost:3000` |

## Seed (admin pertama)

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `SEED_ADMIN_EMAIL` | `admin@example.com` | Email user admin saat `npm run db:seed` |
| `SEED_ADMIN_PASSWORD` | `changeme123` | Password plaintext (akan di-hash) |
| `SEED_ADMIN_NAME` | `Administrator` | Nama tampilan |
| `SEED_RESET_ADMIN_PASSWORD` | — | Set `true` untuk mengganti password admin saat seed ulang |

## Opsional

| Variable | Deskripsi |
|----------|-----------|
| `LOGIN_LOG_INTERNAL_SECRET` | Header internal untuk POST `/api/login-log` (default: `NEXTAUTH_SECRET`) |
| `AI_ENHANCE_ORDER` | Urutan coba provider AI, dipisah koma: `openai`, `gemini`, `ollama`. Default: `openai,gemini,ollama` |
| `OPENAI_API_KEY` | API key OpenAI untuk Chat Completions di `/api/ai-enhance` |
| `OPENAI_AI_MODEL` | Model OpenAI (default: `gpt-4o-mini`) |
| `GEMINI_API_KEY` | API key Google AI (Gemini) |
| `GEMINI_AI_MODEL` | Model Gemini (default: `gemini-2.0-flash-exp`) |
| `OLLAMA_API_KEY` | Opsional; jika di-set, Ollama dianggap dikonfigurasi |
| `OLLAMA_API_ENDPOINT` | Base URL Ollama (default: `http://localhost:11434`) |
| `OLLAMA_AI_MODEL` | Nama model Ollama (default: `llama3.2`) |
| `NODE_ENV`, `PORT`, `HOSTNAME`, `TIMEZONE` | Runtime |

Setidaknya satu dari `OPENAI_API_KEY`, `GEMINI_API_KEY`, atau `OLLAMA_API_KEY` diperlukan agar tombol AI di editor berfungsi.

## Contoh `.env.local`

```env
DATABASE_URL=postgresql://wiki:wiki@localhost:5432/wiki?schema=public
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## Verifikasi cepat

```bash
node -e "['DATABASE_URL','NEXTAUTH_SECRET','NEXTAUTH_URL'].forEach(k=>console.log(process.env[k]? 'OK '+k : 'MISSING '+k))"
```

*(Jalankan dengan env yang sudah di-load, atau dari shell yang men-source `.env.local`.)*

## Docker / production

Set variabel yang sama di platform deploy. Jalankan `npx prisma migrate deploy` sebelum atau saat start container agar tabel `users` ada.
