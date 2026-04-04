resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.project_name}/${var.environment}/app"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    DATABASE_URL    = "postgresql://${var.db_username}:${urlencode(var.db_password)}@${aws_db_instance.postgres.address}:5432/${var.db_name}?schema=public"
    NEXTAUTH_SECRET = var.nextauth_secret
    NEXTAUTH_URL    = "http://${aws_lb.main.dns_name}"
    GEMINI_API_KEY  = var.gemini_api_key
  })

  depends_on = [
    aws_db_instance.postgres,
    aws_lb.main,
  ]
}
