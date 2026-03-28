# Sistem Login Logging

Sistem login logging telah berhasil diimplementasikan untuk mencatat aktivitas login pengguna dengan detail informasi device, IP address, user agent, dan metadata lainnya.

## Fitur Utama

### 1. Logging Otomatis

- **Login Berhasil**: Setiap login yang berhasil dicatat dengan detail lengkap
- **Login Gagal**: Percobaan login yang gagal juga dicatat untuk keamanan
- **Provider Tracking**: Mendukung logging untuk Credentials dan Azure AD
- **Real-time**: Log disimpan secara real-time saat event terjadi

### 2. Data yang Dicatat

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
  provider: "credentials" | "azure-ad";
  requestInfo: {
    ip: string; // IP address pengguna
    userAgent: string; // Full user agent string
    browser: string; // Browser yang digunakan
    os: string; // Operating system
    device: string; // Desktop/Mobile/Tablet
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    timestamp: string; // ISO timestamp
    headers: {
      // Additional request headers
      forwarded?: string;
      realIp?: string;
      host?: string;
      referer?: string;
    };
  };
  sessionId: string; // Unique session identifier
}
```

### 3. API Endpoints

#### POST `/api/login-log`

Menyimpan log login baru (digunakan secara internal oleh sistem auth).

#### GET `/api/login-log`

Mengambil data login logs dengan filter dan pagination.

**Query Parameters:**

- `page`: Nomor halaman (default: 1)
- `limit`: Jumlah item per halaman (default: 50)
- `success`: Filter status login (true/false)
- `provider`: Filter provider (credentials/azure-ad)
- `startDate`: Filter tanggal mulai (ISO format)
- `endDate`: Filter tanggal akhir (ISO format)

**Response:**

```json
{
  "logs": [
    /* array of LoginLogData */
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  },
  "filters": {
    "success": "true",
    "provider": null,
    "startDate": null,
    "endDate": null
  }
}
```

#### DELETE `/api/login-log`

Membersihkan log lama (perlu akses admin).

**Query Parameters:**

- `days`: Hapus log lebih lama dari X hari (default: 30)

### 4. Dashboard Admin

Akses halaman login logs melalui: `/dashboard/login-logs`

**Fitur Dashboard:**

- ✅ Real-time statistics (total login, success rate, dll)
- ✅ Filter berdasarkan status, provider, dan tanggal
- ✅ Pagination untuk navigasi data besar
- ✅ Detail device info dengan icon
- ✅ User agent inspection
- ✅ Responsive design

## Contoh Penggunaan

### 1. Menggunakan Custom Hook

```typescript
import { useLoginLogs, useLoginLogStats } from "@/hooks/use-login-logs";

function MyComponent() {
  const { logs, loading, error, updateFilters, pagination } = useLoginLogs();

  const { stats } = useLoginLogStats();

  // Filter hanya login gagal
  const showFailedLogins = () => {
    updateFilters({ success: false });
  };

  // Filter berdasarkan tanggal
  const showLastWeek = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    updateFilters({
      startDate: lastWeek.toISOString().split("T")[0],
    });
  };

  return (
    <div>
      {stats && (
        <div>
          <p>Total Login: {stats.totalLogins}</p>
          <p>Success Rate: {stats.successRate.toFixed(1)}%</p>
        </div>
      )}

      <button onClick={showFailedLogins}>Show Failed Logins</button>

      {logs.map((log) => (
        <div key={log.sessionId}>
          <p>
            {log.user.email} - {log.success ? "Success" : "Failed"}
          </p>
          <p>IP: {log.requestInfo.ip}</p>
          <p>Device: {log.requestInfo.device}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Mengakses API Secara Manual

```javascript
// Ambil login logs dengan filter
const response = await fetch("/api/login-log?success=false&limit=10");
const data = await response.json();

console.log("Failed logins:", data.logs);

// Hapus log lama (admin only)
const cleanup = await fetch("/api/login-log?days=60", {
  method: "DELETE",
});
```

## Keamanan

### Akses Control

- **Dashboard**: Hanya admin yang bisa mengakses halaman login logs
- **API**: Endpoint GET dan DELETE memerlukan autentikasi admin
- **Data**: Informasi sensitif seperti password tidak disimpan

### Privacy

- User agent strings disimpan untuk analisis tetapi bisa di-anonymize jika diperlukan
- IP addresses dicatat untuk keamanan tetapi bisa di-hash di production
- Data dapat dibersihkan secara otomatis setelah periode tertentu

## Deployment Notes

### Environment Variables

Pastikan `NEXTAUTH_URL` sudah di-set untuk production:

```env
NEXTAUTH_URL=https://yourdomain.com
```

### Database Integration (Optional)

Saat ini menggunakan in-memory storage. Untuk production, integrate dengan database:

```typescript
// Contoh implementasi dengan database
async function saveLoginLog(logData: LoginLogData) {
  await db.loginLogs.create({
    data: logData,
  });
}
```

### Log Rotation

Implementasi auto-cleanup log lama:

```typescript
// Cron job untuk cleanup otomatis
setInterval(async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await fetch("/api/login-log?days=30", { method: "DELETE" });
}, 24 * 60 * 60 * 1000); // Daily cleanup
```

## Testing

### Manual Testing

1. Login dengan credentials yang benar → Cek log success
2. Login dengan credentials salah → Cek log failed
3. Login dari device berbeda → Cek detection device/browser
4. Akses `/dashboard/login-logs` sebagai admin
5. Test filter dan pagination

### Development Credentials

```
Admin: admin@cybersecurity.com / admin123
User: user@cybersecurity.com / user123
```

## Troubleshooting

### Log Tidak Muncul

- Periksa console browser untuk error
- Pastikan user memiliki role admin
- Periksa network tab untuk request API

### API Error 401/403

- User tidak login atau bukan admin
- Session expired, perlu login ulang

### Missing Device Info

- Request headers tidak tersedia (proxy/load balancer)
- User agent tidak standard

## Future Improvements

1. **Database Integration**: Replace in-memory storage
2. **Real-time Notifications**: Alert untuk suspicious activities
3. **Geolocation**: Tambah info lokasi berdasarkan IP
4. **Export Features**: Download logs dalam format CSV/JSON
5. **Advanced Analytics**: Grafik trend login, heatmap, dll
6. **Rate Limiting**: Deteksi brute force attempts
7. **SIEM Integration**: Export ke security tools eksternal

---

Sistem login logging ini memberikan visibility yang baik untuk monitoring keamanan dan troubleshooting. Data yang dikumpulkan dapat membantu dalam analisis forensik dan deteksi aktivitas mencurigakan.
