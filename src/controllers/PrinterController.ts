import { Alert, PermissionsAndroid, Permission, Platform } from 'react-native';
import ThermalPrinter from 'react-native-thermal-printer';
import { CartItem } from '../types';
import { ReceiptSettingsStorage } from '../utils/receiptSettings';

// Helper functions for receipt formatting
const formatLine = (left: string, right: string, width: number) => {
    const spaceLength = width - left.length - right.length;
    if (spaceLength > 0) {
        return left + ' '.repeat(spaceLength) + right;
    }
    return left.substring(0, width - right.length - 1) + ' ' + right;
};

const centerText = (text: string, width: number) => {
    if (text.length >= width) return text.substring(0, width);
    const pad = Math.floor((width - text.length) / 2);
    return ' '.repeat(pad) + text;
};

const formatRp = (n: number) =>
    'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0 }).replace(/,/g, '.');

// Define printer device type
export interface PrinterDevice {
    name: string;
    mac: string;
}

export const PrinterController = {
    /**
     * Request necessary permissions for Bluetooth on Android
     */
    async requestPermissions(): Promise<boolean> {
        if (Platform.OS === 'android') {
            try {
                let permissions: string[] = [];

                if (Platform.Version >= 31) { // Android 12+
                    permissions = [
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    ];
                } else if (Platform.Version >= 23) { // Android 6-11
                    permissions = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
                }

                if (permissions.length > 0) {
                    const granted = await PermissionsAndroid.requestMultiple(permissions as Permission[]);
                    const allGranted = Object.values(granted).every(
                        (res) => res === PermissionsAndroid.RESULTS.GRANTED
                    );

                    if (!allGranted) {
                        console.warn('[Printer] Bluetooth permissions denied');
                        Alert.alert(
                            'Izin Diperlukan',
                            'Aplikasi memerlukan izin Bluetooth untuk mencetak struk.',
                            [{ text: 'OK' }]
                        );
                        return false;
                    }
                }
                return true;
            } catch (err) {
                console.error('[Printer] Permission error:', err);
                return false;
            }
        }
        return true;
    },

    /**
     * Get list of paired Bluetooth devices
     */
    async getPairedDevices(): Promise<PrinterDevice[]> {
        console.log('[Printer] Getting paired devices...');

        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return [];

        try {
            const devices = await ThermalPrinter.getBluetoothDeviceList();

            const pairedDevices = devices.map((device: any) => ({
                name: device.deviceName || 'Unknown Device',
                mac: device.macAddress || device.deviceAddress, // Compatibility
            }));

            console.log(`[Printer] Found ${pairedDevices.length} paired device(s):`, pairedDevices);

            if (pairedDevices.length === 0) {
                Alert.alert(
                    'Tidak Ada Perangkat',
                    'Tidak ditemukan perangkat Bluetooth yang ter-pair. Silakan hubungkan di Pengaturan Android.',
                    [{ text: 'OK' }]
                );
            }

            return pairedDevices;
        } catch (error) {
            console.error('[Printer] Failed to get devices:', error);
            Alert.alert('Error', 'Gagal mendapatkan daftar perangkat Bluetooth.');
            return [];
        }
    },

    /**
     * Get current printer from settings
     */
    async getCurrentPrinter(): Promise<PrinterDevice | null> {
        const settings = await ReceiptSettingsStorage.get();
        if (settings.printer_mac) {
            return {
                name: settings.printer_name || 'Printer',
                mac: settings.printer_mac,
            };
        }
        return null;
    },

    /**
     * Save selected printer to settings
     */
    async savePrinterToSettings(device: PrinterDevice): Promise<boolean> {
        try {
            const settings = await ReceiptSettingsStorage.get();
            settings.printer_mac = device.mac;
            settings.printer_name = device.name;
            await ReceiptSettingsStorage.save(settings);
            return true;
        } catch (error) {
            console.error('[Printer] Failed to save printer:', error);
            return false;
        }
    },

    /**
     * Main print receipt function
     */
    async printReceipt(params: {
        invoiceNumber: string;
        items: CartItem[];
        total: number;
        paymentMethod: string;
        cashReceived?: number;
        cashierName?: string;
    }): Promise<boolean> {
        try {
            const settings = await ReceiptSettingsStorage.get();
            if (!settings.printer_enabled) return false;

            const printer = await this.getCurrentPrinter();
            if (!printer || !printer.mac) {
                Alert.alert('Printer Belum Dipilih', 'Silakan pilih printer di pengaturan.');
                return false;
            }

            const hasPermission = await this.requestPermissions();
            if (!hasPermission) return false;

            // === Build receipt content ===
            const MAX_CHARS = settings.paper_size === '80mm' ? 48 : 32;
            const dashes = '-'.repeat(MAX_CHARS);
            const taxAmount = settings.show_tax ? params.total * (settings.tax_rate / 100) : 0;
            const grandTotal = params.total + taxAmount;
            const change = params.cashReceived ? params.cashReceived - grandTotal : 0;
            const now = new Date();
            const dateStr = now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            let receipt = '\n';
            receipt += centerText(settings.business_name, MAX_CHARS) + '\n';
            if (settings.address) receipt += centerText(settings.address.substring(0, MAX_CHARS), MAX_CHARS) + '\n';
            if (settings.phone) receipt += centerText(settings.phone, MAX_CHARS) + '\n';
            receipt += dashes + '\n';

            receipt += formatLine('No:', params.invoiceNumber, MAX_CHARS) + '\n';
            receipt += formatLine('Tgl:', dateStr, MAX_CHARS) + '\n';
            if (params.cashierName) receipt += formatLine('Kasir:', params.cashierName, MAX_CHARS) + '\n';
            receipt += dashes + '\n';

            params.items.forEach((item) => {
                receipt += item.name.substring(0, MAX_CHARS) + '\n';
                const qtyStr = `  ${item.quantity} x ${formatRp(item.price)}`;
                const subtotalStr = formatRp(item.price * item.quantity);
                receipt += formatLine(qtyStr, subtotalStr, MAX_CHARS) + '\n';
            });

            receipt += dashes + '\n';
            receipt += formatLine('Subtotal', formatRp(params.total), MAX_CHARS) + '\n';
            if (settings.show_tax) receipt += formatLine(`Pajak (${settings.tax_rate}%)`, formatRp(taxAmount), MAX_CHARS) + '\n';
            receipt += formatLine('TOTAL', formatRp(grandTotal), MAX_CHARS) + '\n';
            receipt += formatLine('Bayar', params.paymentMethod, MAX_CHARS) + '\n';

            if (params.cashReceived) {
                receipt += formatLine('Tunai', formatRp(params.cashReceived), MAX_CHARS) + '\n';
                receipt += formatLine('Kembali', formatRp(change), MAX_CHARS) + '\n';
            }

            receipt += dashes + '\n';
            if (settings.tagline) receipt += centerText(settings.tagline.substring(0, MAX_CHARS), MAX_CHARS) + '\n';
            if (settings.show_wifi && settings.wifi_ssid) {
                receipt += '\n' + centerText('--- WiFi Info ---', MAX_CHARS) + '\n';
                receipt += centerText(`SSID: ${settings.wifi_ssid}`, MAX_CHARS) + '\n';
                if (settings.wifi_password) receipt += centerText(`Pass: ${settings.wifi_password}`, MAX_CHARS) + '\n';
            }
            if (settings.footer_note) receipt += '\n' + centerText(settings.footer_note.substring(0, MAX_CHARS), MAX_CHARS) + '\n';
            receipt += '\n\n\n';

            // Send to printer
            await ThermalPrinter.printBluetooth({
                payload: receipt,
                macAddress: printer.mac,
                printerNbrCharactersPerLine: MAX_CHARS,
                autoCut: true,
            });

            console.log('[Printer] Print success');
            return true;

        } catch (error) {
            console.error('[Printer] Print failed:', error);
            Alert.alert('Gagal Cetak', (error as any)?.message || 'Periksa koneksi printer.');
            return false;
        }
    },
};