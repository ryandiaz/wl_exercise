terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "imagegen-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# IAM Policy for Lambda VPC Access
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# IAM Policy for Lambda DynamoDB Access
resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "imagegen-lambda-dynamodb-policy-${var.environment}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.favorites_table.arn,
          "${aws_dynamodb_table.favorites_table.arn}/*"
        ]
      }
    ]
  })
}

# Create deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-package"
  output_path = "${path.module}/lambda-deployment.zip"
  depends_on  = [null_resource.build_lambda]
}

# Build Lambda package
resource "null_resource" "build_lambda" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<EOF
      # Clean and prepare
      rm -rf lambda-package
      mkdir -p lambda-package
      
      # Build TypeScript
      npm run build
      
      # Copy built files
      cp -r dist/* lambda-package/
      
      # Copy package.json and install production dependencies
      cp package.json lambda-package/
      cd lambda-package && npm install --production --platform=linux --arch=x64
      
      # Copy lambda handler
      cp ../lambda-handler.js ./
    EOF
  }
}

# Lambda Function
resource "aws_lambda_function" "imagegen_lambda" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "imagegen-backend-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda-handler.handler"
  runtime         = "nodejs18.x"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  vpc_config {
    subnet_ids         = data.aws_subnets.default.ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      NODE_ENV        = var.environment
      OPENAI_API_KEY  = var.openai_api_key
      FAL_KEY         = var.fal_key
      DB_HOST         = aws_db_instance.imagegen_db.endpoint
      DB_PORT         = aws_db_instance.imagegen_db.port
      DB_NAME         = aws_db_instance.imagegen_db.db_name
      DB_USERNAME     = aws_db_instance.imagegen_db.username
      DB_PASSWORD     = var.db_password
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.favorites_table.name
      AWS_REGION      = var.aws_region
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_vpc,
    aws_iam_role_policy.lambda_dynamodb_policy,
    aws_cloudwatch_log_group.lambda_logs
  ]
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/imagegen-backend-${var.environment}"
  retention_in_days = var.log_retention_days
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "imagegen_api" {
  name        = "imagegen-api-${var.environment}"
  description = "API Gateway for ImageGen Backend"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# API Gateway Resource (proxy)
resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.imagegen_api.id
  parent_id   = aws_api_gateway_rest_api.imagegen_api.root_resource_id
  path_part   = "{proxy+}"
}

# API Gateway Method (proxy)
resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.imagegen_api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

# API Gateway Method (root)
resource "aws_api_gateway_method" "proxy_root" {
  rest_api_id   = aws_api_gateway_rest_api.imagegen_api.id
  resource_id   = aws_api_gateway_rest_api.imagegen_api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

# API Gateway Integration (proxy)
resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.imagegen_api.id
  resource_id = aws_api_gateway_method.proxy.resource_id
  http_method = aws_api_gateway_method.proxy.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.imagegen_lambda.invoke_arn
}

# API Gateway Integration (root)
resource "aws_api_gateway_integration" "lambda_root" {
  rest_api_id = aws_api_gateway_rest_api.imagegen_api.id
  resource_id = aws_api_gateway_method.proxy_root.resource_id
  http_method = aws_api_gateway_method.proxy_root.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.imagegen_lambda.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "imagegen_deployment" {
  depends_on = [
    aws_api_gateway_integration.lambda,
    aws_api_gateway_integration.lambda_root,
  ]

  rest_api_id = aws_api_gateway_rest_api.imagegen_api.id
  stage_name  = var.environment

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.proxy.id,
      aws_api_gateway_method.proxy_root.id,
      aws_api_gateway_integration.lambda.id,
      aws_api_gateway_integration.lambda_root.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.imagegen_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.imagegen_api.execution_arn}/*/*"
}

# VPC and Networking for RDS
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group for RDS
resource "aws_security_group" "rds_sg" {
  name        = "imagegen-rds-sg-${var.environment}"
  description = "Security group for RDS instance"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_migration_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "imagegen-rds-sg-${var.environment}"
    Environment = var.environment
  }
}

# Security Group for Lambda (to allow RDS access)
resource "aws_security_group" "lambda_sg" {
  name        = "imagegen-lambda-sg-${var.environment}"
  description = "Security group for Lambda function"
  vpc_id      = data.aws_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "imagegen-lambda-sg-${var.environment}"
    Environment = var.environment
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "imagegen_db_subnet_group" {
  name       = "imagegen-db-subnet-group-${var.environment}"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name        = "imagegen-db-subnet-group-${var.environment}"
    Environment = var.environment
  }
}

# RDS Instance
resource "aws_db_instance" "imagegen_db" {
  identifier                = "imagegen-db-${var.environment}"
  engine                    = "postgres"
  engine_version            = "17.5"
  instance_class            = var.db_instance_class
  allocated_storage         = var.db_allocated_storage
  storage_type              = "gp2"
  storage_encrypted         = true
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.imagegen_db_subnet_group.name
  
  backup_retention_period = var.db_backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = {
    Name        = "imagegen-db-${var.environment}"
    Environment = var.environment
  }
}

# Get the latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Security Group for EC2 Migration Instance
resource "aws_security_group" "ec2_migration_sg" {
  name        = "imagegen-ec2-migration-sg-${var.environment}"
  description = "Security group for EC2 migration instance"
  vpc_id      = data.aws_vpc.default.id

  # SSH access (optional, only if key pair is provided)
  dynamic "ingress" {
    for_each = var.ec2_key_name != null ? [1] : []
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  # Outbound internet access for package installation
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "imagegen-ec2-migration-sg-${var.environment}"
    Environment = var.environment
  }
}

# IAM Role for EC2 Migration Instance
resource "aws_iam_role" "ec2_migration_role" {
  name = "imagegen-ec2-migration-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "imagegen-ec2-migration-role-${var.environment}"
    Environment = var.environment
  }
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_migration_profile" {
  name = "imagegen-ec2-migration-profile-${var.environment}"
  role = aws_iam_role.ec2_migration_role.name

  tags = {
    Name        = "imagegen-ec2-migration-profile-${var.environment}"
    Environment = var.environment
  }
}

# IAM Policy for EC2 to access SSM (for session manager)
resource "aws_iam_role_policy_attachment" "ec2_ssm_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.ec2_migration_role.name
}

# EC2 Instance for Data Migration
resource "aws_instance" "migration_instance" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = var.ec2_instance_type
  key_name                    = var.ec2_key_name
  vpc_security_group_ids      = [aws_security_group.ec2_migration_sg.id]
  subnet_id                   = data.aws_subnets.default.ids[0]
  associate_public_ip_address = var.ec2_associate_public_ip
  iam_instance_profile        = aws_iam_instance_profile.ec2_migration_profile.name

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    
    # Install PostgreSQL client
    yum install -y postgresql
    
    # Install Node.js and npm for running migration scripts
    yum install -y nodejs npm
    
    # Install git for cloning repositories
    yum install -y git
    
    # Create migration directory
    mkdir -p /opt/migrations
    chown ec2-user:ec2-user /opt/migrations
    
    # Create environment file with database connection info
    cat > /home/ec2-user/.env << EOL
DB_HOST=${aws_db_instance.imagegen_db.endpoint}
DB_PORT=${aws_db_instance.imagegen_db.port}
DB_NAME=${aws_db_instance.imagegen_db.db_name}
DB_USERNAME=${aws_db_instance.imagegen_db.username}
DB_PASSWORD=${var.db_password}
EOL
    
    chown ec2-user:ec2-user /home/ec2-user/.env
    chmod 600 /home/ec2-user/.env
    
    # Add psql connection alias to bashrc
    echo "alias psql-connect='psql -h ${aws_db_instance.imagegen_db.endpoint} -p ${aws_db_instance.imagegen_db.port} -U ${aws_db_instance.imagegen_db.username} -d ${aws_db_instance.imagegen_db.db_name}'" >> /home/ec2-user/.bashrc
    
    # Source environment variables in bashrc
    echo "export \$(cat /home/ec2-user/.env | xargs)" >> /home/ec2-user/.bashrc
  EOF
  )

  tags = {
    Name        = "imagegen-migration-instance-${var.environment}"
    Environment = var.environment
    Purpose     = "Data Migration"
  }
}

# DynamoDB Table for Image Favorites
resource "aws_dynamodb_table" "favorites_table" {
  name           = "${var.dynamodb_table_name}-${var.environment}"
  billing_mode   = var.dynamodb_billing_mode
  
  # Only set capacity if using PROVISIONED billing mode
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null

  hash_key  = "userId"
  range_key = "imageId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "imageId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  # Global Secondary Index for querying by createdAt
  global_secondary_index {
    name     = "CreatedAtIndex"
    hash_key = "userId"
    range_key = "createdAt"
    
    projection_type = "ALL"
    
    read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
    write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "${var.dynamodb_table_name}-${var.environment}"
    Environment = var.environment
    Purpose     = "Image Favorites Storage"
  }
}
