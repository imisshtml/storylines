#!/bin/bash
# WHEN FIRST ADDING RUN THIS: chmod +x scripts/install-ios-sim.sh
set -e

# CONFIG
APP_ID="com.imisshtml.storylines" # <-- your bundleIdentifier
BUILD_URL=$1

if [ -z "$BUILD_URL" ]; then
  echo "Usage: ./scripts/install-ios-sim.sh <url-to-simulator-build.tar.gz>"
  exit 1
fi

# Download build
echo "Downloading iOS simulator build..."
curl -L "$BUILD_URL" -o build.tar.gz

# Extract
echo "Extracting build..."
tar -xzf build.tar.gz
APP_PATH=$(find . -name "*.app" -type d | head -n 1)

if [ -z "$APP_PATH" ]; then
  echo "❌ Could not find .app in extracted build"
  exit 1
fi

# Install into simulator
echo "Installing $APP_PATH into iOS simulator..."
xcrun simctl install booted "$APP_PATH"

# Launch app
echo "Launching app..."
xcrun simctl launch booted $APP_ID

echo "✅ Installed and launched on iOS simulator!"