output "video_queue_arn" {
  value = aws_sqs_queue.video.arn
}

output "ebook_queue_arn" {
  value = aws_sqs_queue.ebook.arn
}

output "sns_topic_arn" {
  value = aws_sns_topic.processing_complete.arn
}

output "video_lambda_arn" {
  value = aws_lambda_function.video_transcoder.arn
}

output "ebook_lambda_arn" {
  value = aws_lambda_function.ebook_converter.arn
}
