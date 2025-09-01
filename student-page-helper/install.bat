@echo off
echo 🎓 Student Page Helper - Installation Script
echo =============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first:
    echo    Visit: https://nodejs.org/
    echo    Download and install the LTS version
    pause
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed or not in PATH
    echo    Please reinstall Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo ✅ npm is available

REM Install dependencies
echo.
echo 📦 Installing dependencies...
npm install

if %errorlevel% equ 0 (
    echo ✅ Dependencies installed successfully!
    echo.
    echo 🚀 To start the app in development mode:
    echo    npm start
    echo.
    echo 🏗️  To build for production:
    echo    npm run build
    echo.
    echo 📦 To build distributable packages:
    echo    npm run dist
    echo.
    echo 🎉 Installation complete! Happy coding! 🎓
) else (
    echo ❌ Failed to install dependencies. Please check the error messages above.
)

pause