import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { CartItem } from '../../types';
import { Button } from '../ui/Button';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  onCheckout: () => void;
  onClearCart: () => void;
}

export const Cart = ({ items, onUpdateQuantity, onRemoveItem, onCheckout, onClearCart }: CartProps) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.11; // Example 11% tax
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4 bg-gray-50 border-l border-gray-200">
        <Text className="text-gray-500 mb-4">Cart is empty</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white border-l border-gray-200 flex-col">
      <View className="p-4 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
        <Text className="text-xl font-bold text-gray-800">Order Summary</Text>
        <TouchableOpacity onPress={onClearCart}>
          <Text className="text-red-500 font-medium">Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {items.map((item) => (
          <View key={item.productId} className="py-4 border-b border-gray-100 flex-row justify-between items-start">
            <View className="flex-1 pr-2">
              <Text className="font-semibold text-gray-800 text-base mb-1">{item.name}</Text>
              <Text className="text-gray-500">Rp {item.price.toLocaleString()}</Text>
              {item.note && <Text className="text-gray-400 text-xs mt-1 italic">"{item.note}"</Text>}
            </View>

            <View className="flex-row items-center bg-gray-100 rounded-lg">
              <TouchableOpacity
                onPress={() => onUpdateQuantity(item.productId, -1)}
                className="px-3 py-2"
              >
                <Text className="text-lg font-bold text-gray-600">-</Text>
              </TouchableOpacity>
              <Text className="font-semibold text-gray-900 mx-1 w-6 text-center">{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => onUpdateQuantity(item.productId, 1)}
                className="px-3 py-2"
              >
                <Text className="text-lg font-bold text-gray-600">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="p-4 bg-gray-50 shadow-inner">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Subtotal</Text>
          <Text className="font-semibold">Rp {subtotal.toLocaleString()}</Text>
        </View>
        <View className="flex-row justify-between mb-4">
          <Text className="text-gray-600">Tax (11%)</Text>
          <Text className="font-semibold">Rp {tax.toLocaleString()}</Text>
        </View>
        <View className="flex-row justify-between mb-6 border-t border-gray-200 pt-4">
          <Text className="text-lg font-bold text-gray-900">Total</Text>
          <Text className="text-xl font-bold text-green-700">Rp {total.toLocaleString()}</Text>
        </View>
        <Button title="Process Payment" onPress={onCheckout} className="w-full" />
      </View>
    </View>
  );
};
