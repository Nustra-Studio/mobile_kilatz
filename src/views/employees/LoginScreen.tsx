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
import { useAuth } from '../../contexts/AuthContext';
import { AuthController } from '../../controllers/AuthController';
import { Input } from '../ui/Input';

interface LoginScreenProps {
  onLogin: () => void;
  onRegister?: () => void;
}

export const LoginScreen = ({ onLogin, onRegister }: LoginScreenProps) => {
  const [outletId, setOutletId] = useState('');
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthData } = useAuth();
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

  const handleSubmit = async () => {
    if (!outletId || !username || !pinCode) {
      setError('Semua field wajib diisi.');
      return;
    }

    if (isNaN(Number(outletId)) || Number(outletId) <= 0) {
      setError('Outlet ID harus berupa angka yang valid.');
      return;
    }

    if (pinCode.length < 4 || pinCode.length > 6) {
      setError('PIN harus 4-6 digit.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await AuthController.login(username, pinCode, Number(outletId));

      setAuthData({
        tenantId: response.tenant_id,
        outletId: response.outlet_id,
        employee: response.employee,
        role: response.role,
      });

      onLogin();
    } catch (e: any) {
      setError(e.message || 'Gagal login, coba lagi.');
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
      >
        {/* Top Brand Area */}
        <View style={styles.header}>
          <Text style={[styles.brandName, { color: themeText }]}>KILATZ</Text>
          <Text style={[styles.brandSub, { color: themeSubText }]}>Sistem Kasir Profesional</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: themeCardBg, borderColor: isDark ? 'rgba(254,180,0,0.15)' : '#E5E7EB' }]}>
          <Text style={[styles.cardTitle, { color: themeText }]}>Masuk ke Akun</Text>
          <Text style={[styles.cardSub, { color: themeSubText }]}>Masukkan detail outlet & kredensial Anda</Text>

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
              <Input
                value={outletId}
                onChangeText={setOutletId}
                placeholder="Contoh: 1"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                keyboardType="numeric"
                style={[styles.inputFlat, { color: themeText }]}
              />
            </View>
          </View>

          {/* Username */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: themeFieldLabel }]}>Username</Text>
            <View style={[styles.inputRow, { backgroundColor: themeInputBg, borderColor: themeInputBorder }]}>
              <Input
                value={username}
                onChangeText={setUsername}
                placeholder="Masukkan username"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.inputFlat, { color: themeText }]}
              />
            </View>
          </View>

          {/* PIN */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.fieldLabel, { color: themeFieldLabel }]}>PIN Code</Text>
            <View style={[styles.inputRow, { backgroundColor: themeInputBg, borderColor: themeInputBorder }]}>
              <Input
                value={pinCode}
                onChangeText={setPinCode}
                placeholder="4-6 digit PIN"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
                style={[styles.inputFlat, { color: themeText }]}
              />
            </View>
          </View>

          {/* Forgot PIN */}
          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Lupa PIN?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <Text style={styles.loginBtnText}>Memproses...</Text>
            ) : (
              <Text style={styles.loginBtnText}> Masuk Sekarang</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
            <Text style={[styles.dividerText, { color: themeSubText }]}>atau</Text>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
          </View>

          {/* Register */}
          {onRegister && (
            <TouchableOpacity style={styles.registerBtn} onPress={onRegister} activeOpacity={0.8}>
              <Text style={styles.registerBtnText}>Daftar Akun Baru</Text>
            </TouchableOpacity>
          )}
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(254,180,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(254,180,0,0.25)',
    marginBottom: 16,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 10,
  },
  brandSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#1A1200',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(254,180,0,0.15)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 20,
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
    fontSize: 12,
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
    overflow: 'hidden',
  },
  inputIcon: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIconText: {
    fontSize: 16,
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
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotText: {
    color: BRAND,
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '600',
  },
  registerBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(254,180,0,0.4)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(254,180,0,0.06)',
  },
  registerBtnText: {
    color: BRAND,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
  },
});
