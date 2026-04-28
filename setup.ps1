# Event Vendor Booking Platform - Setup Script
# Run this in PowerShell to set up the development environment

Write-Host "Setting up Event Vendor Booking Platform..." -ForegroundColor Green

# Check if Node.js is installed
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan

# Setup Frontend
Write-Host "`nSetting up Frontend..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend npm install failed"
    exit 1
}
Write-Host "Frontend setup complete!" -ForegroundColor Green

# Setup Backend
Write-Host "`nSetting up Backend..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend npm install failed"
    exit 1
}

# Generate Prisma client
npx prisma generate --schema=../prisma/schema.prisma
if ($LASTEXITCODE -ne 0) {
    Write-Error "Prisma client generation failed"
    exit 1
}

Write-Host "Backend setup complete!" -ForegroundColor Green

# Create .env file if it doesn't exist
$envPath = "$PSScriptRoot\backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "`nCreating .env file..." -ForegroundColor Yellow
    @"
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/event_vendor_booking?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Server
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email Service (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM=noreply@eventvendor.com
"@ | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host ".env file created at $envPath" -ForegroundColor Green
    Write-Host "Please edit it with your database credentials!" -ForegroundColor Red
}

Write-Host "`n==================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Install PostgreSQL or use Docker:" -ForegroundColor White
Write-Host "   docker run -d --name event-vendor-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=event_vendor_booking -p 5432:5432 postgres:15-alpine" -ForegroundColor Gray
Write-Host "`n2. Update backend\.env with your DATABASE_URL" -ForegroundColor White
Write-Host "`n3. Run database migrations:" -ForegroundColor White
Write-Host "   cd backend && npx prisma migrate dev --name init" -ForegroundColor Gray
Write-Host "`n4. Start the backend:" -ForegroundColor White
Write-Host "   cd backend && npm run dev" -ForegroundColor Gray
Write-Host "`n5. In a new terminal, start the frontend:" -ForegroundColor White
Write-Host "   cd frontend && npm run dev" -ForegroundColor Gray
Write-Host "`n6. Open http://localhost:3000 in your browser" -ForegroundColor White
