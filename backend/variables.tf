variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = can(regex("^(dev|staging|prod)$", var.environment))
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "openai_api_key" {
  description = "OpenAI API Key for GPT integration"
  type        = string
  sensitive   = true
}

variable "fal_key" {
  description = "FAL AI API Key for image generation"
  type        = string
  sensitive   = true
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "log_retention_days" {
  description = "CloudWatch logs retention period in days"
  type        = number
  default     = 14
}

# RDS Variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "imagegen"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "imagegen_user"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS instance in GB"
  type        = number
  default     = 20
}

variable "db_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

# EC2 Variables for Migration Instance
variable "ec2_instance_type" {
  description = "EC2 instance type for migration instance"
  type        = string
  default     = "t3.micro"
}

variable "ec2_key_name" {
  description = "EC2 Key Pair name for SSH access"
  type        = string
  default     = null
}

variable "ec2_associate_public_ip" {
  description = "Whether to associate a public IP with the EC2 instance"
  type        = bool
  default     = true
}

# DynamoDB Variables
variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table for storing favorites"
  type        = string
  default     = "imagegen-favorites"
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode (PAY_PER_REQUEST or PROVISIONED)"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "dynamodb_read_capacity" {
  description = "DynamoDB read capacity units (only used if billing_mode is PROVISIONED)"
  type        = number
  default     = 5
}

variable "dynamodb_write_capacity" {
  description = "DynamoDB write capacity units (only used if billing_mode is PROVISIONED)"
  type        = number
  default     = 5
} 