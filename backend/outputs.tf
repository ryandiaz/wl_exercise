# Frontend S3 and CloudFront Outputs
output "frontend_bucket_name" {
  description = "Name of the S3 bucket hosting the frontend"
  value       = aws_s3_bucket.frontend_bucket.id
}

output "frontend_bucket_arn" {
  description = "ARN of the S3 bucket hosting the frontend"
  value       = aws_s3_bucket.frontend_bucket.arn
}

output "frontend_bucket_website_endpoint" {
  description = "Website endpoint of the S3 bucket"
  value       = aws_s3_bucket.frontend_bucket.website_endpoint
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend_distribution.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend_distribution.domain_name
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend_distribution.arn
}

output "frontend_url" {
  description = "URL of the deployed frontend application"
  value       = "https://${aws_cloudfront_distribution.frontend_distribution.domain_name}"
}

# ECS and Backend Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.backend_cluster.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.backend_cluster.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.backend_service.name
}

output "backend_alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.backend_alb.dns_name
}

output "backend_alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.backend_alb.zone_id
}

output "backend_url" {
  description = "URL of the deployed backend API"
  value       = "http://${aws_lb.backend_alb.dns_name}"
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.backend_ecr.repository_url
}

output "ecr_repository_name" {
  description = "Name of the ECR repository"
  value       = aws_ecr_repository.backend_ecr.name
}

# Database Outputs
output "database_endpoint" {
  description = "Aurora PostgreSQL cluster endpoint"
  value       = aws_rds_cluster.postgresql_cluster.endpoint
}

output "database_reader_endpoint" {
  description = "Aurora PostgreSQL cluster reader endpoint"
  value       = aws_rds_cluster.postgresql_cluster.reader_endpoint
}

output "database_port" {
  description = "Aurora PostgreSQL cluster port"
  value       = aws_rds_cluster.postgresql_cluster.port
}

output "database_name" {
  description = "PostgreSQL database name"
  value       = aws_rds_cluster.postgresql_cluster.database_name
}

output "database_username" {
  description = "PostgreSQL database username"
  value       = aws_rds_cluster.postgresql_cluster.master_username
}

output "database_password" {
  description = "PostgreSQL database password"
  value       = random_password.database_password.result
  sensitive   = true
}

output "database_connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${aws_rds_cluster.postgresql_cluster.master_username}:${random_password.database_password.result}@${aws_rds_cluster.postgresql_cluster.endpoint}:${aws_rds_cluster.postgresql_cluster.port}/${aws_rds_cluster.postgresql_cluster.database_name}"
  sensitive   = true
}

output "vpc_id" {
  description = "ID of the VPC created for the database"
  value       = aws_vpc.database_vpc.id
}

output "database_security_group_id" {
  description = "ID of the security group for the database"
  value       = aws_security_group.database_sg.id
} 