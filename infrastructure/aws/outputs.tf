output "alb_dns_name" {
  description = "Buka di browser: http://<nilai-ini> — set juga sebagai ALB_URL di GitHub Actions"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "URL penuh HTTP (untuk smoke test & NEXTAUTH_URL manual)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecr_repository_url" {
  description = "ECR_REPOSITORY di GitHub Secrets (tanpa tag)"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.app.name
}

output "docs_s3_bucket" {
  description = "DOCS_S3_BUCKET di GitHub Secrets"
  value       = aws_s3_bucket.docs.id
}

output "rds_endpoint" {
  value     = aws_db_instance.postgres.address
  sensitive = false
}

output "database_url_for_ci" {
  description = "Salin ke GitHub Secret DATABASE_URL untuk prisma migrate deploy (sensitive)"
  value       = "postgresql://${var.db_username}:${urlencode(var.db_password)}@${aws_db_instance.postgres.address}:5432/${var.db_name}?schema=public"
  sensitive   = true
}

output "github_actions_role_arn" {
  description = "AWS_ROLE_ARN di GitHub Secrets"
  value       = aws_iam_role.github_actions.arn
}

output "secrets_manager_secret_arn" {
  value     = aws_secretsmanager_secret.app.arn
  sensitive = false
}
