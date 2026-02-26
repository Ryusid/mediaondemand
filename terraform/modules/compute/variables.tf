variable "project_name" {
  type = string
}

variable "key_pair_name" {
  type = string
}

variable "ec2_security_group_id" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "service_names" {
  type    = list(string)
  default = ["user-service", "catalog-service", "upload-service", "search-service", "streaming-service"]
}
