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

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "todoapp"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
}