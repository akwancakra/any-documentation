# Menyimpan `content/docs` di Amazon S3

Aplikasi membaca dan menulis file MDX lewat abstraksi **DocsStorage**. Secara default (`DOCS_STORAGE` tidak di-set atau `fs`) data tetap di folder lokal `content/docs`. Untuk produksi di AWS dengan beberapa instance container, set **`DOCS_STORAGE=s3`**.

## Variabel lingkungan

| Variabel | Wajib | Keterangan |
|----------|--------|------------|
| `DOCS_STORAGE` | Tidak | `fs` (default) atau `s3` |
| `DOCS_S3_BUCKET` | Ya jika `s3` | Nama bucket |
| `DOCS_S3_PREFIX` | Tidak | Awalan key, mis. `wiki-docs/` |
| `AWS_REGION` | Disarankan | Mis. `ap-southeast-1` |

Kredensial: gunakan **IAM task role** (ECS) atau credential chain lokal untuk development.

## IAM (contoh)

Lampirkan policy ke role task/container yang menjalankan Next.js:

- `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` pada resource:

  - `arn:aws:s3:::NAMA_BUCKET`
  - `arn:aws:s3:::NAMA_BUCKET/PREFIX*`

Ganti `PREFIX` sesuai `DOCS_S3_PREFIX` (tanpa wildcard ganda jika prefix kosong: gunakan `arn:aws:s3:::NAMA_BUCKET/*`).

## Isi awal bucket

Dari root repo (dengan AWS CLI):

```bash
export DOCS_S3_BUCKET=nama-bucket-anda
export DOCS_S3_PREFIX=   # atau mis. wiki-docs/
./scripts/sync-content-docs-to-s3.sh
```

Atau setara:

```bash
aws s3 sync ./content/docs s3://NAMA_BUCKET/PREFIX --delete
```

## Folder kosong di S3

S3 tidak punya direktori kosong. Membuat folder dari UI menulis object penanda `nama-folder/.keep`. Itu kompatibel dengan pohon file di editor.

## Konten “live”

Halaman `/docs` memakai `dynamic = "force-dynamic"` dan membaca storage pada setiap request; perubahan lewat API disertai `revalidatePath` / `revalidateTag` sehingga tidak perlu rebuild image untuk melihat MDX baru.
