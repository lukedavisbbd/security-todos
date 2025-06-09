variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "af-south-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "todo-app"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "dev"
}

variable "backend_image" {
  description = "Backend Docker image URI"
  type        = string
  default     = ""
}

variable "master_key_2fa" {
  description = "Master key for 2FA"
  type        = string
  default     = ""
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "todoapp"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_host" {
  description = "Database host"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_database" {
  description = "Database name"
  type        = string
  default     = ""
  sensitive   = true
}