// src/mocks/react-native-ping.js
// Mock for react-native-ping — required by react-native-thermal-receipt-printer-image-qr
// but only used for NetPrinter (IP/WiFi printing) which we don't use.
// We only use BLEPrinter so this is safe to stub out.

export default {
  isReachable: async () => false,
};
