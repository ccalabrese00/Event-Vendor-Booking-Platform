# AWS Deployment Setup Guide

## ✅ Files Already Uploaded to GitHub

Your AWS deployment configuration is now in the `features` branch:
- `Dockerfile` - Container build instructions
- `docker-compose.yml` - Local development with Docker
- `terraform/` - Infrastructure as Code (VPC, ECS, RDS, ALB)
- `next.config.js` - Next.js configuration for standalone output
- `app/api/health/route.ts` - Health check endpoint

## ⏳ One Manual Step Required

The GitHub Actions workflow file needs to be added manually:

### Step 1: Go to GitHub
Visit: https://github.com/ccalabrese00/Event-Vendor-Booking-Platform/tree/features

### Step 2: Create the Workflow File
1. Click **"Add file"** → **"Create new file"**
2. File path: `.github/workflows/aws-deploy.yml`
3. Copy the content below:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main, features ]
  pull_request:
    branches: [ main ]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: event-vendor-platform
  ECS_CLUSTER: event-vendor-cluster
  ECS_SERVICE: event-vendor-service
  ECS_TASK_DEFINITION: .aws/task-definition.json

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build, tag, and push image to Amazon ECR
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT
```

4. Click **"Commit new file"**

## 🔐 Required GitHub Secrets

Go to: https://github.com/ccalabrese00/Event-Vendor-Booking-Platform/settings/secrets/actions

Add these secrets:

| Secret Name | Where to Get It |
|-------------|-----------------|
| `AWS_ACCESS_KEY_ID` | IAM → Users → github-actions-deploy → Security credentials |
| `AWS_SECRET_ACCESS_KEY` | Same as above |
| `DATABASE_URL` | After creating RDS: `postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/eventvendor` |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ALB DNS name (after Terraform apply) or your custom domain |

## 🚀 Deploy Infrastructure with Terraform

```bash
cd terraform

# Initialize
terraform init

# Plan (see what will be created)
terraform plan -var="db_password=YourStrongPassword123!"

# Apply (create everything)
terraform apply -var="db_password=YourStrongPassword123!"

# Get outputs
terraform output
```

This creates:
- VPC with 2 public subnets
- Application Load Balancer
- ECS Fargate cluster (2 containers)
- RDS PostgreSQL database
- ECR repository
- Security groups
- CloudWatch logs

## 📋 Quick Start Checklist

- [ ] Create IAM user `github-actions-deploy` with programmatic access
- [ ] Attach policies: ECR, ECS, RDS
- [ ] Add GitHub secrets (AWS credentials, DB URL, NextAuth)
- [ ] Run `terraform apply` to create infrastructure
- [ ] Manually add `.github/workflows/aws-deploy.yml`
- [ ] Push to `main` branch to trigger deployment
- [ ] Visit ALB DNS name to see your app

## 🆘 Troubleshooting

**Push failed with "workflow scope" error?**
- Manually create the workflow file via GitHub web UI (instructions above)

**Database connection failed?**
- Check RDS security group allows port 5432 from ECS tasks
- Verify DATABASE_URL format: `postgresql://user:pass@host:5432/dbname`

**Container won't start?**
- Check CloudWatch logs: `/ecs/event-vendor-platform`
- Verify all environment variables are set in task definition

## 📚 Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   GitHub    │────▶│   GitHub     │────▶│ Amazon ECR  │
│   (Source)  │     │   Actions    │     │  (Images)   │
└─────────────┘     └──────────────┘     └─────────────┘
                                                  │
                                                  ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Users     │────▶│   ALB        │────▶│   ECS       │
│  (Browser)  │     │ (Load Bal)   │     │  (Fargate)  │
└─────────────┘     └──────────────┘     └─────────────┘
                                                  │
                                                  ▼
                                          ┌─────────────┐
                                          │   RDS       │
                                          │ (Postgres)  │
                                          └─────────────┘
```

## 💰 Cost Estimate (us-east-1)

- **ALB**: ~$16/month + $0.008/LCU-hour
- **ECS Fargate** (2 containers, 1 vCPU, 2GB each): ~$70/month
- **RDS PostgreSQL** (db.t3.micro): ~$13/month
- **Data Transfer**: ~$0.09/GB
- **Total**: ~$100-150/month for production workload

Use `terraform destroy` to clean up and avoid charges when done testing.
