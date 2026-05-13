import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PrinterController, PrinterDevice } from '../../controllers/PrinterController';
import { DEFAULT_RECEIPT_SETTINGS, ReceiptSettings, ReceiptSettingsStorage } from '../../utils/receiptSettings';
import { CartItem } from '../../types';

export const ReceiptSettingsSection = () => {
  const [settings, setSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showWifiPass, setShowWifiPass] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<PrinterDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isTestingPrint, setIsTestingPrint] = useState(false);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Dynamic Theme Colors
  const themeText = isDark ? '#FFFFFF' : '#111827';
  const themeSubText = isDark ? 'rgba(255,255,255,0.4)' : '#6B7280';
  const themeInputBg = isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6';
  const themeInputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB';
  const themeBoxBg = isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB';
  const themeLabelColor = isDark ? 'rgba(255,255,255,0.5)' : '#4B5563';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await ReceiptSettingsStorage.get();
    setSettings(s);
    setIsLoading(false);
  };

  const update = <K extends keyof ReceiptSettings>(key: K, value: ReceiptSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await ReceiptSettingsStorage.save(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      Alert.alert('Error', 'Gagal menyimpan pengaturan struk.');
    } finally {
      setIsSaving(false);
    }
  };

  // 🔥 NEW: Scan for paired devices and show selection modal
  const handleScanForPrinters = async () => {
    setIsScanning(true);
    setShowPrinterModal(true);

    try {
      const devices = await PrinterController.getPairedDevices();
      setAvailablePrinters(devices);

      if (devices.length === 0) {
        Alert.alert(
          'Tidak Ada Perangkat',
          'Tidak ditemukan printer Bluetooth yang ter-pair.\n\n' +
          'Silakan buka Settings → Bluetooth dan pasangkan printer thermal Anda terlebih dahulu.',
          [{ text: 'OK', onPress: () => setShowPrinterModal(false) }]
        );
      }
    } catch (error) {
      console.error('[Settings] Scan error:', error);
      Alert.alert('Error', 'Gagal memindai printer Bluetooth.');
    } finally {
      setIsScanning(false);
    }
  };

  // 🔥 NEW: Select printer manually from list
  const handleSelectPrinter = async (device: PrinterDevice) => {
    const success = await PrinterController.savePrinterToSettings(device);
    if (success) {
      // Reload settings to get updated printer info
      const updatedSettings = await ReceiptSettingsStorage.get();
      setSettings(updatedSettings);
      setShowPrinterModal(false);

      // Optional: Ask to test print
      Alert.alert(
        'Printer Tersimpan',
        `Printer ${device.name} berhasil disimpan.\nIngin melakukan test print?`,
        [
          { text: 'Nanti', style: 'cancel' },
          {
            text: 'Test Print',
            onPress: () => handleTestPrint(device.mac, device.name)
          },
        ]
      );
    }
  };

  // 🔥 NEW: Handle test print
  const handleTestPrint = async (printerMac?: string, printerName?: string) => {
    const macToUse = printerMac || settings.printer_mac;
    const nameToUse = printerName || settings.printer_name;

    if (!macToUse) {
      Alert.alert('Info', 'Silakan pilih printer terlebih dahulu sebelum test print.');
      return;
    }

    setIsTestingPrint(true);

    Alert.alert('Test Print', `Mencoba mencetak ke ${nameToUse || 'printer'}...`);

    const success = await PrinterController.printReceipt({
      invoiceNumber: `TEST-${Math.floor(Math.random() * 10000)}`,
      items: [
        {
          productId: 101,
          name: 'Test Menu 1 (Nasi Goreng)',
          price: 25000,
          quantity: 1,
        },
        {
          productId: 102,
          name: 'Test Menu 2 (Es Teh Manis)',
          price: 8000,
          quantity: 2,
        },
      ],
      total: 41000,
      paymentMethod: 'Tunai',
      cashReceived: 50000,
      cashierName: 'Admin (Test Print)',
    });

    setIsTestingPrint(false);

    if (!success) {
      Alert.alert(
        'Gagal Cetak',
        'Tidak dapat mencetak struk. Pastikan:\n' +
        '1. Printer menyala\n' +
        '2. Printer dalam jarak jangkauan\n' +
        '3. Bluetooth aktif'
      );
    }
  };

  // 🔥 NEW: Remove/clear printer connection
  const handleRemovePrinter = async () => {
    Alert.alert(
      'Hapus Printer',
      `Yakin ingin menghapus ${settings.printer_name} dari pengaturan?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            update('printer_mac', undefined);
            update('printer_name', undefined);
            update('printer_enabled', false);
            await handleSave();
            Alert.alert('Berhasil', 'Printer telah dihapus dari pengaturan.');
          },
        },
      ]
    );
  };

  // 🔥 NEW: Change printer
  const handleChangePrinter = async () => {
    await handleScanForPrinters();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#FEB400" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* ── Hardware Printer ─────────────────────── */}
      <SectionHeader icon="🖨️" title="Hardware Printer" />

      <ToggleRow
        label="Printer Bluetooth"
        subtitle="Auto-print struk saat pembayaran selesai"
        value={settings.printer_enabled}
        onValueChange={(v) => update('printer_enabled', v)}
        isDark={isDark}
      />

      {settings.printer_enabled && (
        <View style={[styles.hardwareBox, { backgroundColor: themeBoxBg, borderColor: themeInputBorder }]}>
          <View style={styles.deviceRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.deviceLabel, { color: themeLabelColor }]}>Perangkat Terhubung</Text>
              {settings.printer_name ? (
                <>
                  <Text style={styles.deviceName}>{settings.printer_name}</Text>
                  <Text style={[styles.deviceMac, { color: themeSubText }]}>{settings.printer_mac}</Text>
                </>
              ) : (
                <Text style={styles.deviceNone}>Belum ada printer terhubung</Text>
              )}
            </View>
            <TouchableOpacity style={styles.scanMiniBtn} onPress={handleScanForPrinters}>
              <Text style={styles.scanMiniBtnText}>
                {settings.printer_name ? 'Ganti' : 'Pilih Printer'}
              </Text>
            </TouchableOpacity>
          </View>

          {settings.printer_name && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.testPrintBtn, isTestingPrint && styles.testPrintDisabled]}
                onPress={() => handleTestPrint()}
                disabled={isTestingPrint}
              >
                <Text style={styles.testPrintBtnText}>
                  {isTestingPrint ? '⏳ Mencetak...' : '🖨️ Test Print Struk'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removePrinterBtn}
                onPress={handleRemovePrinter}
              >
                <Text style={styles.removePrinterBtnText}>🗑️ Hapus</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.deviceLabel, { color: themeLabelColor, marginTop: 12 }]}>Ukuran Kertas (Thermal)</Text>
          <View style={styles.paperOptions}>
            <TouchableOpacity
              style={[styles.paperOpt, { backgroundColor: themeBoxBg, borderColor: themeInputBorder }, settings.paper_size === '58mm' && styles.paperOptActive]}
              onPress={() => update('paper_size', '58mm')}
            >
              <Text style={[styles.paperOptText, { color: themeSubText }, settings.paper_size === '58mm' && styles.paperOptTextActive]}>58 mm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paperOpt, { backgroundColor: themeBoxBg, borderColor: themeInputBorder }, settings.paper_size === '80mm' && styles.paperOptActive]}
              onPress={() => update('paper_size', '80mm')}
            >
              <Text style={[styles.paperOptText, { color: themeSubText }, settings.paper_size === '80mm' && styles.paperOptTextActive]}>80 mm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Informasi Bisnis ─────────────────────── */}
      <SectionHeader icon="🏪" title="Informasi Bisnis" />

      <Field label="Nama Bisnis" color={themeLabelColor}>
        <StyledInput
          value={settings.business_name}
          onChangeText={(v) => update('business_name', v)}
          placeholder="Nama toko / outlet"
          isDark={isDark}
        />
      </Field>

      <Field label="Alamat" color={themeLabelColor}>
        <StyledInput
          value={settings.address}
          onChangeText={(v) => update('address', v)}
          placeholder="Jl. Contoh No. 1, Kota"
          multiline
          numberOfLines={2}
          style={{ minHeight: 56 }}
          isDark={isDark}
        />
      </Field>

      <Field label="No. Telepon" color={themeLabelColor}>
        <StyledInput
          value={settings.phone}
          onChangeText={(v) => update('phone', v)}
          placeholder="021-1234567"
          keyboardType="phone-pad"
          isDark={isDark}
        />
      </Field>

      <Field label="Tagline / Slogan" color={themeLabelColor}>
        <StyledInput
          value={settings.tagline}
          onChangeText={(v) => update('tagline', v)}
          placeholder="Terima kasih telah berkunjung!"
          isDark={isDark}
        />
      </Field>

      {/* ── WiFi ─────────────────────────────────── */}
      <SectionHeader icon="📶" title="Info WiFi" />

      <ToggleRow
        label="Tampilkan WiFi di Struk"
        subtitle="SSID & password WiFi akan muncul di bawah struk"
        value={settings.show_wifi}
        onValueChange={(v) => update('show_wifi', v)}
        isDark={isDark}
      />

      {settings.show_wifi && (
        <>
          <Field label="Nama WiFi (SSID)" color={themeLabelColor}>
            <StyledInput
              value={settings.wifi_ssid}
              onChangeText={(v) => update('wifi_ssid', v)}
              placeholder="Nama jaringan WiFi"
              isDark={isDark}
            />
          </Field>

          <Field label="Password WiFi" color={themeLabelColor}>
            <View style={styles.passwordRow}>
              <StyledInput
                value={settings.wifi_password}
                onChangeText={(v) => update('wifi_password', v)}
                placeholder="Password WiFi"
                secureTextEntry={!showWifiPass}
                style={{ flex: 1 }}
                isDark={isDark}
              />
              <TouchableOpacity
                style={[styles.eyeBtn, { backgroundColor: themeBoxBg, borderColor: themeInputBorder }]}
                onPress={() => setShowWifiPass((p) => !p)}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeIcon}>{showWifiPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </Field>
        </>
      )}

      {/* ── Tampilan Struk ───────────────────────── */}
      <SectionHeader icon="🧾" title="Tampilan Struk" />

      <ToggleRow
        label="Tampilkan Logo"
        subtitle="Logo KILATZ ditampilkan di header struk"
        value={settings.show_logo}
        onValueChange={(v) => update('show_logo', v)}
        isDark={isDark}
      />

      <ToggleRow
        label="Tampilkan Pajak"
        subtitle="PPN akan dihitung dan ditampilkan di struk"
        value={settings.show_tax}
        onValueChange={(v) => update('show_tax', v)}
        isDark={isDark}
      />

      {settings.show_tax && (
        <Field label="Tarif Pajak (%)" color={themeLabelColor}>
          <StyledInput
            value={String(settings.tax_rate)}
            onChangeText={(v) => update('tax_rate', parseFloat(v) || 0)}
            placeholder="11"
            keyboardType="numeric"
            isDark={isDark}
          />
        </Field>
      )}

      <Field label="Catatan Kaki Struk" color={themeLabelColor}>
        <StyledInput
          value={settings.footer_note}
          onChangeText={(v) => update('footer_note', v)}
          placeholder="Pesan di bagian bawah struk..."
          multiline
          numberOfLines={2}
          style={{ minHeight: 56 }}
          isDark={isDark}
        />
      </Field>

      {/* ── Tombol Simpan ───────────────────────── */}
      <TouchableOpacity
        style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
        onPress={handleSave}
        disabled={isSaving}
        activeOpacity={0.85}
      >
        {isSaving ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.saveBtnText}>
            {saved ? '✅ Tersimpan!' : '💾 Simpan Pengaturan Struk'}
          </Text>
        )}
      </TouchableOpacity>

      {/* ── MODAL PILIH PRINTER ───────────────────────── */}
      <Modal
        visible={showPrinterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrinterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Pilih Printer Bluetooth
              </Text>
              <TouchableOpacity onPress={() => setShowPrinterModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {isScanning ? (
              <View style={styles.scanningContainer}>
                <ActivityIndicator size="large" color="#FEB400" />
                <Text style={[styles.scanningText, { color: themeSubText }]}>
                  Memindai perangkat Bluetooth...
                </Text>
              </View>
            ) : availablePrinters.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: themeSubText }]}>
                  Tidak ada perangkat Bluetooth ter-pair
                </Text>
                <TouchableOpacity
                  style={styles.rescanBtn}
                  onPress={handleScanForPrinters}
                >
                  <Text style={styles.rescanBtnText}>↻ Scan Ulang</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={availablePrinters}
                keyExtractor={(item) => item.mac}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.printerItem, { borderBottomColor: themeInputBorder }]}
                    onPress={() => handleSelectPrinter(item)}
                  >
                    <View>
                      <Text style={[styles.printerName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.printerMac, { color: themeSubText }]}>
                        MAC: {item.mac}
                      </Text>
                    </View>
                    <Text style={styles.selectIcon}>→</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.printerList}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ────────── Sub-components ──────────────────────────────────

const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionIcon}>{icon}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const Field = ({ label, color, children }: { label: string; color?: string; children: React.ReactNode }) => (
  <View style={styles.field}>
    <Text style={[styles.fieldLabel, color ? { color } : null]}>{label}</Text>
    {children}
  </View>
);

const StyledInput = ({
  style,
  multiline,
  numberOfLines,
  isDark,
  ...props
}: React.ComponentProps<typeof TextInput> & { style?: any; isDark?: boolean }) => (
  <TextInput
    style={[
      styles.input,
      {
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
        color: isDark ? '#FFFFFF' : '#111827'
      },
      multiline && styles.inputMultiline,
      style
    ]}
    placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
    multiline={multiline}
    numberOfLines={numberOfLines}
    textAlignVertical={multiline ? 'top' : 'center'}
    {...props}
  />
);

const ToggleRow = ({
  label,
  subtitle,
  value,
  onValueChange,
  isDark,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isDark?: boolean;
}) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleText}>
      <Text style={[styles.toggleLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>{label}</Text>
      {subtitle && <Text style={[styles.toggleSub, { color: isDark ? 'rgba(255,255,255,0.4)' : '#6B7280' }]}>{subtitle}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : '#D1D5DB', true: 'rgba(254,180,0,0.5)' }}
      thumbColor={value ? '#FEB400' : (isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF')}
    />
  </View>
);

const BRAND = '#FEB400';

const styles = StyleSheet.create({
  wrapper: { paddingBottom: 8 },
  loadingBox: { paddingVertical: 24, alignItems: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,180,0,0.15)',
    marginBottom: 12,
  },
  sectionIcon: { fontSize: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputMultiline: {
    paddingTop: 10,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  eyeIcon: { fontSize: 18 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 8,
  },
  toggleText: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleSub: { fontSize: 11, marginTop: 2 },
  saveBtn: {
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnSuccess: { backgroundColor: '#22c55e' },
  saveBtnText: { color: '#000', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  hardwareBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    marginTop: -4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  deviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  deviceLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  deviceName: { color: '#4ade80', fontSize: 14, fontWeight: '600' },
  deviceMac: { fontSize: 10, marginTop: 2 },
  deviceNone: { color: '#f87171', fontSize: 14, fontWeight: '600' },
  scanMiniBtn: {
    backgroundColor: 'rgba(254,180,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(254,180,0,0.3)',
  },
  scanMiniBtnText: { color: BRAND, fontWeight: '700', fontSize: 12 },
  paperOptions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  paperOpt: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  paperOptActive: { borderColor: BRAND, backgroundColor: 'rgba(254,180,0,0.1)' },
  paperOptText: { fontWeight: '600', fontSize: 13 },
  paperOptTextActive: { color: BRAND },
  testPrintBtn: {
    backgroundColor: 'rgba(254,180,0,0.1)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flex: 2,
    borderWidth: 1,
    borderColor: 'rgba(254,180,0,0.4)',
    borderStyle: 'dashed',
  },
  testPrintBtnText: {
    color: BRAND,
    fontWeight: '700',
    fontSize: 13,
  },
  testPrintDisabled: {
    opacity: 0.5,
  },
  removePrinterBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  removePrinterBtnText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  scanningContainer: {
    padding: 40,
    alignItems: 'center',
  },
  scanningText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 16,
  },
  rescanBtn: {
    backgroundColor: 'rgba(254,180,0,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(254,180,0,0.3)',
  },
  rescanBtnText: {
    color: BRAND,
    fontWeight: '600',
  },
  printerList: {
    padding: 8,
  },
  printerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  printerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  printerMac: {
    fontSize: 11,
  },
  selectIcon: {
    fontSize: 18,
    color: BRAND,
    fontWeight: 'bold',
  },
});