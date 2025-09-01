#!/bin/bash
# RUN VERY FIRST TIME CREATED: chmod +x scripts/dev-android.sh
set -e

PACKAGE_NAME="com.imisshtml.storylines" # <-- your Android package name

echo "🚀 Building Android dev client for emulator..."
eas build --platform android --profile development --local --non-interactive

# Find the .apk output (EAS puts it under ./build/android)
APK_PATH=$(find ./build/android -name "*.apk" | head -n 1)

if [ -z "$APK_PATH" ]; then
  echo "❌ Could not find .apk build output"
  exit 1
fi

echo "📱 Installing $APK_PATH into Android emulator..."
adb install -r "$APK_PATH"

echo "▶️ Launching app..."
adb shell monkey -p $PACKAGE_NAME -c android.intent.category.LAUNCHER 1

echo "✅ Android dev client installed and launched!"