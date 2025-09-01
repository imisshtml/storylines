#!/bin/bash
# RUN VERY FIRST TIME: chmod +x scripts/setup-android-dev.sh
set -e

echo "🚀 Setting up local Android build environment for EAS..."

# 1. Install Homebrew if missing
if ! command -v brew &>/dev/null; then
  echo "📦 Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "✅ Homebrew already installed."
fi

# 2. Install Java JDK 17
if ! /usr/libexec/java_home -v 17 &>/dev/null; then
  echo "📦 Installing OpenJDK 17..."
  brew install openjdk@17
  sudo ln -sfn $(brew --prefix openjdk@17)/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
else
  echo "✅ Java 17 already installed."
fi

# 3. Check Android SDK
if [ ! -d "$HOME/Library/Android/sdk" ]; then
  echo "⚠️ Android SDK not found. Please install Android Studio and SDK tools."
else
  echo "✅ Android SDK found at $HOME/Library/Android/sdk"
fi

# 4. Add environment variables
if ! grep -q "ANDROID_HOME" ~/.zshrc ~/.bashrc 2>/dev/null; then
  echo "📦 Adding ANDROID_HOME to shell config..."
  echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
  echo 'export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH' >> ~/.zshrc
fi

# 5. Verify installs
echo "🔍 Verifying installs..."
java -version
adb version || echo "⚠️ adb not found (install Android SDK platform-tools)"

echo "🎉 Android local build environment setup complete!"
echo "👉 You can now run: npm run android:dev"