data "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.project_name}-${var.environment}-secrets"
}

resource "aws_iam_role_policy" "ecs_secrets_policy" {
  name = "${var.project_name}-${var.environment}-ecs-secrets"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          data.aws_secretsmanager_secret.app_secrets.arn
        ]
      }
    ]
  })
}