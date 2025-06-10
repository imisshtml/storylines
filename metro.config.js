const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package exports for better ES module support
config.resolver.unstable_enablePackageExports = true;

// Configure transformer to handle import.meta syntax
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true, // Changed from false to true to support import.meta
    inlineRequires: true,
  },
});

// Add resolver configuration for problematic packages
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;