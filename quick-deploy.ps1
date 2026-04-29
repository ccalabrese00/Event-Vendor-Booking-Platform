# Quick Deploy Script - Creates a simple Node.js image and pushes to ECR
# This gets the service running while the full build completes

Write-Host "Creating quick-deploy Docker image..." -ForegroundColor Cyan

# Create temporary Dockerfile
$dockerfile = @"
FROM node:18-alpine
WORKDIR /app
RUN echo '{"name":"temp-app","version":"1.0.0","scripts":{"start":"node -e \\"require(\\'http\\').createServer((req,res)=>{res.writeHead(200);res.end(JSON.stringify({status:\"ok\",time:new Date().toISOString()}))}).listen(3001)\\""}}' > package.json
RUN echo 'const http=require(\\'http\\');http.createServer((req,res)=>{res.writeHead(200,{\\'Content-Type\\':\\'application/json\\'});const routes={\\'/\\':{message:\"Event Vendor API - Temporary Deployment\",status:\"running\",version:\"0.1.0\"},\\'/health\\':{status:\"healthy\",timestamp:new Date().toISOString()},\\'/api/health\\':{status:\"healthy\",timestamp:new Date().toISOString()}};const path=req.url;const response=routes[path]||{error:\"Not found\",available:routes};res.end(JSON.stringify(response))}).listen(3001,()=>console.log(\\'Server on port 3001\\'))' > server.js
EXPOSE 3001
CMD [\"node\", \"server.js\"]
"@

$dockerfile | Out-File -FilePath C:\temp\Dockerfile.quick -Encoding UTF8

# Login to ECR
Write-Host "Logging into ECR..." -ForegroundColor Yellow
$login = aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 294960493261.dkr.ecr.us-east-1.amazonaws.com 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to login to ECR. Is Docker installed?"
    Write-Host "Install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Build and push
Write-Host "Building image..." -ForegroundColor Yellow
docker build -f C:\temp\Dockerfile.quick -t event-vendor-platform:latest C:\temp 2>&1

Write-Host "Tagging image..." -ForegroundColor Yellow
docker tag event-vendor-platform:latest 294960493261.dkr.ecr.us-east-1.amazonaws.com/event-vendor-platform:latest 2>&1

Write-Host "Pushing to ECR..." -ForegroundColor Yellow
docker push 294960493261.dkr.ecr.us-east-1.amazonaws.com/event-vendor-platform:latest 2>&1

# Force new deployment
Write-Host "Forcing ECS deployment..." -ForegroundColor Yellow
aws ecs update-service --cluster event-vendor-cluster --service event-vendor-service --force-new-deployment --region us-east-1 2>&1 | Out-Null

Write-Host "`n✅ Quick deployment complete!" -ForegroundColor Green
Write-Host "`nYour API will be available at:" -ForegroundColor Cyan
Write-Host "http://event-vendor-alb-462640695.us-east-1.elb.amazonaws.com" -ForegroundColor Yellow
Write-Host "`nHealth check:" -ForegroundColor Cyan
Write-Host "http://event-vendor-alb-462640695.us-east-1.elb.amazonaws.com/health" -ForegroundColor Yellow
Write-Host "`nNote: This is a temporary deployment. Run the full GitHub Actions workflow for the complete application." -ForegroundColor Gray
