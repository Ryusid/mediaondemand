variable "project_name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "ec2_instance_id" {
  type = string
}

variable "db_instance_id" {
  type = string
}

variable "service_names" {
  type    = list(string)
  default = ["user-service", "catalog-service", "upload-service", "search-service", "streaming-service"]
}
