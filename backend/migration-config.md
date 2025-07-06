# Database Migration Configuration

This guide explains how to set up the environment variables needed for the database migration script using your Terraform outputs.

## Step 1: Get Database Connection Details from Terraform

After deploying your infrastructure with Terraform, run the following commands to get the database connection details:

```bash
# Get the RDS endpoint
terraform output db_instance_endpoint

# Get the database port
terraform output db_instance_port

# Get the database name
terraform output db_name

# Get the database username
terraform output db_username
```

## Step 2: Create Environment Variables

Create a `.env` file in the backend directory with the following format:

```bash
# Copy this template and replace with your actual values

# Database host (from terraform output db_instance_endpoint)
DB_HOST=your-rds-endpoint.amazonaws.com

# Database username (from terraform output db_username)
DB_USER=imagegen_user

# Database password (the one you set in terraform.tfvars)
DB_PASSWORD=your_secure_database_password

# Database name (from terraform output db_name)
DB_NAME=imagegen

# Database port (from terraform output db_instance_port)
DB_PORT=5432

# Environment (set to 'production' for SSL connections to RDS)
NODE_ENV=production
```

## Step 3: Quick Setup Script

Here's a quick script to set up your environment variables:

```bash
#!/bin/bash

# Navigate to backend directory
cd backend

# Get values from Terraform outputs
DB_HOST=$(terraform output -raw db_instance_endpoint)
DB_PORT=$(terraform output -raw db_instance_port)
DB_NAME=$(terraform output -raw db_name)
DB_USER=$(terraform output -raw db_username)

# Create .env file (you'll need to add the password manually)
cat > .env << EOF
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=your_secure_database_password
DB_NAME=$DB_NAME
DB_PORT=$DB_PORT
NODE_ENV=production
EOF

echo "Environment file created! Don't forget to update DB_PASSWORD with your actual password."
```

## Step 4: Run the Migration

Once your `.env` file is set up, run the migration:

```bash
npm run migrate
```

## Important Notes

1. **Database Password**: The database password is the one you set in your `terraform.tfvars` file as `db_password`.

2. **SSL Connection**: Since you're connecting to RDS, `NODE_ENV=production` enables SSL connections.

3. **Security**: The `.env` file is ignored by git, so your credentials won't be committed to version control.

4. **Default Values**: Based on your Terraform configuration:
   - Default database name: `imagegen`
   - Default username: `imagegen_user`
   - Default port: `5432`

## Troubleshooting

If the migration fails:

1. Verify your RDS instance is running and accessible
2. Check that your security groups allow connections on port 5432
3. Ensure the database password matches what you set in Terraform
4. Verify the database name exists (it should be created automatically by Terraform) 