# ImageGen Backend - AWS Lambda Deployment

This directory contains Terraform configuration to deploy the ImageGen backend as an AWS Lambda function with API Gateway.

## 🏗️ Architecture

- **AWS Lambda**: Serverless function running your Node.js/Express application
- **API Gateway**: RESTful API endpoint with proxy integration
- **CloudWatch**: Logging and monitoring
- **IAM**: Secure roles and permissions

## 📋 Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **Node.js** >= 16.x installed
4. **API Keys**:
   - OpenAI API Key
   - FAL AI API Key

## 🚀 Quick Deployment

1. **Clone and setup**:
   ```bash
   # Install dependencies
   npm install
   
   # Build the project
   npm run build
   ```

2. **Configure variables**:
   ```bash
   # Copy the example terraform variables
   cp terraform.tfvars.example terraform.tfvars
   
   # Edit with your actual values
   vim terraform.tfvars
   ```

3. **Deploy**:
   ```bash
   # Make deploy script executable
   chmod +x deploy.sh
   
   # Run deployment
   ./deploy.sh
   ```

## ⚙️ Manual Deployment

If you prefer manual control:

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

## 📁 File Structure

```
.
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Variable definitions
├── outputs.tf                 # Output definitions
├── terraform.tfvars.example   # Example variables file
├── lambda-handler.js          # Lambda entry point
├── deploy.sh                  # Deployment script
└── README-terraform.md        # This file
```

## 🔧 Configuration

### Required Variables

Set these in your `terraform.tfvars` file:

```hcl
aws_region = "us-west-1"
environment = "dev"
openai_api_key = "your-openai-api-key"
fal_key = "your-fal-ai-key"
```

### Optional Variables

```hcl
lambda_timeout = 30          # Lambda timeout in seconds
lambda_memory_size = 512     # Lambda memory in MB
log_retention_days = 14      # CloudWatch log retention
```

## 🌐 API Endpoints

After deployment, your API will be available at the API Gateway URL with these endpoints:

- `GET /` - Health check
- `GET /image` - Get image info
- `POST /image` - Generate image
- `GET /favorites` - Get favorites list
- `POST /favorites` - Add to favorites
- `DELETE /favorites/:id` - Remove from favorites

## 📊 Monitoring

- **CloudWatch Logs**: `/aws/lambda/imagegen-backend-{environment}`
- **API Gateway Logs**: Available in CloudWatch under API Gateway
- **Lambda Metrics**: Available in CloudWatch Lambda section

## 🔒 Security

- Lambda function runs with minimal IAM permissions
- API Gateway has no authentication (add if needed)
- Environment variables are encrypted at rest
- VPC configuration not included (add if needed)

## 💰 Cost Considerations

- **Lambda**: Pay per invocation and execution time
- **API Gateway**: Pay per API call
- **CloudWatch**: Pay for log storage and retention
- **Estimated cost**: ~$0.01-0.10 per day for light usage

## 🛠️ Customization

### Adding Environment Variables

Edit the Lambda function resource in `main.tf`:

```hcl
environment {
  variables = {
    NODE_ENV        = var.environment
    OPENAI_API_KEY  = var.openai_api_key
    FAL_KEY         = var.fal_key
    YOUR_NEW_VAR    = var.your_new_var
  }
}
```

### Increasing Timeout/Memory

Adjust in `variables.tf` or override in `terraform.tfvars`:

```hcl
lambda_timeout = 60      # For longer-running operations
lambda_memory_size = 1024 # For memory-intensive operations
```

### Adding Authentication

Consider adding:
- AWS Cognito User Pools
- API Keys
- Lambda Authorizer
- IAM authentication

## 🔄 Updates

To update your deployment:

```bash
# Build latest changes
npm run build

# Apply updates
terraform apply
```

## 🧹 Cleanup

To destroy all resources:

```bash
terraform destroy
```

## 🆘 Troubleshooting

### Common Issues

1. **Build failures**: Ensure `npm run build` completes successfully
2. **Permission errors**: Check AWS credentials and IAM permissions
3. **API errors**: Check CloudWatch logs for detailed error messages
4. **Timeout errors**: Increase `lambda_timeout` variable

### Debugging

1. **Check Lambda logs**:
   ```bash
   aws logs tail /aws/lambda/imagegen-backend-dev --follow
   ```

2. **Test Lambda directly**:
   ```bash
   aws lambda invoke --function-name imagegen-backend-dev response.json
   ```

3. **Check API Gateway**:
   - Use AWS Console to test API Gateway endpoints
   - Enable CloudWatch logging for API Gateway

## 📚 Additional Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [Serverless HTTP Documentation](https://github.com/dougmoscrop/serverless-http) 