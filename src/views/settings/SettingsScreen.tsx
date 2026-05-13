import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import { ReceiptSettingsSection } from './ReceiptSettingsSection';

type Tab = 'GENERAL' | 'RECEIPT';

export const SettingsScreen = () => {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [activeTab, setActiveTab] = useState<Tab>('GENERAL');
  const [taxRate, setTaxRate] = useState('11');

  // Dynamic styles based on theme
  const themeBg = isDark ? '#0F0A00' : '#F9FAFB';
  const themeCardBg = isDark ? '#1A1200' : '#FFFFFF';
  const themeText = isDark ? '#FFFFFF' : '#111827';
  const themeSubText = isDark ? 'rgba(255,255,255,0.4)' : '#6B7280';
  const themeBorder = isDark ? 'rgba(254,180,0,0.12)' : '#E5E7EB';

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: themeText }]}>Pengaturan</Text>
        <Text style={[styles.headerSub, { color: themeSubText }]}>Konfigurasi sistem kasir</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TabBtn label="⚙️  Umum" active={activeTab === 'GENERAL'} onPress={() => setActiveTab('GENERAL')} />
        <TabBtn label="🧾  Struk" active={activeTab === 'RECEIPT'} onPress={() => setActiveTab('RECEIPT')} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'GENERAL' ? (
          <>
            {/* ── Appearance ── */}
            <SectionCard title="🎨 Tampilan" isDark={isDark}>
              <SettingRow
                label="Tema Gelap (Dark Mode)"
                subtitle="Ganti ke tema gelap atau terang"
                isDark={isDark}
              >
                <Switch
                  value={isDark}
                  onValueChange={toggleColorScheme}
                  trackColor={{ false: '#D1D5DB', true: 'rgba(254,180,0,0.5)' }}
                  thumbColor={isDark ? '#FEB400' : '#FFFFFF'}
                />
              </SettingRow>
            </SectionCard>

            {/* ── Financials ── */}
            <SectionCard title="💰 Keuangan" isDark={isDark}>
              <SettingRow
                label="Tarif Pajak (%)"
                subtitle="PPN default jika struk mengaktifkan pajak"
                isDark={isDark}
              >
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>11%</Text>
                </View>
              </SettingRow>
            </SectionCard>

            {/* ── App Info ── */}
            <SectionCard title="ℹ️ Tentang Aplikasi" isDark={isDark}>
              <InfoRow label="Versi" value="1.2.0" isDark={isDark} />
              <InfoRow label="Platform" value="Kilatz Mobile" isDark={isDark} />
              <InfoRow label="Developer" value="Nustra Group" isDark={isDark} />
            </SectionCard>
          </>
        ) : (
          <SectionCard title="🧾 Pengaturan Struk" isDark={isDark}>
            <ReceiptSettingsSection />
          </SectionCard>
        )}
      </ScrollView>
    </View>
  );
};

// ── Sub-components ────────────────────────────────────────────

const TabBtn = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <TouchableOpacity
      style={[
        styles.tab, 
        active && styles.tabActive,
        !isDark && !active && { backgroundColor: '#E5E7EB' }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.tabText, 
        active && styles.tabTextActive,
        !isDark && !active && { color: '#6B7280' }
      ]}>{label}</Text>
    </TouchableOpacity>
  );
};

const SectionCard = ({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) => (
  <View style={[styles.card, { backgroundColor: isDark ? '#1A1200' : '#FFFFFF', borderColor: isDark ? 'rgba(254,180,0,0.12)' : '#E5E7EB' }]}>
    <Text style={[styles.cardTitle, { borderBottomColor: isDark ? 'rgba(254,180,0,0.08)' : '#F3F4F6' }]}>{title}</Text>
    <View style={styles.cardBody}>{children}</View>
  </View>
);

const SettingRow = ({
  label, subtitle, children, isDark
}: { label: string; subtitle?: string; children: React.ReactNode; isDark: boolean }) => (
  <View style={styles.settingRow}>
    <View style={styles.settingText}>
      <Text style={[styles.settingLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>{label}</Text>
      {subtitle && <Text style={[styles.settingSub, { color: isDark ? 'rgba(255,255,255,0.4)' : '#6B7280' }]}>{subtitle}</Text>}
    </View>
    {children}
  </View>
);

const InfoRow = ({ label, value, isDark }: { label: string; value: string; isDark: boolean }) => (
  <View style={[styles.infoRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
    <Text style={[styles.infoLabel, { color: isDark ? 'rgba(255,255,255,0.4)' : '#6B7280' }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>{value}</Text>
  </View>
);

// ── Styles ────────────────────────────────────────────────────

const BRAND = '#FEB400';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0A00' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: BRAND },
  tabText: { color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#000' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  card: {
    backgroundColor: '#1A1200',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(254,180,0,0.12)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,180,0,0.08)',
  },
  cardBody: { padding: 18 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingText: { flex: 1, marginRight: 12 },
  settingLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  settingSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  badgePill: {
    backgroundColor: 'rgba(254,180,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(254,180,0,0.3)',
  },
  badgeText: { color: BRAND, fontWeight: '800', fontSize: 13 },
  scanBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(254,180,0,0.1)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254,180,0,0.25)',
  },
  scanBtnText: { color: BRAND, fontWeight: '700', fontSize: 13 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  infoLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  infoValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
