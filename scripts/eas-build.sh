#!/bin/bash
# RUN THIS TO MAKE EXECUTABLE FIRST TIME: chmod +x scripts/eas-build.sh
set -e

echo "🧹 Cleaning native folders..."
rm -rf ios android

echo "🚀 Running EAS build..."
eas build "$@"

echo "📦 Re-generating native projects locally (expo prebuild)..."
npx expo prebuild --non-interactive

echo "✅ Done! ios/ and android/ have been regenerated for local dev."