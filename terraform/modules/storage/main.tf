# --- Storage Module ---
# S3 buckets + CloudFront distribution (free tier: 5GB S3, 1TB CloudFront)

# Raw uploads bucket
resource "aws_s3_bucket" "raw" {
  bucket = "${var.project_name}-raw-${random_string.bucket_suffix.result}"

  tags = {
    Name = "${var.project_name}-raw-uploads"
  }
}

resource "aws_s3_bucket_versioning" "raw" {
  bucket = aws_s3_bucket.raw.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable event notifications to SQS
resource "aws_s3_bucket_notification" "raw" {
  bucket = aws_s3_bucket.raw.id

  queue {
    queue_arn     = var.sqs_video_queue_arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "videos/"
  }

  queue {
    queue_arn     = var.sqs_ebook_queue_arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "ebooks/"
  }
}

# Processed content bucket
resource "aws_s3_bucket" "processed" {
  bucket = "${var.project_name}-processed-${random_string.bucket_suffix.result}"

  tags = {
    Name = "${var.project_name}-processed-content"
  }
}

resource "aws_s3_bucket_policy" "processed" {
  bucket = aws_s3_bucket.processed.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontOAI"
        Effect    = "Allow"
        Principal = { AWS = aws_cloudfront_origin_access_identity.main.iam_arn }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.processed.arn}/*"
      }
    ]
  })
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# --- CloudFront Distribution ---
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "${var.project_name} OAI"
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = "index.html"
  comment             = "${var.project_name} content delivery"

  origin {
    domain_name = aws_s3_bucket.processed.bucket_regional_domain_name
    origin_id   = "S3-processed"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-processed"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-cdn"
  }
}
