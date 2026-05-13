const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Mock react-native-ping — used by NetPrinter inside react-native-thermal-receipt-printer-image-qr
// We only use BLEPrinter, so this is safe to stub out.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "react-native-ping": path.resolve(__dirname, "src/mocks/react-native-ping.js"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
