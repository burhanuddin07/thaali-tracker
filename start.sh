#!/bin/bash
# =====================================================
#  Thaali Tracker - Quick Start Script
# =====================================================

echo ""
echo "🍱  Thaali Tracker - Starting up..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js v18+ from https://nodejs.org"
  exit 1
fi

echo "✅ Node.js $(node -v) found"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install
if [ $? -ne 0 ]; then echo "❌ Backend install failed"; exit 1; fi
cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend && npm install
if [ $? -ne 0 ]; then echo "❌ Frontend install failed"; exit 1; fi
cd ..

# Build frontend
echo ""
echo "🔨 Building frontend..."
cd frontend && npm run build
if [ $? -ne 0 ]; then echo "❌ Frontend build failed"; exit 1; fi
cd ..

echo ""
echo "🚀 Starting server..."
echo "   Open http://localhost:5000 in your browser"
echo ""
cd backend && node server.js
