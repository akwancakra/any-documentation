# Admin & user roles

Akses **admin** (editor dokumen, upload, dashboard penuh, login logs) vs **user** (akses terbatas sesuai middleware) ditentukan oleh **kolom `role`** pada tabel `users` di PostgreSQL.

## Nilai yang didukung

- `admin` — akses penuh termasuk `/editor`, `/api/save-file`, dll.
- `user` — pengguna biasa (sesuai aturan di `middleware.ts`)

## Cara mengubah role

### Prisma Studio (paling mudah)

```bash
npm run db:studio
```

Buka model **User**, edit field `role` untuk email yang diinginkan.

### SQL

```sql
UPDATE users SET role = 'admin' WHERE email = 'orang@example.com';
```

### User baru

1. Studio: **Add record** — isi `email`, `passwordHash` harus berupa **bcrypt** (jangan simpan password plaintext).
2. Atau buat skrip kecil dengan `bcrypt.hash` + `prisma.user.create` (bisa ditambahkan sebagai `npm run db:add-user` jika diperlukan).

## Seed awal

`npm run db:seed` membuat/ memperbarui satu user admin (email/password dari env `SEED_*`). Ganti password production segera setelah deploy pertama.

## Catatan keamanan

- Password hanya disimpan sebagai **hash bcrypt** di `password_hash`.
- Session memakai **JWT** NextAuth; pastikan `NEXTAUTH_SECRET` kuat dan unik per environment.
