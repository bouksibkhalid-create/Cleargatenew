#!/bin/bash

# Quick Start Script for Due Diligence Platform
# This script helps you get started with local development

set -e

echo "🚀 Due Diligence Platform - Quick Start"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "netlify.toml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists python3; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

echo "✅ All prerequisites met!"
echo ""

# Setup backend
echo "🐍 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -q -r requirements-dev.txt

echo "✅ Backend setup complete!"
echo ""

# Setup frontend
echo "⚛️  Setting up frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

echo "✅ Frontend setup complete!"
echo ""

# Return to root
cd ..

echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "Option 1: Run with Netlify Dev (recommended)"
echo "  netlify dev"
echo ""
echo "Option 2: Run separately"
echo "  Terminal 1: cd backend && source venv/bin/activate && netlify dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "🌐 The application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8888/.netlify/functions/"
echo ""
echo "🧪 To run tests:"
echo "  Backend:  cd backend && pytest"
echo "  Frontend: cd frontend && npm test"
echo ""
echo "Happy coding! 🎉"
