@echo off
title PurePlay Vercel Deployment
echo ======================================================================
echo          PurePlay: AI-Powered Video Filtering Platform
echo          Deploying to Vercel (Production Cloud Hosting)
echo ======================================================================
echo.

echo [1/3] Building production bundle...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed! Check the output above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Checking Vercel CLI...
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Vercel CLI not found. Installing globally via npm...
    call npm install -g vercel
)

echo.
echo [3/3] Deploying to Vercel Production...
echo (If prompted to log in or link, confirm your account and accept defaults)
call vercel --prod

echo.
echo ======================================================================
echo  Deployment complete! Check your live Vercel URL above.
echo ======================================================================
echo.
pause
