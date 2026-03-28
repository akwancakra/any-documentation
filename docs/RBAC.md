# Role-Based Access Control (RBAC)

Dokumentasi sistem kontrol akses berdasarkan role dalam aplikasi CyberSec Docs.

## Roles yang Tersedia

### 1. Admin

- **Akses penuh** ke semua fitur aplikasi
- Dapat membuat, mengedit, dan menghapus dokumentasi
- Akses ke dashboard admin dan login logs
- Dapat mengakses editor untuk membuat/edit docs

### 2. User

- **Akses terbatas** untuk membaca dokumentasi
- Dapat mengakses dashboard user
- Dapat membaca semua dokumentasi di `/docs`
- **Tidak dapat** mengakses editor atau admin features

## Route Access Matrix

| Route                   | Public | User | Admin | Keterangan                                  |
| ----------------------- | ------ | ---- | ----- | ------------------------------------------- |
| `/`                     | ✅     | ✅   | ✅    | Homepage (redirect ke dashboard jika login) |
| `/login`                | ✅     | 🚫   | 🚫    | Login page (redirect jika sudah login)      |
| `/docs/**`              | ✅     | ✅   | ✅    | Dokumentasi (public access)                 |
| `/dashboard`            | 🚫     | ✅   | ✅    | Dashboard utama                             |
| `/dashboard/login-logs` | 🚫     | 🚫   | ✅    | Login logs (admin only)                     |
| `/editor/**`            | 🚫     | 🚫   | ✅    | Editor untuk create/edit docs (admin only)  |
| `/api/auth/**`          | ✅     | ✅   | ✅    | NextAuth API routes                         |

## Implementasi Middleware

### Public Routes

Routes yang bisa diakses tanpa login:

- `/` - Homepage
- `/login` - Login page
- `/api/auth/**` - Authentication APIs
- `/docs/**` - Documentation (read-only)

### Protected Routes

Routes yang memerlukan authentication:

- `/dashboard` - User dan Admin
- `/editor/**` - Admin only
- `/dashboard/login-logs` - Admin only

### Redirect Logic

1. **User belum login** → Redirect ke `/login`
2. **User sudah login di `/login`** → Redirect ke `/dashboard`
3. **User sudah login di `/`** → Redirect ke `/dashboard`
4. **User tanpa akses** → Redirect ke `/dashboard?error=access-denied`
5. **Invalid role** → Redirect ke `/login?error=invalid-role`

## Error Handling

### Query Parameters untuk Error

- `?error=access-denied` - User tidak memiliki akses ke halaman tersebut
- `?error=invalid-role` - Role user tidak valid
- `?error=unauthorized` - Akses tidak diizinkan

### Client-side Handling

Setiap halaman protected harus menghandle error query parameters dan menampilkan pesan yang sesuai.

## Contoh Penggunaan

### Di Client Component

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

### Di Server Component

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

Middleware akan log setiap request dengan format:

```
=== Middleware: /path, token: true/false, role: admin/user
```

Untuk debugging access control issues, cek console logs untuk melihat:

1. Path yang diakses
2. Status token (ada/tidak)
3. Role user
4. Redirect decisions
