import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Input } from '../ui/Input';

type Role = 'CASHIER' | 'SUPERVISOR' | 'OWNER';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const RegisterScreen = ({ onBack, onSuccess }: RegisterScreenProps) => {
  const [outletId, setOutletId] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [role, setRole] = useState<Role>('CASHIER');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Dynamic Theme Colors
  const themeBg = isDark ? '#0F0A00' : '#F9FAFB';
  const themeCardBg = isDark ? '#1A1200' : '#FFFFFF';
  const themeText = isDark ? '#FFFFFF' : '#111827';
  const themeSubText = isDark ? 'rgba(255,255,255,0.4)' : '#6B7280';
  const themeInputBg = isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6';
  const themeInputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB';
  const themeFieldLabel = isDark ? 'rgba(255,255,255,0.6)' : '#4B5563';
  const themePillBg = isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB';

  const roles: { label: string; value: Role; emoji: string }[] = [
    { label: 'Kasir', value: 'CASHIER', emoji: '🧾' },
    { label: 'Supervisor', value: 'SUPERVISOR', emoji: '🔑' },
    { label: 'Owner', value: 'OWNER', emoji: '👑' },
  ];

  const validate = () => {
    if (!outletId || !name || !username || !pinCode || !confirmPin) {
      setError('Semua field wajib diisi.');
      return false;
    }
    if (isNaN(Number(outletId)) || Number(outletId) <= 0) {
      setError('Outlet ID harus berupa angka yang valid.');
      return false;
    }
    if (name.trim().length < 2) {
      setError('Nama minimal 2 karakter.');
      return false;
    }
    if (username.trim().length < 3) {
      setError('Username minimal 3 karakter.');
      return false;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setError('Username hanya boleh huruf kecil, angka, dan underscore.');
      return false;
    }
    if (pinCode.length < 4 || pinCode.length > 6) {
      setError('PIN harus 4-6 digit.');
      return false;
    }
    if (pinCode !== confirmPin) {
      setError('PIN dan konfirmasi PIN tidak cocok.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setError('');

    try {
      // TODO: Call AuthController.register() once backend is ready
      // await AuthController.register({ outletId: Number(outletId), name, username, pin_code: pinCode, role });

      // Simulate API delay for now
      await new Promise((res) => setTimeout(res, 1200));

      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Gagal mendaftar, coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: themeBg }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backIcon}>←</Text>
            <Text style={[styles.backText, { color: BRAND }]}>Kembali</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={[styles.logoBox, { backgroundColor: isDark ? 'rgba(254,180,0,0.12)' : 'rgba(254,180,0,0.08)' }]}>
            <Svg viewBox="0 0 320 320" width={60} height={60}>
              <Defs>
                <LinearGradient id="lgBag2" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FEC400" stopOpacity="1" />
                  <Stop offset="1" stopColor="#F08000" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Path
                d="M 90,135 C 110,55 190,55 210,135"
                fill="none"
                stroke="#FEC400"
                strokeWidth="13"
                strokeLinecap="round"
              />
              <Path
                d="M 50,135 L 250,135 L 215,285 C 210,302 192,312 160,312 C 128,312 110,302 105,285 Z"
                fill="url(#lgBag2)"
              />
              <Path
                d="M 178,125 L 132,200 L 162,200 L 128,285 L 208,178 L 168,178 Z"
                fill={isDark ? "#FFFFFF" : "#FFF"}
              />
            </Svg>
          </View>

          <Text style={[styles.title, { color: themeText }]}>Daftar Akun Baru</Text>
          <Text style={[styles.subtitle, { color: themeSubText }]}>Lengkapi informasi untuk membuat akun</Text>
        </View>

        {/* Form Card */}
        <View style={[styles.card, { backgroundColor: themeCardBg, borderColor: isDark ? 'rgba(254,180,0,0.15)' : '#E5E7EB' }]}>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          {/* Outlet ID */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: themeFieldLabel }]}>Outlet ID</Text>
            <View style={[styles.inputRow, { backgroundColor: themeInputBg, borderColor: themeInputBorder }]}>
              <Text style={styles.inputEmoji}>🏪</Text>
              <Input
                value={outletId}
                onChangeText={setOutletId}
                placeholder="ID outlet Anda"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                keyboardType="numeric"
                style={[styles.inputFlat, { color: themeText }]}
              />
            </View>
          </View>

          {/* Name */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: themeFieldLabel }]}>Nama Lengkap</Text>
            <View style={[styles.inputRow, { backgroundColor: themeInputBg, borderColor: themeInputBorder }]}>
              <Text style={styles.inputEmoji}>📝</Text>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Nama lengkap Anda"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                autoCapitalize="words"
                style={[styles.inputFlat, { color: themeText }]}
              />
            </View>
          </View>

          {/* Username */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: themeFieldLabel }]}>Username</Text>
            <View style={[styles.inputRow, { backgroundColor: themeInputBg, borderColor: themeInputBorder }]}>
              <Text style={styles.inputEmoji}>👤</Text>
              <Input
                value={username}
                onChangeText={(t) => setUsername(t.toLowerCase())}
                placeholder="huruf_kecil_dan_angka"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.inputFlat, { color: themeText }]}
              />
            </View>
          </View>

          {/* Role Selector */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: themeFieldLabel }]}>Role / Jabatan</Text>
            <View style={styles.roleRow}>
              {roles.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.rolePill, { backgroundColor: themePillBg, borderColor: themeInputBorder }, role === r.value && styles.rolePillActive]}
                  onPress={() => setRole(r.value)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.roleEmoji}>{r.emoji}</Text>
                  <Text style={[styles.roleLabel, { color: themeSubText }, role === r.value && styles.roleLabelActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* PIN */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: themeFieldLabel }]}>PIN Code</Text>
            <View style={[styles.inputRow, { backgroundColor: themeInputBg, borderColor: themeInputBorder }]}>
              <Text style={styles.inputEmoji}>🔒</Text>
              <Input
                value={pinCode}
                onChangeText={setPinCode}
                placeholder="Buat PIN 4-6 digit"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
                style={[styles.inputFlat, { color: themeText }]}
              />
            </View>
          </View>

          {/* Confirm PIN */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: themeFieldLabel }]}>Konfirmasi PIN</Text>
            <View style={[
              styles.inputRow,
              { backgroundColor: themeInputBg, borderColor: themeInputBorder },
              confirmPin.length > 0 && pinCode !== confirmPin && styles.inputRowError,
              confirmPin.length > 0 && pinCode === confirmPin && styles.inputRowSuccess,
            ]}>
              <Text style={styles.inputEmoji}>
                {confirmPin.length > 0 ? (pinCode === confirmPin ? '✅' : '❌') : '🔑'}
              </Text>
              <Input
                value={confirmPin}
                onChangeText={setConfirmPin}
                placeholder="Ulangi PIN Anda"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
                style={[styles.inputFlat, { color: themeText }]}
              />
            </View>
          </View>

          {/* PIN hint */}
          <Text style={styles.hint}>
            💡 PIN digunakan untuk masuk ke aplikasi kasir setiap hari
          </Text>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {isLoading ? 'Mendaftarkan...' : '✨ Buat Akun'}
            </Text>
          </TouchableOpacity>

          {/* Back to login */}
          <TouchableOpacity style={styles.loginLink} onPress={onBack}>
            <Text style={styles.loginLinkText}>Sudah punya akun? </Text>
            <Text style={styles.loginLinkBold}>Masuk di sini</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeSubText }]}>v1.2.0 • Kilatz by Nustra Group</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const BRAND = '#FEB400';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A00',
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
    alignSelf: 'flex-start',
  },
  backIcon: {
    color: BRAND,
    fontSize: 20,
    fontWeight: '700',
  },
  backText: {
    color: BRAND,
    fontSize: 14,
    fontWeight: '700',
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: 'rgba(254,180,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254,180,0,0.2)',
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  card: {
    backgroundColor: '#1A1200',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(254,180,0,0.15)',
  },
  errorBox: {
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  fieldWrapper: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingLeft: 12,
    overflow: 'hidden',
  },
  inputRowError: {
    borderColor: 'rgba(239,68,68,0.5)',
  },
  inputRowSuccess: {
    borderColor: 'rgba(34,197,94,0.5)',
  },
  inputEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  inputFlat: {
    flex: 1,
    height: 48,
    color: '#FFFFFF',
    fontSize: 15,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rolePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  rolePillActive: {
    backgroundColor: 'rgba(254,180,0,0.15)',
    borderColor: BRAND,
  },
  roleEmoji: {
    fontSize: 18,
  },
  roleLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  roleLabelActive: {
    color: BRAND,
  },
  hint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    marginBottom: 20,
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  loginLinkBold: {
    color: BRAND,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 16,
  },
  footerText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
  },
});
