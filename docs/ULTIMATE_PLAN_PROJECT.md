# any-documentation — Comprehensive Project Documentation

> **Stack**: Next.js 15 (App Router · Standalone) · Prisma · PostgreSQL (RDS) · AWS ECS Fargate · S3 (docs) · Gemini AI  
> **Target Role**: Cloud Engineer / DevOps Engineer / QA Engineer Portfolio Project  
> **Last Updated**: 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Tech Stack & Decision Log](#3-tech-stack--decision-log)
4. [Phase 1 — MDX document storage on S3](#4-phase-1--mdx-document-storage-on-s3)
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

**any-documentation** (Any Documentation) is an **MDX** documentation platform with a WYSIWYG editor, admin authentication, and optional **AI** (e.g. Gemini) to generate and improve content. It is designed as a **production-grade portfolio** showcasing Cloud Engineering, DevOps, and QA **end-to-end**.

### Goals

| Goal                | Detail                                                                   |
| ------------------- | ------------------------------------------------------------------------ |
| **Functional**      | CRUD MDX docs, live rendering, AI-assisted content via Gemini            |
| **Infrastructure**  | Monolithic Next.js on AWS ECS Fargate + RDS PostgreSQL + S3 for MDX docs |
| **DevOps**          | Automated CI/CD (GitHub Actions + OIDC), minimal manual deploy          |
| **Security**        | Least-privilege IAM, secrets in Secrets Manager, rate limiting, HTTPS   |
| **Observability**   | CloudWatch Logs, alarms, structured logging                              |
| **QA portfolio**    | Test pyramid: unit (Vitest) + E2E (Playwright) + manual checklist       |
| **Portfolio value** | Concrete Cloud / DevOps / QA skills for hiring portfolios               |

### Main architecture choice: monolith container (not a split serverless design)

The app runs as a **Next.js standalone container on ECS Fargate** — not static export + separate Lambda. Rationale:

- The app needs **dynamic SSR** (live MDX per request, NextAuth session, Prisma).
- **One deployable unit** is easier to debug, roll back, and explain.
- **Known trade-off**: you do not use the Lambda free tier, but the shape matches many **real production** Next.js deployments.

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

### Data flow: read docs page

```
Browser → ALB → ECS Task
                    │
                    ├─ getDynamicPage(slug) [force-dynamic]
                    ├─ getDocsStorage().getText(relKey)  ← S3 GetObject
                    ├─ parse MDX (gray-matter + MDXRemote)
                    └─ return rendered RSC
```

### Data flow: save / edit document (admin)

```
Browser → ALB → ECS Task → /api/save-file
                                │
                                ├─ getDocsStorage().putText(key, body)  ← S3 PutObject
                                ├─ revalidatePath / revalidateTag
                                └─ appendActivityLog → RDS
```

### Data flow: AI content enhancement

```
Browser → ALB → ECS Task → /api/ai-enhance
                                │
                                ├─ Read GEMINI_API_KEY from env (injected via Secrets Manager)
                                ├─ Call Gemini Flash API
                                └─ Return { enhancedContent }
```

---

## 3. Tech Stack & Decision Log

| Layer              | Choice                           | Rationale                                                                |
| ------------------ | -------------------------------- | ------------------------------------------------------------------------ |
| **Frontend/app**   | Next.js 15 App Router            | SSR + dynamic MDX rendering; simple monolith; standalone output          |
| **Database**       | PostgreSQL via Prisma            | Relational (User, LoginLog, FileLog); consistent schema; type-safe ORM   |
| **DB hosting**     | Amazon RDS PostgreSQL            | Managed backups, encryption, private VPC, Prisma-friendly               |
| **Compute**        | ECS Fargate                      | Serverless containers; no host management; scale-to-zero optional         |
| **Load balancer**  | ALB                              | HTTPS termination, health checks, optional sticky sessions                |
| **Docs storage**   | S3 (via `DocsStorage`)           | Durable MDX across tasks; optional versioning; encryption at rest         |
| **Secrets**        | Secrets Manager / SSM            | DATABASE_URL, NEXTAUTH_SECRET, Gemini key — not baked into images         |
| **IaC**            | Terraform                        | Reproducible, versioned, industry standard                                |
| **CI/CD**          | GitHub Actions + OIDC            | Native GitHub integration; no long-lived cloud keys in CI for public repos |
| **AI model**       | Gemini Flash / Flash-Lite        | Useful free tier; strong for content workflows                           |
| **Monitoring**     | CloudWatch                       | Native AWS; no extra vendor setup                                          |
| **Testing**        | Vitest + Playwright + manual     | Test pyramid for QA portfolio demos                                      |
| **Image Registry** | Amazon ECR                       | Private, native ECS integration, lifecycle policy                        |

---

## 4. Phase 1 — MDX document storage on S3

**Status:** Implemented  
**Deliverable:** `DocsStorage` abstraction with `fs` (local) and `s3` (AWS) adapters.

### Concept

All MDX reads/writes under `content/docs` go through a single interface (`DocsStorage`). The backend is selected via env:

- `DOCS_STORAGE=fs` — read/write local disk (default for dev)
- `DOCS_STORAGE=s3` — read/write S3 bucket (typical for ECS prod)

### Module layout

```
src/lib/docs-storage/
├── types.ts        # Interface DocsStorage
├── keys.ts         # Key normalization, path traversal checks, .keep marker
├── fs-storage.ts   # Filesystem implementation (dev / single instance)
├── s3-storage.ts   # S3 implementation (@aws-sdk/client-s3)
└── index.ts        # getDocsStorage() — singleton + env toggle
src/lib/
├── mdx-utils.ts        # getAllMDXFiles, getMDXFileBySlug — via DocsStorage
├── docs-file-tree.ts   # buildDocsFileTree — FS: readdir; S3: list keys
└── docs-revalidate.ts  # central revalidateDocsContent()
```

### Empty folders on S3

S3 has no real directories. When an admin creates a folder, a **marker object** `folder/.keep` (0 bytes) is written. The editor tree is derived from listing object keys and prefix rules.

### Environment variables

```bash
DOCS_STORAGE=s3
DOCS_S3_BUCKET=your-bucket-name
DOCS_S3_PREFIX=          # optional, e.g. wiki-docs/
AWS_REGION=ap-southeast-1
```

### IAM task role (example)

```json
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject",
    "s3:ListBucket"
  ],
  "Resource": ["arn:aws:s3:::YOUR_BUCKET", "arn:aws:s3:::YOUR_BUCKET/*"]
}
```

### Initial bucket seed

```bash
export DOCS_S3_BUCKET=your-bucket-name
./scripts/sync-content-docs-to-s3.sh
# or: aws s3 sync ./content/docs s3://BUCKET_NAME/PREFIX --delete
```

---

## 5. Phase 2 — Infrastructure as Code (Terraform)

**Estimated effort:** 2–3 days  
**Deliverable:** All AWS resources provisioned in a reproducible, versioned way.

### Directory layout

```
infrastructure/
├── main.tf              # Provider, remote state, resource utama
├── variables.tf         # Input variables
├── terraform.tfvars     # Actual values (gitignored)
├── outputs.tf           # Outputs: ALB URL, ECR repo, etc.
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
  description = "Prefix for all AWS resources"
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

### Core resources

```hcl
# ECR — image registry
resource "aws_ecr_repository" "app" {
  name                 = "${var.project_name}-${var.environment}"
  image_tag_mutability = "MUTABLE"
  lifecycle_policy {
    # Keep only the last 10 images
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
  deletion_protection    = false  # set true in real production
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

### Execution order

```bash
# 1. Init
terraform init

# 2. Preview
terraform plan -var-file="terraform.tfvars"

# 3. Apply
terraform apply -var-file="terraform.tfvars"

# 4. Show outputs
terraform output
```

> **Keep** `terraform.tfvars` out of git (`.gitignore`). In CI/CD, inject variables via env (`TF_VAR_db_password`, etc.).

---

## 6. Phase 3 — CI/CD Pipeline (GitHub Actions)

**Estimated time:** 2 days  
**Deliverable:** Each `git push` to `main` runs test → build → deploy.

### Pipeline flow

```
git push → Actions trigger
                │
    ┌───────────┴──────────────┐
    ▼                          ▼
test (lint + Vitest)     Playwright E2E (staging)
    │
    ▼ (merge to main)
build Docker image
    │
    ▼
push to ECR
    │
    ▼
deploy ECS (rolling update)
    │
    ▼
smoke test production
```

### Setup GitHub Secrets

| Secret             | Value                                   |
| ------------------ | --------------------------------------- |
| `AWS_ROLE_ARN`     | IAM role ARN (OIDC) for GitHub Actions |
| `AWS_REGION`       | `ap-southeast-1`                        |
| `ECR_REPOSITORY`   | ECR repository URL                     |
| `ECS_CLUSTER`      | ECS cluster name                       |
| `ECS_SERVICE`      | ECS service name                       |
| `DOCS_S3_BUCKET`   | MDX docs S3 bucket name                |

### OIDC (no long-lived static credentials)

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

      - name: Seed docs S3 (when content/docs changes in the commit)
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
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ALB_URL/")
          [ "$STATUS" = "200" ] || (echo "Smoke test FAILED: HTTP $STATUS" && exit 1)
          echo "Smoke test OK"
```

---

## 7. Phase 4 — Security & Production Hardening

**Estimated time:** 1–2 days

### Security checklist

| Area           | Implementation                                           | Status    |
| -------------- | -------------------------------------------------------- | --------- |
| IAM            | Least-privilege task role (S3 + Secrets Manager only)    | Required |
| Secrets        | DATABASE_URL, NEXTAUTH_SECRET, Gemini in Secrets Manager | Required |
| S3 MDX         | Block public access + AES-256 encryption                  | Required |
| ALB            | HTTPS only, redirect HTTP → HTTPS                         | Required |
| RDS            | Private subnet; strict SG (only from ECS)                  | Required |
| Auth           | NextAuth: admin-only for edit/save/delete                 | In place |
| Path traversal | `normalizeDocRelKey` rejects `..` before storage I/O       | In place |
| Logging        | Never log `GEMINI_API_KEY`, passwords, or session tokens   | Required |
| WAF            | Basic OWASP rule set via AWS WAF                          | Optional |

### Safe logging (example)

```typescript
// src/lib/docs-revalidate.ts — no secrets in this module
// All secrets live in env / container; do not log them

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

Add middleware / guards on `/api/ai-enhance`:

```typescript
// Simple in-memory example per instance; for multi-instance consider DynamoDB / Redis
const rateLimitMap = new Map<string, { count: number; window: number }>();
const LIMIT = 10; // per minute per IP/user

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

**Estimated time:** 3–4 days  
**Coverage target:** At least ~80% for critical logic.

### Test pyramid

```
         ▲
        / \
       /   \      E2E — Playwright
      /     \     · Login → open editor → save MDX → verify
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
// scripts/verify-docs-storage.ts — already in repo; run via:
// npm run verify:docs-storage
```

**Skenario kritis:**

```typescript
// tests/unit/docs-storage-keys.test.ts
import { normalizeDocRelKey, isFolderKeepKey } from "@/lib/docs-storage/keys";

test("menolak path traversal", () => {
  expect(() => normalizeDocRelKey("../evil")).toThrow();
});

test("normalise backslash to posix", () => {
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

test("admin can create and view a new document", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', process.env.SEED_ADMIN_EMAIL!);
  await page.fill('[name="password"]', process.env.SEED_ADMIN_PASSWORD!);
  await page.click('button[type="submit"]');

  await page.goto("/editor/create");
  await page.fill('[data-testid="title-input"]', "E2E Test Page");
  await page.click('[data-testid="save-btn"]');
  await expect(page.locator("text=E2E Test Page")).toBeVisible();
});
```

### Manual Testing Checklist

```markdown
## Auth

- [ ] Valid admin login → lands on dashboard
- [ ] Wrong password → clear error message
- [ ] Visit /editor while logged out → redirect to /login

## CRUD MDX

- [ ] Create document → appears under /docs
- [ ] Edit content → changes visible without rebuilding the image
- [ ] Delete document → removed from sidebar
- [ ] Rename/move folder → URL path updates accordingly

## AI Feature

- [ ] Enhance text → Gemini returns a response
- [ ] Empty AI prompt → clear validation error
- [ ] More than 10 requests/minute → 429 rate limit

## Security

- [ ] Direct S3 bucket access without IAM → 403
- [ ] Path `../../etc/passwd` in filePath API → 403
- [ ] Save request without auth → 401

## Performance

- [ ] /docs loads in under 2s (warm request)
- [ ] Save document → page refreshes content without full reload
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
-- API errors on docs routes
fields @timestamp, @message
| filter @message like /ERROR/
| filter @log like /ecs/
| sort @timestamp desc
| limit 20

-- High latency (save-file)
fields @timestamp, @message
| filter @message like /save-file/
| parse @message "duration=*ms" as latency
| stats avg(latency) as avgMs
```

---

## 10. Cost Management & Free Tier Guard

### Rough monthly cost (portfolio / dev)

| Service             | Free tier / notes              | Typical usage         | Est. cost         |
| ------------------- | ------------------------------ | --------------------- | ----------------- |
| ECS Fargate         | No free tier                   | 0.25 vCPU, 0.5 GB RAM | ~$5–10/mo        |
| RDS db.t3.micro     | 750 hrs/mo (first 12 months)   | 1 instance            | $0 (free tier)    |
| S3 Docs             | 5 GB, 20K GET free             | ~50 MB, ~500 req      | $0                |
| ALB                 | No free tier                   | ~$16/mo minimum       | ~$16              |
| CloudWatch Logs     | 5 GB ingest free               | ~100 MB               | $0                |
| ECR                 | 500 MB/mo free                 | ~200 MB               | $0                |
| Secrets Manager     | ~$0.40/secret/mo               | 1 secret              | ~$0.40            |
| **Total (rough)**   |                                |                       | **~$20–30/mo**   |

> **Tip:** To save cost, consider **App Runner** (~$0 when idle) instead of ALB + ECS, or stop the ECS service when not in use.

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
6. Smoke test a public URL (e.g. `/` or `/docs`; align with your ALB health path)
7. Manual testing checklist
8. Approval → promote to prod pipeline (if you use multiple environments)
9. Watch CloudWatch for the first 15 minutes
```

### Rollback Procedures

```bash
# Roll back ECS to the previous task image
aws ecs update-service \
  --cluster CLUSTER_NAME \
  --service SERVICE_NAME \
  --task-definition TASK_DEF_ARN_PREVIOUS

# Roll back MDX in S3 to a prior version (if versioning is enabled)
aws s3api list-object-versions --bucket BUCKET --prefix path/to/file.mdx
aws s3api get-object --bucket BUCKET --key path/to/file.mdx \
  --version-id VERSION_ID restored-file.mdx

# Roll back Terraform (targeted apply)
terraform state list
terraform apply -target=aws_ecs_service.app -var-file="terraform.tfvars"
```

### Future Improvements (Roadmap)

| Priority | Feature                          | Notes                                                |
| -------- | -------------------------------- | ---------------------------------------------------- |
| High     | Playwright E2E in CI             | Run after staging deploy                              |
| Medium   | App Runner instead of ALB+ECS   | Often cheaper for portfolios; scale to zero          |
| Medium   | S3 versioning for MDX rollback  | Enable in Terraform; use object versions             |
| Low      | OpenSearch / full-text search   | Stronger than linear string scan for content search  |
| Low      | AWS X-Ray                        | Distributed tracing per request                       |
| Low      | Cognito                          | If you need public multi-user auth (today: admin-focused) |

---

## 12. Local Development Setup

```bash
# Prerequisites
node --version    # >= 20.x
terraform --version  # >= 1.6.0
aws --version     # >= 2.x (useful for S3 sync in dev with DOCS_STORAGE=s3)

# 1. Clone repo
git clone https://github.com/YOUR_USERNAME/cys-fumadocs
cd cys-fumadocs

# 2. Install dependencies
npm install

# 3. Setup env
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL, NEXTAUTH_SECRET, etc.

# 4. Local database
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=wiki -e POSTGRES_USER=wiki -e POSTGRES_DB=wiki postgres:16
npm run db:migrate
npm run db:seed

# 5. Dev server
npm run dev
```

### Full environment variable list

```bash
# === Database ===
DATABASE_URL=postgresql://wiki:wiki@localhost:5432/wiki?schema=public

# === NextAuth ===
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# === Docs Storage ===
# Local dev: leave unset (defaults to fs)
# DOCS_STORAGE=s3
# DOCS_S3_BUCKET=your-bucket-name
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

**Symptom:** Task keeps restarting; health checks fail.  
**Fix:**

```bash
# Read task logs
aws logs get-log-events \
  --log-group-name "/ecs/any-documentation-dev" \
  --log-stream-name "ecs/app/TASK_ID" \
  --limit 50

# Check for missing env (e.g. DATABASE_URL not injected)
aws ecs describe-task-definition --task-definition any-documentation-dev \
  | jq '.taskDefinition.containerDefinitions[].environment'
```

### RDS Connection Refused

**Symptom:** `Can't reach database server`.  
**Cause:** RDS security group does not allow the ECS task SG, or `DATABASE_URL` is wrong.  
**Fix:** Allow inbound TCP **5432** on RDS from the ECS task security group.

### Gemini API Error 429

**Symptom:** `429 Too Many Requests` from Gemini.  
**Fix:**

```bash
# Switch to a more quota-friendly model
GEMINI_AI_MODEL=gemini-1.5-flash-8b

# Monitor: https://aistudio.google.com/app/apikey
```

### MDX content not updating after save

**Symptom:** Saved via editor but `/docs/...` still shows stale content.  
**Cause:** Revalidation failed, or S3 access failed (IAM).  
**Fix:**

```bash
# ECS logs: does save-file return 200?
# IAM task role: does it include s3:PutObject?
aws iam simulate-principal-policy \
  --policy-source-arn TASK_ROLE_ARN \
  --action-names s3:PutObject \
  --resource-arns "arn:aws:s3:::BUCKET/*"
```

### Terraform State Conflict

**Symptom:** `Error: state is locked`.  
**Fix:**

```bash
terraform force-unlock <LOCK_ID>
```

---

## 14. Architecture Decision Records (ADR)

### ADR-001: Monolith Container vs Serverless Lambda

**Decision:** Monolithic Next.js standalone on ECS Fargate  
**Reason:** The app needs dynamic SSR (live MDX, NextAuth, Prisma); one deploy unit is easier to operate. This is not a static site + separate API split.  
**Trade-off accepted:** No Fargate free tier (~minimal monthly cost); Lambda can be cheaper but forces a different architecture than this App Router app.

### ADR-002: RDS PostgreSQL vs DynamoDB

**Decision:** RDS PostgreSQL (via Prisma)  
**Reason:** Data is relational (User, LoginLog, FileLog); Prisma is already integrated; schema migrations are straightforward; RDS free tier can cover early dev.  
**Trade-off accepted:** Add pooling (PgBouncer / RDS Proxy) if you scale out tasks; for a portfolio, Prisma limits often suffice.

### ADR-003: S3 for MDX vs EFS

**Decision:** S3 (via `DocsStorage` abstraction)  
**Reason:** Cost-effective, cloud-native, optional versioning, no NFS mount. The abstraction keeps local `fs` dev simple.  
**Trade-off accepted:** Empty folders need `.keep` markers; S3 has no atomic rename (copy + delete).

### ADR-004: DocsStorage Abstraction

**Decision:** Central interface with `fs` and `s3` adapters  
**Reason:** Flip storage behavior with env only; local dev stays on `fs`, production on `s3`.  
**Trade-off accepted:** Slightly more code than raw `fs`; S3 path needs `@aws-sdk/client-s3`.

### ADR-005: MDX Content Live vs Baked at Build

**Decision:** `force-dynamic` + read from storage per request  
**Reason:** MDX can change via the editor after the image is built; full SSG is a poor fit.  
**Trade-off accepted:** Each `/docs` request may hit S3 (`GetObject` / `ListObjectsV2`); acceptable for small doc sites. `React.cache` limits duplicate work per request.

### ADR-006: Terraform vs CDK

**Decision:** Terraform  
**Reason:** Portable across clouds, common in DevOps hiring, mature ecosystem.  
**Trade-off accepted:** More verbose than CDK for some container resources.

---

_This is a living document — update it whenever architecture or major technical decisions change._

> **Language:** Keep this document in **English** for consistency with the rest of the repo docs.
