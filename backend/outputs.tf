output "api_gateway_url" {
  description = "URL of the API Gateway endpoint"
  value       = aws_api_gateway_deployment.imagegen_deployment.invoke_url
}

output "api_gateway_stage_url" {
  description = "Full URL of the API Gateway with stage"
  value       = "${aws_api_gateway_deployment.imagegen_deployment.invoke_url}/${var.environment}"
}

output "lambda_function_name" {
  description = "Name of the deployed Lambda function"
  value       = aws_lambda_function.imagegen_lambda.function_name
}

output "lambda_function_arn" {
  description = "ARN of the deployed Lambda function"
  value       = aws_lambda_function.imagegen_lambda.arn
}

output "lambda_function_url" {
  description = "Invoke URL for the Lambda function"
  value       = aws_lambda_function.imagegen_lambda.invoke_arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name for Lambda function"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

# RDS Outputs
output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.imagegen_db.endpoint
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.imagegen_db.port
}

output "db_instance_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.imagegen_db.identifier
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.imagegen_db.db_name
}

output "db_username" {
  description = "Database master username"
  value       = aws_db_instance.imagegen_db.username
  sensitive   = true
}

# EC2 Migration Instance Outputs
output "migration_instance_id" {
  description = "ID of the migration EC2 instance"
  value       = aws_instance.migration_instance.id
}

output "migration_instance_public_ip" {
  description = "Public IP address of the migration EC2 instance"
  value       = aws_instance.migration_instance.public_ip
}

output "migration_instance_private_ip" {
  description = "Private IP address of the migration EC2 instance"
  value       = aws_instance.migration_instance.private_ip
}

output "migration_instance_public_dns" {
  description = "Public DNS name of the migration EC2 instance"
  value       = aws_instance.migration_instance.public_dns
}

output "migration_instance_ssh_command" {
  description = "SSH command to connect to the migration instance (if key pair is configured)"
  value       = var.ec2_key_name != null ? "ssh -i ~/.ssh/${var.ec2_key_name}.pem ec2-user@${aws_instance.migration_instance.public_ip}" : "Key pair not configured - use AWS Session Manager"
}

output "migration_instance_psql_command" {
  description = "Command to connect to the database from the migration instance"
  value       = "psql -h ${aws_db_instance.imagegen_db.endpoint} -p ${aws_db_instance.imagegen_db.port} -U ${aws_db_instance.imagegen_db.username} -d ${aws_db_instance.imagegen_db.db_name}"
}

# DynamoDB Outputs
output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for favorites"
  value       = aws_dynamodb_table.favorites_table.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table for favorites"
  value       = aws_dynamodb_table.favorites_table.arn
}

output "dynamodb_table_id" {
  description = "ID of the DynamoDB table for favorites"
  value       = aws_dynamodb_table.favorites_table.id
}

output "dynamodb_table_stream_arn" {
  description = "ARN of the DynamoDB table stream (if enabled)"
  value       = aws_dynamodb_table.favorites_table.stream_arn
} 