output "ec2_public_ip" {
  value = aws_instance.main.public_ip
}

output "ec2_instance_id" {
  value = aws_instance.main.id
}

output "ecr_repository_urls" {
  value = { for k, v in aws_ecr_repository.services : k => v.repository_url }
}
