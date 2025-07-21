#!/bin/bash

# AI Review Response Automation - Startup Script

echo "🤖 AI Review Response Automation Platform"
echo "=========================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if pip is installed
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo "❌ pip is required but not installed."
    exit 1
fi

echo "✅ Python and pip found"

# Install Python dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        echo "✅ Python dependencies installed successfully"
    else
        echo "❌ Failed to install Python dependencies"
        exit 1
    fi
else
    echo "⚠️  requirements.txt not found, skipping Python dependency installation"
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOL
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Webhook Security (optional for development)
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
EOL
    echo "📝 .env template created. Please add your OpenAI API key."
    echo "   Edit .env file and replace 'your_openai_api_key_here' with your actual key."
fi

# Function to start backend
start_backend() {
    echo "🔥 Starting Flask backend..."
    python app.py &
    BACKEND_PID=$!
    echo "✅ Backend started with PID: $BACKEND_PID"
    sleep 3
}

# Function to start frontend
start_frontend() {
    if [ -d "src" ] && [ -f "frontend-package.json" ]; then
        echo "⚛️  Starting React frontend..."
        if command -v npm &> /dev/null; then
            # Copy package.json to proper location
            cp frontend-package.json src/package.json
            cd src
            npm install
            npm start &
            FRONTEND_PID=$!
            echo "✅ React frontend started with PID: $FRONTEND_PID"
            cd ..
        else
            echo "⚠️  npm not found. Please install Node.js to use React frontend."
            echo "   You can still use the HTML dashboard by opening dashboard.html"
        fi
    else
        echo "📱 React files not found. You can use the HTML dashboard instead."
        echo "   Open dashboard.html in your browser after the backend starts."
    fi
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start services
start_backend

# Wait a moment for backend to fully start
sleep 2

# Check if backend is running
if curl -s http://localhost:5000 > /dev/null; then
    echo "✅ Backend is running on http://localhost:5000"
else
    echo "❌ Backend failed to start properly"
    exit 1
fi

start_frontend

echo ""
echo "🎉 Platform is ready!"
echo "📊 HTML Dashboard: Open dashboard.html in your browser"
echo "⚛️  React App: http://localhost:3000 (if npm is available)"
echo "🔧 Backend API: http://localhost:5000"
echo ""
echo "💡 Try the test mode in the dashboard to simulate reviews!"
echo "🛑 Press Ctrl+C to stop all services"

# Keep script running
wait
