variable "project_name" {
  type = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "allowed_ssh_cidr" {
  type    = string
  default = "0.0.0.0/0"
}
