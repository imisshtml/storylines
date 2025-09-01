#!/bin/bash
# FIRST RUN: chmod +x scripts/install-android-emulator.sh
set -e

# CONFIG
PACKAGE_NAME="com.imisshtml.storylines" # <-- your Android package
BUILD_URL=$1

if [ -z "$BUILD_URL" ]; then
  echo "Usage: ./scripts/install-android-emulator.sh <url-to-apk>"
  exit 1
fi

# Download build
echo "Downloading Android APK..."
curl -L "$BUILD_URL" -o app.apk

# Install into emulator
echo "Installing APK into Android emulator..."
adb install -r app.apk

# Launch app
echo "Launching app..."
adb shell monkey -p $PACKAGE_NAME -c android.intent.category.LAUNCHER 1

echo "✅ Installed and launched on Android emulator!"