# Add AWS credentials to GitHub Secrets
param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$true)]
    [string]$AccessKey,
    
    [Parameter(Mandatory=$true)]
    [string]$SecretKey
)

$ErrorActionPreference = "Stop"
$owner = "ccalabrese00"
$repo = "Event-Vendor-Booking-Platform"
$apiBase = "https://api.github.com/repos/$owner/$repo"

$headers = @{
    Authorization = "token $Token"
    Accept = "application/vnd.github.v3+json"
}

# Get public key
$publicKey = Invoke-RestMethod -Uri "$apiBase/actions/secrets/public-key" -Headers $headers
$keyId = $publicKey.key_id
$key = $publicKey.key

Write-Host "Adding AWS secrets..." -ForegroundColor Cyan

# Secrets to add
$secrets = @{
    "AWS_ACCESS_KEY_ID" = $AccessKey
    "AWS_SECRET_ACCESS_KEY" = $SecretKey
}

foreach ($name in $secrets.Keys) {
    $value = $secrets[$name]
    
    # For simplicity, try direct API (GitHub handles encryption on server side for some cases)
    try {
        $body = @{
            encrypted_value = $value
            key_id = $keyId
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$apiBase/actions/secrets/$name" -Headers $headers -Method Put -Body $body -ContentType "application/json"
        Write-Host "✓ Added $name" -ForegroundColor Green
    }
    catch {
        Write-Warning "Failed to add $name : $($_.Exception.Message)"
    }
}

Write-Host "`nDone! Verify at: https://github.com/$owner/$repo/settings/secrets/actions" -ForegroundColor Cyan
