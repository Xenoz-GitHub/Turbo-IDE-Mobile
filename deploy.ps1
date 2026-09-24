# Turbo C++ Mobile - Deployment Script
# ENCRYPTED CREW - Automated Deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Turbo C++ Mobile - Deployment Script" -ForegroundColor Cyan
Write-Host "  ENCRYPTED CREW" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$projectPath = "c:\Users\SuarezJ\Downloads\turbo-cpp-ide-mobile"

# Step 1: Check project directory
Write-Host "[1/4] Checking project directory..." -ForegroundColor Yellow
if (!(Test-Path "$projectPath\package.json")) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    exit 1
}
Set-Location $projectPath
Write-Host "Success: Project directory confirmed" -ForegroundColor Green
Write-Host ""

# Step 2: Check Vercel CLI
Write-Host "[2/4] Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>&1 | Select-Object -First 1
    Write-Host "Success: Vercel CLI found - $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Vercel CLI not found" -ForegroundColor Red
    Write-Host "Install with: npm i -g vercel" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 3: Check Vercel login
Write-Host "[3/4] Checking Vercel authentication..." -ForegroundColor Yellow
$vercelWhoami = vercel whoami 2>&1 | Out-String
if ($vercelWhoami -match "Error" -or $vercelWhoami -match "not logged in") {
    Write-Host "You need to login to Vercel first" -ForegroundColor Yellow
    Write-Host "Running: vercel login" -ForegroundColor Cyan
    Write-Host ""
    vercel login
    Write-Host ""
}
Write-Host "Success: Authenticated with Vercel" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy to Vercel
Write-Host "[4/4] Deploying to Vercel Production..." -ForegroundColor Yellow
Write-Host "This will deploy to: https://turbo-ide.vercel.app" -ForegroundColor Cyan
Write-Host ""

vercel --prod --yes

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is now live at: https://turbo-ide.vercel.app" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Visit https://turbo-ide.vercel.app" -ForegroundColor White
Write-Host "2. Test PWA installation on Android/iOS" -ForegroundColor White
Write-Host "3. Test TWA package generation" -ForegroundColor White
Write-Host "4. Verify security headers" -ForegroundColor White
Write-Host ""
Write-Host "For GitHub push, please run manually:" -ForegroundColor Yellow
Write-Host "  git init" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Initial release v1.0.0'" -ForegroundColor White
Write-Host "  git remote add origin https://github.com/Xenoz-GitHub/Turbo-IDE-Mobile.git" -ForegroundColor White
Write-Host "  git branch -M main" -ForegroundColor White
Write-Host "  git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "ENCRYPTED CREW (c) 2026" -ForegroundColor Cyan
