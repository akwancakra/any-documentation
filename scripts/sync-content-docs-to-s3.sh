#!/usr/bin/env bash
# Sinkronisasi awal: unggah content/docs lokal ke bucket S3 (setelah bucket dibuat).
# Prasyarat: AWS CLI terkonfigurasi (aws configure / env / role).
#
# Contoh:
#   export DOCS_S3_BUCKET=my-wiki-bucket
#   export DOCS_S3_PREFIX=wiki-docs/   # opsional
#   ./scripts/sync-content-docs-to-s3.sh
#
# IAM (contoh policy minimal pada task/instance yang menjalankan sync):
#   s3:PutObject, s3:ListBucket pada arn:aws:s3:::BUCKET/PREFIX*
#   s3:GetObject untuk verifikasi (opsional)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUCKET="${DOCS_S3_BUCKET:?Set DOCS_S3_BUCKET}"
PREFIX="${DOCS_S3_PREFIX:-}"
DEST="s3://${BUCKET}/${PREFIX}"

echo "Sync ${ROOT}/content/docs -> ${DEST}"
aws s3 sync "${ROOT}/content/docs" "${DEST}" --delete
