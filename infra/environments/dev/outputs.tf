output "instance_id" {
  value = aws_instance.platform.id
}

output "public_ip" {
  value = aws_instance.platform.public_ip
}

output "ssm_command" {
  value = "aws ssm start-session --target ${aws_instance.platform.id} --region ${var.aws_region}"
}
