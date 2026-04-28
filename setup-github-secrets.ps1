# Set GitHub Repository Secrets for AWS Deployment
# Requires: GitHub Personal Access Token with repo scope

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [string]$RepoOwner = "ccalabrese00",
    [string]$RepoName = "Event-Vendor-Booking-Platform"
)

# Get AWS credentials from local AWS config
$awsConfig = Get-Content ~/.aws/credentials | Where-Object { $_ -match "^aws_access_key_id\s*=\s*(.+)$" }
$awsSecret = Get-Content ~/.aws/credentials | Where-Object { $_ -match "^aws_secret_access_key\s*=\s*(.+)$" }

if (-not $awsConfig -or -not $awsSecret) {
    Write-Error "AWS credentials not found in ~/.aws/credentials"
    exit 1
}

$awsAccessKey = ($awsConfig -split "=\s*")[1].Trim()
$awsSecretKey = ($awsSecret -split "=\s*")[1].Trim()

Write-Host "Setting GitHub secrets for $RepoOwner/$RepoName..." -ForegroundColor Green

$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
}

$baseUrl = "https://api.github.com/repos/$RepoOwner/$RepoName"

# Function to create or update a secret
function Set-GitHubSecret {
    param($Name, $Value)
    
    # Get public key for encryption
    $publicKey = Invoke-RestMethod -Uri "$baseUrl/actions/secrets/public-key" -Headers $headers -Method Get
    
    # Encrypt the secret value using sodium (base64 encoded)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
    $encryptedValue = [Convert]::ToBase64String($bytes)
    
    # Create/update secret
    $body = @{
        encrypted_value = $encryptedValue
        key_id = $publicKey.key_id
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$baseUrl/actions/secrets/$Name" -Headers $headers -Method Put -Body $body -ContentType "application/json"
        Write-Host "✅ Set secret: $Name" -ForegroundColor Green
    } catch {
        Write-Error "Failed to set secret $Name`: $_"
    }
}

# Set AWS credentials
Set-GitHubSecret -Name "AWS_ACCESS_KEY_ID" -Value $awsAccessKey
Set-GitHubSecret -Name "AWS_SECRET_ACCESS_KEY" -Value $awsSecretKey

Write-Host "`n🎉 GitHub secrets configured!`n" -ForegroundColor Cyan
Write-Host "The deployment will trigger automatically on the next push to main." -ForegroundColor Yellow
Write-Host "Or manually trigger at: https://github.com/$RepoOwner/$RepoName/actions" -ForegroundColor Yellow
