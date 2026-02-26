# --- Media Processing Module ---
# Lambda (FFmpeg + ebook), SQS queues, SNS notifications
# All within free tier: 1M Lambda requests, 1M SQS requests, 1M SNS publishes

# --- SQS Queues ---
resource "aws_sqs_queue" "video" {
  name                       = "${var.project_name}-video-jobs"
  visibility_timeout_seconds = 900  # 15 min (match Lambda timeout)
  message_retention_seconds  = 86400

  tags = {
    Name = "${var.project_name}-video-queue"
  }
}

resource "aws_sqs_queue" "ebook" {
  name                       = "${var.project_name}-ebook-jobs"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400

  tags = {
    Name = "${var.project_name}-ebook-queue"
  }
}

# Allow S3 to send messages to SQS
resource "aws_sqs_queue_policy" "video" {
  queue_url = aws_sqs_queue.video.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "s3.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.video.arn
      Condition = {
        ArnEquals = { "aws:SourceArn" = var.raw_bucket_arn }
      }
    }]
  })
}

resource "aws_sqs_queue_policy" "ebook" {
  queue_url = aws_sqs_queue.ebook.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "s3.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.ebook.arn
      Condition = {
        ArnEquals = { "aws:SourceArn" = var.raw_bucket_arn }
      }
    }]
  })
}

# --- SNS Topic (processing complete notifications) ---
resource "aws_sns_topic" "processing_complete" {
  name = "${var.project_name}-processing-complete"

  tags = {
    Name = "${var.project_name}-processing-notifications"
  }
}

# --- Lambda IAM Role ---
resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${var.raw_bucket_arn}/*",
          "${var.processed_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.video.arn,
          aws_sqs_queue.ebook.arn
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.processing_complete.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# --- Video Transcoder Lambda ---
data "archive_file" "video_transcoder" {
  type        = "zip"
  source_dir  = "${path.root}/../lambda/video-transcoder"
  output_path = "${path.root}/../lambda/video-transcoder.zip"
}

resource "aws_lambda_function" "video_transcoder" {
  function_name    = "${var.project_name}-video-transcoder"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = 900  # 15 min max
  memory_size      = 512
  filename         = data.archive_file.video_transcoder.output_path
  source_code_hash = data.archive_file.video_transcoder.output_base64sha256

  environment {
    variables = {
      PROCESSED_BUCKET = var.processed_bucket_name
      SNS_TOPIC_ARN    = aws_sns_topic.processing_complete.arn
    }
  }

  tags = {
    Name = "${var.project_name}-video-transcoder"
  }
}

# SQS trigger for video Lambda
resource "aws_lambda_event_source_mapping" "video" {
  event_source_arn = aws_sqs_queue.video.arn
  function_name    = aws_lambda_function.video_transcoder.arn
  batch_size       = 1
}

# --- Ebook Converter Lambda ---
data "archive_file" "ebook_converter" {
  type        = "zip"
  source_dir  = "${path.root}/../lambda/ebook-converter"
  output_path = "${path.root}/../lambda/ebook-converter.zip"
}

resource "aws_lambda_function" "ebook_converter" {
  function_name    = "${var.project_name}-ebook-converter"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = 300
  memory_size      = 256
  filename         = data.archive_file.ebook_converter.output_path
  source_code_hash = data.archive_file.ebook_converter.output_base64sha256

  environment {
    variables = {
      PROCESSED_BUCKET = var.processed_bucket_name
      SNS_TOPIC_ARN    = aws_sns_topic.processing_complete.arn
    }
  }

  tags = {
    Name = "${var.project_name}-ebook-converter"
  }
}

# SQS trigger for ebook Lambda
resource "aws_lambda_event_source_mapping" "ebook" {
  event_source_arn = aws_sqs_queue.ebook.arn
  function_name    = aws_lambda_function.ebook_converter.arn
  batch_size       = 1
}
