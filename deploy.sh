#!/bin/bash
set -e

# Configuration
APP_NAME="nota.febriansyah.dev_2007"
APP_PORT=2007
APP_DIR="/home/ubuntu/nota.febriansyah.dev_2007"

echo "=================================================="
echo "🚀 Starting Deployment for $APP_NAME"
echo "=================================================="

# Optional: Change directory
# cd $APP_DIR

echo "=================================================="
echo "📦 Installing Dependencies"
echo "=================================================="
# Using --legacy-peer-deps in case of conflicts, or just npm install
npm install

echo "=================================================="
echo "🏗️ Building Application"
echo "=================================================="
npm run build

echo "=================================================="
echo "🛑 Resetting PM2 Process"
echo "=================================================="
# Delete existing process to ensure fresh config/env logic
pm2 delete $APP_NAME 2>/dev/null || true

echo "=================================================="
echo "▶️ Starting Application on Port $APP_PORT"
echo "=================================================="
# Run 'npm start' via PM2. 
# Note: Next.js uses the PORT environment variable.
PORT=$APP_PORT pm2 start npm --name "$APP_NAME" -- start

echo "=================================================="
echo "💾 Saving PM2 Configuration"
echo "=================================================="
pm2 save

echo "=================================================="
echo "✅ Deployment Finished Successfully"
echo "=================================================="
pm2 status
