# ImageGen - AI-Powered Image Generation Platform

~~See a running demo here : https://d104an3nk84c9.cloudfront.net/~~
Site has been taken down as of July 10

## 🏗️ Architecture Overview

This project follows a modern cloud-native architecture with the following components:

### Frontend (`my-app/`)

The frontend is a Typescript React app with several components

The React app in `my-app/` is organized into modular, reusable components to provide a seamless user experience for AI-powered image generation and management. Key components include:

- **ImageCanvas**: The main workspace where users can view, arrange, and interact with generated images. Supports drag-and-drop for free-form positioning and layout management.
- **ImageTile**: Represents each individual image on the canvas. Includes controls for duplicating, deleting, and generating creative variations, as well as visual feedback for loading and generation states.
- **PromptInput**: Allows users to enter and edit text prompts for image generation. Integrates with backend APIs to trigger real-time image updates as the prompt changes.
- **Toolbar**: Provides global actions such as theme switching, layout cleanup, and access to favorites.
- **FavoritesPanel**: Lets users view, add, and remove favorite images, persisting selections across sessions.
- **ThemeProvider**: Manages light/dark mode and applies consistent theming across the app.

The app leverages React Router for navigation, CSS modules for scoped styling, and context providers for global state such as theme and user preferences. All components are written in TypeScript for type safety and improved developer experience.

### Backend

The Backend is composed primarily of an API server and database deployed on AWS infrastructure with Terraform

The backend is composed of several cloud resources, all provisioned and managed using Terraform for reproducibility and scalability. The main components deployed include:

- **ECS Cluster & Fargate Services**: The Node.js/Express API server is containerized with Docker and deployed as a service on AWS ECS (Elastic Container Service) using Fargate, which provides serverless compute for containers. Terraform defines the ECS cluster, task definitions, service scaling, and networking including the Application Load Balancer.

- **RDS Aurora PostgreSQL Database**: The backend uses an Amazon Aurora PostgreSQL cluster for persistent storage of favorites and image metadata.

- **AWS Secrets Manager**: API keys (such as OpenAI and FAL AI keys) and other sensitive configuration values are securely stored in AWS Secrets Manager. Terraform provisions the secrets and grants the ECS task role permission to access them at runtime.

- **IAM Roles and Policies**: Terraform creates IAM roles with least-privilege permissions for ECS tasks, allowing secure access to Secrets Manager, S3, CloudWatch, and other AWS services as needed.

- **VPC, Subnets, and Security Groups**: All backend resources are deployed within a dedicated VPC with public and private subnets for network isolation. Security groups are configured to tightly control inbound and outbound traffic between the ALB, ECS tasks, and the database.

- **CloudWatch Logging**: Application and infrastructure logs are sent to AWS CloudWatch for monitoring and troubleshooting. Terraform configures log groups and log drivers for the ECS service.

- **ECR (Elastic Container Registry)**: The Docker image for the backend is built and pushed to a private ECR repository, which ECS pulls from during deployment. Terraform manages the ECR repository lifecycle.

All of these resources are defined as code in the `backend/` Terraform configuration, enabling automated, repeatable deployments and easy updates to the backend infrastructure.


We also configure frontend deployment details with terraform. The react frontend is deployed by pushing the built single page application artifacts to S3.

We use Cloudfront as a CDN caching layer. We also route from cloudfront to the API server so both our frontend and api calls share a common origin.


## 📋 Prerequisites For Development and Deployment

### Local Development
- **Node.js** (v18 or higher)
- **npm**
- **PostgreSQL** psql client for database management

### AWS Deployment
- **AWS CLI** configured with appropriate credentials
- **Terraform** (v1.0 or higher)
- **Docker** (for building container images)

### API Keys Required
- **OpenAI API Key** (for prompt variations)
- **FAL API Key** (for image generation)

## 🛠️ Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd imagegen

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../my-app
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
# API Keys
OPENAI_API_KEY=your_openai_api_key_here
FAL_KEY=your_fal_api_key_here

# Database (for local development)
DATABASE_URL=postgresql://username:password@localhost:5432/imagegen_db

# Server Configuration
PORT=8080
```
### 3. Start Development Servers

```bash
# Terminal 1: Start backend server
cd backend
npm run dev

# Terminal 2: Start frontend development server
cd my-app
npm start
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080`


### Database Setup

When testing locally you will first need to start a PostgreSQL database or connect to a deployed db.

After following the Terraform deployment steps below, you can extract the `database_endpoint` from `terraform output`

To apply the migrations to your target database, run the following:
```bash
# Run 
cd backend
psql -h <db_cluster_url> -p 5432 -d imagegen_db -U postgres
imagen_db=> \i migrations/001_create_favorites_table.sql

```



## 🌩️ AWS Deployment with Terraform

### 1. Prerequisites Setup

```bash
# Install and configure AWS CLI
aws configure

# Verify Terraform installation
terraform version
```

### 2. AWS Secrets Manager Setup

Create secrets in AWS Secrets Manager for your API keys:

```bash
# Create OpenAI API key secret
aws secretsmanager create-secret \
  --name "openai-api-key" \
  --secret-string "your-openai-api-key"

# Create FAL API key secret
aws secretsmanager create-secret \
  --name "fal-api-key" \
  --secret-string "your-fal-api-key"
```

### 3. Terraform Configuration

```bash
cd backend

# Copy and customize terraform variables
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your specific values:

```hcl
aws_region = "us-west-1"
environment = "dev"

# Update these with your actual secret ARNs
openai_api_key_secret_arn = "arn:aws:secretsmanager:us-west-1:123456789012:secret:openai-api-key-abcdef"
fal_key_secret_arn = "arn:aws:secretsmanager:us-west-1:123456789012:secret:fal-api-key-abcdef"

# Customize other values as needed
s3_bucket_name = "your-unique-bucket-name"
ecs_cpu = 512
ecs_memory = 1024
```

### 4. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply infrastructure changes
terraform apply
```

The output values will contain relevant urls and ids for deployed resources. To get the url of your deployed
frontend run `terraform output -raw frontend_url`

### 5. Build and Deploy Applications

From here you can modify the code and continually deploy with `terraform apply`. The frontend React app will always be rebuilt and 
deployed and the backend server will be rebuilt and deployed when code changed are detected.
