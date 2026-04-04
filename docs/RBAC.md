# Role-based access control (RBAC)

How access is enforced in Any Documentation.

## Roles

### Admin

- Full access to app features
- Create, update, and delete documentation (per API rules)
- Admin dashboard and login logs
- Editor routes for creating/editing docs

### User

- Limited access (read docs and dashboard per middleware)
- Can use `/docs` as allowed by `middleware.ts`
- **Cannot** use editor-only or admin-only features

## Route matrix

| Route                   | Public | User | Admin | Notes |
| ----------------------- | ------ | ---- | ----- | ----- |
| `/`                     | ✅     | ✅   | ✅    | Home (authenticated users may be redirected per middleware) |
| `/login`                | ✅     | —    | —     | Login (redirect if already signed in) |
| `/docs/**`              | ✅*    | ✅*  | ✅*   | *Per your `middleware.ts` / session rules |
| `/dashboard`            | 🚫     | ✅†  | ✅    | †If allowed for non-admin in your deployment |
| `/dashboard/login-logs` | 🚫     | 🚫   | ✅    | Admin only |
| `/editor/**`            | 🚫     | 🚫   | ✅    | Admin only |
| `/api/auth/**`          | ✅     | ✅   | ✅    | NextAuth routes |

Adjust the table if your middleware differs.

## Middleware behavior (typical)

### Public routes

Examples often include:

- `/` — landing
- `/login`
- `/api/auth/**`
- `/docs/**` — may be public or require auth (check `middleware.ts`)

### Protected routes

- `/dashboard` — requires authentication
- `/editor/**` — admin only
- `/dashboard/login-logs` — admin only

### Redirects (examples)

1. Unauthenticated user hits protected route → `/login`
2. Authenticated user on `/login` → `/dashboard` (or home)
3. Authenticated user on `/` → may redirect to `/dashboard` (project-specific)
4. Forbidden role → `/dashboard?error=access-denied` or similar

## Error query parameters

- `?error=access-denied` — missing permission for the page
- `?error=invalid-role` — role not valid for the resource
- `?error=unauthorized` — not allowed

Handle these in client UI where appropriate.

## Usage examples

### Client component

```tsx
import { useSession } from "next-auth/react";
import { isAdmin } from "@/lib/auth-utils";

function MyComponent() {
  const { data: session } = useSession();
  const userIsAdmin = session && isAdmin(session);

  return (
    <div>
      {userIsAdmin && <AdminOnlyButton />}
      <UserContent />
    </div>
  );
}
```

### Server component

```tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { isAdmin } from "@/lib/auth-utils";

export default async function ServerPage() {
  const session = await getServerSession(authOptions);
  const userIsAdmin = session && isAdmin(session);

  if (!userIsAdmin) {
    redirect("/dashboard?error=access-denied");
  }

  return <AdminContent />;
}
```

## Debugging

If middleware logs requests, verify:

1. Request path
2. Whether a session/token is present
3. User role
4. Redirect target
