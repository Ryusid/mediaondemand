variable "project_name" {
  type = string
}

variable "sqs_video_queue_arn" {
  description = "ARN of the SQS queue for video processing"
  type        = string
}

variable "sqs_ebook_queue_arn" {
  description = "ARN of the SQS queue for ebook processing"
  type        = string
}
