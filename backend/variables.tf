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

variable "api_url" {
  description = "API URL for the frontend to connect to"
  type        = string
  default     = ""
}

# S3 and CloudFront Variables for Frontend
variable "s3_bucket_name" {
  description = "Name of the S3 bucket for hosting the React app"
  type        = string
  default     = "imagegen-frontend"
}

variable "cloudfront_price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_100"
  
  validation {
    condition     = can(regex("^(PriceClass_100|PriceClass_200|PriceClass_All)$", var.cloudfront_price_class))
    error_message = "Price class must be one of: PriceClass_100, PriceClass_200, PriceClass_All."
  }
}

variable "cloudfront_default_root_object" {
  description = "Default root object for CloudFront distribution"
  type        = string
  default     = "index.html"
}

variable "frontend_build_command" {
  description = "Command to build the React app"
  type        = string
  default     = "npm run build"
}

variable "frontend_source_dir" {
  description = "Source directory for the React app"
  type        = string
  default     = "../my-app"
}

variable "backend_source_dir" {
  description = "Source directory for the backend Express app"
  type        = string
  default     = "."
}

# ECS Variables
variable "ecs_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 512
  
  validation {
    condition     = contains([256, 512, 1024, 2048, 4096], var.ecs_cpu)
    error_message = "ECS CPU must be one of: 256, 512, 1024, 2048, 4096."
  }
}

variable "ecs_memory" {
  description = "Memory (MB) for ECS task"
  type        = number
  default     = 1024
  
  validation {
    condition     = var.ecs_memory >= 512 && var.ecs_memory <= 30720
    error_message = "ECS memory must be between 512 and 30720 MB."
  }
}

variable "openai_api_key_secret_arn" {
  description = "ARN of the AWS Secrets Manager secret containing the OpenAI API key"
  type        = string
  default     = ""
}

variable "fal_key_secret_arn" {
  description = "ARN of the AWS Secrets Manager secret containing the FAL API key"
  type        = string
  default     = ""
}

# Database Variables
variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "imagegen_db"
}

variable "db_username" {
  description = "Username for the PostgreSQL database"
  type        = string
  default     = "postgres"
}

variable "db_instance_class" {
  description = "Instance class for the RDS Aurora instances"
  type        = string
  default     = "db.r5.large"
}

variable "db_backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access the database"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Allow from anywhere - modify for better security
} 