#!/bin/bash
# RUN VERY FIRST TIME CREATED: chmod +x scripts/dev-ios.sh
set -e

APP_ID="com.imisshtml.storylines" # <-- your iOS bundleIdentifier

echo "🚀 Building iOS dev client for simulator..."
eas build --platform ios --profile development --local --non-interactive

# Find the .app output (EAS puts it under ./build/ios)
APP_PATH=$(find ./build/ios -name "*.app" -type d | head -n 1)

if [ -z "$APP_PATH" ]; then
  echo "❌ Could not find .app build output"
  exit 1
fi

echo "📱 Installing $APP_PATH into iOS simulator..."
xcrun simctl install booted "$APP_PATH"

echo "▶️ Launching app..."
xcrun simctl launch booted $APP_ID

echo "✅ iOS dev client installed and launched!"