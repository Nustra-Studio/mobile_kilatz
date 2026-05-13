import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'receipt_settings';

export interface ReceiptSettings {
  business_name: string;
  address: string;
  phone: string;
  wifi_ssid: string;
  wifi_password: string;
  tagline: string;
  show_logo: boolean;
  show_wifi: boolean;
  show_tax: boolean;
  tax_rate: number;
  footer_note: string;
  // Printer Hardware
  printer_enabled: boolean;
  printer_mac?: string;
  printer_name?: string;
  paper_size: '58mm' | '80mm';
}

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  business_name: 'My Karaoke & Resto',
  address: 'Jl. Example No. 123, Jakarta',
  phone: '021-1234567',
  wifi_ssid: 'Kilatz_Wifi',
  wifi_password: '',
  tagline: 'Terima kasih telah berkunjung!',
  show_logo: true,
  show_wifi: true,
  show_tax: false,
  tax_rate: 11,
  footer_note: 'Barang yang sudah dibeli tidak dapat dikembalikan.',
  printer_enabled: false,
  paper_size: '58mm',
};

export const ReceiptSettingsStorage = {
  async get(): Promise<ReceiptSettings> {
    try {
      const raw = await SecureStore.getItemAsync(SETTINGS_KEY);
      if (raw) {
        return { ...DEFAULT_RECEIPT_SETTINGS, ...JSON.parse(raw) };
      }
      return DEFAULT_RECEIPT_SETTINGS;
    } catch {
      return DEFAULT_RECEIPT_SETTINGS;
    }
  },

  async save(settings: ReceiptSettings): Promise<void> {
    await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
  },
};
