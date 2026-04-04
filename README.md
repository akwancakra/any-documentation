# Any Documentation — Documentation Platform

MDX-based documentation platform with local authentication (PostgreSQL + NextAuth Credentials), bcrypt, and RBAC (admin / user).

## ✨ Features

### Authentication

- **PostgreSQL + Prisma**: Users stored in the database; passwords hashed with bcrypt
- **Role-based access**: Admin (editor, upload, dashboard) vs user (read docs)
- **Login logging**: Internal API for login audit (optional)

### 📊 Admin Dashboard

- **Login Logs Monitoring**: Real-time tracking of user login activity
- **User Analytics**: Statistics, success rate, device info, browser analytics
- **Advanced Filtering**: Filter by status, provider, date, and more
- **Responsive Design**: Mobile-friendly admin interface

### 📚 Documentation Platform

- **MDX Support**: Rich markdown with React components
- **Search Functionality**: Full-text search across documentation
- **Modern UI**: Clean, responsive interface with dark/light mode
- **Content Management**: Editor for admin users

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or Docker)
- `npm` or `yarn`

### Setup

```bash
git clone [repository-url]
cd any-documentation
cp env.template .env.local
# Edit .env.local: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# Run Postgres (optional Docker):
# docker compose --profile with-postgres up -d

npm install
npm run db:migrate   # or: npm run db:push
npm run db:seed      # create first admin (see SEED_* in .env)
npm run dev
```

### Environment (summary)

```env
DATABASE_URL=postgresql://USER:PASS@localhost:5432/wiki?schema=public
NEXTAUTH_SECRET=minimal-32-chars-random
NEXTAUTH_URL=http://localhost:3000
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=changeme123
```

## 📁 Project Structure

```
any-documentation/
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

1. User submits email + password to NextAuth Credentials.
2. Server looks up the user in PostgreSQL (unique email, case-insensitive).
3. Password is verified with `bcrypt.compare`.
4. Role is read from `users.role` (`admin` / `user`).
5. JWT session includes `role` and user `id`; optional login log to `/api/login-log`.

## 📊 Login Logging System

### Automatic Data Collection

- ✅ **IP Address**: Client IP with proxy support
- ✅ **Device Detection**: Desktop / mobile / tablet identification
- ✅ **Browser Info**: Chrome, Firefox, Safari, Edge detection
- ✅ **Operating System**: Windows, macOS, Linux, iOS, Android
- ✅ **User Agent**: Full browser string for forensics
- ✅ **Timestamp**: Precise login time with timezone
- ✅ **Success / Failure**: Status tracking for security monitoring

### Admin Dashboard Features

- **Real-time Statistics**: Total logins, success rate, unique users
- **Advanced Filtering**: Status, provider, date range filters
- **Device Analytics**: Top browsers, OS, device types
- **Pagination**: Handle large datasets efficiently
- **Export Ready**: Data structure ready for CSV / JSON export

## 🛡️ Security Features

### Authentication Security

- **API Token Protection**: Secure storage in environment variables
- **Session Management**: JWT with NextAuth encryption
- **Role-based Permissions**: Granular access control
- **Failed Login Tracking**: Monitor brute-force attempts

### Data Privacy

- **Secure Password Handling**: Only bcrypt hashes are stored; plaintext passwords are never logged
- **IP Anonymization**: Ready for GDPR-style compliance
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
  - The editor shows a live preview as you write.

### 2. Split View (Code) Editor

- **File:** `src/app/editor/_components/split-view-editor.tsx`
- **Description:** A split view editor with a code (MDX) panel and a preview panel. Ideal for users who want direct control over the MDX source and access to advanced components.
- **How to use:**
  - When creating a new doc, select **Split View (Code)** in the editor selection dialog.
  - When editing an existing doc, the split view editor is always used.
  - Write MDX in the code panel; the preview updates automatically.

### Selecting Editor Type

- When you click **Create Doc** (admin only), an **Editor Type Dialog** appears.
- Choose between **Live Preview** and **Split View (Code)**.
- The selected editor is used for the new document.
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
- Headings (`h1`–`h6`): Auto-generated anchor links
- `pre`: Auto-highlighted code blocks

You can also use all standard Markdown/MDX elements. For details, see `src/mdx-components.tsx`.

## 🧪 Testing

### Manual Testing

```bash
# 1. Test login (database)
# Visit: http://localhost:3000/login
# Use email/password from seed (or a user created in the DB)

# 2. Test admin access
# Log in as a user with admin role
# Visit: http://localhost:3000/dashboard/login-logs

# 3. Test roles
# Change users.role in the DB / Prisma Studio; verify /editor and dashboard access
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
docker build -t any-documentation .
docker run -p 3000:3000 any-documentation
```

### Environment Variables (Production)

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=production-secret-32-chars
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
```

## 🤝 Support

### Technical issues

- Check the browser console (F12) and server logs
- Ensure `DATABASE_URL`, migrations, and `NEXTAUTH_*` are correct in the production environment

## 🔮 Roadmap

### Phase 1 (Current) ✅

- ✅ PostgreSQL + NextAuth Credentials authentication
- ✅ Login logging system
- ✅ Admin dashboard
- ✅ Role-based access control

### Phase 2 (Planned)

- [ ] Database integration for persistent logging
- [ ] Real-time notifications
- [ ] Advanced analytics with charts
- [ ] Export functionality (CSV/Excel)
- [ ] Geolocation tracking
- [ ] Rate limiting & brute-force protection

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

## 📄 Fumadocs component usage example (MDX)

```mdx
# Fumadocs component examples

<Banner>This is an important banner!</Banner>

<Accordion title="What is Fumadocs?">
  Fumadocs is a modern MDX-based documentation framework.
</Accordion>

<Accordions>
  <Accordion title="Feature 1">Feature 1 description</Accordion>
  <Accordion title="Feature 2">Feature 2 description</Accordion>
</Accordions>

<DynamicCodeBlock lang="js" code={`console.log('Hello Fumadocs!')`} />

<ImageZoom
  src="/docs/images/screenshot-2025-06-28-192107-38759540.png"
  alt="Example screenshot"
  width={600}
  height={400}
/>

<InlineTOC />

<Step title="Step 1">Install dependencies</Step>
<Step title="Step 2">Run the server</Step>
<Steps>
  <Step title="A">Action A</Step>
  <Step title="B">Action B</Step>
</Steps>

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Tab 1 content</TabsContent>
  <TabsContent value="tab2">Tab 2 content</TabsContent>
</Tabs>

<PDFViewer src="/docs/files/example.pdf" width={800} height={600} />

<VideoViewer src="/docs/videos/example.mp4" width={800} height={450} />
```

---

## 📦 MDX component integration example in Next.js (Server Component)

```tsx
// app/docs/[[...slug]]/page.tsx
import { getMDXComponents } from "@/mdx-components";
import { source } from "@/lib/source";

const page = source.getPage(["..."]);

return (
  <MdxContent
    code={page?.data.body}
    components={getMDXComponents({
      // Example: custom link handler
      a: (props) => <a {...props} target="_blank" rel="noopener" />,
    })}
  />
);
```
