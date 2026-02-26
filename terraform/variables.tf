variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "mediaondemand"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "ec2_key_pair_name" {
  description = "Name of the EC2 key pair for SSH access"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into EC2 (your IP)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "db_username" {
  description = "RDS PostgreSQL master username"
  type        = string
  default     = "mediaadmin"
}

variable "db_password" {
  description = "RDS PostgreSQL master password"
  type        = string
  sensitive   = true
}

variable "cognito_callback_urls" {
  description = "Callback URLs for Cognito app client"
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}
