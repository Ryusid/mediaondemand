# --- Observability Module ---
# CloudWatch log groups, metric alarms, and dashboard (free tier)

# Log groups for each microservice
resource "aws_cloudwatch_log_group" "services" {
  for_each          = toset(var.service_names)
  name              = "/mediaondemand/${each.key}"
  retention_in_days = 7  # Keep logs for 7 days (minimizes free tier usage)

  tags = {
    Name    = "${var.project_name}-${each.key}-logs"
    Service = each.key
  }
}

# Log group for Lambda functions
resource "aws_cloudwatch_log_group" "lambda_video" {
  name              = "/aws/lambda/${var.project_name}-video-transcoder"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "lambda_ebook" {
  name              = "/aws/lambda/${var.project_name}-ebook-converter"
  retention_in_days = 7
}

# --- Alarms (free tier: 10 alarms) ---

# EC2 CPU alarm
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  alarm_name          = "${var.project_name}-ec2-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "EC2 CPU utilization > 80%"

  dimensions = {
    InstanceId = var.ec2_instance_id
  }

  tags = {
    Name = "${var.project_name}-cpu-alarm"
  }
}

# RDS CPU alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project_name}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization > 80%"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }

  tags = {
    Name = "${var.project_name}-rds-cpu-alarm"
  }
}

# RDS free storage alarm
resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "${var.project_name}-rds-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2000000000  # 2GB
  alarm_description   = "RDS free storage < 2GB"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }

  tags = {
    Name = "${var.project_name}-rds-storage-alarm"
  }
}

# --- Dashboard (free tier: 3 dashboards) ---
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "EC2 CPU Utilization"
          metrics = [["AWS/EC2", "CPUUtilization", "InstanceId", var.ec2_instance_id]]
          period  = 300
          stat    = "Average"
          region  = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "RDS CPU Utilization"
          metrics = [["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.db_instance_id]]
          period  = 300
          stat    = "Average"
          region  = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Lambda Invocations"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.project_name}-video-transcoder"],
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.project_name}-ebook-converter"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "SQS Messages"
          metrics = [
            ["AWS/SQS", "NumberOfMessagesReceived", "QueueName", "${var.project_name}-video-jobs"],
            ["AWS/SQS", "NumberOfMessagesReceived", "QueueName", "${var.project_name}-ebook-jobs"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
        }
      }
    ]
  })
}
