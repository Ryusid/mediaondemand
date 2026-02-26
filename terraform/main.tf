# =============================================================
# MediaOnDemand — Root Module
# Wires all child modules together
# =============================================================

# --- Networking ---
module "networking" {
  source = "./modules/networking"

  project_name     = var.project_name
  allowed_ssh_cidr = var.allowed_ssh_cidr
}

# --- Authentication ---
module "auth" {
  source = "./modules/auth"

  project_name  = var.project_name
  callback_urls = var.cognito_callback_urls
}

# --- Storage (S3, CloudFront) ---
# Created first — buckets exist before queues and notifications
module "storage" {
  source = "./modules/storage"

  project_name        = var.project_name
  sqs_video_queue_arn = module.media_processing.video_queue_arn
  sqs_ebook_queue_arn = module.media_processing.ebook_queue_arn
}

# --- Media Processing (SQS, SNS, Lambda) ---
# SQS queues are created here, then storage module wires S3 notifications
module "media_processing" {
  source = "./modules/media-processing"

  project_name          = var.project_name
  raw_bucket_arn        = module.storage.raw_bucket_arn
  processed_bucket_arn  = module.storage.processed_bucket_arn
  processed_bucket_name = module.storage.processed_bucket_name
}

# --- Database ---
module "database" {
  source = "./modules/database"

  project_name          = var.project_name
  subnet_ids            = module.networking.public_subnet_ids
  rds_security_group_id = module.networking.rds_security_group_id
  db_username           = var.db_username
  db_password           = var.db_password
}

# --- Compute (EC2 + ECR) ---
module "compute" {
  source = "./modules/compute"

  project_name          = var.project_name
  key_pair_name         = var.ec2_key_pair_name
  ec2_security_group_id = module.networking.ec2_security_group_id
  subnet_id             = module.networking.public_subnet_ids[0]
}

# --- API Gateway ---
module "api" {
  source = "./modules/api"

  project_name          = var.project_name
  environment           = var.environment
  cognito_user_pool_arn = module.auth.user_pool_arn
  ec2_public_ip         = module.compute.ec2_public_ip
}

# --- Observability ---
module "observability" {
  source = "./modules/observability"

  project_name    = var.project_name
  aws_region      = var.aws_region
  ec2_instance_id = module.compute.ec2_instance_id
  db_instance_id  = "${var.project_name}-db"
}
