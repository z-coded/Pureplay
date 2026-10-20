@echo off
title PurePlay — Push to GitHub
cd /d "%~dp0.."
echo =========================================================
echo         PurePlay: Pushing Local Commits to GitHub
echo =========================================================
echo.
git push origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] All commits pushed to GitHub successfully!
) else (
    echo [NOTICE] If prompted above, complete your GitHub sign-in in the browser window.
)
echo.
pause
