@echo off
title PurePlay Cloud Deployment
echo ======================================================================
echo          PurePlay: AI-Powered Video Moderation Platform
echo          Deploying to Firebase Hosting (pureplay-f3bf9.web.app)
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
echo [2/3] Checking Firebase authentication...
call npx firebase-tools login

echo.
echo [3/3] Deploying to Firebase Hosting...
call npx firebase-tools deploy --only hosting

echo.
echo ======================================================================
echo  Deployment complete!
echo  Your live cloud web application is now active at:
echo    -> https://pureplay-f3bf9.web.app
echo    -> https://pureplay-f3bf9.firebaseapp.com
echo ======================================================================
echo.
pause
