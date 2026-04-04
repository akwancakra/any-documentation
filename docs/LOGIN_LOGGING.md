# Login logging

Sign-in attempts (success and failure) can be recorded in **PostgreSQL** via the `login_logs` table (Prisma). Each row stores user identifiers, provider, success flag, session id, and **request metadata** (IP, user agent, coarse device/browser/OS).

## How events are written

1. **Primary path:** During NextAuth `authorize`, the app inserts a row with `prisma.loginLog.create` (see `src/lib/auth-options.ts`).
2. **Alternative path:** `POST /api/login-log` accepts a JSON payload and persists to the same table when the request includes a valid `X-Internal-Token` matching `LOGIN_LOG_INTERNAL_SECRET` or `NEXTAUTH_SECRET` (see `src/app/api/login-log/route.ts`). Useful for trusted internal callers; normal flows use direct DB insert.

## Payload shape (conceptual)

```typescript
interface LoginLogData {
  event: "user_login";
  success: boolean;
  user: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
  provider: string; // e.g. "credentials", "error"
  requestInfo: {
    ip: string;
    userAgent: string;
    browser: string;
    os: string;
    device: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    timestamp: string;
    headers?: {
      forwarded?: string | null;
      realIp?: string | null;
      host?: string | null;
      referer?: string | null;
    };
  };
  sessionId: string;
}
```

## API — `POST /api/login-log`

- **Auth:** `X-Internal-Token` must match the configured secret.
- **Body:** JSON matching `LoginLogData` (see types in `src/lib/login-log-types.ts`).
- **Response:** `201` on success.

## API — `GET /api/login-log`

- **Auth:** signed-in **admin** only.
- **Query:** `page`, `limit` (max 5000), optional `success`, `provider`, `startDate`, `endDate`.
- **Response:** `{ logs, pagination, filters }`.

## API — `DELETE /api/login-log?days=N`

- **Auth:** admin only.
- Deletes rows older than **N** days (default `30`).

## Admin UI

`/dashboard/login-logs` uses hooks such as `useLoginLogs` / `useLoginLogStats` (see `src/hooks/use-login-logs.ts`) which call the GET API.

## Security & privacy

- Passwords are **never** stored in login logs.
- Restrict admin routes and secrets in production (`NEXTAUTH_URL`, strong `NEXTAUTH_SECRET`).
- Consider retention policies and `DELETE` cleanup for compliance.

## Troubleshooting

- **No rows** — confirm `DATABASE_URL` and migrations; check server logs during login.
- **401 on POST** — token header mismatch or secret not set.
- **403 on GET** — session user is not `admin`.
