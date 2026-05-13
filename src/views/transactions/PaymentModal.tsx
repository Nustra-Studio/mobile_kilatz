import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface PaymentModalProps {
  visible: boolean;
  total: number;
  onClose: () => void;
  onConfirm: (method: 'CASH' | 'QRIS', cashAmount?: number) => void;
}

export const PaymentModal = ({ visible, total, onClose, onConfirm }: PaymentModalProps) => {
  const [method, setMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [cashAmount, setCashAmount] = useState('');

  const change = parseFloat(cashAmount) - total;
  const canConfirm = method === 'QRIS' || (method === 'CASH' && parseFloat(cashAmount) >= total);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 h-[80%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-gray-900">Payment</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-blue-600 font-semibold">Close</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center mb-8">
            <Text className="text-gray-500 mb-1">Total Amount</Text>
            <Text className="text-4xl font-bold text-green-600">Rp {total.toLocaleString()}</Text>
          </View>

          <Text className="font-semibold mb-3 text-gray-700">Payment Method</Text>
          <View className="flex-row gap-4 mb-6">
            <TouchableOpacity 
              onPress={() => setMethod('CASH')}
              className={`flex-1 p-4 rounded-xl border-2 items-center ${
                method === 'CASH' ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <View className="flex-row items-center">
                <FontAwesome6 name="money-bill" size={18} color={method === 'CASH' ? '#15803d' : '#4b5563'} iconStyle="solid" style={{marginRight: 8}} />
                <Text className={`font-bold ${method === 'CASH' ? 'text-green-700' : 'text-gray-600'}`}>
                    Cash
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setMethod('QRIS')}
              className={`flex-1 p-4 rounded-xl border-2 items-center ${
                method === 'QRIS' ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <View className="flex-row items-center">
                <FontAwesome6 name="mobile-screen" size={18} color={method === 'QRIS' ? '#15803d' : '#4b5563'} iconStyle="solid" style={{marginRight: 8}} />
                <Text className={`font-bold ${method === 'QRIS' ? 'text-green-700' : 'text-gray-600'}`}>
                    QRIS
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {method === 'CASH' && (
            <View className="mb-6">
                <Input
                    label="Cash Received"
                    keyboardType="numeric"
                    value={cashAmount}
                    onChangeText={setCashAmount}
                    placeholder="Enter amount"
                    className="text-xl"
                />
                {cashAmount && (
                    <View className="flex-row justify-between mt-2 p-3 bg-gray-100 rounded-lg">
                        <Text className="font-semibold text-gray-700">Change:</Text>
                        <Text className={`font-bold text-lg ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                            Rp {change >= 0 ? change.toLocaleString() : 'Insufficient'}
                        </Text>
                    </View>
                )}
            </View>
          )}

          {method === 'QRIS' && (
            <View className="items-center justify-center p-8 bg-gray-50 rounded-xl mb-6 border border-gray-200 border-dashed">
                <Text className="text-gray-400 mb-2">QRIS Code Display Area</Text>
                <View className="w-48 h-48 bg-gray-200 rounded-lg" />
            </View>
          )}

          < View className="flex-1 justify-end">
            <Button 
                title={`Confirm Payment - Rp ${total.toLocaleString()}`}
                onPress={() => onConfirm(method, parseFloat(cashAmount))}
                disabled={!canConfirm}
                className="w-full"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
