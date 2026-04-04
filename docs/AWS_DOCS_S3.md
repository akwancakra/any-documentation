# Storing `content/docs` in Amazon S3

The app reads and writes MDX through a **`DocsStorage`** abstraction. By default (`DOCS_STORAGE` unset or `fs`) content lives under the local `content/docs` folder. For multi-instance deployments on AWS, set **`DOCS_STORAGE=s3`**.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DOCS_STORAGE` | No | `fs` (default) or `s3` |
| `DOCS_S3_BUCKET` | Yes if `s3` | Bucket name |
| `DOCS_S3_PREFIX` | No | Key prefix, e.g. `wiki-docs/` |
| `AWS_REGION` | Recommended | e.g. `ap-southeast-1` |

Credentials: use an **IAM task role** (ECS) or the default credential chain locally.

## IAM (example)

Attach a policy to the role that runs Next.js, allowing:

- `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on:

  - `arn:aws:s3:::BUCKET_NAME`
  - `arn:aws:s3:::BUCKET_NAME/PREFIX*`

If `DOCS_S3_PREFIX` is empty, use `arn:aws:s3:::BUCKET_NAME/*` instead of a prefix wildcard.

## Initial bucket content

From the repo root (with AWS CLI):

```bash
export DOCS_S3_BUCKET=your-bucket-name
export DOCS_S3_PREFIX=   # or e.g. wiki-docs/
./scripts/sync-content-docs-to-s3.sh
```

Or:

```bash
aws s3 sync ./content/docs s3://BUCKET_NAME/PREFIX --delete
```

## Empty folders in S3

S3 has no real directories. Creating a folder from the UI writes a **marker object** `folder/.keep`, which the file tree understands.

## Live content

`/docs` is configured for dynamic rendering and reads from storage on request; updates via the API trigger `revalidatePath` / `revalidateTag` so you usually do **not** need a new image build for every MDX change.
