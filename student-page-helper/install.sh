#!/bin/bash

echo "🎓 Student Page Helper - Installation Script"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   Visit: https://nodejs.org/"
    echo "   Or use your package manager:"
    echo "   Ubuntu/Debian: sudo apt install nodejs npm"
    echo "   macOS: brew install node"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    echo "   Please update Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) is installed"
echo "✅ npm $(npm -v) is available"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🚀 To start the app in development mode:"
    echo "   npm start"
    echo ""
    echo "🏗️  To build for production:"
    echo "   npm run build"
    echo ""
    echo "📦 To build distributable packages:"
    echo "   npm run dist"
    echo ""
    echo "🎉 Installation complete! Happy coding! 🎓"
else
    echo "❌ Failed to install dependencies. Please check the error messages above."
    exit 1
fi