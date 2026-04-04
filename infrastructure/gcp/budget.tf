locals {
  effective_monthly_budget_usd = coalesce(var.monthly_budget_amount, var.monthly_budget_usd)
}

resource "google_billing_budget" "monthly" {
  billing_account = var.gcp_billing_account_id
  display_name    = "${var.project_name}-cost-${var.environment}"

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(floor(local.effective_monthly_budget_usd))
      nanos         = floor((local.effective_monthly_budget_usd - floor(local.effective_monthly_budget_usd)) * 1000000000)
    }
  }

  budget_filter {
    projects = [
      "projects/${var.gcp_project_id}"
    ]
  }

  threshold_rules {
    threshold_percent = 0.8
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "CURRENT_SPEND"
  }

  dynamic "all_updates_rule" {
    for_each = var.alert_email != "" ? [1] : []
    content {
      monitoring_notification_channels = []
      disable_default_iam_recipients   = true

      pubsub_topic = null

      schema_version = "1.0"
    }
  }
}

resource "google_monitoring_notification_channel" "budget_email" {
  count        = var.alert_email != "" ? 1 : 0
  display_name = "${var.project_name}-${var.environment}-budget-email"
  type         = "email"

  labels = {
    email_address = var.alert_email
  }

  enabled = true
}

resource "google_billing_budget" "monthly_with_email_channel" {
  count           = var.alert_email != "" ? 1 : 0
  billing_account = var.gcp_billing_account_id
  display_name    = "${var.project_name}-cost-${var.environment}-email"

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(floor(local.effective_monthly_budget_usd))
      nanos         = floor((local.effective_monthly_budget_usd - floor(local.effective_monthly_budget_usd)) * 1000000000)
    }
  }

  budget_filter {
    projects = [
      "projects/${var.gcp_project_id}"
    ]
  }

  threshold_rules {
    threshold_percent = 0.8
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "CURRENT_SPEND"
  }

  all_updates_rule {
    monitoring_notification_channels = [
      google_monitoring_notification_channel.budget_email[0].name
    ]
    disable_default_iam_recipients = false
    schema_version                 = "1.0"
  }
}
