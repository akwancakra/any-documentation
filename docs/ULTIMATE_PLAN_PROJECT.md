# any-documentation — Comprehensive Project Documentation

> **Stack**: Next.js 15 (App Router · Standalone) · Prisma · PostgreSQL (RDS) · AWS ECS Fargate · S3 (docs) · Gemini AI  
> **Target Role**: Cloud Engineer / DevOps Engineer / QA Engineer Portfolio Project  
> **Last Updated**: 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Tech Stack & Decision Log](#3-tech-stack--decision-log)
4. [Phase 1 — Penyimpanan Dokumen MDX di S3](#4-phase-1--penyimpanan-dokumen-mdx-di-s3)
5. [Phase 2 — Infrastructure as Code (Terraform)](#5-phase-2--infrastructure-as-code-terraform)
6. [Phase 3 — CI/CD Pipeline (GitHub Actions)](#6-phase-3--cicd-pipeline-github-actions)
7. [Phase 4 — Security & Production Hardening](#7-phase-4--security--production-hardening)
8. [Phase 5 — Testing Strategy (QA Showcase)](#8-phase-5--testing-strategy-qa-showcase)
9. [Monitoring & Observability](#9-monitoring--observability)
10. [Cost Management & Free Tier Guard](#10-cost-management--free-tier-guard)
11. [Rollout & Maintenance Plan](#11-rollout--maintenance-plan)
12. [Local Development Setup](#12-local-development-setup)
13. [Troubleshooting Guide](#13-troubleshooting-guide)
14. [Architecture Decision Records (ADR)](#14-architecture-decision-records-adr)

---

## 1. Project Overview

**any-documentation** (Any Documentation) adalah platform dokumentasi berbasis MDX dengan editor WYSIWYG, autentikasi admin, dan fitur AI (Gemini) untuk generate & improve konten. Project ini dirancang sebagai **production-grade portfolio** yang membuktikan kemampuan Cloud Engineering, DevOps, dan Quality Assurance secara end-to-end.

### Goals

| Goal                | Detail                                                                   |
| ------------------- | ------------------------------------------------------------------------ |
| **Functional**      | CRUD dokumen MDX, live rendering, AI-powered content via Gemini          |
| **Infrastructure**  | Monolith Next.js di AWS ECS Fargate + RDS PostgreSQL + S3 untuk docs MDX |
| **DevOps**          | Pipeline CI/CD otomatis (GitHub Actions + OIDC), zero manual deployment  |
| **Security**        | Least privilege IAM, secrets di Secrets Manager, rate limiting, HTTPS    |
| **Observability**   | CloudWatch Logs, alarms, structured logging                              |
| **QA Portfolio**    | Piramida testing: unit (Vitest) + E2E (Playwright) + manual checklist    |
| **Portfolio Value** | Demonstrasi skill Cloud/DevOps/QA nyata ke recruiter                     |

### Keputusan Arsitektur Utama: Monolith Container (bukan serverless split)

Aplikasi ini menggunakan **Next.js standalone container di ECS Fargate** — bukan static export + Lambda terpisah. Alasannya:

- App membutuhkan **server-side rendering dinamis** (MDX live per-request, NextAuth session, Prisma).
- **Satu unit deploy** lebih mudah di-debug, di-rollback, dan dijelaskan.
- **Trade-off yang disadari**: tidak memanfaatkan free tier Lambda, tapi arsitektur lebih representatif untuk aplikasi production nyata.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                   USER / BROWSER                 │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────┐
│          Application Load Balancer (ALB)         │
│     HTTPS termination · health check · routing   │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         ECS Fargate — Next.js Standalone         │
│  ┌───────────────────────────────────────────┐  │
│  │  App Router                               │  │
│  │  · /docs/[[...slug]]  — MDX live render   │  │
│  │  · /editor            — WYSIWYG editor    │  │
│  │  · /api/*             — Route Handlers    │  │
│  │  · /api/auth          — NextAuth          │  │
│  └───────────────────────────────────────────┘  │
└────────────────┬────────────────┬───────────────┘
                 │                │
          ┌──────▼──────┐  ┌──────▼───────────────┐
          │ RDS Postgres │  │ S3 Bucket (MDX Docs)  │
          │  · User      │  │  DOCS_STORAGE=s3      │
          │  · LoginLog  │  │  · content/docs/*.mdx │
          │  · FileLog   │  │  · folder/.keep       │
          └─────────────┘  └──────────────────────┘
                                    │
                         ┌──────────▼───────────────┐
                         │  AWS Secrets Manager /    │
                         │  SSM Parameter Store      │
                         │  DATABASE_URL             │
                         │  NEXTAUTH_SECRET          │
                         │  GEMINI_API_KEY           │
                         └──────────────────────────┘

Monitoring Layer:
CloudWatch Logs → CloudWatch Metrics → CloudWatch Alarms → SNS (email alert)
```

### Data Flow: Baca Halaman Docs

```
Browser → ALB → ECS Task
                    │
                    ├─ getDynamicPage(slug) [force-dynamic]
                    ├─ getDocsStorage().getText(relKey)  ← S3 GetObject
                    ├─ parse MDX (gray-matter + MDXRemote)
                    └─ return rendered RSC
```

### Data Flow: Simpan/Edit Dokumen (Admin)

```
Browser → ALB → ECS Task → /api/save-file
                                │
                                ├─ getDocsStorage().putText(key, body)  ← S3 PutObject
                                ├─ revalidatePath / revalidateTag
                                └─ appendActivityLog → RDS
```

### Data Flow: AI Generate Content

```
Browser → ALB → ECS Task → /api/ai-enhance
                                │
                                ├─ Baca GEMINI_API_KEY dari env (inject via Secrets Manager)
                                ├─ Call Gemini Flash API
                                └─ Return { enhancedContent }
```

---

## 3. Tech Stack & Decision Log

| Layer              | Pilihan                          | Alasan                                                                   |
| ------------------ | -------------------------------- | ------------------------------------------------------------------------ |
| **Frontend/App**   | Next.js 15 App Router            | SSR + force-dynamic MDX rendering, monolith sederhana, standalone output |
| **Database**       | PostgreSQL via Prisma            | Relasional (User, LoginLog, FileLog), schema konsisten, Prisma type-safe |
| **DB Hosting**     | Amazon RDS PostgreSQL            | Managed, backup, encryption, VPC private, kompatibel Prisma              |
| **Compute**        | ECS Fargate                      | Serverless container, tidak ada server management, scale-down ke 0       |
| **Load Balancer**  | ALB                              | HTTPS termination, health check, sticky session opsional                 |
| **Docs Storage**   | S3 (via `DocsStorage` abstraksi) | MDX file persisten lintas task, versioning opsional, enkripsi at-rest    |
| **Secrets**        | Secrets Manager / SSM            | DATABASE_URL, NEXTAUTH_SECRET, Gemini key — tidak disimpan di image      |
| **IaC**            | Terraform                        | Reproducible, versioned, industry standard                               |
| **CI/CD**          | GitHub Actions + OIDC            | Native integration, tanpa static credential, gratis untuk public repo    |
| **AI Model**       | Gemini Flash / Flash-Lite        | Free tier, powerful untuk content generation                             |
| **Monitoring**     | CloudWatch                       | Native AWS, zero setup tambahan                                          |
| **Testing**        | Vitest + Playwright + manual     | Piramida testing untuk showcase QA                                       |
| **Image Registry** | Amazon ECR                       | Private, native ECS integration, lifecycle policy                        |

---

## 4. Phase 1 — Penyimpanan Dokumen MDX di S3

**Status**: Selesai diimplementasikan  
**Output**: Abstraksi `DocsStorage` dengan adapter `fs` (lokal) dan `s3` (AWS).

### Konsep

Semua baca/tulis file MDX di `content/docs` melewati satu interface terpusat (`DocsStorage`). Backend dipilih lewat env:

- `DOCS_STORAGE=fs` — baca/tulis ke disk lokal (default untuk dev)
- `DOCS_STORAGE=s3` — baca/tulis ke S3 bucket (untuk prod ECS)

### Struktur Modul

```
src/lib/docs-storage/
├── types.ts        # Interface DocsStorage
├── keys.ts         # Normalisasi key, validasi path traversal, .keep marker
├── fs-storage.ts   # Implementasi filesystem (dev / single-instance)
├── s3-storage.ts   # Implementasi S3 (@aws-sdk/client-s3)
└── index.ts        # getDocsStorage() — singleton + env toggle
src/lib/
├── mdx-utils.ts        # getAllMDXFiles, getMDXFileBySlug — via DocsStorage
├── docs-file-tree.ts   # buildDocsFileTree — FS: readdir; S3: list keys
└── docs-revalidate.ts  # revalidateDocsContent() terpusat
```

### Folder Kosong di S3

S3 tidak punya konsep direktori. Saat admin membuat folder baru, sebuah **marker object** `folder/.keep` (0 byte) dibuat. Pohon file di editor dibentuk dari listing key + infal prefix.

### Variabel Environment

```bash
DOCS_STORAGE=s3
DOCS_S3_BUCKET=nama-bucket
DOCS_S3_PREFIX=          # opsional, mis. wiki-docs/
AWS_REGION=ap-southeast-1
```

### IAM Task Role (contoh)

```json
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject",
    "s3:ListBucket"
  ],
  "Resource": ["arn:aws:s3:::NAMA_BUCKET", "arn:aws:s3:::NAMA_BUCKET/*"]
}
```

### Seed Awal Bucket

```bash
export DOCS_S3_BUCKET=nama-bucket
./scripts/sync-content-docs-to-s3.sh
# atau: aws s3 sync ./content/docs s3://NAMA_BUCKET/PREFIX --delete
```

---

## 5. Phase 2 — Infrastructure as Code (Terraform)

**Estimasi waktu**: 2–3 hari  
**Output**: Semua AWS resource terprovision secara reproducible dan versioned.

### Struktur Folder

```
infrastructure/
├── main.tf              # Provider, remote state, resource utama
├── variables.tf         # Input variables
├── terraform.tfvars     # Actual values (gitignored)
├── outputs.tf           # Output: ALB URL, ECR repo, dll
├── modules/
│   ├── network/         # VPC, subnets, security groups
│   ├── compute/         # ECS cluster, service, task definition, ALB
│   ├── database/        # RDS PostgreSQL
│   ├── storage/         # S3 bucket docs, ECR
│   └── secrets/         # Secrets Manager entries
└── .terraform.lock.hcl
```

### `variables.tf`

```hcl
variable "project_name" {
  description = "Prefix semua resource AWS"
  type        = string
  default     = "any-documentation"
}

variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "nextauth_secret" {
  type      = string
  sensitive = true
}

variable "gemini_api_key" {
  type      = string
  sensitive = true
}
```

### Resource Utama

```hcl
# ECR — image registry
resource "aws_ecr_repository" "app" {
  name                 = "${var.project_name}-${var.environment}"
  image_tag_mutability = "MUTABLE"
  lifecycle_policy {
    # Simpan hanya 10 image terakhir
    policy = jsonencode({
      rules = [{ rulePriority = 1, action = { type = "expire" },
        selection = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 } }]
    })
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier        = "${var.project_name}-db-${var.environment}"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.micro"  # Free tier eligible
  allocated_storage = 20
  db_name           = "wikidocs"
  username          = "wikiuser"
  password          = var.db_password
  skip_final_snapshot = true
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  storage_encrypted      = true
  backup_retention_period = 7
  deletion_protection    = false  # set true di prod nyata
}

# S3 — MDX Docs Storage
resource "aws_s3_bucket" "docs" {
  bucket = "${var.project_name}-docs-${var.environment}"
}

resource "aws_s3_bucket_versioning" "docs" {
  bucket = aws_s3_bucket.docs.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "docs" {
  bucket = aws_s3_bucket.docs.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "docs" {
  bucket                  = aws_s3_bucket.docs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Secrets Manager
resource "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.project_name}/${var.environment}/app"
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    DATABASE_URL    = "postgresql://wikiuser:${var.db_password}@${aws_db_instance.postgres.endpoint}/wikidocs"
    NEXTAUTH_SECRET = var.nextauth_secret
    GEMINI_API_KEY  = var.gemini_api_key
  })
}

# ECS Task Role — IAM
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-task-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy" "ecs_task_policy" {
  name = "${var.project_name}-task-policy"
  role = aws_iam_role.ecs_task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
        Resource = [aws_s3_bucket.docs.arn, "${aws_s3_bucket.docs.arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = aws_secretsmanager_secret.app_secrets.arn
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}
```

### Urutan Eksekusi

```bash
# 1. Init
terraform init

# 2. Preview
terraform plan -var-file="terraform.tfvars"

# 3. Apply
terraform apply -var-file="terraform.tfvars"

# 4. Lihat output
terraform output
```

> **Simpan** `terraform.tfvars` di `.gitignore`. CI/CD inject variabel via env (`TF_VAR_db_password`, dll.).

---

## 6. Phase 3 — CI/CD Pipeline (GitHub Actions)

**Estimasi waktu**: 2 hari  
**Output**: Setiap `git push` ke `main` otomatis test → build → deploy.

### Prinsip Pipeline

```
git push → Actions trigger
                │
    ┌───────────┴──────────────┐
    ▼                          ▼
test (lint + Vitest)     Playwright E2E (staging)
    │
    ▼ (merge ke main)
build Docker image
    │
    ▼
push ke ECR
    │
    ▼
deploy ECS (rolling update)
    │
    ▼
smoke test production
```

### Setup GitHub Secrets

| Secret           | Nilai                                  |
| ---------------- | -------------------------------------- |
| `AWS_ROLE_ARN`   | ARN IAM Role OIDC untuk GitHub Actions |
| `AWS_REGION`     | `ap-southeast-1`                       |
| `ECR_REPOSITORY` | URL ECR repo                           |
| `ECS_CLUSTER`    | Nama cluster ECS                       |
| `ECS_SERVICE`    | Nama service ECS                       |
| `DOCS_S3_BUCKET` | Nama bucket MDX docs                   |

### OIDC (Tanpa Static Credential)

```hcl
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "${var.project_name}-github-actions-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringLike = {
          "token.actions.githubusercontent.com:sub" =
            "repo:YOUR_USERNAME/YOUR_REPO:*"
        }
      }
    }]
  })
}
```

### `.github/workflows/deploy.yml`

```yaml
name: Test, Build & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  id-token: write
  contents: read
  pull-requests: write

jobs:
  test:
    name: Lint + Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit

  build-deploy:
    name: Build Image & Deploy
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build & Push Image
        run: |
          IMAGE="${{ secrets.ECR_REPOSITORY }}:${{ github.sha }}"
          docker build -t "$IMAGE" .
          docker push "$IMAGE"
          echo "IMAGE=$IMAGE" >> $GITHUB_ENV

      - name: Seed docs S3 (hanya jika ada perubahan di content/docs)
        run: |
          aws s3 sync ./content/docs s3://${{ secrets.DOCS_S3_BUCKET }} --delete

      - name: Deploy ECS
        run: |
          aws ecs update-service \
            --cluster ${{ secrets.ECS_CLUSTER }} \
            --service ${{ secrets.ECS_SERVICE }} \
            --force-new-deployment

      - name: Wait healthy
        run: |
          aws ecs wait services-stable \
            --cluster ${{ secrets.ECS_CLUSTER }} \
            --services ${{ secrets.ECS_SERVICE }}

      - name: Smoke test
        run: |
          ALB_URL="${{ secrets.ALB_URL }}"
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ALB_URL/api/health")
          [ "$STATUS" = "200" ] || (echo "Smoke test FAILED: HTTP $STATUS" && exit 1)
          echo "Smoke test OK"
```

---

## 7. Phase 4 — Security & Production Hardening

**Estimasi waktu**: 1–2 hari

### Checklist Security

| Area           | Implementasi                                             | Status    |
| -------------- | -------------------------------------------------------- | --------- |
| IAM            | Least privilege task role (S3 + Secrets Manager only)    | Wajib     |
| Secrets        | DATABASE_URL, NEXTAUTH_SECRET, Gemini di Secrets Manager | Wajib     |
| S3 MDX         | Block public access + enkripsi AES-256                   | Wajib     |
| ALB            | HTTPS only, redirect HTTP → HTTPS                        | Wajib     |
| RDS            | Private subnet, security group strict (hanya dari ECS)   | Wajib     |
| Auth           | NextAuth admin-only untuk edit/save/delete               | Sudah ada |
| Path traversal | `normalizeDocRelKey` menolak `..` sebelum ke storage     | Sudah ada |
| Logging        | Tidak log `GEMINI_API_KEY`, password, session token      | Wajib     |
| WAF            | Basic OWASP rule set via AWS WAF (opsional)              | Opsional  |

### Logging Aman (contoh)

```typescript
// src/lib/docs-revalidate.ts — tidak ada secret di sini
// Semua secret hanya di env/container; tidak di log

const SENSITIVE_FIELDS = ["apiKey", "password", "token", "secret"];
function sanitizeForLog(obj: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      SENSITIVE_FIELDS.some((f) => k.toLowerCase().includes(f))
        ? "[REDACTED]"
        : v,
    ]),
  );
}
```

### Rate Limit AI Endpoint

Tambahkan middleware pada `/api/ai-enhance`:

```typescript
// Contoh sederhana in-memory (per instance); untuk multi-instance: DynamoDB counter
const rateLimitMap = new Map<string, { count: number; window: number }>();
const LIMIT = 10; // per menit per IP/user

function isRateLimited(key: string): boolean {
  const now = Math.floor(Date.now() / 60000);
  const entry = rateLimitMap.get(key);
  if (!entry || entry.window !== now) {
    rateLimitMap.set(key, { count: 1, window: now });
    return false;
  }
  if (entry.count >= LIMIT) return true;
  entry.count++;
  return false;
}
```

---

## 8. Phase 5 — Testing Strategy (QA Showcase)

**Estimasi waktu**: 3–4 hari  
**Coverage target**: Minimal 80% untuk logika kritis.

### Piramida Testing

```
         ▲
        / \
       /   \      E2E — Playwright
      /     \     · Login → buka editor → simpan MDX → verifikasi
     /───────\
    /         \   Integration — Vitest + fetch mock
   /           \  · POST /api/save-file, /api/files, /api/docs/count
  /─────────────\
 /               \ Unit — Vitest
/─────────────────\ · normalizeDocRelKey, buildDocsFileTree, mdx-utils
```

### Setup Unit & Integration (Vitest)

```bash
npm install -D vitest @vitest/coverage-v8
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    coverage: { provider: "v8", threshold: { lines: 80 } },
  },
});
```

```typescript
// scripts/verify-docs-storage.ts — sudah ada, jalankan via:
// npm run verify:docs-storage
```

**Skenario kritis:**

```typescript
// tests/unit/docs-storage-keys.test.ts
import { normalizeDocRelKey, isFolderKeepKey } from "@/lib/docs-storage/keys";

test("menolak path traversal", () => {
  expect(() => normalizeDocRelKey("../evil")).toThrow();
});

test("normalise backslash jadi posix", () => {
  expect(normalizeDocRelKey("a\\b.mdx")).toBe("a/b.mdx");
});

test("mengenali .keep marker", () => {
  expect(isFolderKeepKey("guide/.keep")).toBe(true);
  expect(isFolderKeepKey("guide/page.mdx")).toBe(false);
});
```

### Setup E2E (Playwright)

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// tests/e2e/editor.spec.ts
import { test, expect } from "@playwright/test";

test("admin dapat buat dan lihat dokumen baru", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', process.env.SEED_ADMIN_EMAIL!);
  await page.fill('[name="password"]', process.env.SEED_ADMIN_PASSWORD!);
  await page.click('button[type="submit"]');

  await page.goto("/editor/create");
  await page.fill('[data-testid="title-input"]', "Test Halaman E2E");
  await page.click('[data-testid="save-btn"]');
  await expect(page.locator("text=Test Halaman E2E")).toBeVisible();
});
```

### Manual Testing Checklist

```markdown
## Auth

- [ ] Login admin valid → masuk dashboard
- [ ] Login salah password → error jelas
- [ ] Akses /editor tanpa login → redirect /login

## CRUD MDX

- [ ] Buat dokumen baru → muncul di /docs
- [ ] Edit konten → perubahan tampil tanpa rebuild image
- [ ] Hapus dokumen → hilang dari sidebar
- [ ] Rename/pindah folder → path URL ikut berubah

## AI Feature

- [ ] Enhance teks → Gemini memberikan respons
- [ ] Prompt kosong → error yang jelas
- [ ] Hit >10x/menit → 429 rate limit

## Security

- [ ] Coba akses S3 bucket langsung → 403
- [ ] Path `../../etc/passwd` di filePath API → 403
- [ ] Request save tanpa auth → 401

## Performance

- [ ] Halaman /docs load < 2 detik (warm request)
- [ ] Simpan dokumen → halaman update tanpa full reload
```

---

## 9. Monitoring & Observability

### CloudWatch Log Groups

```hcl
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}-${var.environment}"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "alb" {
  name              = "/alb/${var.project_name}-${var.environment}"
  retention_in_days = 7
}
```

### CloudWatch Alarms

```hcl
# ALB 5xx error rate > 5%
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.project_name}-alb-5xx-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_actions       = [aws_sns_topic.alerts.arn]
}

# ECS task CPU > 80%
resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "${var.project_name}-ecs-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }
}

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${var.environment}"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "your-email@gmail.com"
}
```

### CloudWatch Logs Insights

```sql
-- Error pada API docs
fields @timestamp, @message
| filter @message like /ERROR/
| filter @log like /ecs/
| sort @timestamp desc
| limit 20

-- Latency tinggi
fields @timestamp, @message
| filter @message like /save-file/
| parse @message "duration=*ms" as latency
| stats avg(latency) as avgMs
```

---

## 10. Cost Management & Free Tier Guard

### Estimasi Biaya Bulanan (portfolio/dev)

| Service             | Free Tier / Catatan           | Estimasi Usage        | Biaya             |
| ------------------- | ----------------------------- | --------------------- | ----------------- |
| ECS Fargate         | Tidak ada free tier           | 0.25 vCPU, 0.5 GB RAM | ~$5–10/bulan      |
| RDS db.t3.micro     | 750 jam/bulan free (12 bulan) | 1 instance            | $0 (free tier)    |
| S3 Docs             | 5 GB, 20K GET free            | ~50 MB, ~500 req      | $0                |
| ALB                 | Tidak ada free tier           | ~$16/bulan minimum    | ~$16              |
| CloudWatch Logs     | 5 GB ingest free              | ~100 MB               | $0                |
| ECR                 | 500 MB/bulan free             | ~200 MB               | $0                |
| Secrets Manager     | $0.40/secret/bulan            | 1 secret              | ~$0.40            |
| **Total perkiraan** |                               |                       | **~$20–30/bulan** |

> **Tip**: Untuk menghemat: gunakan **App Runner** ($0 saat tidak ada traffic) sebagai alternatif ALB + ECS; atau matikan ECS service saat tidak dipakai.

### Budget Alert

```hcl
resource "aws_budgets_budget" "monthly" {
  name         = "${var.project_name}-budget"
  budget_type  = "COST"
  limit_amount = "35"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["your-email@gmail.com"]
  }
}
```

---

## 11. Rollout & Maintenance Plan

### Deploy Sequence

```
1. terraform apply (IaC) → dev environment
2. aws s3 sync content/docs → bucket docs
3. prisma migrate deploy → RDS
4. docker build + push ECR
5. ECS rolling update
6. Smoke test /api/health
7. Manual testing checklist
8. Approval → pipeline prod (jika ada multi-env)
9. Monitor CloudWatch 15 menit pertama
```

### Rollback Procedures

```bash
# Rollback ECS ke image sebelumnya
aws ecs update-service \
  --cluster CLUSTER_NAME \
  --service SERVICE_NAME \
  --task-definition TASK_DEF_ARN_PREVIOUS

# Rollback MDX docs ke S3 versi sebelumnya (jika versioning enabled)
aws s3api list-object-versions --bucket BUCKET --prefix path/ke/file.mdx
aws s3api get-object --bucket BUCKET --key path/ke/file.mdx \
  --version-id VERSION_ID restored-file.mdx

# Rollback Terraform
terraform state list
terraform apply -target=aws_ecs_service.app -var-file="terraform.tfvars"
```

### Future Improvements (Roadmap)

| Priority | Feature                          | Catatan                                             |
| -------- | -------------------------------- | --------------------------------------------------- |
| High     | Playwright E2E di CI             | Jalan saat staging deploy                           |
| Medium   | App Runner sebagai alternatif    | Lebih murah untuk portfolio, scale to zero          |
| Medium   | S3 versioning untuk rollback MDX | Sudah diaktifkan di Terraform, tinggal pakai        |
| Low      | OpenSearch / full-text search    | Search MDX content lebih powerful dari string match |
| Low      | AWS X-Ray                        | Distributed tracing per request                     |
| Low      | Cognito                          | Jika ingin multi-user publik (saat ini admin only)  |

---

## 12. Local Development Setup

```bash
# Prerequisites
node --version    # >= 20.x
terraform --version  # >= 1.6.0
aws --version     # >= 2.x (untuk sync S3 saat dev dengan DOCS_STORAGE=s3)

# 1. Clone repo
git clone https://github.com/YOUR_USERNAME/cys-fumadocs
cd cys-fumadocs

# 2. Install dependencies
npm install

# 3. Setup env
cp .env.example .env.local
# Edit .env.local — isi DATABASE_URL, NEXTAUTH_SECRET, dll.

# 4. Setup database lokal
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=wiki -e POSTGRES_USER=wiki -e POSTGRES_DB=wiki postgres:16
npm run db:migrate
npm run db:seed

# 5. Jalankan dev server
npm run dev
```

### Environment Variables Lengkap

```bash
# === Database ===
DATABASE_URL=postgresql://wiki:wiki@localhost:5432/wiki?schema=public

# === NextAuth ===
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# === Docs Storage ===
# Lokal: tidak perlu diisi (default fs)
# DOCS_STORAGE=s3
# DOCS_S3_BUCKET=nama-bucket
# DOCS_S3_PREFIX=
# AWS_REGION=ap-southeast-1

# === AI (Gemini) ===
# AI_ENHANCE_ORDER=gemini
# GEMINI_API_KEY=
# GEMINI_AI_MODEL=gemini-2.0-flash-exp

# === Seed admin ===
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=changeme123

# === Runtime ===
NODE_ENV=development
TIMEZONE=Asia/Jakarta
```

---

## 13. Troubleshooting Guide

### ECS Task Restart Loop

**Symptom**: Task terus restart, health check gagal.  
**Fix**:

```bash
# Cek log task
aws logs get-log-events \
  --log-group-name "/ecs/any-documentation-dev" \
  --log-stream-name "ecs/app/TASK_ID" \
  --limit 50

# Cek env yang hilang (mis. DATABASE_URL tidak di-inject)
aws ecs describe-task-definition --task-definition any-documentation-dev \
  | jq '.taskDefinition.containerDefinitions[].environment'
```

### RDS Connection Refused

**Symptom**: `Can't reach database server`.  
**Cause**: Security group tidak allow dari ECS security group, atau DATABASE_URL salah.  
**Fix**: Pastikan inbound RDS SG mengizinkan port 5432 dari SG ECS task.

### Gemini API Error 429

**Symptom**: `429 Too Many Requests` dari Gemini.  
**Fix**:

```bash
# Ganti ke model yang lebih hemat quota
GEMINI_AI_MODEL=gemini-1.5-flash-8b

# Monitor: https://aistudio.google.com/app/apikey
```

### Konten MDX Tidak Update Setelah Simpan

**Symptom**: Simpan via editor tapi halaman `/docs/...` masih lama.  
**Cause**: Revalidasi gagal, atau akses S3 gagal (IAM).  
**Fix**:

```bash
# Cek log ECS: apakah save-file return 200?
# Cek IAM task role: apakah ada s3:PutObject?
aws iam simulate-principal-policy \
  --policy-source-arn TASK_ROLE_ARN \
  --action-names s3:PutObject \
  --resource-arns "arn:aws:s3:::BUCKET/*"
```

### Terraform State Conflict

**Symptom**: `Error: state is locked`.  
**Fix**:

```bash
terraform force-unlock <LOCK_ID>
```

---

## 14. Architecture Decision Records (ADR)

### ADR-001: Monolith Container vs Serverless Lambda

**Keputusan**: Monolith Next.js standalone di ECS Fargate  
**Alasan**: Aplikasi membutuhkan SSR dinamis (MDX live, NextAuth session, Prisma), satu unit deploy lebih mudah di-debug. Aplikasi ini bukan static site + API terpisah.  
**Tradeoff diterima**: Tidak ada free tier untuk ECS Fargate (biaya minimal ~$20/bulan); Lambda lebih murah tapi membutuhkan arsitektur terpisah yang tidak sesuai dengan Next.js App Router yang ada.

### ADR-002: RDS PostgreSQL vs DynamoDB

**Keputusan**: RDS PostgreSQL (via Prisma)  
**Alasan**: Data sudah relasional (User, LoginLog, FileLog); Prisma sudah terintegrasi; migrasi schema mudah; free tier db.t3.micro 12 bulan pertama.  
**Tradeoff diterima**: Perlu connection pooling (PgBouncer/RDS Proxy) jika scale banyak instance; untuk portfolio cukup dengan connection limit Prisma.

### ADR-003: S3 untuk MDX vs EFS

**Keputusan**: S3 (via abstraksi `DocsStorage`)  
**Alasan**: Lebih murah, lebih cloud-native, versioning built-in, tidak butuh NFS mount. Abstraksi memudahkan swap ke `fs` saat lokal.  
**Tradeoff diterima**: Folder kosong butuh marker `.keep`; tidak ada `rename` atomik di S3 (copy + delete).

### ADR-004: DocsStorage Abstraction

**Keputusan**: Interface terpusat dengan adapter `fs` dan `s3`  
**Alasan**: Satu perubahan env mengubah seluruh behavior storage tanpa mengubah kode bisnis. Developer lokal tetap pakai `fs`, prod pakai `s3`.  
**Tradeoff diterima**: Sedikit lebih verbose dari akses `fs` langsung; adapter S3 butuh `@aws-sdk/client-s3`.

### ADR-005: MDX Content Live vs Baked at Build

**Keputusan**: `force-dynamic` + baca dari storage per-request  
**Alasan**: Konten MDX bisa berubah lewat editor setelah image di-build; SSG tidak cocok.  
**Tradeoff diterima**: Setiap request ke `/docs` memerlukan S3 `GetObject` / `ListObjectsV2`; untuk situs dokumentasi kecil ini acceptable. `React.cache` meminimalkan duplikasi per-request.

### ADR-006: Terraform vs CDK

**Keputusan**: Terraform  
**Alasan**: Multi-cloud portable, industry standard di DevOps job market, komunitas mature.  
**Tradeoff diterima**: Lebih verbose dibanding CDK untuk resource container.

---

_Dokumen ini adalah living document — update setiap kali ada perubahan arsitektur atau keputusan teknis baru._
