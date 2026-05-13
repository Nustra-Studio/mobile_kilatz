import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import { CartItem } from '../types';
import { ReceiptSettingsStorage } from '../utils/receiptSettings';

// Utility for formatting text to specific width
const formatLine = (left: string, right: string, width: number) => {
    const spaceLength = width - left.length - right.length;
    if (spaceLength > 0) {
        return left + ' '.repeat(spaceLength) + right;
    }
    // If it exceeds, just truncate left or add a space
    return left.substring(0, width - right.length - 1) + ' ' + right;
};

const centerText = (text: string, width: number) => {
    if (text.length >= width) return text.substring(0, width);
    const pad = Math.floor((width - text.length) / 2);
    return ' '.repeat(pad) + text;
};

const formatRp = (n: number) =>
    'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0 });

export const PrinterController = {
    /**
     * Scan for paired Bluetooth devices using Native Module
     */
    async scanDevices(): Promise<Array<{ name: string; mac: string; isPaired: boolean }>> {
        console.log('[Printer] Scanning for Bluetooth printers...');
        try {
            await BLEPrinter.init();
            const devices = await BLEPrinter.getDeviceList();

            // Expected IBLEPrinter[] = { device_name: string, inner_mac_address: string }[]
            return devices.map(d => ({
                name: d.device_name || 'Unknown',
                mac: d.inner_mac_address,
                isPaired: true // Assuming they are paired in OS settings
            })).filter(d => d.mac && d.name !== 'Unknown');

        } catch (error) {
            console.error('[Printer] Scan Failed:', error);
            return [];
        }
    },

    /**
     * Connect to a Bluetooth printer by MAC address
     */
    async connect(mac: string): Promise<boolean> {
        console.log(`[Printer] Connecting to MAC: ${mac}...`);
        try {
            await BLEPrinter.connectPrinter(mac);
            console.log(`[Printer] Connected to ${mac} successfully.`);
            return true;
        } catch (error) {
            console.error(`[Printer] Connect Failed for ${mac}:`, error);
            return false;
        }
    },

    /**
     * Print the receipt based on user settings and transaction data
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

            if (!settings.printer_enabled) {
                console.log('[Printer] Printer is disabled in settings. Skipping print.');
                return false;
            }

            // Connect to printer if mac is available
            if (!settings.printer_mac) {
                console.warn('[Printer] No printer MAC address configured!');
                return false;
            }

            // In real app: await BluetoothEscposPrinter.connect(settings.printer_mac);
            await this.connect(settings.printer_mac);

            // Paper width chars: 58mm usually 32 chars, 80mm usually 48 chars
            const MAX_CHARS = settings.paper_size === '80mm' ? 48 : 32;
            const dashes = '-'.repeat(MAX_CHARS);

            const taxAmount = settings.show_tax ? params.total * (settings.tax_rate / 100) : 0;
            const grandTotal = params.total + taxAmount;
            const change = params.cashReceived ? params.cashReceived - grandTotal : 0;

            const now = new Date();
            const dateStr = now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            // --- BUILD RECEIPT STRING ---
            let receipt = '\n';

            // 1. Header (Center)
            receipt += centerText(settings.business_name, MAX_CHARS) + '\n';
            if (settings.address) {
                // simple split if too long
                receipt += centerText(settings.address.substring(0, MAX_CHARS), MAX_CHARS) + '\n';
            }
            if (settings.phone) {
                receipt += centerText(settings.phone, MAX_CHARS) + '\n';
            }
            receipt += dashes + '\n';

            // 2. Transaction Info
            receipt += formatLine('No:', params.invoiceNumber, MAX_CHARS) + '\n';
            receipt += formatLine('Tgl:', dateStr, MAX_CHARS) + '\n';
            if (params.cashierName) {
                receipt += formatLine('Kasir:', params.cashierName, MAX_CHARS) + '\n';
            }
            receipt += dashes + '\n';

            // 3. Items
            params.items.forEach((item) => {
                // Item Name on one line if it's long, or just let it wrap
                receipt += item.name.substring(0, MAX_CHARS) + '\n';
                const qtyStr = `  ${item.quantity} x ${formatRp(item.price)}`;
                const subtotalStr = formatRp(item.price * item.quantity);
                receipt += formatLine(qtyStr, subtotalStr, MAX_CHARS) + '\n';
            });
            receipt += dashes + '\n';

            // 4. Totals
            receipt += formatLine('Subtotal', formatRp(params.total), MAX_CHARS) + '\n';
            if (settings.show_tax) {
                receipt += formatLine(`Pajak (${settings.tax_rate}%)`, formatRp(taxAmount), MAX_CHARS) + '\n';
            }
            receipt += formatLine('TOTAL', formatRp(grandTotal), MAX_CHARS) + '\n';
            receipt += formatLine('Bayar', params.paymentMethod, MAX_CHARS) + '\n';

            if (params.cashReceived) {
                receipt += formatLine('Tunai', formatRp(params.cashReceived), MAX_CHARS) + '\n';
                receipt += formatLine('Kembali', formatRp(change), MAX_CHARS) + '\n';
            }
            receipt += dashes + '\n';

            // 5. Footer & Tagline
            if (settings.tagline) {
                receipt += centerText(settings.tagline.substring(0, MAX_CHARS), MAX_CHARS) + '\n';
            }

            // 6. WiFi
            if (settings.show_wifi && settings.wifi_ssid) {
                receipt += '\n';
                receipt += centerText('--- WiFi Info ---', MAX_CHARS) + '\n';
                receipt += centerText(`SSID: ${settings.wifi_ssid}`, MAX_CHARS) + '\n';
                if (settings.wifi_password) {
                    receipt += centerText(`Pass: ${settings.wifi_password}`, MAX_CHARS) + '\n';
                }
            }

            if (settings.footer_note) {
                receipt += '\n' + centerText(settings.footer_note.substring(0, MAX_CHARS), MAX_CHARS) + '\n';
            }

            receipt += '\n\n\n'; // Feed lines for tearing

            // --- END BUILD ---

            console.log('=== SENDING TO NATIVE PRINTER ===');
            console.log(receipt);

            // Execute actual print command
            BLEPrinter.printBill(receipt, {
                beep: false,
                cut: false,
                tailingLine: true
            });

            return true;

        } catch (error) {
            console.error('[Printer] Print failed:', error);
            return false;
        }
    }
};
