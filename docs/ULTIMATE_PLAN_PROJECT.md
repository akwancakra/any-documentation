# SmartDocs MDX — Comprehensive Project Documentation

> **Stack**: Next.js 14 (App Router) · Node.js (Express/Fastify) · AWS Serverless · Gemini AI  
> **Target Role**: Cloud Engineer / DevOps Engineer Portfolio Project  
> **Last Updated**: 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Tech Stack & Decision Log](#3-tech-stack--decision-log)
4. [Phase 1 — Infrastructure as Code (Terraform)](#4-phase-1--infrastructure-as-code-terraform)
5. [Phase 2 — CI/CD Pipeline (GitHub Actions)](#5-phase-2--cicd-pipeline-github-actions)
6. [Phase 3 — Security & Production Hardening](#6-phase-3--security--production-hardening)
7. [Phase 4 — Testing Strategy](#7-phase-4--testing-strategy)
8. [Monitoring & Observability](#8-monitoring--observability)
9. [Cost Management & Free Tier Guard](#9-cost-management--free-tier-guard)
10. [Rollout & Maintenance Plan](#10-rollout--maintenance-plan)
11. [Local Development Setup](#11-local-development-setup)
12. [Troubleshooting Guide](#12-troubleshooting-guide)

---

## 1. Project Overview

SmartDocs MDX adalah platform dokumentasi berbasis MDX yang ditenagai Gemini AI untuk fitur generate dan improve content. Project ini dirancang sebagai **production-grade portfolio** yang membuktikan kemampuan Cloud Engineering dan DevOps secara end-to-end — bukan sekadar aplikasi biasa, tapi sistem dengan IaC, CI/CD pipeline, security layer, observability, dan automated testing.

### Goals

| Goal                | Detail                                                     |
| ------------------- | ---------------------------------------------------------- |
| **Functional**      | CRUD dokumen MDX, AI-powered content generation via Gemini |
| **Infrastructure**  | 100% serverless di AWS, eligible free tier selamanya       |
| **DevOps**          | Pipeline CI/CD otomatis, zero manual deployment            |
| **Security**        | Least privilege IAM, secrets management, rate limiting     |
| **Observability**   | CloudWatch dashboard, alarms, dan structured logging       |
| **Portfolio Value** | Demonstrasi nyata skill Cloud/DevOps ke recruiter          |

### Why Serverless?

> **Tradeoff yang disadari, bukan dipaksakan.**

- **Pros**: Lambda 1 juta request/bulan gratis selamanya, auto-scale tanpa server management, biaya hampir nol untuk personal/portfolio use.
- **Cons**: Cold start Lambda 200–500ms pertama (dapat dimitigasi dengan Provisioned Concurrency jika diperlukan nanti).
- **Counterpoint**: ECS/Fargate lebih mahal dan butuh lebih banyak management overhead — tidak efisien untuk tahap ini.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER / BROWSER                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              CloudFront (CDN — Global Edge)                  │
│         Free Tier: 1 TB transfer/bulan                       │
└──────────┬──────────────────────────┬───────────────────────┘
           │ Static Assets            │ API calls
           ▼                          ▼
┌──────────────────┐      ┌──────────────────────────────────┐
│   S3 Bucket      │      │       API Gateway (HTTP API)      │
│  (Static Site)   │      │   throttling + CORS + WAF basic   │
│  Next.js export  │      └──────────────┬───────────────────┘
└──────────────────┘                     │
                                         ▼
                          ┌──────────────────────────────────┐
                          │         AWS Lambda               │
                          │  ┌────────────────────────────┐  │
                          │  │  fn: mdx-crud              │  │
                          │  │  (Node.js/Express handler) │  │
                          │  │  · Create/Read/Update/Delete│  │
                          │  │  · MDX parse & validate    │  │
                          │  │  · Version history logic   │  │
                          │  └────────────────────────────┘  │
                          │  ┌────────────────────────────┐  │
                          │  │  fn: gemini-generate       │  │
                          │  │  · Prompt construction     │  │
                          │  │  · Rate limit guard        │  │
                          │  │  · Error fallback logic    │  │
                          │  └────────────────────────────┘  │
                          └──────────┬───────────────────────┘
                                     │
               ┌─────────────────────┼──────────────────────┐
               ▼                     ▼                        ▼
┌──────────────────┐   ┌─────────────────────┐  ┌──────────────────────┐
│   S3 Bucket      │   │   DynamoDB Table    │  │  SSM Parameter Store │
│  (MDX Storage)   │   │   (Metadata)        │  │  GEMINI_API_KEY      │
│  · Versioning ON │   │   PK: docId         │  │  (SecureString)      │
│  · Encrypted     │   │   SK: version       │  └──────────────────────┘
│  · Private       │   │   GSI: tags, author │
└──────────────────┘   └─────────────────────┘

Monitoring Layer:
CloudWatch Logs → CloudWatch Metrics → CloudWatch Alarms → SNS (email alert)
```

### Data Flow: Create/Update MDX Document

```
Client → API Gateway → Lambda (mdx-crud)
                           │
                           ├─ Validate MDX content
                           ├─ Write .mdx file → S3 (mdx-storage bucket)
                           ├─ Write metadata → DynamoDB
                           └─ Return { docId, version, url }
```

### Data Flow: AI Generate Content

```
Client → API Gateway → Lambda (gemini-generate)
                           │
                           ├─ Read GEMINI_API_KEY dari SSM
                           ├─ Check rate limit (custom counter di DynamoDB)
                           ├─ Call Gemini Flash API
                           ├─ Parse response
                           └─ Return { generatedContent, tokensUsed }
```

---

## 3. Tech Stack & Decision Log

| Layer               | Pilihan                                    | Alasan                                                            |
| ------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| **Frontend**        | Next.js 14 App Router                      | SSG/SSR built-in, optimal untuk MDX rendering, SEO-friendly       |
| **Backend Runtime** | Node.js 20.x                               | Same language dengan frontend, ecosystem Lambda mature            |
| **API Framework**   | Express (via `@vendia/serverless-express`) | Familiar, mudah diportasi ke Lambda handler                       |
| **IaC**             | Terraform                                  | Repeatable, versioned, industry standard untuk DevOps portfolio   |
| **CI/CD**           | GitHub Actions                             | Native GitHub integration, OIDC support, gratis untuk public repo |
| **Compute**         | AWS Lambda                                 | Serverless, free tier 1M req/bulan                                |
| **CDN**             | CloudFront                                 | 1TB transfer gratis, global edge, Origin Access Control           |
| **Storage**         | S3                                         | MDX files + static site, virtually unlimited, murah               |
| **Database**        | DynamoDB                                   | Serverless, free tier 25GB, no connection pool issue di Lambda    |
| **Secrets**         | SSM Parameter Store                        | Gratis (Standard tier), integrated IAM, lebih aman dari env var   |
| **AI Model**        | Gemini Flash (Flash-Lite)                  | Free tier, cukup powerful untuk doc generation                    |
| **Monitoring**      | CloudWatch                                 | Native AWS, zero setup tambahan                                   |

---

## 4. Phase 1 — Infrastructure as Code (Terraform)

**Estimasi waktu**: 2–3 hari  
**Output**: Semua AWS resource terprovision secara reproducible dan versioned.

### Struktur Folder

```
infrastructure/
├── main.tf              # Resource definitions
├── variables.tf         # Input variable declarations
├── terraform.tfvars     # Actual values (gitignored untuk secrets)
├── outputs.tf           # Output values (API URL, CloudFront domain, dll)
├── modules/
│   ├── lambda/          # Lambda + IAM role
│   ├── storage/         # S3 + DynamoDB
│   ├── cdn/             # CloudFront + OAC
│   └── api/             # API Gateway
└── .terraform.lock.hcl  # Provider lock file (di-commit ke repo)
```

### `variables.tf`

```hcl
variable "project_name" {
  description = "Project name prefix untuk semua resource"
  type        = string
  default     = "smartdocs-mdx"
}

variable "aws_region" {
  description = "AWS region deployment"
  type        = string
  default     = "ap-southeast-1" # Singapore, paling dekat dari Indonesia
}

variable "environment" {
  description = "dev atau prod"
  type        = string
  default     = "dev"
}

variable "gemini_api_key" {
  description = "Google Gemini API Key"
  type        = string
  sensitive   = true # Tidak di-print di terraform output
}
```

### `main.tf` — Core Resources

```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state di S3 (buat bucket ini manual sekali saja)
  backend "s3" {
    bucket = "smartdocs-terraform-state"
    key    = "infra/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ─────────────────────────────────────────────
# S3 — Static Frontend (Next.js Export)
# ─────────────────────────────────────────────
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${var.environment}"
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─────────────────────────────────────────────
# S3 — MDX File Storage
# ─────────────────────────────────────────────
resource "aws_s3_bucket" "mdx_storage" {
  bucket = "${var.project_name}-mdx-${var.environment}"
}

resource "aws_s3_bucket_versioning" "mdx_storage" {
  bucket = aws_s3_bucket.mdx_storage.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "mdx_storage" {
  bucket = aws_s3_bucket.mdx_storage.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ─────────────────────────────────────────────
# DynamoDB — Document Metadata
# ─────────────────────────────────────────────
resource "aws_dynamodb_table" "docs" {
  name         = "${var.project_name}-docs-${var.environment}"
  billing_mode = "PAY_PER_REQUEST" # Free tier: 25 WCU/RCU selamanya

  hash_key  = "docId"
  range_key = "version"

  attribute {
    name = "docId"
    type = "S"
  }

  attribute {
    name = "version"
    type = "N"
  }

  attribute {
    name = "author"
    type = "S"
  }

  global_secondary_index {
    name            = "AuthorIndex"
    hash_key        = "author"
    projection_type = "ALL"
  }

  point_in_time_recovery { enabled = true }
}

# ─────────────────────────────────────────────
# SSM — Gemini API Key
# ─────────────────────────────────────────────
resource "aws_ssm_parameter" "gemini_api_key" {
  name        = "/${var.project_name}/${var.environment}/GEMINI_API_KEY"
  type        = "SecureString"
  value       = var.gemini_api_key
  description = "Google Gemini API Key untuk Lambda gemini-generate"
}

# ─────────────────────────────────────────────
# IAM — Lambda Execution Role (Least Privilege)
# ─────────────────────────────────────────────
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # CloudWatch Logs
        Effect = "Allow"
        Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        # S3 MDX Storage — read/write only (bukan delete sembarangan)
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.mdx_storage.arn,
          "${aws_s3_bucket.mdx_storage.arn}/*"
        ]
      },
      {
        # DynamoDB — CRUD docs table only
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan"]
        Resource = [
          aws_dynamodb_table.docs.arn,
          "${aws_dynamodb_table.docs.arn}/index/*"
        ]
      },
      {
        # SSM — read only parameter yang relevan
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = aws_ssm_parameter.gemini_api_key.arn
      }
    ]
  })
}

# ─────────────────────────────────────────────
# Lambda — CRUD MDX
# ─────────────────────────────────────────────
resource "aws_lambda_function" "mdx_crud" {
  function_name = "${var.project_name}-mdx-crud-${var.environment}"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  filename      = "../backend/dist/mdx-crud.zip"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      ENVIRONMENT      = var.environment
      DYNAMODB_TABLE   = aws_dynamodb_table.docs.name
      S3_MDX_BUCKET    = aws_s3_bucket.mdx_storage.id
    }
  }
}

# ─────────────────────────────────────────────
# Lambda — Gemini Generate
# ─────────────────────────────────────────────
resource "aws_lambda_function" "gemini_generate" {
  function_name = "${var.project_name}-gemini-generate-${var.environment}"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  filename      = "../backend/dist/gemini-generate.zip"
  timeout       = 60  # Gemini bisa lambat
  memory_size   = 256

  environment {
    variables = {
      ENVIRONMENT       = var.environment
      GEMINI_SSM_PATH   = aws_ssm_parameter.gemini_api_key.name
      GEMINI_MODEL      = "gemini-1.5-flash-8b" # Flash-Lite = paling hemat
      RATE_LIMIT_TABLE  = aws_dynamodb_table.docs.name
    }
  }
}

# ─────────────────────────────────────────────
# API Gateway — HTTP API (lebih murah dari REST API)
# ─────────────────────────────────────────────
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["content-type", "authorization"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_origins = ["https://your-cloudfront-domain.cloudfront.net"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn
  }

  default_route_settings {
    throttling_burst_limit = 50
    throttling_rate_limit  = 100
  }
}

# ─────────────────────────────────────────────
# CloudFront — CDN Frontend
# ─────────────────────────────────────────────
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # US + Europe edge only (paling murah)

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3Frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    target_origin_id       = "S3Frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# ─────────────────────────────────────────────
# CloudWatch Log Groups
# ─────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "lambda_crud" {
  name              = "/aws/lambda/${aws_lambda_function.mdx_crud.function_name}"
  retention_in_days = 7 # Hemat storage
}

resource "aws_cloudwatch_log_group" "lambda_gemini" {
  name              = "/aws/lambda/${aws_lambda_function.gemini_generate.function_name}"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/apigateway/${aws_apigatewayv2_api.main.name}"
  retention_in_days = 7
}
```

### `outputs.tf`

```hcl
output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.frontend.domain_name
  description = "URL frontend lo"
}

output "api_gateway_url" {
  value       = "${aws_apigatewayv2_api.main.api_endpoint}/${var.environment}"
  description = "Base URL API"
}

output "mdx_bucket_name" {
  value = aws_s3_bucket.mdx_storage.id
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.docs.name
}
```

### Urutan Eksekusi Terraform

```bash
# 1. Init (download providers)
terraform init

# 2. Validasi syntax
terraform validate

# 3. Preview perubahan — SELALU jalankan sebelum apply
terraform plan -var-file="terraform.tfvars"

# 4. Apply (ketik "yes" ketika diminta)
terraform apply -var-file="terraform.tfvars"

# 5. Lihat outputs
terraform output
```

> **Tip**: Simpan `terraform.tfvars` di `.gitignore`. Untuk CI/CD, inject variabel via environment variable (`TF_VAR_gemini_api_key`).

---

## 5. Phase 2 — CI/CD Pipeline (GitHub Actions)

**Estimasi waktu**: 2 hari  
**Output**: Setiap `git push` ke `main` otomatis deploy — zero manual error.

### Prinsip Desain Pipeline

```
Developer → git push → GitHub Actions trigger
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     Frontend Pipeline           Backend Pipeline
     (next build + S3 sync)     (test → zip → lambda deploy)
              │                         │
              ▼                         ▼
     CloudFront Invalidation    Terraform apply (jika IaC berubah)
              │                         │
              └────────────┬────────────┘
                           ▼
                    Notify (opsional: Slack/email)
```

### Setup GitHub Secrets

Navigasi ke `Settings → Secrets and variables → Actions`, tambahkan:

| Secret Name                  | Value                                              |
| ---------------------------- | -------------------------------------------------- |
| `AWS_ROLE_ARN`               | ARN dari IAM Role OIDC (lihat setup OIDC di bawah) |
| `AWS_REGION`                 | `ap-southeast-1`                                   |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID dari output Terraform                           |
| `TF_VAR_gemini_api_key`      | Gemini API Key lo                                  |

### Setup OIDC (Tidak Ada Static Credential di GitHub)

```hcl
# Tambahkan di main.tf — buat sekali, permanent
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "${var.project_name}-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:YOUR_GITHUB_USERNAME/YOUR_REPO:*"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "github_actions_policy" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess" # Scope down di production
}
```

### `.github/workflows/frontend-deploy.yml`

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - "frontend/**" # Hanya trigger kalau ada perubahan di folder frontend
      - ".github/workflows/frontend-deploy.yml"

permissions:
  id-token: write # OIDC — wajib ada
  contents: read

jobs:
  deploy:
    name: Build & Deploy Frontend
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install Dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Type Check
        working-directory: ./frontend
        run: npm run type-check

      - name: Lint
        working-directory: ./frontend
        run: npm run lint

      - name: Build Next.js (Static Export)
        working-directory: ./frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_GATEWAY_URL }}

      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Sync ke S3
        run: |
          aws s3 sync ./frontend/out s3://${{ secrets.FRONTEND_BUCKET_NAME }} \
            --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "*.html"

          # HTML files: jangan di-cache aggressively
          aws s3 sync ./frontend/out s3://${{ secrets.FRONTEND_BUCKET_NAME }} \
            --delete \
            --cache-control "public, max-age=0, must-revalidate" \
            --include "*.html"

      - name: Invalidate CloudFront Cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

      - name: Deployment Summary
        run: |
          echo "✅ Frontend deployed successfully"
          echo "🌐 URL: https://${{ secrets.CLOUDFRONT_DOMAIN }}"
```

### `.github/workflows/backend-deploy.yml`

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - "backend/**"
      - ".github/workflows/backend-deploy.yml"
  pull_request:
    branches: [main]
    paths:
      - "backend/**"

permissions:
  id-token: write
  contents: read
  pull-requests: write # Untuk post comment di PR

jobs:
  # ──────────────────────────────────────────
  # JOB 1: Test (selalu jalan, di PR maupun push)
  # ──────────────────────────────────────────
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json

      - name: Install Dependencies
        working-directory: ./backend
        run: npm ci

      - name: Lint
        working-directory: ./backend
        run: npm run lint

      - name: Type Check
        working-directory: ./backend
        run: npm run type-check

      - name: Unit & Integration Tests
        working-directory: ./backend
        run: npm run test:ci
        env:
          NODE_ENV: test
          # Mock values untuk testing
          AWS_ACCESS_KEY_ID: test
          AWS_SECRET_ACCESS_KEY: test
          AWS_REGION: us-east-1 # localstack/moto default

      - name: Upload Coverage Report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: backend/coverage/

      - name: Coverage Check (minimal 80%)
        working-directory: ./backend
        run: npm run test:coverage-check

      # Post coverage ke PR comment
      - name: Comment Coverage ke PR
        if: github.event_name == 'pull_request'
        uses: ArtiomTr/jest-coverage-report-action@v2
        with:
          working-directory: ./backend

  # ──────────────────────────────────────────
  # JOB 2: Build & Package Lambda
  # ──────────────────────────────────────────
  build:
    name: Build Lambda Packages
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json

      - name: Install Production Dependencies
        working-directory: ./backend
        run: npm ci --omit=dev

      - name: Build TypeScript
        working-directory: ./backend
        run: npm run build

      - name: Package mdx-crud Lambda
        working-directory: ./backend
        run: |
          cd dist
          zip -r ../mdx-crud.zip . -x "*.test.js"
          cd ..
          echo "mdx-crud.zip size: $(du -sh mdx-crud.zip | cut -f1)"

      - name: Package gemini-generate Lambda
        working-directory: ./backend
        run: |
          cd dist
          zip -r ../gemini-generate.zip . -x "*.test.js"
          cd ..
          echo "gemini-generate.zip size: $(du -sh gemini-generate.zip | cut -f1)"

      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: lambda-packages
          path: |
            backend/mdx-crud.zip
            backend/gemini-generate.zip
          retention-days: 1

  # ──────────────────────────────────────────
  # JOB 3: Deploy ke Dev
  # ──────────────────────────────────────────
  deploy-dev:
    name: Deploy ke Dev
    needs: build
    runs-on: ubuntu-latest
    environment: dev

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download Lambda Packages
        uses: actions/download-artifact@v4
        with:
          name: lambda-packages
          path: backend/dist/

      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Deploy Lambda — mdx-crud
        run: |
          aws lambda update-function-code \
            --function-name smartdocs-mdx-mdx-crud-dev \
            --zip-file fileb://backend/dist/mdx-crud.zip

      - name: Deploy Lambda — gemini-generate
        run: |
          aws lambda update-function-code \
            --function-name smartdocs-mdx-gemini-generate-dev \
            --zip-file fileb://backend/dist/gemini-generate.zip

      - name: Wait for Lambda Update
        run: |
          aws lambda wait function-updated \
            --function-name smartdocs-mdx-mdx-crud-dev
          aws lambda wait function-updated \
            --function-name smartdocs-mdx-gemini-generate-dev

      - name: Smoke Test Dev
        run: |
          API_URL="${{ secrets.API_GATEWAY_URL_DEV }}"
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
          if [ "$STATUS" != "200" ]; then
            echo "❌ Smoke test failed — HTTP $STATUS"
            exit 1
          fi
          echo "✅ Smoke test passed"

  # ──────────────────────────────────────────
  # JOB 4: Deploy ke Prod (dengan manual approval)
  # ──────────────────────────────────────────
  deploy-prod:
    name: Deploy ke Production
    needs: deploy-dev
    runs-on: ubuntu-latest
    environment: production # Environment ini punya required reviewers di GitHub

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download Lambda Packages
        uses: actions/download-artifact@v4
        with:
          name: lambda-packages
          path: backend/dist/

      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Deploy ke Production
        run: |
          aws lambda update-function-code \
            --function-name smartdocs-mdx-mdx-crud-prod \
            --zip-file fileb://backend/dist/mdx-crud.zip

          aws lambda update-function-code \
            --function-name smartdocs-mdx-gemini-generate-prod \
            --zip-file fileb://backend/dist/gemini-generate.zip

      - name: Tag Release
        run: |
          git tag "release-$(date +'%Y%m%d-%H%M%S')"
          git push origin --tags

      - name: Deployment Summary
        run: echo "🚀 Production deployment selesai — $(date)"
```

### Pipeline Flow Diagram

```
git push → Actions trigger
                │
                ▼
        ┌───────────────┐
        │  Job: test    │ ← Jalan di PR dan push
        │  · lint       │
        │  · type-check │
        │  · unit test  │
        │  · coverage   │
        └──────┬────────┘
               │ ✅ pass
               ▼ (push to main only)
        ┌───────────────┐
        │  Job: build   │
        │  · tsc build  │
        │  · zip lambda │
        └──────┬────────┘
               │
               ▼
        ┌───────────────┐
        │ deploy-dev    │
        │ · update fn   │
        │ · smoke test  │
        └──────┬────────┘
               │ ✅ smoke test pass
               ▼
        ┌───────────────┐
        │ deploy-prod   │ ← ⏸ Manual approval required
        │ · update fn   │
        │ · tag release │
        └───────────────┘
```

---

## 6. Phase 3 — Security & Production Hardening

**Estimasi waktu**: 1–2 hari

### Checklist Security

| Area        | Implementasi                                  | Status   |
| ----------- | --------------------------------------------- | -------- |
| IAM         | Least privilege per Lambda function           | Wajib    |
| Secrets     | Gemini key di SSM SecureString, bukan env var | Wajib    |
| API Gateway | Throttling (100 req/s, burst 50)              | Wajib    |
| CORS        | Restrict ke CloudFront domain saja            | Wajib    |
| S3          | Block public access + OAC untuk CloudFront    | Wajib    |
| S3          | Server-side encryption (AES-256)              | Wajib    |
| DynamoDB    | Encryption at rest (default aktif)            | Wajib    |
| Lambda      | Tidak ada sensitive data di logs              | Wajib    |
| Gemini      | Rate limit custom logic di Lambda             | Wajib    |
| WAF         | Basic rule set (OWASP top 10)                 | Opsional |

### Rate Limiter — Gemini API (Lambda Middleware)

```typescript
// backend/src/middleware/rateLimiter.ts
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const dynamodb = new DynamoDBClient({});
const RATE_LIMIT_PER_MINUTE = 10; // Konservatif untuk Gemini free tier

export async function checkGeminiRateLimit(userId: string): Promise<boolean> {
  const windowKey = `ratelimit#${userId}#${Math.floor(Date.now() / 60000)}`;

  try {
    const result = await dynamodb.send(
      new UpdateItemCommand({
        TableName: process.env.DYNAMODB_TABLE!,
        Key: {
          docId: { S: windowKey },
          version: { N: "0" },
        },
        UpdateExpression:
          "ADD #count :inc SET #ttl = if_not_exists(#ttl, :ttl)",
        ExpressionAttributeNames: {
          "#count": "requestCount",
          "#ttl": "expiresAt",
        },
        ExpressionAttributeValues: {
          ":inc": { N: "1" },
          ":ttl": { N: String(Math.floor(Date.now() / 1000) + 120) }, // TTL 2 menit
        },
        ReturnValues: "ALL_NEW",
      }),
    );

    const count = parseInt(result.Attributes?.requestCount?.N || "0");
    return count <= RATE_LIMIT_PER_MINUTE;
  } catch {
    // Fail open — jangan block user kalau DynamoDB down
    return true;
  }
}
```

### Logging — Tidak Log Data Sensitif

```typescript
// backend/src/utils/logger.ts
const SENSITIVE_FIELDS = ["apiKey", "password", "token", "prompt", "content"];

export function safeLog(
  level: "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>,
) {
  const sanitized = data ? sanitize(data) : undefined;
  console[level](
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(sanitized && { data: sanitized }),
      requestId: process.env.AWS_REQUEST_ID,
    }),
  );
}

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
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

---

## 7. Phase 4 — Testing Strategy

**Estimasi waktu**: 3–4 hari  
**Coverage target**: Minimal 80% untuk backend logic.

### Piramida Testing

```
         ▲
        /|\
       / | \        E2E Tests (sedikit)
      /  |  \       · Playwright — full user flow
     /───────\
    /         \     Integration Tests (sedang)
   /           \    · Supertest + aws-sdk-mock
  /─────────────\
 /               \  Unit Tests (banyak)
/─────────────────\ · Jest — pure logic, parsers, validators
```

### Setup Testing

```json
// backend/package.json (testing scripts)
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --forceExit --coverage",
    "test:coverage-check": "jest --coverage --coverageThreshold='{\"global\":{\"lines\":80}}'"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "collectCoverageFrom": ["src/**/*.ts", "!src/**/*.d.ts"],
    "setupFilesAfterFramework": ["<rootDir>/tests/setup.ts"]
  }
}
```

### Unit Test — MDX Validator

```typescript
// backend/tests/unit/mdxValidator.test.ts
import { validateMDX, extractFrontmatter } from "../../src/utils/mdxValidator";

describe("MDX Validator", () => {
  describe("validateMDX", () => {
    it("valid MDX lolos validasi", () => {
      const validMDX = `---
title: Test Doc
author: john
---

# Hello World

Ini paragraf biasa.
`;
      expect(validateMDX(validMDX)).toEqual({ valid: true, errors: [] });
    });

    it("MDX tanpa frontmatter gagal validasi", () => {
      const result = validateMDX("# No frontmatter");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing frontmatter");
    });

    it("frontmatter tanpa title gagal validasi", () => {
      const mdxNoTitle = `---\nauthor: john\n---\n# Content`;
      const result = validateMDX(mdxNoTitle);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("title is required in frontmatter");
    });
  });

  describe("extractFrontmatter", () => {
    it("ekstrak frontmatter dengan benar", () => {
      const mdx = `---\ntitle: My Doc\nauthor: jane\ntags: [aws, devops]\n---\n# Body`;
      const result = extractFrontmatter(mdx);
      expect(result).toMatchObject({
        title: "My Doc",
        author: "jane",
        tags: ["aws", "devops"],
      });
    });
  });
});
```

### Unit Test — Gemini Prompt Builder

```typescript
// backend/tests/unit/geminiPrompt.test.ts
import {
  buildGeneratePrompt,
  buildImprovePrompt,
} from "../../src/gemini/promptBuilder";

describe("Gemini Prompt Builder", () => {
  it("generate prompt mengandung instruksi MDX format", () => {
    const prompt = buildGeneratePrompt({
      topic: "AWS Lambda",
      tone: "technical",
    });
    expect(prompt).toContain("MDX");
    expect(prompt).toContain("frontmatter");
    expect(prompt).toContain("AWS Lambda");
  });

  it("improve prompt tidak expose konten sensitif", () => {
    const prompt = buildImprovePrompt({
      content: "Some content",
      instruction: "Make it clearer",
      apiKey: "secret-key-123", // Input yang seharusnya tidak masuk ke prompt
    } as any);
    expect(prompt).not.toContain("secret-key-123");
  });

  it("prompt panjang > 10000 karakter di-truncate", () => {
    const longContent = "a".repeat(20000);
    const prompt = buildImprovePrompt({
      content: longContent,
      instruction: "improve",
    });
    expect(prompt.length).toBeLessThan(15000);
  });
});
```

### Integration Test — CRUD Endpoint (dengan aws-sdk-mock)

```typescript
// backend/tests/integration/mdxCrud.test.ts
import request from "supertest";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import app from "../../src/app";

const ddbMock = mockClient(DynamoDBClient);
const s3Mock = mockClient(S3Client);

beforeEach(() => {
  ddbMock.reset();
  s3Mock.reset();
});

describe("POST /docs", () => {
  it("berhasil create dokumen baru", async () => {
    // Mock DynamoDB dan S3 response
    ddbMock.on(PutItemCommand).resolves({});
    s3Mock.on(PutObjectCommand).resolves({ ETag: '"abc123"' });

    const response = await request(app)
      .post("/docs")
      .send({
        title: "Test Document",
        author: "john",
        content: "---\ntitle: Test\nauthor: john\n---\n# Hello",
      })
      .expect(201);

    expect(response.body).toMatchObject({
      docId: expect.any(String),
      version: 1,
      message: "Document created successfully",
    });
  });

  it("return 400 jika MDX content tidak valid", async () => {
    const response = await request(app)
      .post("/docs")
      .send({
        title: "Test",
        author: "john",
        content: "invalid no frontmatter",
      })
      .expect(400);

    expect(response.body.error).toContain("Invalid MDX");
  });

  it("return 429 jika rate limit Gemini tercapai", async () => {
    // Simulate rate limit exceeded
    ddbMock.on(GetItemCommand).resolves({
      Item: { requestCount: { N: "15" } }, // Di atas limit 10
    });

    const response = await request(app)
      .post("/ai/generate")
      .send({ topic: "AWS" })
      .expect(429);

    expect(response.body.error).toContain("Rate limit");
  });
});
```

### Manual Testing Checklist

Jalankan setelah deploy ke dev stage:

```markdown
## CRUD MDX

- [ ] POST /docs — create dokumen baru
- [ ] GET /docs/:id — baca dokumen
- [ ] PUT /docs/:id — update konten
- [ ] DELETE /docs/:id — hapus dokumen
- [ ] GET /docs/:id?version=1 — baca versi spesifik (version history)

## AI Feature

- [ ] POST /ai/generate — generate dokumen baru dari topik
- [ ] POST /ai/improve — improve section tertentu
- [ ] Test dengan prompt yang sangat panjang (>5000 karakter)
- [ ] Test ketika Gemini API key salah — proper error message?
- [ ] Test rate limit — hit endpoint >10x/menit — return 429?

## Performance

- [ ] Artillery load test: 20 concurrent users selama 30 detik
- [ ] Lambda cold start < 1 detik (warm: < 200ms)
- [ ] CloudFront cache hit untuk static assets

## Security

- [ ] Coba akses S3 bucket langsung (harus 403)
- [ ] Coba request tanpa CORS origin yang benar (harus ditolak)
- [ ] Inject SQL/NoSQL injection di parameter (harus sanitized)
- [ ] Kirim prompt injection ke AI endpoint

## Cross-Browser

- [ ] Chrome, Firefox, Safari
- [ ] Mobile (iOS Safari, Android Chrome)
```

### Artillery Load Test Config

```yaml
# backend/tests/load/artillery.yml
config:
  target: "https://your-api-gateway-url/dev"
  phases:
    - duration: 30
      arrivalRate: 5 # 5 user/detik selama 30 detik = 150 total request
    - duration: 30
      arrivalRate: 20 # Spike ke 20 user/detik
  defaults:
    headers:
      Content-Type: "application/json"

scenarios:
  - name: CRUD Flow
    flow:
      - post:
          url: "/docs"
          json:
            title: "Load Test Doc"
            author: "artillery"
            content: '---\ntitle: Load Test\nauthor: artillery\n---\n# Test'
          capture:
            - json: "$.docId"
              as: "docId"
      - get:
          url: "/docs/{{ docId }}"
```

---

## 8. Monitoring & Observability

### CloudWatch Dashboard

```hcl
# infrastructure/monitoring.tf
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          title  = "Lambda Invocations"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.project_name}-mdx-crud-${var.environment}"],
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.project_name}-gemini-generate-${var.environment}"]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type = "metric"
        properties = {
          title  = "Lambda Errors"
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "${var.project_name}-mdx-crud-${var.environment}"],
            ["AWS/Lambda", "Errors", "FunctionName", "${var.project_name}-gemini-generate-${var.environment}"]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type = "metric"
        properties = {
          title  = "Lambda Duration (P95)"
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", "${var.project_name}-mdx-crud-${var.environment}"]
          ]
          period = 300
          stat   = "p95"
        }
      },
      {
        type = "metric"
        properties = {
          title  = "API Gateway Requests & 4xx/5xx"
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiId", aws_apigatewayv2_api.main.id],
            ["AWS/ApiGateway", "4XXError", "ApiId", aws_apigatewayv2_api.main.id],
            ["AWS/ApiGateway", "5XXError", "ApiId", aws_apigatewayv2_api.main.id]
          ]
          period = 300
          stat   = "Sum"
        }
      }
    ]
  })
}
```

### CloudWatch Alarms

```hcl
# infrastructure/alarms.tf

# Alarm: Lambda error rate > 5%
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Lambda error count > 5 dalam 10 menit"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.mdx_crud.function_name
  }
}

# Alarm: Lambda duration > 5 detik
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${var.project_name}-lambda-duration-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  extended_statistic  = "p95"
  threshold           = 5000 # 5 detik
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.gemini_generate.function_name
  }
}

# SNS Topic untuk alerting
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${var.environment}"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "your-email@gmail.com"
}
```

### CloudWatch Logs Insights — Query Siap Pakai

```sql
-- Cari Gemini API error dalam 1 jam terakhir
fields @timestamp, message, data.error
| filter level = "error" and message like "Gemini"
| sort @timestamp desc
| limit 20

-- Hitung rata-rata latency per endpoint
fields @timestamp, data.path, data.duration
| filter level = "info" and ispresent(data.duration)
| stats avg(data.duration) as avgMs, count() as requests by data.path
| sort avgMs desc

-- Deteksi rate limit hits
fields @timestamp, data.userId
| filter message = "Rate limit exceeded"
| stats count() as hits by data.userId
| sort hits desc
```

---

## 9. Cost Management & Free Tier Guard

### Estimasi Biaya Bulanan

| Service             | Free Tier              | Estimasi Usage     | Estimasi Biaya      |
| ------------------- | ---------------------- | ------------------ | ------------------- |
| Lambda              | 1M req + 400K GB-s     | ~5K req, ~50K GB-s | **$0**              |
| API Gateway (HTTP)  | 1M req                 | ~5K req            | **$0**              |
| S3                  | 5 GB storage, 20K GET  | ~100 MB, ~500 GET  | **$0**              |
| CloudFront          | 1 TB transfer, 10M req | ~1 GB, ~5K req     | **$0**              |
| DynamoDB            | 25 GB, 25 WCU/RCU      | ~10 MB             | **$0**              |
| CloudWatch Logs     | 5 GB ingest            | ~100 MB            | **$0**              |
| SSM Parameter Store | Standard gratis        | 1 parameter        | **$0**              |
| **Total**           |                        |                    | **< Rp5.000/bulan** |

> Gemini Flash-Lite: Free tier cukup untuk portfolio/testing. Monitor di Google AI Studio.

### AWS Budget Alert

```hcl
# infrastructure/budget.tf
resource "aws_budgets_budget" "monthly" {
  name         = "${var.project_name}-budget"
  budget_type  = "COST"
  limit_amount = "2"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80  # Alert di 80% (= $1.6)
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["your-email@gmail.com"]
  }
}
```

---

## 10. Rollout & Maintenance Plan

### Deploy Sequence

```
1. Terraform apply (IaC) → dev environment
2. Backend deploy → dev Lambda
3. Frontend deploy → dev S3 + CloudFront
4. Manual testing checklist → dev stage
5. Approval → production deploy
6. Smoke test production
7. Monitor CloudWatch 15 menit pertama
```

### Rollback Procedures

```bash
# Rollback Lambda ke versi sebelumnya
aws lambda update-alias \
  --function-name smartdocs-mdx-mdx-crud-prod \
  --name LIVE \
  --function-version <previous-version-number>

# Rollback Terraform (destroy dan re-apply dari state yang lebih lama)
terraform state list
terraform apply -target=aws_lambda_function.mdx_crud -var-file="terraform.tfvars"

# Rollback frontend (re-sync versi S3 sebelumnya via GitHub Actions re-run)
# GitHub Actions → pilih workflow run sebelumnya → Re-run jobs
```

### Future Improvements (Roadmap)

| Priority | Feature                        | Catatan                               |
| -------- | ------------------------------ | ------------------------------------- |
| High     | Cognito Authentication         | User management proper                |
| Medium   | Lambda Provisioned Concurrency | Eliminasi cold start                  |
| Medium   | Blue-Green Deployment          | Zero-downtime deploy via Lambda alias |
| Low      | OpenSearch                     | Full-text search MDX content          |
| Low      | AWS X-Ray                      | Distributed tracing                   |

---

## 11. Local Development Setup

```bash
# Prerequisites
node --version    # >= 20.x
terraform --version  # >= 1.6.0
aws --version     # >= 2.x

# 1. Clone repo
git clone https://github.com/YOUR_USERNAME/smartdocs-mdx
cd smartdocs-mdx

# 2. Setup backend
cd backend
cp .env.example .env.local
# Edit .env.local: isi AWS credentials untuk lokal (pakai profile, bukan key langsung)
npm install
npm run dev  # Express server di localhost:3001

# 3. Setup frontend
cd ../frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev  # Next.js di localhost:3000

# 4. Terraform (hanya untuk provision infrastructure)
cd ../infrastructure
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars: isi gemini_api_key
terraform init
terraform plan
```

### Environment Variables

```bash
# backend/.env.example
NODE_ENV=development
PORT=3001
AWS_REGION=ap-southeast-1
AWS_PROFILE=smartdocs-dev      # Pakai AWS profile, bukan raw key
DYNAMODB_TABLE=smartdocs-mdx-docs-dev
S3_MDX_BUCKET=smartdocs-mdx-mdx-dev
GEMINI_MODEL=gemini-1.5-flash-8b
# Di lokal, bisa hardcode untuk dev. Di Lambda, dibaca dari SSM.
GEMINI_API_KEY=your-key-here

# frontend/.env.example
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 12. Troubleshooting Guide

### Lambda Cold Start Tinggi

**Symptom**: Request pertama lambat (>1 detik).  
**Cause**: Lambda initialize runtime dari scratch.  
**Fix**:

```bash
# Cek duration di CloudWatch
aws logs filter-log-events \
  --log-group-name "/aws/lambda/smartdocs-mdx-mdx-crud-dev" \
  --filter-pattern "Init Duration"

# Solusi jangka pendek: kurangi dependency di Lambda package
# Solusi jangka panjang: Enable Provisioned Concurrency (bayar per jam)
```

### Gemini API Error 429

**Symptom**: `429 Too Many Requests` dari Gemini.  
**Cause**: Free tier limit tercapai (15–60 RPM tergantung model).  
**Fix**:

```bash
# 1. Cek model yang dipakai — ganti ke yang lebih hemat
GEMINI_MODEL=gemini-1.5-flash-8b  # Paling murah quota-nya

# 2. Enable retry dengan exponential backoff di Lambda
# 3. Monitor usage di: https://aistudio.google.com/app/apikey
```

### Terraform State Conflict

**Symptom**: `Error: state is locked`.  
**Cause**: Pipeline sebelumnya crash di tengah jalan.  
**Fix**:

```bash
# Lihat siapa yang lock
terraform force-unlock <LOCK_ID>
# LOCK_ID ada di error message

# Atau via AWS console: S3 → terraform-state bucket → terraform.tfstate.lock
```

### CloudFront Tidak Update Setelah Deploy

**Symptom**: Frontend lama masih tampil setelah deploy.  
**Cause**: CloudFront cache belum expired.  
**Fix**:

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"

# Cek status invalidation
aws cloudfront list-invalidations --distribution-id YOUR_DIST_ID
```

### DynamoDB Throttling

**Symptom**: `ProvisionedThroughputExceededException`.  
**Cause**: Terlalu banyak request ke DynamoDB (jarang terjadi di free tier).  
**Fix**: Billing mode `PAY_PER_REQUEST` (sudah di-set di Terraform) tidak ada throttling — kalau masih terjadi, cek ada loop yang tidak sengaja di Lambda.

---

## Architecture Decision Records (ADR)

### ADR-001: Serverless vs Container (ECS/Fargate)

**Keputusan**: Serverless (Lambda + API Gateway)  
**Alasan**: Free tier cukup untuk portfolio, zero server management, auto-scale.  
**Tradeoff diterima**: Cold start latency 200–500ms (dapat dimitigasi jika perlu).

### ADR-002: DynamoDB vs RDS

**Keputusan**: DynamoDB  
**Alasan**: Serverless, free tier 25GB, tidak ada connection pool issue di Lambda environment.  
**Tradeoff diterima**: Query flexibility lebih terbatas dibanding SQL — dikompensasi dengan GSI yang tepat.

### ADR-003: HTTP API Gateway vs REST API Gateway

**Keputusan**: HTTP API (v2)  
**Alasan**: 70% lebih murah dari REST API, latency lebih rendah, cukup fiturnya untuk use case ini.  
**Tradeoff diterima**: Tidak ada built-in request validation model — validasi dilakukan di Lambda.

### ADR-004: Terraform vs AWS SAM/CDK

**Keputusan**: Terraform  
**Alasan**: Multi-cloud portable, industry standard di DevOps job market, komunitas dan dokumentasi lebih mature.  
**Tradeoff diterima**: Lebih verbose dibanding SAM untuk Lambda-specific resources.

---

_Dokumentasi ini merupakan living document — update setiap kali ada perubahan arsitektur atau keputusan teknis baru._
