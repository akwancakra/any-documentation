locals {
  github_repo_owner = split("/", var.github_repository)[0]
  github_repo_name  = split("/", var.github_repository)[1]
  github_subject    = "repo:${var.github_repository}:*"
}

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "${var.project_name}-${var.environment}-github-pool"
  display_name              = "${var.project_name} ${var.environment} GitHub Pool"
  description               = "OIDC pool for GitHub Actions"
  disabled                  = false
}

resource "google_iam_workload_identity_pool_provider" "github_oidc" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "${var.project_name}-${var.environment}-github-provider"
  display_name                       = "${var.project_name} ${var.environment} GitHub OIDC"
  description                        = "GitHub Actions OIDC provider"
  disabled                           = false

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
    "attribute.actor"      = "assertion.actor"
    "attribute.aud"        = "assertion.aud"
  }

  attribute_condition = "assertion.repository == '${var.github_repository}'"
}

resource "google_service_account_iam_member" "github_oidc_workload_identity_user" {
  service_account_id = google_service_account.github_deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}
