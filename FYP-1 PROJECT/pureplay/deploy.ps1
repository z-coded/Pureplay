Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         PurePlay: AI-Powered Video Moderation Platform" -ForegroundColor Cyan
Write-Host "         Deploying to Firebase Hosting (pureplay-f3bf9.web.app)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Building production bundle with Vite..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/3] Checking Firebase authentication..." -ForegroundColor Yellow
npx firebase-tools login

Write-Host ""
Write-Host "[3/3] Deploying to Firebase Hosting..." -ForegroundColor Yellow
npx firebase-tools deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host " Deployment Complete!" -ForegroundColor Green
    Write-Host " Your live web application is now active at:" -ForegroundColor Green
    Write-Host "   -> https://pureplay-f3bf9.web.app" -ForegroundColor Cyan
    Write-Host "   -> https://pureplay-f3bf9.firebaseapp.com" -ForegroundColor Cyan
    Write-Host "======================================================================" -ForegroundColor Green
}
