# AWS Deployment Guide

## Deployment Options

Choose one of the following AWS deployment methods:

1. **Elastic Beanstalk** (Easiest - recommended for beginners)
2. **ECS Fargate** (Scalable - recommended for production)
3. **EC2 + Docker** (Full control - for advanced users)

---

## Option 1: Elastic Beanstalk (Recommended)

### Prerequisites
- AWS CLI installed and configured
- EB CLI installed: `pip install awsebcli`

### Step 1: Setup Secrets in AWS Secrets Manager

```bash
# Create database credentials secret
aws secretsmanager create-secret \
  --name event-vendor-db-credentials \
  --secret-string '{
    "username": "eventvendor",
    "password": "your-secure-password",
    "DATABASE_URL": "postgresql://eventvendor:your-secure-password@localhost:5432/eventvendor"
  }'

# Create application secrets
aws secretsmanager create-secret \
  --name event-vendor-secrets \
  --secret-string '{
    "JWT_SECRET": "your-jwt-secret-min-32-chars",
    "SENDGRID_API_KEY": "SG.your-api-key"
  }'
```

### Step 2: Initialize Elastic Beanstalk

```bash
cd backend

# Initialize EB application
eb init -p node.js event-vendor-backend --region us-east-1

# Create environment
eb create event-vendor-production \
  --single \
  --envvars NODE_ENV=production
```

### Step 3: Deploy

```bash
eb deploy
```

### Step 4: Verify

```bash
curl http://your-env.elasticbeanstalk.com/api/health
```

---

## Option 2: ECS Fargate (Production-Ready)

### Prerequisites
- Docker installed
- AWS CLI configured
- RDS PostgreSQL database created

### Step 1: Create ECR Repository

```bash
aws ecr create-repository --repository-name event-vendor-backend
```

### Step 2: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
cd backend
docker build -t event-vendor-backend .

# Tag image
docker tag event-vendor-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/event-vendor-backend:latest

# Push image
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/event-vendor-backend:latest
```

### Step 3: Deploy with CloudFormation

```bash
# Update task definition with your account ID
sed -i 's/ACCOUNT_ID/YOUR_ACCOUNT_ID/g' aws-ecs-task-definition.json
sed -i 's/REGION/us-east-1/g' aws-ecs-task-definition.json

# Deploy infrastructure
aws cloudformation create-stack \
  --stack-name event-vendor-backend \
  --template-body file://aws-cloudformation.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=SubnetIds,ParameterValue='subnet-xxxxx,subnet-yyyyy' \
  --capabilities CAPABILITY_IAM
```

### Step 4: Update ECS Service

```bash
aws ecs update-service \
  --cluster event-vendor-cluster-production \
  --service event-vendor-backend-production \
  --force-new-deployment
```

---

## Option 3: EC2 + Docker

### Step 1: Launch EC2 Instance

- AMI: Amazon Linux 2023
- Instance Type: t3.micro (or larger)
- Security Group: Allow ports 22, 80, 443, 3001

### Step 2: Install Docker

```bash
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user
```

### Step 3: Deploy Application

```bash
# Clone repository
git clone https://github.com/ccalabrese00/Event-Vendor-Booking-Platform.git
cd Event-Vendor-Booking-Platform/backend

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@your-rds-endpoint:5432/eventvendor
JWT_SECRET=your-jwt-secret
SENDGRID_API_KEY=your-sendgrid-key
EOF

# Build and run
docker build -t event-vendor-backend .
docker run -d -p 3001:3001 --env-file .env event-vendor-backend
```

### Step 4: Setup Nginx (Optional)

```bash
sudo yum install nginx -y

# Configure nginx
sudo tee /etc/nginx/conf.d/event-vendor.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo systemctl start nginx
```

---

## Database Setup (RDS PostgreSQL)

### Create RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier event-vendor-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --allocated-storage 20 \
  --master-username eventvendor \
  --master-user-password your-secure-password \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --publicly-accessible false \
  --storage-encrypted
```

### Run Migrations

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier event-vendor-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Update DATABASE_URL and run migrations
cd backend
export DATABASE_URL="postgresql://eventvendor:your-password@$RDS_ENDPOINT:5432/eventvendor"
npx prisma migrate deploy
```

---

## Monitoring & Logging

### CloudWatch Logs

```bash
# View logs
aws logs tail /ecs/event-vendor-backend-production --follow
```

### Setup Alarms

```bash
# Create CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name event-vendor-high-cpu \
  --alarm-description "CPU utilization > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## SSL/TLS with ACM

### Request Certificate

```bash
aws acm request-certificate \
  --domain-name api.eventvendor.com \
  --validation-method DNS \
  --subject-alternative-names www.api.eventvendor.com
```

### Update ALB Listener (ECS)

```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:region:account-id:loadbalancer/app/event-vendor-alb \
  --protocol HTTPS \
  --port 443 \
  --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
  --certificates CertificateArn=arn:aws:acm:region:account-id:certificate/id \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:region:account-id:targetgroup/event-vendor-tg
```

---

## Cost Optimization

| Service | Monthly Cost (est.) |
|---------|---------------------|
| ECS Fargate (2 tasks) | $15-25 |
| RDS db.t3.micro | $12-15 |
| ALB | $16-20 |
| Data Transfer | $5-10 |
| **Total** | **$48-70/month** |

---

## Troubleshooting

### Common Issues

1. **Container fails to start**
   ```bash
   # Check logs
   aws logs tail /ecs/event-vendor-backend-production --follow
   ```

2. **Database connection errors**
   - Verify security group allows traffic from ECS tasks
   - Check DATABASE_URL format

3. **Health check failures**
   - Ensure `/api/health` endpoint returns 200
   - Check security group allows ALB traffic

4. **Out of memory**
   - Increase task memory in CloudFormation
   - Or scale horizontally with more tasks

---

## Useful Commands

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster event-vendor-cluster-production \
  --services event-vendor-backend-production

# Scale up tasks
aws ecs update-service \
  --cluster event-vendor-cluster-production \
  --service event-vendor-backend-production \
  --desired-count 4

# Restart service
aws ecs update-service \
  --cluster event-vendor-cluster-production \
  --service event-vendor-backend-production \
  --force-new-deployment
```
