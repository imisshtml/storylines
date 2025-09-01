#!/bin/bash
# RUN VERY FIRST TIME: chmod +x scripts/setup-ios-dev.sh
set -e

echo "🚀 Setting up local iOS build environment for EAS..."

# 1. Install Xcode Command Line Tools
if ! xcode-select -p &>/dev/null; then
  echo "📦 Installing Xcode Command Line Tools..."
  xcode-select --install || true
else
  echo "✅ Xcode Command Line Tools already installed."
fi

# 2. Install Homebrew if missing
if ! command -v brew &>/dev/null; then
  echo "📦 Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "✅ Homebrew already installed."
fi

# 3. Install Fastlane
if ! command -v fastlane &>/dev/null; then
  echo "📦 Installing Fastlane..."
  brew install fastlane
else
  echo "✅ Fastlane already installed."
fi

# 4. Install CocoaPods
if ! command -v pod &>/dev/null; then
  echo "📦 Installing CocoaPods..."
  brew install cocoapods
else
  echo "✅ CocoaPods already installed."
fi

# 5. Verify installs
echo "🔍 Verifying installs..."
echo "Xcode: $(xcodebuild -version | head -n 1)"
echo "Fastlane: $(fastlane --version)"
echo "CocoaPods: $(pod --version)"

echo "🎉 iOS local build environment setup complete!"
echo "👉 You can now run: npm run ios:dev"