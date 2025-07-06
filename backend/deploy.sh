#!/bin/bash

# ImageGen Backend Lambda Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting ImageGen Backend Lambda deployment...${NC}"

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}⚠️  terraform.tfvars not found. Creating from example...${NC}"
    cp terraform.tfvars.example terraform.tfvars
    echo -e "${RED}❌ Please update terraform.tfvars with your actual API keys before proceeding!${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
    npm install
fi

# Build the project
echo -e "${YELLOW}🔨 Building TypeScript project...${NC}"
npm run build

# Initialize Terraform if needed
if [ ! -d ".terraform" ]; then
    echo -e "${YELLOW}🏗️  Initializing Terraform...${NC}"
    terraform init
fi

# Plan the deployment
echo -e "${YELLOW}📋 Planning Terraform deployment...${NC}"
terraform plan

# Ask for confirmation
echo -e "${YELLOW}❓ Do you want to apply these changes? (y/N)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${YELLOW}🚀 Applying Terraform configuration...${NC}"
    terraform apply -auto-approve
    
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo -e "${GREEN}🌐 API Gateway URL:${NC}"
    terraform output api_gateway_url
    
    echo -e "${GREEN}📝 Lambda Function Name:${NC}"
    terraform output lambda_function_name
    
    echo -e "${GREEN}📊 CloudWatch Logs:${NC}"
    terraform output cloudwatch_log_group
else
    echo -e "${YELLOW}❌ Deployment cancelled.${NC}"
fi 