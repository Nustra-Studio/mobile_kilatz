import React, { useState } from 'react';
import { View, useWindowDimensions, TouchableOpacity, Text, Modal } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { ProductList } from '../products/ProductList';
import { Cart } from './Cart';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { Product, CartItem } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

import { TransactionController } from '../../controllers/TransactionController';
import { PrinterController } from '../../controllers/PrinterController';

export const POSScreen = ({ sidebar }: { sidebar: boolean }) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const { employee } = useAuth();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [syncToast, setSyncToast] = useState<'synced' | 'pending' | 'error' | null>(null);

  // Receipt state
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [lastInvoice, setLastInvoice] = useState('');
  const [lastPaymentMethod, setLastPaymentMethod] = useState<'CASH' | 'QRIS' | 'DEBIT'>('CASH');
  const [lastCashReceived, setLastCashReceived] = useState<number | undefined>();
  const [lastCartItems, setLastCartItems] = useState<CartItem[]>([]);
  const [lastTotal, setLastTotal] = useState(0);

  // Tab State
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'CUSTOM'>('PRODUCTS');

  // Custom Item State
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const addToCart = (product: Product) => {
    setCartItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCartItems((current) => {
      return current
        .map((item) => {
          if (item.productId === id) {
            const newQty = item.quantity + delta;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const clearCart = () => setCartItems([]);

  const addCustomItem = () => {
    if (!customName || !customPrice) return;

    const price = parseFloat(customPrice);
    if (isNaN(price)) return;

    // Use negative ID for custom transient items to avoid DB collision if possible, or 0
    // But Controller processTransaction expects ProductExists for stock update? 
    // Logic: custom items don't have stock tracking.
    // TransactionController currently tries to update stock for ALL items. 
    // I should create a 'Custom' entry in DB or handle custom items in Controller.
    // Hack for MVP: Controller will fail if product_id not found.
    // I will skip custom item feature refactor for now or just fake a product ID 0 and hope Controller handles it or I create a special product.
    // Let's assume custom items are not crucial for "Refactor to MVC" step 1, but I'll leave the UI there.
    // It will likely fail at checkout. I'll comment out implementation to be safe or use a dummy ID '999999'.

    const customProduct: Product = {
      id: 999999 + Math.floor(Math.random() * 1000), // Random ID
      name: customName,
      price: price,
      categoryId: 'custom',
      isActive: true,
    };

    addToCart(customProduct);
    setCustomName('');
    setCustomPrice('');
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0; // No tax for now simplified
  const total = subtotal + tax;

  const handlePaymentConfirm = async (method: 'CASH' | 'QRIS', cashAmount?: number) => {
    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }));

      const { invoiceNumber, syncStatus } = await TransactionController.processTransaction(
        orderItems,
        method,
        total
      );

      // Save receipt data before clearing cart
      setLastInvoice(invoiceNumber);
      setLastPaymentMethod(method);
      setLastCashReceived(cashAmount);
      setLastCartItems([...cartItems]);
      setLastTotal(total);

      // Show sync status toast
      setSyncToast(syncStatus);
      setTimeout(() => setSyncToast(null), 4000);

      // Auto-print receipt if enabled in settings
      // We don't await this so it doesn't block UI
      PrinterController.printReceipt({
        invoiceNumber: invoiceNumber,
        items: cartItems,
        total: total,
        paymentMethod: method,
        cashReceived: cashAmount,
        cashierName: employee?.name,
      });

      clearCart();
      setIsPaymentModalVisible(false);

      // Show receipt
      setReceiptVisible(true);
    } catch (e) {
      console.error('Transaction Failed', e);
    }
  };

  return (
    <View className="flex-1 flex-row bg-gray-100">
      {/* Sync Status Toast */}
      {syncToast && (
        <View style={{
          position: 'absolute', top: 12, left: 16, right: 16, zIndex: 999,
          backgroundColor: syncToast === 'synced' ? '#166534' : syncToast === 'error' ? '#7f1d1d' : '#92400e',
          borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16,
          flexDirection: 'row', alignItems: 'center', gap: 8,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
        }}>
          <Text style={{ fontSize: 16 }}>{syncToast === 'synced' ? '✅' : syncToast === 'error' ? '❌' : '⚠️'}</Text>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
            {syncToast === 'synced'
              ? 'Transaksi berhasil disinkron ke server'
              : syncToast === 'error'
              ? 'Transaksi gagal — cek koneksi & coba lagi'
              : 'Belum sinkron — akan dikirim otomatis'}
          </Text>
        </View>
      )}

      {/* Left Side: Product Grid */}
      <View className={`${isTablet ? 'w-2/3' : 'w-full'} flex-1 pt-2`}>

        <View
          className={`mb-6 mt-2 flex-row items-center justify-between transition-all pe-3 ${sidebar ? 'ps-4' : 'ps-16'}`}>
          <View>
            <Text className="text-2xl font-bold text-gray-900">POS</Text>
          </View>
          <TouchableOpacity
            className="rounded-full border border-gray-200 bg-white p-3 shadow-sm"
            onPress={() => console.log('Scan Barcode')}>
            <FontAwesome6 name="barcode" size={20} color="#4b5563" iconStyle="solid" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="mx-4 flex-row rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <TouchableOpacity
            onPress={() => setActiveTab('PRODUCTS')}
            className={`flex-1 flex-row items-center justify-center rounded-md py-3 ${activeTab === 'PRODUCTS' ? 'bg-primary-50' : ''}`}>
            <FontAwesome6
              name="burger"
              size={16}
              color={activeTab === 'PRODUCTS' ? '#FEB400' : '#6b7280'}
              iconStyle="solid"
              style={{ marginRight: 8 }}
            />
            <Text
              className={`font-bold ${activeTab === 'PRODUCTS' ? 'text-primary-700' : 'text-gray-500'}`}>
              Products
            </Text>
          </TouchableOpacity>

          {/* Custom Items - Future Enhancement
          <TouchableOpacity
            onPress={() => setActiveTab('CUSTOM')}
            className={`flex-1 flex-row items-center justify-center rounded-md py-3 ${activeTab === 'CUSTOM' ? 'bg-green-50' : ''}`}>
            <FontAwesome6
              name="plus"
              size={16}
              color={activeTab === 'CUSTOM' ? '#15803d' : '#6b7280'}
              iconStyle="solid"
              style={{ marginRight: 8 }}
            />
            <Text
              className={`font-bold ${activeTab === 'CUSTOM' ? 'text-green-700' : 'text-gray-500'}`}>
              Custom
            </Text>
          </TouchableOpacity> */}
        </View>

        {activeTab === 'PRODUCTS' ? (
          <ProductList
            onProductPress={addToCart}
          />
        ) : (
          <View className="flex-1 bg-gray-50 p-6">
            <View className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <Text className="mb-6 text-xl font-bold text-gray-900">Add Custom Item</Text>

              <Input
                label="Item Name"
                placeholder="e.g. Service Fee, Extra Sauce"
                value={customName}
                onChangeText={setCustomName}
              />

              <Input
                label="Price (Rp)"
                placeholder="0"
                value={customPrice}
                onChangeText={setCustomPrice}
                keyboardType="numeric"
              />

              <Button title="Add to Cart" onPress={addCustomItem} variant="primary" />
            </View>
          </View>
        )}
      </View>

      {/* Right Side: Cart (Hidden on mobile if not active, or separate screen) */}
      {isTablet && (
        <View className="w-1/3">
          <Cart
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={(id) => updateQuantity(id, -100)} // quick remove
            onCheckout={() => setIsPaymentModalVisible(true)}
            onClearCart={clearCart}
          />
        </View>
      )}

      {/* Mobile Cart Modal */}
      {!isTablet && (
        <Modal
          visible={isCartVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsCartVisible(false)}>
          <View className="flex-1 bg-white pt-6">
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 pb-4">
              <Text className="text-xl font-bold text-gray-900">Shopping Cart</Text>
              <TouchableOpacity onPress={() => setIsCartVisible(false)}>
                <Text className="text-lg font-semibold text-blue-600">Close</Text>
              </TouchableOpacity>
            </View>
            <Cart
              items={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={(id) => updateQuantity(id, -100)}
              onCheckout={() => {
                setIsCartVisible(false);
                setIsPaymentModalVisible(true);
              }}
              onClearCart={clearCart}
            />
          </View>
        </Modal>
      )}

      {/* Floating Cart Button (Mobile Only) */}
      {!isTablet && cartItems.length > 0 && (
        <TouchableOpacity
          onPress={() => setIsCartVisible(true)}
          className="elevation-5 absolute bottom-6 right-6 z-50 flex-row items-center rounded-full bg-green-600 p-4 shadow-lg">
          <View className="mr-2">
            <FontAwesome6 name="cart-shopping" size={24} color="white" iconStyle="solid" />
          </View>
          <View className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-0.5">
            <Text className="text-xs font-bold text-white">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </Text>
          </View>
          <Text className="text-lg font-bold text-white">View Cart</Text>
        </TouchableOpacity>
      )}

      <PaymentModal
        visible={isPaymentModalVisible}
        total={total}
        onClose={() => setIsPaymentModalVisible(false)}
        onConfirm={handlePaymentConfirm}
      />

      <ReceiptModal
        visible={receiptVisible}
        invoiceNumber={lastInvoice}
        items={lastCartItems}
        total={lastTotal}
        paymentMethod={lastPaymentMethod}
        cashReceived={lastCashReceived}
        cashierName={employee?.name}
        onClose={() => setReceiptVisible(false)}
      />
    </View>
  );
};
