# Environment variables

Summary of variables used by Any Documentation (database-backed authentication).

## Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/db?schema=public` |
| `NEXTAUTH_SECRET` | Secret for NextAuth JWT (~32+ random characters) |
| `NEXTAUTH_URL` | Public app URL, e.g. `http://localhost:3000` |

## Seed (first admin)

| Variable | Default | Description |
|----------|---------|-------------|
| `SEED_ADMIN_EMAIL` | `admin@example.com` | Admin email when running `npm run db:seed` |
| `SEED_ADMIN_PASSWORD` | `changeme123` | Plaintext password (will be hashed) |
| `SEED_ADMIN_NAME` | `Administrator` | Display name |
| `SEED_RESET_ADMIN_PASSWORD` | — | Set `true` to reset admin password on re-seed |

## Optional

| Variable | Description |
|----------|-------------|
| `LOGIN_LOG_INTERNAL_SECRET` | Shared secret for `X-Internal-Token` on POST `/api/login-log` (defaults to `NEXTAUTH_SECRET`) |
| `AI_ENHANCE_ORDER` | Comma-separated provider order: `openai`, `gemini`, `ollama`. Default: `openai,gemini,ollama` |
| `OPENAI_API_KEY` | OpenAI API key for `/api/ai-enhance` |
| `OPENAI_AI_MODEL` | OpenAI model (default: `gpt-4o-mini`) |
| `GEMINI_API_KEY` | Google AI (Gemini) key |
| `GEMINI_AI_MODEL` | Gemini model (default: `gemini-2.0-flash-exp`) |
| `OLLAMA_API_KEY` | Optional; if set, Ollama is treated as configured |
| `OLLAMA_API_ENDPOINT` | Ollama base URL (default: `http://localhost:11434`) |
| `OLLAMA_AI_MODEL` | Ollama model name (default: `llama3.2`) |
| `NODE_ENV`, `PORT`, `HOSTNAME`, `TIMEZONE` | Runtime |

At least one of `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `OLLAMA_API_KEY` is needed for the editor AI buttons to work.

## Example `.env.local`

```env
DATABASE_URL=postgresql://wiki:wiki@localhost:5432/wiki?schema=public
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## Quick verification

```bash
node -e "['DATABASE_URL','NEXTAUTH_SECRET','NEXTAUTH_URL'].forEach(k=>console.log(process.env[k]? 'OK '+k : 'MISSING '+k))"
```

*(Run with env loaded, or from a shell that sources `.env.local`.)*

## Docker / production

Set the same variables on your host or orchestrator. Run `npx prisma migrate deploy` before or at container start so tables such as `users` exist.
