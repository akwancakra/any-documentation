# CYS Wiki — Documentation Platform

Platform dokumentasi berbasis MDX dengan autentikasi lokal (PostgreSQL + NextAuth Credentials), bcrypt, dan RBAC (admin / user).

## ✨ Features

### Authentication

- **PostgreSQL + Prisma**: User disimpan di database; password di-hash dengan bcrypt
- **Role-based access**: Admin (editor, upload, dashboard) vs user (baca docs)
- **Login logging**: API internal untuk audit login (opsional)

### 📊 Admin Dashboard

- **Login Logs Monitoring**: Real-time tracking aktivitas login users
- **User Analytics**: Statistics, success rate, device info, browser analytics
- **Advanced Filtering**: Filter berdasarkan status, provider, tanggal, dll
- **Responsive Design**: Mobile-friendly admin interface

### 📚 Documentation Platform

- **MDX Support**: Rich markdown dengan React components
- **Search Functionality**: Full-text search across documentation
- **Modern UI**: Clean, responsive interface dengan dark/light mode
- **Content Management**: Editor untuk admin users

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (lokal atau Docker)
- `npm` atau `yarn`

### Setup

```bash
git clone [repository-url]
cd cys-wiki
cp env.template .env.local
# Edit .env.local: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# Jalankan Postgres (opsional Docker):
# docker compose --profile with-postgres up -d

npm install
npm run db:migrate   # atau: npm run db:push
npm run db:seed      # buat admin pertama (lihat SEED_* di .env)
npm run dev
```

### Environment (ringkas)

```env
DATABASE_URL=postgresql://USER:PASS@localhost:5432/wiki?schema=public
NEXTAUTH_SECRET=minimal-32-chars-random
NEXTAUTH_URL=http://localhost:3000
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=changeme123
```

## 📁 Project Structure

```
cys-wiki/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/     # NextAuth Credentials + Prisma
│   │   │   └── login-log/              # Login logging API
│   │   ├── dashboard/
│   │   │   ├── login-logs/             # Admin login monitoring
│   │   │   └── page.tsx                # Main dashboard
│   │   ├── login/                      # Login (email + password)
│   │   └── docs/                       # Documentation pages
│   ├── components/                     # Reusable UI components
│   ├── hooks/
│   │   └── use-login-logs.ts          # Custom hooks for login data
│   └── lib/
│       └── login-log-types.ts         # TypeScript types
├── content/docs/                       # MDX documentation files
├── env.template                        # Environment variables template
├── docs/
│   ├── ADMIN_SETUP.md                # Admin role (database)
│   ├── SETUP.md                      # Quick setup
│   ├── ENVIRONMENT_VARIABLES.md      # Environment reference
│   └── LOGIN_LOGGING.md              # Login logging
└── prisma/                             # Schema + migrations + seed
```

## 🌟 Key Routes

| Route                   | Description           | Access Level  |
| ----------------------- | --------------------- | ------------- |
| `/`                     | Landing page          | Public        |
| `/login`                | Login (DB)            | Public        |
| `/docs`                 | Documentation browser | Authenticated |
| `/dashboard`            | Main dashboard        | Authenticated |
| `/dashboard/login-logs` | Login monitoring      | Admin only    |
| `/editor`               | Content editor        | Admin only    |

## Authentication flow

1. User mengirim email + password ke NextAuth Credentials.
2. Server mencari user di PostgreSQL (email unik, case-insensitive).
3. Password diverifikasi dengan `bcrypt.compare`.
4. Role diambil dari kolom `users.role` (`admin` / `user`).
5. JWT session berisi `role` dan `id` user; login log opsional ke `/api/login-log`.

## 📊 Login Logging System

### Automatic Data Collection

- ✅ **IP Address**: Client IP dengan proxy support
- ✅ **Device Detection**: Desktop/Mobile/Tablet identification
- ✅ **Browser Info**: Chrome, Firefox, Safari, Edge detection
- ✅ **Operating System**: Windows, macOS, Linux, iOS, Android
- ✅ **User Agent**: Complete browser string untuk forensic
- ✅ **Timestamp**: Precise login time dengan timezone
- ✅ **Success/Failure**: Status tracking untuk security monitoring

### Admin Dashboard Features

- **Real-time Statistics**: Total logins, success rate, unique users
- **Advanced Filtering**: Status, provider, date range filters
- **Device Analytics**: Top browsers, OS, device types
- **Pagination**: Handle large datasets efficiently
- **Export Ready**: Data structure ready untuk CSV/JSON export

## 🛡️ Security Features

### Authentication Security

- **API Token Protection**: Secure storage environment variables
- **Session Management**: JWT dengan NextAuth encryption
- **Role-based Permissions**: Granular access control
- **Failed Login Tracking**: Monitor brute force attempts

### Data Privacy

- **No Password Storage**: Passwords never stored atau logged
- **IP Anonymization**: Ready untuk GDPR compliance
- **Data Retention**: Configurable log cleanup
- **Audit Trail**: Complete activity monitoring

## 📖 Documentation

### Setup & Configuration

- **[SETUP.md](./docs/SETUP.md)**: Quick start guide
- **[ADMIN_SETUP.md](./docs/ADMIN_SETUP.md)**: Admin role configuration guide
- **[env.template](./env.template)**: Environment variables template
- **[ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md)**: Complete variables reference

### Technical Documentation

- **[LOGIN_LOGGING.md](./docs/LOGIN_LOGGING.md)**: Login logging system documentation

### API References

- **[Login Log API](./src/app/api/login-log/route.ts)**: Internal logging endpoints

## 📝 Documentation Editors

This project provides two types of documentation editors for admin users:

### 1. Live Preview Editor

- **File:** `src/app/editor/_components/editor.tsx`
- **Description:** A WYSIWYG (What You See Is What You Get) editor with real-time preview. Suitable for users who prefer editing content visually.
- **How to use:**
  - When creating a new doc, select **Live Preview** in the editor selection dialog.
  - The editor will show a live preview as you write.

### 2. Split View (Code) Editor

- **File:** `src/app/editor/_components/split-view-editor.tsx`
- **Description:** A split view editor with a code (MDX) panel and a preview panel. Ideal for users who want direct control over the MDX source and access to advanced components.
- **How to use:**
  - When creating a new doc, select **Split View (Code)** in the editor selection dialog.
  - When editing an existing doc, the split view editor is always used.
  - Write MDX in the code panel; the preview updates automatically.

### Selecting Editor Type

- When you click **Create Doc** (admin only), an **Editor Type Dialog** will appear.
- Choose between **Live Preview** and **Split View (Code)**.
- The selected editor will be used for the new document.
- You can only choose the editor type when creating a new doc. Editing always uses the split view editor.

## 🧩 Available MDX Components (Split View Editor)

When using the split view editor, you can use the following MDX components in your documentation:

- `Accordion`, `Accordions`: Collapsible content sections
- `Banner`: Highlighted information banners
- `DynamicCodeBlock`: Syntax-highlighted code blocks with language detection
- `ImageZoom`: Click-to-zoom images
- `InlineTOC`: Inline table of contents
- `Step`, `Steps`: Step-by-step guides
- `Tabs`, `Tab`: Tabbed content areas
- `PDFViewer`: Embed PDF files
- `VideoViewer`: Embed videos
- `img`: Enhanced image support (auto-zoom, responsive)
- `table`, `thead`, `th`, `td`: Styled tables
- Headings (`h1`-`h6`): Auto-generated anchor links
- `pre`: Auto-highlighted code blocks

You can also use all standard Markdown/MDX elements. For details, see `src/mdx-components.tsx`.

## 🧪 Testing

### Manual Testing

```bash
# 1. Test login (database)
# Visit: http://localhost:3000/login
# Gunakan email/password dari seed (atau user yang sudah dibuat di DB)

# 2. Test admin access
# Login sebagai user dengan role admin
# Visit: http://localhost:3000/dashboard/login-logs

# 3. Test role
# Ubah users.role di DB / Prisma Studio; verifikasi akses /editor dan dashboard
```

### Environment Testing

```bash
# Check if all required environment variables are set
node -e "
const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
required.forEach(v => {
  if (!process.env[v]) console.error('❌ Missing:', v);
  else console.log('✅', v);
});
"
```

## 🚀 Deployment

### Development

```bash
npm run dev
# Access: http://localhost:3000
```

### Production

```bash
# Build
npm run build

# Start
npm run start

# Or use Docker
docker build -t cys-wiki .
docker run -p 3000:3000 cys-wiki
```

### Environment Variables (Production)

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=production-secret-32-chars
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
```

## 🤝 Support

### Masalah teknis

- Cek console browser (F12) dan log server
- Pastikan `DATABASE_URL`, migrasi, dan `NEXTAUTH_*` benar di environment production

## 🔮 Roadmap

### Phase 1 (Current) ✅

- ✅ Autentikasi PostgreSQL + NextAuth Credentials
- ✅ Login logging system
- ✅ Admin dashboard
- ✅ Role-based access control

### Phase 2 (Planned)

- [ ] Database integration untuk persistent logging
- [ ] Real-time notifications
- [ ] Advanced analytics dengan charts
- [ ] Export functionality (CSV/Excel)
- [ ] Geolocation tracking
- [ ] Rate limiting & brute force protection

### Phase 3 (Future)

- [ ] SIEM integration
- [ ] Advanced threat detection
- [ ] Compliance reporting
- [ ] Multi-language support
- [ ] Mobile app integration

## 📚 Learn More

### Technologies Used

- **[Next.js](https://nextjs.org/docs)**: React framework
- **[NextAuth.js](https://next-auth.js.org/)**: Authentication solution
- **[Fumadocs](https://fumadocs.vercel.app)**: Documentation framework
- **[Tailwind CSS](https://tailwindcss.com/)**: Styling framework
- **[TypeScript](https://www.typescriptlang.org/)**: Type safety

---

## 📄 Contoh Penggunaan Komponen Fumadocs (MDX)

```mdx
# Contoh Penggunaan Komponen Fumadocs

<Banner>Ini adalah banner penting!</Banner>

<Accordion title="Apa itu Fumadocs?">
  Fumadocs adalah framework dokumentasi modern berbasis MDX.
</Accordion>

<Accordions>
  <Accordion title="Fitur 1">Deskripsi fitur 1</Accordion>
  <Accordion title="Fitur 2">Deskripsi fitur 2</Accordion>
</Accordions>

<DynamicCodeBlock lang="js" code={`console.log('Hello Fumadocs!')`} />

<ImageZoom
  src="/docs/images/screenshot-2025-06-28-192107-38759540.png"
  alt="Contoh Screenshot"
  width={600}
  height={400}
/>

<InlineTOC />

<Step title="Langkah 1">Install dependencies</Step>
<Step title="Langkah 2">Jalankan server</Step>
<Steps>
  <Step title="A">Aksi A</Step>
  <Step title="B">Aksi B</Step>
</Steps>

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Konten Tab 1</TabsContent>
  <TabsContent value="tab2">Konten Tab 2</TabsContent>
</Tabs>

<PDFViewer src="/docs/files/example.pdf" width={800} height={600} />

<VideoViewer src="/docs/videos/example.mp4" width={800} height={450} />
```

---

## 📦 Contoh Integrasi Komponen MDX di Next.js (Server Component)

```tsx
// app/docs/[[...slug]]/page.tsx
import { getMDXComponents } from "@/mdx-components";
import { source } from "@/lib/source";

const page = source.getPage(["..."]);

return (
  <MdxContent
    code={page?.data.body}
    components={getMDXComponents({
      // Contoh: custom link handler
      a: (props) => <a {...props} target="_blank" rel="noopener" />,
    })}
  />
);
```
