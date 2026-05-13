import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'device_id';

/**
 * Get or generate a unique device ID
 * This ID is stored in SecureStore and persists across app sessions
 */
export async function getDeviceId(): Promise<string> {
    try {
        // Try to get existing device ID
        let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

        if (!deviceId) {
            // Generate new UUID-like device ID
            deviceId = generateUUID();
            await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
        }

        return deviceId;
    } catch (error) {
        console.error('Error getting device ID:', error);
        // Fallback to a generated ID (won't persist if SecureStore fails)
        return generateUUID();
    }
}

/**
 * Get device model name
 * Examples: "Samsung Galaxy S23", "iPhone 14 Pro", "Pixel 7"
 */
export function getDeviceModel(): string {
    const modelName = Device.modelName || Device.deviceName || 'Unknown Device';
    return modelName;
}

/**
 * Get device OS and version
 * Examples: "Android 14", "iOS 17.2", "Web"
 */
export function getDeviceOs(): string {
    const osName = Device.osName || Platform.OS;
    const osVersion = Device.osVersion;

    if (osVersion) {
        return `${osName} ${osVersion}`;
    }

    return osName || 'Unknown OS';
}

/**
 * Get all device information at once
 */
export async function getDeviceInfo() {
    const deviceId = await getDeviceId();
    const deviceModel = getDeviceModel();
    const deviceOs = getDeviceOs();

    return {
        device_id: deviceId,
        device_model: deviceModel,
        device_os: deviceOs,
    };
}

/**
 * Simple UUID v4 generator
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
