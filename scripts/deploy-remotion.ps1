# Deploy Remotion Lambda Function and Site (PowerShell)
# Usage: .\scripts\deploy-remotion.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Remotion Lambda Function and Site..." -ForegroundColor Cyan

# Check for required environment variables
if (-not $env:AWS_ACCESS_KEY_ID -and -not $env:REMOTION_AWS_ACCESS_KEY_ID) {
    Write-Host "❌ Error: AWS_ACCESS_KEY_ID or REMOTION_AWS_ACCESS_KEY_ID must be set" -ForegroundColor Red
    Write-Host "   Set it with: `$env:AWS_ACCESS_KEY_ID='your_key'" -ForegroundColor Yellow
    exit 1
}

if (-not $env:AWS_SECRET_ACCESS_KEY -and -not $env:REMOTION_AWS_SECRET_ACCESS_KEY) {
    Write-Host "❌ Error: AWS_SECRET_ACCESS_KEY or REMOTION_AWS_SECRET_ACCESS_KEY must be set" -ForegroundColor Red
    Write-Host "   Set it with: `$env:AWS_SECRET_ACCESS_KEY='your_secret'" -ForegroundColor Yellow
    exit 1
}

# Set defaults if not provided
if (-not $env:REMOTION_AWS_REGION) {
    $env:REMOTION_AWS_REGION = "us-east-1"
}
if (-not $env:REMOTION_SITE_NAME) {
    $env:REMOTION_SITE_NAME = "remotion-caption-platform"
}

Write-Host "📋 Configuration:" -ForegroundColor Green
Write-Host "   Region: $env:REMOTION_AWS_REGION"
Write-Host "   Site Name: $env:REMOTION_SITE_NAME"
Write-Host ""

# Run deployment
node deploy.mjs

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Copy the site name above"
Write-Host "   2. Add REMOTION_SITE_NAME=$env:REMOTION_SITE_NAME to Vercel environment variables"
Write-Host "   3. Deploy your Next.js app to Vercel"
