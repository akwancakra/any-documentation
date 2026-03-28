# Security Audit & Bug Analysis Report

**Project:** CyberSec Docs (cys-fumadocs)  
**Tanggal Audit:** 28 Maret 2026  
**Framework:** Next.js 15.3.3 (App Router), React 19, NextAuth v4, Fumadocs  
**Severity Scale:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | ⚪ Info

---

## Daftar Isi

1. [Ringkasan Eksekutif](#ringkasan-eksekutif)
2. [Vulnerability — Keamanan](#vulnerability--keamanan)
   - [SEC-01: API Endpoint Tanpa Autentikasi](#sec-01-api-save-file-tanpa-autentikasi)
   - [SEC-02: CRUD Files Tanpa Autentikasi](#sec-02-crud-files-tanpa-autentikasi)
   - [SEC-03: Login Log Tanpa Autentikasi](#sec-03-login-log-post-tanpa-autentikasi)
   - [SEC-04: Path Traversal pada Asset Routes](#sec-04-path-traversal-pada-asset-routes)
   - [SEC-05: Hardcoded Dummy Credentials](#sec-05-hardcoded-dummy-credentials)
   - [SEC-06: XSS via dangerouslySetInnerHTML](#sec-06-xss-via-dangerouslysetinnerhtml)
   - [SEC-07: YAML Injection pada Frontmatter](#sec-07-yaml-injection-pada-frontmatter)
   - [SEC-08: Prompt Injection pada AI Enhance](#sec-08-prompt-injection-pada-ai-enhance)
   - [SEC-09: Upload Tanpa Validasi File](#sec-09-upload-tanpa-validasi-file-type)
   - [SEC-10: Middleware Inkonsistensi](#sec-10-middleware-inkonsistensi)
   - [SEC-11: getServerSession Tanpa authOptions](#sec-11-getserversession-tanpa-authoptions)
   - [SEC-12: Emergency Admin Hardcoded](#sec-12-emergency-admin-hardcoded)
   - [SEC-13: Revalidate Path Abuse](#sec-13-revalidate-path-abuse)
3. [Bug & Code Quality](#bug--code-quality)
   - [BUG-01: Next.js 15 params/searchParams Pattern](#bug-01-nextjs-15-paramssearchparams-pattern)
   - [BUG-02: Race Condition pada MDX Preview](#bug-02-race-condition-pada-mdx-preview)
   - [BUG-03: Memory Leak — setTimeout Tanpa Cleanup](#bug-03-memory-leak--settimeout-tanpa-cleanup)
   - [BUG-04: In-Memory Login Log (Data Loss)](#bug-04-in-memory-login-log-data-loss)
   - [BUG-05: Fetch Tanpa AbortController](#bug-05-fetch-tanpa-abortcontroller)
   - [BUG-06: Regex Error pada Search Highlight](#bug-06-regex-error-pada-search-highlight)
   - [BUG-07: Tidak Ada Error Boundary](#bug-07-tidak-ada-error-boundary)
   - [BUG-08: Azure AD Provider Tidak Ada](#bug-08-azure-ad-provider-tidak-ada)
   - [BUG-09: Duplikat auth-options.ts](#bug-09-duplikat-auth-optionsts)
   - [BUG-10: key={index} pada Dynamic Lists](#bug-10-keyindex-pada-dynamic-lists)
4. [Accessibility Issues](#accessibility-issues)
5. [Rekomendasi Prioritas](#rekomendasi-prioritas)

---

## Ringkasan Eksekutif

| Severity | Jumlah |
|----------|--------|
| 🔴 Critical | 3 |
| 🟠 High | 5 |
| 🟡 Medium | 5 |
| 🟢 Low | 6 |
| ⚪ Info | 4 |
| **Total** | **23** |

Audit menemukan **3 vulnerability kritis** terkait endpoint API tanpa autentikasi yang memungkinkan penulisan/penghapusan file tanpa izin, **5 vulnerability tingkat tinggi** termasuk path traversal, hardcoded credentials, dan XSS, serta sejumlah bug terkait kompatibilitas Next.js 15 dan race condition.

---

## Vulnerability — Keamanan

### SEC-01: API `save-file` Tanpa Autentikasi

| | |
|---|---|
| **Severity** | 🔴 Critical |
| **File** | `src/app/api/save-file/route.ts` |
| **Deskripsi** | Endpoint `POST /api/save-file` tidak melakukan pengecekan session/autentikasi. Siapa pun yang dapat mengirim HTTP request ke endpoint ini bisa menulis file `.mdx` ke filesystem server. |

**Kode Bermasalah:**

```typescript
// Tidak ada pengecekan session di awal handler
export async function POST(request: Request) {
  try {
    const { filePath, content, metadata, isUpdate, originalPath } = await request.json();
    // ... langsung memproses penulisan file
```

**Dampak:**
- Penyerang bisa membuat atau menimpa file dokumentasi tanpa login
- Potensi defacement konten wiki
- Komentar di baris 102 mengakui masalah: `user: "unknown", // Belum ada auth di API`

**Rekomendasi:**
```typescript
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // ... sisanya
}
```

---

### SEC-02: CRUD Files Tanpa Autentikasi

| | |
|---|---|
| **Severity** | 🔴 Critical |
| **File** | `src/app/api/files/route.ts` |
| **Baris** | POST (80), DELETE (113), PUT (164) |
| **Deskripsi** | Hanya handler `GET` yang memeriksa session. Handler `POST` (buat folder), `DELETE` (hapus file/folder), dan `PUT` (rename/move) tidak memiliki pengecekan autentikasi. |

**Kode Bermasalah:**

```typescript
// GET - memiliki auth check ✅
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) { return new Response(..., { status: 401 }); }
  // ...
}

// POST - TIDAK ada auth check ❌
export async function POST(request: Request) {
  try {
    const { folderPath } = await request.json();
    // ... langsung membuat folder
```

**Dampak:**
- Penyerang bisa membuat folder arbitrary di `content/docs`
- Penyerang bisa menghapus file/folder dokumentasi
- Penyerang bisa memindahkan/rename file dan merusak struktur docs

**Rekomendasi:** Tambahkan `getServerSession(authOptions)` + role check `admin` di awal setiap handler.

---

### SEC-03: Login Log POST Tanpa Autentikasi

| | |
|---|---|
| **Severity** | 🟠 High |
| **File** | `src/app/api/login-log/route.ts` |
| **Baris** | 39 |
| **Deskripsi** | `POST /api/login-log` menerima data log tanpa autentikasi. Ini memungkinkan siapa pun mengirim data log palsu dan menyebabkan DoS pada memori server. |

**Dampak:**
- Pemalsuan data audit log
- Memory exhaustion (DoS) karena log disimpan in-memory tanpa batas ukuran
- Data `requestInfo` (IP, headers) yang dipalsukan klien bisa menyesatkan investigasi

**Rekomendasi:**
- Tambahkan autentikasi, atau batasi hanya dari internal calls
- Tambahkan rate limiting
- Batasi ukuran array `loginLogs` (misal max 10.000 entry)

---

### SEC-04: Path Traversal pada Asset Routes

| | |
|---|---|
| **Severity** | 🟠 High |
| **File** | `src/app/api/assets/images/[filename]/route.ts` (dan `files/`, `videos/`) |
| **Deskripsi** | Parameter `filename` dari URL langsung di-join dengan `path.join()` tanpa validasi bahwa path hasil resolve masih berada di dalam directory yang diizinkan. |

**Kode Bermasalah:**

```typescript
const { filename } = await params;
const filePath = path.join(
  process.cwd(), "public", "assets", "images", filename
);

// Tidak ada validasi: filePath.startsWith(allowedDir)
if (!fs.existsSync(filePath)) { ... }
const fileBuffer = fs.readFileSync(filePath);
```

**Dampak:**
- Payload seperti `../../etc/passwd` atau `..%2F..%2F.env` bisa membaca file di luar folder assets
- Kemungkinan kebocoran file `.env`, source code, atau file sensitif lainnya

**Rekomendasi:**
```typescript
const allowedDir = path.resolve(process.cwd(), "public", "assets", "images");
const filePath = path.resolve(allowedDir, filename);

if (!filePath.startsWith(allowedDir)) {
  return new NextResponse("Forbidden", { status: 403 });
}
```

---

### SEC-05: Hardcoded Dummy Credentials

| | |
|---|---|
| **Severity** | 🟠 High |
| **File** | `src/lib/auth-options.ts` |
| **Baris** | 122-148 |
| **Deskripsi** | Empat akun dummy dengan password plaintext di-hardcode di source code dan aktif di semua environment tanpa pengecekan `NODE_ENV`. |

**Credentials yang terekspos:**

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| superadmin | super123 | admin |
| testadmin | test123 | admin |
| dummy | dummy123 | user |

**Dampak:**
- Siapa pun dengan akses ke source code (repo) mengetahui credential admin
- Jika deploy ke production tanpa menonaktifkan, penyerang bisa login sebagai admin
- Password lemah dan mudah di-brute force

**Rekomendasi:**
```typescript
function validateDummyAdmin(username: string, password: string) {
  if (process.env.NODE_ENV === "production") {
    return { success: false };
  }
  // ... sisanya hanya untuk development
}
```

---

### SEC-06: XSS via dangerouslySetInnerHTML

| | |
|---|---|
| **Severity** | 🟠 High |
| **File** | `src/app/(home)/_components/home-search-cta.tsx` |
| **Baris** | 93-101 |
| **Deskripsi** | Fungsi `highlightText` membangun HTML string dari konten MDX dan query pencarian, lalu merendernya via `dangerouslySetInnerHTML` tanpa sanitasi. |

**Kode Bermasalah:**

```typescript
searchTerms.forEach((term) => {
  const regex = new RegExp(`(${term})`, "gi");  // term tidak di-escape
  highlightedText = highlightedText.replace(
    regex,
    '<mark class="bg-yellow-200 ...">$1</mark>'
  );
});
return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
```

**Dampak:**
- Jika konten MDX mengandung tag HTML berbahaya (mis. `<script>`, `<img onerror=...>`), konten tersebut akan dieksekusi di browser pengguna
- Search term yang mengandung karakter regex khusus bisa menyebabkan error

**Rekomendasi:**
- Gunakan library sanitizer (mis. DOMPurify) sebelum render
- Escape karakter regex pada search term: `term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
- Pertimbangkan pendekatan React-native (split string, render komponen `<mark>`)

---

### SEC-07: YAML Injection pada Frontmatter

| | |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `src/app/api/save-file/route.ts` |
| **Baris** | 79-84 |
| **Deskripsi** | Title dan description dimasukkan ke frontmatter YAML menggunakan string interpolation tanpa escape. |

**Kode Bermasalah:**

```typescript
const frontmatter = `---
title: "${metadata?.title || "Untitled"}"
description: "${metadata?.description || ""}"
---`;
```

**Dampak:**
- Input seperti `My "Title" \ninjected: true` bisa merusak struktur YAML
- Bisa menginjeksi field YAML tambahan

**Rekomendasi:** Gunakan library YAML (mis. `js-yaml`) untuk serialisasi yang aman:
```typescript
import yaml from 'js-yaml';
const frontmatter = `---\n${yaml.dump({ title, description })}---\n\n`;
```

---

### SEC-08: Prompt Injection pada AI Enhance

| | |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `src/app/api/ai-enhance/route.ts` |
| **Baris** | 152, 194, 228 |
| **Deskripsi** | Konten user langsung disisipkan ke prompt LLM tanpa sanitasi. User bisa menyisipkan instruksi yang mengubah perilaku AI. |

**Dampak:**
- Prompt injection bisa membuat AI menghasilkan konten berbahaya/menyesatkan
- Penyalahgunaan kuota API (Ollama/Gemini) dengan prompt manipulatif
- Konten yang dihasilkan bisa mengandung kode berbahaya yang kemudian di-render

**Rekomendasi:**
- Sanitasi input: hapus pola instruksi seperti "ignore previous instructions"
- Batasi panjang konten input
- Tambahkan rate limiting per user

---

### SEC-09: Upload Tanpa Validasi File Type

| | |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `src/app/api/upload/route.ts` |
| **Deskripsi** | Upload file tidak memvalidasi MIME type/magic bytes, tidak ada batas ukuran file, dan file extension asli dipertahankan. |

**Dampak:**
- Upload file berbahaya (SVG dengan script, HTML, executable) yang di-serve kembali via API asset
- Denial of Service melalui upload file besar tanpa batas
- SVG yang di-serve dengan content-type `image/svg+xml` bisa mengeksekusi JavaScript

**Rekomendasi:**
- Validasi magic bytes untuk memastikan tipe file sesuai
- Tambahkan batas ukuran file (mis. 10MB untuk gambar, 50MB untuk video)
- Jangan serve SVG sebagai `image/svg+xml`, gunakan Content-Security-Policy
- Whitelist ekstensi yang diizinkan

---

### SEC-10: Middleware Inkonsistensi

| | |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `middleware.ts` |
| **Deskripsi** | Terdapat inkonsistensi antara daftar `publicRoutes` di fungsi middleware (baris 20, termasuk `/docs`) dan di callback `authorized` (baris 80, TIDAK termasuk `/docs`). |

**Kode Bermasalah:**

```typescript
// Dalam fungsi middleware (baris 20)
const publicRoutes = ["/", "/login", "/api/auth", "/docs"];

// Dalam callback authorized (baris 80)
const publicRoutes = ["/", "/login", "/api/auth"];
// /docs TIDAK termasuk — user tanpa token akan ditolak oleh authorized()
```

**Dampak:**
- Perilaku akses `/docs` ambigu: `authorized` callback berjalan SEBELUM fungsi middleware
- User tanpa login tidak bisa akses `/docs` karena ditolak di `authorized` lebih dulu
- Juga ada file `middleware-new.ts` yang tidak digunakan tapi membingungkan

**Rekomendasi:** Sinkronkan kedua daftar `publicRoutes`. Hapus `middleware-new.ts` jika tidak dipakai.

---

### SEC-11: getServerSession Tanpa authOptions

| | |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `src/app/api/login-log/route.ts` |
| **Baris** | 80, 173 |
| **Deskripsi** | `getServerSession()` dipanggil tanpa argumen `authOptions`. Ini bisa menyebabkan session tidak ter-parse dengan benar, termasuk field kustom seperti `role`. |

**Kode Bermasalah:**

```typescript
const session = await getServerSession(); // ❌ tanpa authOptions
const userRole = (session.user as any)?.role; // role mungkin undefined
```

**Dampak:**
- Pengecekan role admin mungkin gagal, memungkinkan non-admin mengakses data log
- Atau sebaliknya, admin yang valid mungkin ditolak

**Rekomendasi:**
```typescript
const session = await getServerSession(authOptions);
```

---

### SEC-12: Emergency Admin Hardcoded (temuan historis — diperbaiki)

| | |
|---|---|
| **Severity** | 🟠 High (pada versi lama) |
| **Status** | **Mitigated** — autentikasi sekarang Credentials + PostgreSQL; role admin hanya dari kolom `users.role`, tanpa daftar emergency hardcoded di provider eksternal. |

**Catatan:** Temuan asli mengacu pada identifier admin darurat yang di-hardcode di alur auth lama. Implementasi saat ini tidak lagi memakai pola tersebut; kelola admin lewat database (lihat `docs/ADMIN_SETUP.md`).

---

### SEC-13: Revalidate Path Abuse

| | |
|---|---|
| **Severity** | 🟢 Low |
| **File** | `src/app/api/revalidate/route.ts` |
| **Deskripsi** | `targetPath` dari request body langsung diteruskan ke `revalidatePath()` tanpa validasi. User terautentikasi bisa memicu revalidasi path sembarang. |

**Dampak:**
- Cache abuse: memicu revalidasi berulang bisa menurunkan performa
- Bukan akses data, tapi bisa dimanfaatkan untuk DoS

---

## Bug & Code Quality

### BUG-01: Next.js 15 params/searchParams Pattern

| | |
|---|---|
| **Severity** | 🔴 Critical (Runtime Error) |
| **File** | `src/app/editor/edit/[...slug]/page.tsx` (baris 56, 75) dan `src/app/editor/create/page.tsx` (baris 14, 34) |
| **Deskripsi** | Next.js 15 mengubah `params` dan `searchParams` menjadi `Promise`. Halaman editor tidak menggunakan `await` pada `params`/`searchParams`. |

**Kode Bermasalah:**

```typescript
// edit/[...slug]/page.tsx
export default async function EditPage({ params }: any) {
  const slug = params.slug; // ❌ params adalah Promise di Next.js 15
  // ...
}

// create/page.tsx
export default async function CreateEditorPage({ searchParams }: any) {
  const type = searchParams?.type; // ❌ searchParams adalah Promise
  // ...
}
```

**Kode yang Benar** (seperti di `docs/[[...slug]]/page.tsx`):

```typescript
export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const slug = params.slug;
}
```

**Dampak:**
- `slug` bernilai `undefined` → halaman edit tidak bisa memuat konten
- `type` bernilai `undefined` → editor type tidak terdeteksi
- Kedua halaman editor kemungkinan tidak berfungsi sama sekali

---

### BUG-02: Race Condition pada MDX Preview

| | |
|---|---|
| **Severity** | 🟠 High |
| **File** | `src/app/editor/_components/mdx-preview.tsx` |
| **Baris** | 184-216 |
| **Deskripsi** | `processMDX()` async dipanggil di `useEffect` tanpa cleanup/cancellation flag. Jika konten berubah cepat, respons dari request lama bisa menimpa respons terbaru. |

**Dampak:**
- Preview menampilkan konten yang salah (dari request sebelumnya)
- State `isLoading` bisa salah (set ke false padahal request baru masih berjalan)

**Rekomendasi:**
```typescript
useEffect(() => {
  let cancelled = false;
  async function process() {
    setIsLoading(true);
    const result = await serialize(content);
    if (!cancelled) {
      setMdxSource(result);
      setIsLoading(false);
    }
  }
  process();
  return () => { cancelled = true; };
}, [content]);
```

---

### BUG-03: Memory Leak — setTimeout Tanpa Cleanup

| | |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | Multiple files |
| **Deskripsi** | `setTimeout` digunakan untuk redirect/dismiss tanpa `clearTimeout` di cleanup `useEffect` atau unmount. |

**Lokasi:**
- `src/app/editor/_components/editor.tsx` (baris 923-925, 948-950)
- `src/app/editor/_components/split-view-editor.tsx` (baris 255-257)
- `src/app/(auth)/login/page.tsx` (baris 98-100)
- `src/components/ui/use-toast.tsx` (baris 37-42)

**Dampak:**
- Jika komponen unmount sebelum timeout selesai, callback akan mencoba update state pada komponen yang sudah tidak ada
- Bisa menyebabkan React warning atau perilaku tidak terduga

---

### BUG-04: In-Memory Login Log (Data Loss)

| | |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `src/app/api/login-log/route.ts` |
| **Baris** | 36 |
| **Deskripsi** | Login log disimpan dalam variabel in-memory (`let loginLogs: LoginLogData[] = []`). Data hilang setiap kali server restart, redeploy, atau Next.js melakukan hot reload. |

**Dampak:**
- Semua data audit login hilang saat restart
- Tidak ada persistensi data untuk keperluan compliance/forensik
- Memory bisa terus bertambah tanpa batas karena tidak ada max size

---

### BUG-05: Fetch Tanpa AbortController

| | |
|---|---|
| **Severity** | 🟢 Low |
| **File** | `src/app/dashboard/page.tsx` (baris 53-70), `src/hooks/use-login-logs.ts` (baris 28-71) |
| **Deskripsi** | `fetch` di `useEffect` tanpa `AbortController`. Jika user navigasi cepat, respons dari request lama bisa menyebabkan update state pada komponen yang sudah unmount. |

---

### BUG-06: Regex Error pada Search Highlight

| | |
|---|---|
| **Severity** | 🟢 Low |
| **File** | `src/app/(home)/_components/home-search-cta.tsx` |
| **Baris** | 94 |
| **Deskripsi** | Search term langsung dimasukkan ke `new RegExp()` tanpa escaping karakter khusus regex. |

**Input Bermasalah:** Pencarian `C++` atau `test(` akan menyebabkan `SyntaxError: Invalid regular expression`.

---

### BUG-07: Tidak Ada Error Boundary

| | |
|---|---|
| **Severity** | 🟢 Low |
| **File** | `src/app/` (seluruh direktori) |
| **Deskripsi** | Tidak ditemukan file `error.tsx` di seluruh route App Router. Error runtime akan menampilkan default Next.js error page tanpa handling yang baik. |

**Rekomendasi:** Buat minimal `src/app/error.tsx` dan `src/app/global-error.tsx` untuk menangkap error secara graceful.

---

### BUG-08: Azure AD Provider Tidak Ada

| | |
|---|---|
| **Severity** | 🟢 Low |
| **File** | `src/app/(auth)/login/page.tsx` vs `src/lib/auth-options.ts` |
| **Deskripsi** | Login page memiliki tombol "Microsoft Login" yang memanggil `signIn("azure-ad")`, tetapi provider `azure-ad` tidak terdaftar di `authOptions`. Hanya ada provider `credentials`. |

**Dampak:**
- Klik tombol Microsoft Login akan gagal/error
- UX yang membingungkan bagi pengguna

---

### BUG-09: Duplikat auth-options.ts

| | |
|---|---|
| **Severity** | ⚪ Info |
| **File** | `src/lib/auth-options.ts` dan `src/app/api/auth/[...nextauth]/auth-options.ts` |
| **Deskripsi** | Terdapat dua file `auth-options.ts` dengan konten serupa. Yang digunakan oleh `route.ts` adalah yang di `src/lib/`. File di folder `[...nextauth]` tidak dipakai dan bisa menimbulkan kebingungan saat maintenance. |

**Rekomendasi:** Hapus `src/app/api/auth/[...nextauth]/auth-options.ts`.

---

### BUG-10: key={index} pada Dynamic Lists

| | |
|---|---|
| **Severity** | ⚪ Info |
| **Lokasi** | Multiple files |
| **Deskripsi** | Beberapa list menggunakan `key={index}` alih-alih key yang stabil. |

**Lokasi:**
- `src/app/(home)/page.tsx` (baris 115-116) — gunakan `key={doc.href}`
- `src/app/dashboard/page.tsx` (baris 214-216, 260-261) — gunakan `key={action.href}` / `key={log.time}`
- `src/app/(home)/_components/home-search-cta.tsx` (baris 263-265) — gunakan `key={doc.href}`

---

## Accessibility Issues

| ID | File | Masalah | Severity |
|----|------|---------|----------|
| A11Y-01 | `src/app/(auth)/login/page.tsx` (baris 246-256) | Tombol toggle password tanpa `aria-label` | 🟢 Low |
| A11Y-02 | `src/components/ui/use-toast.tsx` (baris 72-77) | Tombol dismiss "×" tanpa `aria-label` | 🟢 Low |
| A11Y-03 | `src/app/editor/_components/table-of-contents.tsx` | Heading aktif tanpa `aria-current` | ⚪ Info |
| A11Y-04 | `src/app/layout.tsx` (baris 16) | `suppressHydrationWarning` di `<html>` — pastikan ini untuk next-themes dan bukan menutupi masalah lain | ⚪ Info |

---

## Rekomendasi Prioritas

### Prioritas 1 — Segera Perbaiki (Critical)

1. **Tambahkan autentikasi** ke `POST /api/save-file` — endpoint ini bisa menulis file tanpa login
2. **Tambahkan autentikasi** ke `POST/DELETE/PUT /api/files` — endpoint ini bisa manipulasi filesystem tanpa login
3. **Perbaiki pola `params`/`searchParams`** di halaman editor untuk Next.js 15 — halaman editor kemungkinan broken

### Prioritas 2 — Penting (High)

4. **Perbaiki path traversal** pada ketiga route `api/assets/` — tambahkan validasi `startsWith`
5. **Nonaktifkan dummy credentials** di production — tambahkan guard `NODE_ENV`
6. **Hapus emergency admin hardcoded** — pindahkan ke env variable
7. **Sanitasi `dangerouslySetInnerHTML`** pada search highlight — ganti dengan pendekatan React
8. **Tambahkan autentikasi** ke `POST /api/login-log`

### Prioritas 3 — Sedang (Medium)

9. Perbaiki `getServerSession()` tanpa `authOptions` di login-log route
10. Sinkronkan middleware `publicRoutes`
11. Perbaiki race condition di MDX preview
12. Sanitasi input YAML frontmatter
13. Validasi file upload (size, magic bytes, whitelist extensions)

### Prioritas 4 — Rendah (Low)

14. Cleanup `setTimeout` dengan `clearTimeout` di unmount
15. Tambahkan `AbortController` pada `fetch` di `useEffect`
16. Buat `error.tsx` error boundary
17. Hapus/perbaiki tombol Azure AD login
18. Hapus duplikat `auth-options.ts`
19. Ganti `key={index}` dengan key stabil
20. Escape regex pada search term
21. Perbaiki accessibility issues
22. Migrasi login log dari in-memory ke persistent storage
23. Hapus `middleware-new.ts` yang tidak dipakai
