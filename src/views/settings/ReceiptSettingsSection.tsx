import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ReceiptSettings, ReceiptSettingsStorage, DEFAULT_RECEIPT_SETTINGS } from '../../utils/receiptSettings';

export const ReceiptSettingsSection = () => {
  const [settings, setSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showWifiPass, setShowWifiPass] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    ReceiptSettingsStorage.get().then((s) => {
      setSettings(s);
      setIsLoading(false);
    });
  }, []);

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
      />

      {settings.printer_enabled && (
        <View style={styles.hardwareBox}>
          <View style={styles.deviceRow}>
            <View>
              <Text style={styles.deviceLabel}>Perangkat Terhubung</Text>
              {settings.printer_name ? (
                <Text style={styles.deviceName}>{settings.printer_name} ({settings.printer_mac})</Text>
              ) : (
                <Text style={styles.deviceNone}>Belum ada printer terhubung</Text>
              )}
            </View>
            <TouchableOpacity style={styles.scanMiniBtn} onPress={() => {
                // Simulate connect
                update('printer_name', 'MTP-II');
                update('printer_mac', '00:11:22:33:44:55');
            }}>
              <Text style={styles.scanMiniBtnText}>{settings.printer_name ? 'Ganti' : 'Cari'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.deviceLabel}>Ukuran Kertas (Thermal)</Text>
          <View style={styles.paperOptions}>
            <TouchableOpacity 
              style={[styles.paperOpt, settings.paper_size === '58mm' && styles.paperOptActive]}
              onPress={() => update('paper_size', '58mm')}
            >
              <Text style={[styles.paperOptText, settings.paper_size === '58mm' && styles.paperOptTextActive]}>58 mm</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.paperOpt, settings.paper_size === '80mm' && styles.paperOptActive]}
              onPress={() => update('paper_size', '80mm')}
            >
              <Text style={[styles.paperOptText, settings.paper_size === '80mm' && styles.paperOptTextActive]}>80 mm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Informasi Bisnis ─────────────────────── */}
      <SectionHeader icon="🏪" title="Informasi Bisnis" />

      <Field label="Nama Bisnis">
        <StyledInput
          value={settings.business_name}
          onChangeText={(v) => update('business_name', v)}
          placeholder="Nama toko / outlet"
        />
      </Field>

      <Field label="Alamat">
        <StyledInput
          value={settings.address}
          onChangeText={(v) => update('address', v)}
          placeholder="Jl. Contoh No. 1, Kota"
          multiline
          numberOfLines={2}
          style={{ minHeight: 56 }}
        />
      </Field>

      <Field label="No. Telepon">
        <StyledInput
          value={settings.phone}
          onChangeText={(v) => update('phone', v)}
          placeholder="021-1234567"
          keyboardType="phone-pad"
        />
      </Field>

      <Field label="Tagline / Slogan">
        <StyledInput
          value={settings.tagline}
          onChangeText={(v) => update('tagline', v)}
          placeholder="Terima kasih telah berkunjung!"
        />
      </Field>

      {/* ── WiFi ─────────────────────────────────── */}
      <SectionHeader icon="📶" title="Info WiFi" />

      <ToggleRow
        label="Tampilkan WiFi di Struk"
        subtitle="SSID & password WiFi akan muncul di bawah struk"
        value={settings.show_wifi}
        onValueChange={(v) => update('show_wifi', v)}
      />

      {settings.show_wifi && (
        <>
          <Field label="Nama WiFi (SSID)">
            <StyledInput
              value={settings.wifi_ssid}
              onChangeText={(v) => update('wifi_ssid', v)}
              placeholder="Nama jaringan WiFi"
            />
          </Field>

          <Field label="Password WiFi">
            <View style={styles.passwordRow}>
              <StyledInput
                value={settings.wifi_password}
                onChangeText={(v) => update('wifi_password', v)}
                placeholder="Password WiFi"
                secureTextEntry={!showWifiPass}
                style={{ flex: 1 }}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
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
      />

      <ToggleRow
        label="Tampilkan Pajak"
        subtitle="PPN akan dihitung dan ditampilkan di struk"
        value={settings.show_tax}
        onValueChange={(v) => update('show_tax', v)}
      />

      {settings.show_tax && (
        <Field label="Tarif Pajak (%)">
          <StyledInput
            value={String(settings.tax_rate)}
            onChangeText={(v) => update('tax_rate', parseFloat(v) || 0)}
            placeholder="11"
            keyboardType="numeric"
          />
        </Field>
      )}

      <Field label="Catatan Kaki Struk">
        <StyledInput
          value={settings.footer_note}
          onChangeText={(v) => update('footer_note', v)}
          placeholder="Pesan di bagian bawah struk..."
          multiline
          numberOfLines={2}
          style={{ minHeight: 56 }}
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

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

const StyledInput = ({
  style,
  multiline,
  numberOfLines,
  ...props
}: React.ComponentProps<typeof TextInput> & { style?: any }) => (
  <TextInput
    style={[styles.input, multiline && styles.inputMultiline, style]}
    placeholderTextColor="rgba(255,255,255,0.3)"
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
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleText}>
      <Text style={styles.toggleLabel}>{label}</Text>
      {subtitle && <Text style={styles.toggleSub}>{subtitle}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(254,180,0,0.5)' }}
      thumbColor={value ? '#FEB400' : 'rgba(255,255,255,0.4)'}
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
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
  toggleLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  toggleSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
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
  deviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  deviceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  deviceName: { color: '#4ade80', fontSize: 14, fontWeight: '600' },
  deviceNone: { color: '#f87171', fontSize: 14, fontWeight: '600' },
  scanMiniBtn: {
    backgroundColor: 'rgba(254,180,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  paperOptActive: { borderColor: BRAND, backgroundColor: 'rgba(254,180,0,0.1)' },
  paperOptText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 13 },
  paperOptTextActive: { color: BRAND },
});
