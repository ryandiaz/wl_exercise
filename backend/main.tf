terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Random string for bucket name uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket for Frontend Hosting
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "${var.s3_bucket_name}-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "${var.s3_bucket_name}-${var.environment}"
    Environment = var.environment
    Purpose     = "Frontend Hosting"
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "frontend_bucket_pab" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "frontend_bucket_versioning" {
  bucket = aws_s3_bucket.frontend_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_bucket_encryption" {
  bucket = aws_s3_bucket.frontend_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "frontend_oac" {
  name                              = "${var.s3_bucket_name}-${var.environment}-oac"
  description                       = "Origin Access Control for ${var.s3_bucket_name}-${var.environment}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend_distribution" {
  # S3 Origin for Frontend
  origin {
    domain_name              = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.frontend_bucket.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }

  # ALB Origin for Backend API
  origin {
    domain_name = aws_lb.backend_alb.dns_name
    origin_id   = "ALB-${aws_lb.backend_alb.name}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
    
    # Note: Ensure your backend application handles CORS headers appropriately
    # since requests will come from the CloudFront domain
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = var.cloudfront_default_root_object

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # Cache behavior for API calls - route to ALB
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-${aws_lb.backend_alb.name}"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  # Custom error response for SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  price_class = var.cloudfront_price_class

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${var.s3_bucket_name}-${var.environment}"
    Environment = var.environment
    Purpose     = "Frontend Distribution"
  }
}

# S3 Bucket Policy for CloudFront Access
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend_distribution.arn
          }
        }
      }
    ]
  })
}

# ============================================================================
# Database Infrastructure
# ============================================================================

# VPC for Database
resource "aws_vpc" "database_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-database-vpc"
    Environment = var.environment
    Purpose     = "Database Infrastructure"
  }
}

# Internet Gateway for VPC
resource "aws_internet_gateway" "database_igw" {
  vpc_id = aws_vpc.database_vpc.id

  tags = {
    Name        = "${var.environment}-database-igw"
    Environment = var.environment
  }
}

# Public Subnets for Database (in different AZs)
resource "aws_subnet" "database_public_subnet_1" {
  vpc_id                  = aws_vpc.database_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.environment}-database-public-subnet-1"
    Environment = var.environment
    Type        = "Public"
  }
}

resource "aws_subnet" "database_public_subnet_2" {
  vpc_id                  = aws_vpc.database_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.environment}-database-public-subnet-2"
    Environment = var.environment
    Type        = "Public"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "database_public_rt" {
  vpc_id = aws_vpc.database_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.database_igw.id
  }

  tags = {
    Name        = "${var.environment}-database-public-rt"
    Environment = var.environment
  }
}

# Route Table Associations
resource "aws_route_table_association" "database_public_subnet_1_association" {
  subnet_id      = aws_subnet.database_public_subnet_1.id
  route_table_id = aws_route_table.database_public_rt.id
}

resource "aws_route_table_association" "database_public_subnet_2_association" {
  subnet_id      = aws_subnet.database_public_subnet_2.id
  route_table_id = aws_route_table.database_public_rt.id
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Security Group for Database
resource "aws_security_group" "database_sg" {
  name        = "${var.environment}-database-sg"
  description = "Security group for Aurora PostgreSQL database"
  vpc_id      = aws_vpc.database_vpc.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
    description = "PostgreSQL access from allowed CIDR blocks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "${var.environment}-database-sg"
    Environment = var.environment
    Purpose     = "Database Security"
  }
}

# Database Subnet Group
resource "aws_db_subnet_group" "database_subnet_group" {
  name       = "${var.environment}-database-subnet-group"
  subnet_ids = [aws_subnet.database_public_subnet_1.id, aws_subnet.database_public_subnet_2.id]

  tags = {
    Name        = "${var.environment}-database-subnet-group"
    Environment = var.environment
  }
}

# Random Password for Database
resource "random_password" "database_password" {
  length  = 16
  special = true
}

# Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "postgresql_cluster" {
  cluster_identifier        = "${var.environment}-postgresql-cluster"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  database_name             = var.db_name
  master_username           = var.db_username
  master_password           = random_password.database_password.result
  backup_retention_period   = var.db_backup_retention_period
  preferred_backup_window   = var.db_backup_window
  preferred_maintenance_window = var.db_maintenance_window
  vpc_security_group_ids    = [aws_security_group.database_sg.id]
  db_subnet_group_name      = aws_db_subnet_group.database_subnet_group.name
  skip_final_snapshot       = true  # Set to false for production
  apply_immediately         = true

  tags = {
    Name        = "${var.environment}-postgresql-cluster"
    Environment = var.environment
    Engine      = "aurora-postgresql"
  }
}

# Aurora PostgreSQL Cluster Instances
resource "aws_rds_cluster_instance" "postgresql_cluster_instances" {
  count              = 2
  identifier         = "${var.environment}-postgresql-${count.index}"
  cluster_identifier = aws_rds_cluster.postgresql_cluster.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.postgresql_cluster.engine
  engine_version     = aws_rds_cluster.postgresql_cluster.engine_version
  publicly_accessible = true

  tags = {
    Name        = "${var.environment}-postgresql-${count.index}"
    Environment = var.environment
  }
}

# ============================================================================
# ECS Infrastructure
# ============================================================================

# ECR Repository for Docker Images
resource "aws_ecr_repository" "backend_ecr" {
  name                 = "${var.environment}-imagegen-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.environment}-imagegen-backend"
    Environment = var.environment
    Purpose     = "Backend Container Registry"
  }
}

# ECR Repository Policy
resource "aws_ecr_repository_policy" "backend_ecr_policy" {
  repository = aws_ecr_repository.backend_ecr.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPull"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}

# ECS Cluster
resource "aws_ecs_cluster" "backend_cluster" {
  name = "${var.environment}-imagegen-backend-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "${var.environment}-imagegen-backend-cluster"
    Environment = var.environment
    Purpose     = "Backend ECS Cluster"
  }
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.environment}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.environment}-ecs-task-execution-role"
    Environment = var.environment
  }
}

# ECS Task Role
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.environment}-ecs-task-role"
    Environment = var.environment
  }
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Custom policy for ECS task execution (ECR access and Secrets Manager)
resource "aws_iam_role_policy" "ecs_task_execution_policy" {
  name = "${var.environment}-ecs-task-execution-policy"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          var.openai_api_key_secret_arn,
          var.fal_key_secret_arn
        ]
      }
    ]
  })
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs_log_group" {
  name              = "/ecs/${var.environment}-imagegen-backend"
  retention_in_days = 7

  tags = {
    Name        = "${var.environment}-imagegen-backend-logs"
    Environment = var.environment
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks_sg" {
  name        = "${var.environment}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.database_vpc.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
    description     = "Allow traffic from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "${var.environment}-ecs-tasks-sg"
    Environment = var.environment
  }
}

# Security Group for Application Load Balancer
resource "aws_security_group" "alb_sg" {
  name        = "${var.environment}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.database_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP traffic"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "${var.environment}-alb-sg"
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "backend_alb" {
  name               = "${var.environment}-backend-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.database_public_subnet_1.id, aws_subnet.database_public_subnet_2.id]

  enable_deletion_protection = false

  tags = {
    Name        = "${var.environment}-backend-alb"
    Environment = var.environment
    Purpose     = "Backend Load Balancer"
  }
}

# ALB Target Group
resource "aws_lb_target_group" "backend_tg" {
  name     = "${var.environment}-backend-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.database_vpc.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = {
    Name        = "${var.environment}-backend-tg"
    Environment = var.environment
  }
}

# ALB Listener
resource "aws_lb_listener" "backend_listener" {
  load_balancer_arn = aws_lb.backend_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend_tg.arn
  }

  tags = {
    Name        = "${var.environment}-backend-listener"
    Environment = var.environment
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "backend_task" {
  family                   = "${var.environment}-imagegen-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${aws_ecr_repository.backend_ecr.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = "8080"
        },
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "DB_HOST"
          value = aws_rds_cluster.postgresql_cluster.endpoint
        },
        {
          name  = "DB_PORT"
          value = tostring(aws_rds_cluster.postgresql_cluster.port)
        },
        {
          name  = "DB_NAME"
          value = aws_rds_cluster.postgresql_cluster.database_name
        },
        {
          name  = "DB_USER"
          value = aws_rds_cluster.postgresql_cluster.master_username
        },
        {
          name  = "DB_PASSWORD"
          value = random_password.database_password.result
        }
      ]

      secrets = [
        {
          name      = "OPENAI_API_KEY"
          valueFrom = var.openai_api_key_secret_arn
        },
        {
          name      = "FAL_KEY"
          valueFrom = var.fal_key_secret_arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs_log_group.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command = ["CMD-SHELL", "curl -f http://localhost:8080/ || exit 1"]
        interval = 30
        timeout = 5
        retries = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.environment}-imagegen-backend-task"
    Environment = var.environment
  }
}

# ECS Service
resource "aws_ecs_service" "backend_service" {
  name            = "${var.environment}-imagegen-backend-service"
  cluster         = aws_ecs_cluster.backend_cluster.id
  task_definition = aws_ecs_task_definition.backend_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks_sg.id]
    subnets          = [aws_subnet.database_public_subnet_1.id, aws_subnet.database_public_subnet_2.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend_tg.arn
    container_name   = "backend"
    container_port   = 8080
  }

  depends_on = [
    aws_lb_listener.backend_listener
  ]

  tags = {
    Name        = "${var.environment}-imagegen-backend-service"
    Environment = var.environment
  }
}

# Build and Push Docker Image
resource "null_resource" "build_and_push_backend" {
  triggers = {
    # Trigger on any change to the backend source code
    source_code_hash = filebase64sha256("${var.backend_source_dir}/src/index.ts")
    dockerfile_hash  = filebase64sha256("${var.backend_source_dir}/Dockerfile")
    package_json_hash = filebase64sha256("${var.backend_source_dir}/package.json")
  }

  provisioner "local-exec" {
    command = <<EOF
      cd ${var.backend_source_dir}
      
      # Get AWS account ID
      AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
      
      # Login to ECR
      aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.${var.aws_region}.amazonaws.com
      
      # Build Docker image
      docker build -t ${aws_ecr_repository.backend_ecr.name}:latest .
      
      # Tag the image
      docker tag ${aws_ecr_repository.backend_ecr.name}:latest ${aws_ecr_repository.backend_ecr.repository_url}:latest
      
      # Push to ECR
      docker push ${aws_ecr_repository.backend_ecr.repository_url}:latest
    EOF
  }

  depends_on = [
    aws_ecr_repository.backend_ecr
  ]
}

# Force ECS service deployment after image push
resource "null_resource" "force_ecs_deployment" {
  triggers = {
    # This will trigger whenever the Docker image is rebuilt
    image_hash = null_resource.build_and_push_backend.triggers.source_code_hash
  }

  provisioner "local-exec" {
    command = <<EOF
      aws ecs update-service --cluster ${aws_ecs_cluster.backend_cluster.name} --service ${aws_ecs_service.backend_service.name} --force-new-deployment --region ${var.aws_region}
    EOF
  }

  depends_on = [
    aws_ecs_service.backend_service,
    null_resource.build_and_push_backend
  ]
}

# ============================================================================
# Frontend Build and Deploy
# ============================================================================

# Build and Deploy Frontend
resource "null_resource" "build_and_deploy_frontend" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<EOF
      cd ${var.frontend_source_dir}
      
      # Install dependencies
      npm install
      
      # Create production environment file
      cat > .env.production << EOL
REACT_APP_API_URL=https://${aws_cloudfront_distribution.frontend_distribution.domain_name}
REACT_APP_ENVIRONMENT=${var.environment}
REACT_APP_DB_HOST=${aws_rds_cluster.postgresql_cluster.endpoint}
REACT_APP_DB_PORT=${aws_rds_cluster.postgresql_cluster.port}
EOL
      
      # Build the React app
      ${var.frontend_build_command}
      
      # Sync build files to S3
      aws s3 sync build/ s3://${aws_s3_bucket.frontend_bucket.id} --delete
      
      # Invalidate CloudFront cache
      aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.frontend_distribution.id} --paths "/*"
    EOF
  }

  depends_on = [
    aws_s3_bucket.frontend_bucket,
    aws_cloudfront_distribution.frontend_distribution,
    aws_rds_cluster.postgresql_cluster,
    aws_lb.backend_alb
  ]
}
