# AWS Deployment Setup Guide

## Quick Start (Recommended)

### Step 1: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. Generate and copy the token

### Step 2: Set GitHub Secrets via API (PowerShell)

```powershell
# Set your GitHub PAT and run:
$GitHubToken = "ghp_YOUR_TOKEN_HERE"

# Set AWS_ACCESS_KEY_ID
$awsKey = aws configure get aws_access_key_id
Invoke-RestMethod -Uri "https://api.github.com/repos/ccalabrese00/Event-Vendor-Booking-Platform/actions/secrets/AWS_ACCESS_KEY_ID" -Headers @{Authorization = "token $GitHubToken"; Accept = "application/vnd.github.v3+json"} -Method Put -Body (@{encrypted_value = $awsKey; key_id = (Invoke-RestMethod -Uri "https://api.github.com/repos/ccalabrese00/Event-Vendor-Booking-Platform/actions/secrets/public-key" -Headers @{Authorization = "token $GitHubToken"}).key_id} | ConvertTo-Json) -ContentType "application/json"

# Set AWS_SECRET_ACCESS_KEY  
$awsSecret = aws configure get aws_secret_access_key
Invoke-RestMethod -Uri "https://api.github.com/repos/ccalabrese00/Event-Vendor-Booking-Platform/actions/secrets/AWS_SECRET_ACCESS_KEY" -Headers @{Authorization = "token $GitHubToken"; Accept = "application/vnd.github.v3+json"} -Method Put -Body (@{encrypted_value = $awsSecret; key_id = (Invoke-RestMethod -Uri "https://api.github.com/repos/ccalabrese00/Event-Vendor-Booking-Platform/actions/secrets/public-key" -Headers @{Authorization = "token $GitHubToken"}).key_id} | ConvertTo-Json) -ContentType "application/json"
```

### Step 3: Manual Alternative (Web Interface)

Go to: https://github.com/ccalabrese00/Event-Vendor-Booking-Platform/settings/secrets/actions

Add these secrets:
- **Name:** `AWS_ACCESS_KEY_ID`
  **Value:** (run `aws configure get aws_access_key_id`)
  
- **Name:** `AWS_SECRET_ACCESS_KEY`
  **Value:** (run `aws configure get aws_secret_access_key`)

### Step 4: Trigger Deployment

After adding secrets:
```bash
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

## Manual ECR Build (Alternative)

If GitHub Actions doesn't work:

```bash
# 1. Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 294960493261.dkr.ecr.us-east-1.amazonaws.com

# 2. Build image
docker build -t event-vendor-platform .

# 3. Tag and push
docker tag event-vendor-platform:latest 294960493261.dkr.ecr.us-east-1.amazonaws.com/event-vendor-platform:latest
docker push 294960493261.dkr.ecr.us-east-1.amazonaws.com/event-vendor-platform:latest

# 4. Force new deployment
aws ecs update-service --cluster event-vendor-cluster --service event-vendor-service --force-new-deployment --region us-east-1
```

## Expected Results

After successful deployment:
- ECS Service running: 2 tasks
- Health check: http://event-vendor-alb-462640695.us-east-1.elb.amazonaws.com/api/health
- API endpoints available at ALB DNS

## Troubleshooting

**Issue:** Tasks stuck at 0 running
**Fix:** Check CloudWatch logs: `/ecs/event-vendor-platform`

**Issue:** Cannot pull image
**Fix:** Verify ECR image exists: `aws ecr describe-images --repository-name event-vendor-platform --region us-east-1`

**Issue:** Database connection failed
**Fix:** Check RDS security group allows ECS tasks (port 5432)
