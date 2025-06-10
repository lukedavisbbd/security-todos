data "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.project_name}-${var.environment}-secrets"
}

data "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = data.aws_secretsmanager_secret.app_secrets.id
}

locals {
  secrets = jsondecode(data.aws_secretsmanager_secret_version.app_secrets.secret_string)
}