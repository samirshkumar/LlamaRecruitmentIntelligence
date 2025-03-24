@echo off
echo Starting Llama Recruitment Intelligence application...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo npm is not installed or not in your PATH.
    echo Please reinstall Node.js from https://nodejs.org/ with npm included and try again.
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo Starting the application...
echo.
echo The application will be available at: http://localhost:5000
echo Press Ctrl+C to stop the application.
echo.

call npx cross-env NODE_ENV=development tsx server/index.ts
pause