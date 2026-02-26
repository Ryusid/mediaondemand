# --- Networking ---
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

# --- Auth ---
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.auth.user_pool_id
}

output "cognito_app_client_id" {
  description = "Cognito App Client ID"
  value       = module.auth.app_client_id
}

# --- Storage ---
output "s3_raw_bucket" {
  description = "S3 bucket for raw uploads"
  value       = module.storage.raw_bucket_name
}

output "s3_processed_bucket" {
  description = "S3 bucket for processed content"
  value       = module.storage.processed_bucket_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = module.storage.cloudfront_domain
}

# --- Database ---
output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.database.db_endpoint
}

# --- Compute ---
output "ec2_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = module.compute.ec2_public_ip
}

output "jenkins_url" {
  description = "Jenkins web UI URL"
  value       = "http://${module.compute.ec2_public_ip}:8080"
}

# --- API ---
output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = module.api.api_gateway_url
}
