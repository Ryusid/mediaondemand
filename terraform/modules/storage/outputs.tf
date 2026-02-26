output "raw_bucket_name" {
  value = aws_s3_bucket.raw.id
}

output "raw_bucket_arn" {
  value = aws_s3_bucket.raw.arn
}

output "processed_bucket_name" {
  value = aws_s3_bucket.processed.id
}

output "processed_bucket_arn" {
  value = aws_s3_bucket.processed.arn
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.main.id
}
