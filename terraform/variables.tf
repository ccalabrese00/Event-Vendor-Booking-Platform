variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_password" {
  description = "Password for the RDS PostgreSQL database"
  type        = string
  sensitive   = true
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "event-vendor-platform"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
