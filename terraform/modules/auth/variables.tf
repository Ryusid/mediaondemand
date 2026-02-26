variable "project_name" {
  type = string
}

variable "callback_urls" {
  type    = list(string)
  default = ["http://localhost:3000/callback"]
}
