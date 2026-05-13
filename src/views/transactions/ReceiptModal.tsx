import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ReceiptSettings, ReceiptSettingsStorage } from '../../utils/receiptSettings';
import { CartItem } from '../../types';

interface ReceiptModalProps {
  visible: boolean;
  invoiceNumber: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'CASH' | 'QRIS' | 'DEBIT';
  cashReceived?: number;
  cashierName?: string;
  onClose: () => void;
}

const formatRp = (n: number) =>
  'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0 });

const formatDate = (d: Date) =>
  d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const dashes = (n = 32) => '─'.repeat(n);

export const ReceiptModal = ({
  visible,
  invoiceNumber,
  items,
  total,
  paymentMethod,
  cashReceived,
  cashierName,
  onClose,
}: ReceiptModalProps) => {
  const [settings, setSettings] = useState<ReceiptSettings | null>(null);
  const now = new Date();

  useEffect(() => {
    if (visible) {
      ReceiptSettingsStorage.get().then(setSettings);
    }
  }, [visible]);

  if (!settings) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.paper}>
            <ActivityIndicator color="#FEB400" style={{ marginTop: 32 }} />
          </View>
        </View>
      </Modal>
    );
  }

  const tax = settings.show_tax ? total * (settings.tax_rate / 100) : 0;
  const grandTotal = total + tax;
  const change = cashReceived ? cashReceived - grandTotal : 0;

  const handleShare = async () => {
    let text = '';
    text += `${settings.business_name}\n`;
    text += `${settings.address}\n`;
    text += `${settings.phone}\n`;
    text += `${dashes()}\n`;
    text += `Struk: ${invoiceNumber}\n`;
    text += `Tanggal: ${formatDate(now)}\n`;
    if (cashierName) text += `Kasir: ${cashierName}\n`;
    text += `${dashes()}\n`;
    items.forEach((item) => {
      text += `${item.name}\n`;
      text += `  ${item.quantity} x ${formatRp(item.price)} = ${formatRp(item.price * item.quantity)}\n`;
    });
    text += `${dashes()}\n`;
    text += `Subtotal : ${formatRp(total)}\n`;
    if (settings.show_tax) text += `Pajak ${settings.tax_rate}% : ${formatRp(tax)}\n`;
    text += `TOTAL    : ${formatRp(grandTotal)}\n`;
    text += `Bayar    : ${paymentMethod}\n`;
    if (cashReceived) text += `Tunai    : ${formatRp(cashReceived)}\n`;
    if (cashReceived) text += `Kembali  : ${formatRp(change)}\n`;
    text += `${dashes()}\n`;
    text += `${settings.tagline}\n`;
    if (settings.show_wifi) {
      text += `\n📶 WiFi: ${settings.wifi_ssid}\n`;
      if (settings.wifi_password) text += `🔑 Pass: ${settings.wifi_password}\n`;
    }
    if (settings.footer_note) text += `\n${settings.footer_note}\n`;

    await Share.share({ message: text, title: `Struk ${invoiceNumber}` });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        {/* Receipt Paper */}
        <View style={styles.paper}>
          {/* Header bar */}
          <View style={styles.paperHeader}>
            <Text style={styles.headerTitle}>Preview Struk</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.paperScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Receipt Content ── */}
            <View style={styles.receipt}>

              {/* Logo */}
              {settings.show_logo && (
                <View style={styles.logoArea}>
                  <Svg viewBox="0 0 320 320" width={56} height={56}>
                    <Defs>
                      <LinearGradient id="rBag" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#rBag)"
                    />
                    <Path
                      d="M 178,125 L 132,200 L 162,200 L 128,285 L 208,178 L 168,178 Z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
              )}

              {/* Business name */}
              <Text style={styles.bizName}>{settings.business_name}</Text>
              <Text style={styles.bizAddr}>{settings.address}</Text>
              {settings.phone ? <Text style={styles.bizAddr}>{settings.phone}</Text> : null}

              <Dash />

              {/* Invoice info */}
              <Row left="No. Struk" right={invoiceNumber} bold />
              <Row left="Tanggal" right={formatDate(now)} />
              {cashierName && <Row left="Kasir" right={cashierName} />}

              <Dash />

              {/* Items */}
              {items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemQty}>{item.quantity}x</Text>
                  <Text style={styles.itemPrice}>{formatRp(item.price * item.quantity)}</Text>
                </View>
              ))}

              <Dash />

              {/* Totals */}
              <Row left="Subtotal" right={formatRp(total)} />
              {settings.show_tax && (
                <Row left={`Pajak (${settings.tax_rate}%)`} right={formatRp(tax)} />
              )}
              <Row left="TOTAL" right={formatRp(grandTotal)} bold highlight />

              <Dash />

              {/* Payment */}
              <Row left="Metode" right={paymentMethod} />
              {cashReceived != null && cashReceived > 0 && (
                <>
                  <Row left="Tunai" right={formatRp(cashReceived)} />
                  <Row left="Kembalian" right={formatRp(change)} bold />
                </>
              )}

              <Dash />

              {/* Tagline */}
              <Text style={styles.tagline}>{settings.tagline}</Text>

              {/* WiFi */}
              {settings.show_wifi && (
                <View style={styles.wifiBox}>
                  <Text style={styles.wifiTitle}>📶 Informasi WiFi</Text>
                  <View style={styles.wifiRow}>
                    <Text style={styles.wifiLabel}>Nama WiFi</Text>
                    <Text style={styles.wifiValue}>{settings.wifi_ssid || '—'}</Text>
                  </View>
                  {settings.wifi_password ? (
                    <View style={styles.wifiRow}>
                      <Text style={styles.wifiLabel}>Password</Text>
                      <Text style={[styles.wifiValue, styles.wifiPass]}>
                        {settings.wifi_password}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Footer note */}
              {settings.footer_note ? (
                <Text style={styles.footerNote}>{settings.footer_note}</Text>
              ) : null}

              {/* Perforated edge */}
              <View style={styles.perfRow}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <View key={i} style={styles.perfDot} />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
              <Text style={styles.shareBtnText}>📤 Bagikan Struk</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Local sub-components ─────────────────────────────────────

const Dash = () => <View style={styles.dashLine} />;

const Row = ({
  left, right, bold, highlight,
}: { left: string; right: string; bold?: boolean; highlight?: boolean }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLeft, bold && styles.bold]}>{left}</Text>
    <Text style={[styles.rowRight, bold && styles.bold, highlight && styles.highlight]}>
      {right}
    </Text>
  </View>
);

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  paper: {
    backgroundColor: '#0F0A00',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(254,180,0,0.2)',
  },
  paperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,180,0,0.15)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '700' },
  paperScroll: { paddingHorizontal: 20, paddingBottom: 12 },

  // Receipt body
  receipt: {
    backgroundColor: '#FEFDF8',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoArea: { alignItems: 'center', marginBottom: 10 },
  bizName: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '900',
    color: '#1a1200',
    letterSpacing: 1,
  },
  bizAddr: {
    textAlign: 'center',
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 16,
    marginTop: 2,
  },
  dashLine: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
    borderStyle: 'dashed',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  rowLeft: { color: '#4b5563', fontSize: 12 },
  rowRight: { color: '#111827', fontSize: 12 },
  bold: { fontWeight: '700' },
  highlight: { color: '#FEB400', fontSize: 14 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  itemName: { flex: 1, color: '#111827', fontSize: 12 },
  itemQty: { color: '#9ca3af', fontSize: 11, marginHorizontal: 8, width: 24, textAlign: 'center' },
  itemPrice: { color: '#374151', fontSize: 12, fontWeight: '600', textAlign: 'right', minWidth: 80 },
  tagline: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 11,
    fontStyle: 'italic',
    marginVertical: 10,
  },
  wifiBox: {
    marginTop: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  wifiTitle: { fontSize: 11, fontWeight: '700', color: '#166534', marginBottom: 6 },
  wifiRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  wifiLabel: { color: '#4b5563', fontSize: 11 },
  wifiValue: { color: '#111827', fontSize: 11, fontWeight: '600' },
  wifiPass: { fontFamily: 'monospace', letterSpacing: 1 },
  footerNote: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 12,
    lineHeight: 14,
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  perfDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },

  // Action buttons
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(254,180,0,0.12)',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#FEB400',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#FEB400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  shareBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  doneBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  doneBtnText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 14 },
});
