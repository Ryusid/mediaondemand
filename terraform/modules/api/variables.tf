variable "project_name" {
  type = string
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "cognito_user_pool_arn" {
  type = string
}

variable "ec2_public_ip" {
  type = string
}
