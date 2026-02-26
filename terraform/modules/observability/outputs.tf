output "log_group_names" {
  value = { for k, v in aws_cloudwatch_log_group.services : k => v.name }
}

output "dashboard_name" {
  value = aws_cloudwatch_dashboard.main.dashboard_name
}
