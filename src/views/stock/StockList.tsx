import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Image } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { NotificationBell } from '../ui/NotificationBell';

// Mock Data (In a real app, this would be fetched/synced)
const MOCK_STOCK_DATA = [
  { id: '1', name: 'Nasi Goreng Spesial', stock: 45, unit: 'portion', minLevel: 10, category: 'Food', imageUrl: null },
  { id: '2', name: 'Es Teh Manis', stock: 5, unit: 'glass', minLevel: 10, category: 'Beverage', imageUrl: null }, // Low
  { id: '3', name: 'Minyak Goreng', stock: 20, unit: 'L', minLevel: 5, category: 'Ingredient', imageUrl: null },
  { id: '4', name: 'Ayam Potong', stock: 0, unit: 'kg', minLevel: 5, category: 'Ingredient', imageUrl: null }, // Out of stock
];

interface AdjustmentModalProps {
  visible: boolean;
  type: 'IN' | 'OUT';
  item: typeof MOCK_STOCK_DATA[0] | null;
  onClose: () => void;
  onConfirm: (qty: number, reason: string) => void;
}

const AdjustmentModal = ({ visible, type, item, onClose, onConfirm }: AdjustmentModalProps) => {
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) {
        setQty('');
        setReason('');
    }
  }, [visible]);

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
            <View className="bg-white rounded-2xl w-full max-w-sm p-6">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-xl font-bold text-gray-900">
                        {type === 'IN' ? 'Stock In (Restock)' : 'Stock Out (Usage/Damage)'}
                    </Text>
                    <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 rounded-full">
                        <FontAwesome6 name="xmark" size={16} color="#4b5563" iconStyle="solid" />
                    </TouchableOpacity>
                </View>

                <View className="bg-gray-50 p-4 rounded-xl mb-4 flex-row items-center border border-gray-100">
                    <View className="flex-1">
                        <Text className="font-bold text-gray-800">{item.name}</Text>
                        <Text className="text-gray-500 text-xs text-capitalize">Current: {item.stock} {item.unit}</Text>
                    </View>
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${type === 'IN' ? 'bg-green-100' : 'bg-orange-100'}`}>
                        <FontAwesome6 name={type === 'IN' ? "arrow-down" : "arrow-up"} size={16} color={type === 'IN' ? "#15803d" : "#c2410c"} iconStyle="solid"/>
                    </View>
                </View>

                <Input 
                    label="Quantity" 
                    value={qty} 
                    onChangeText={setQty} 
                    keyboardType="numeric" 
                    placeholder="0"
                />
                
                <Input 
                    label="Reason / Note" 
                    value={reason} 
                    onChangeText={setReason} 
                    placeholder={type === 'IN' ? "e.g. Supplier delivery" : "e.g. Broken, Expired"}
                />

                <Button 
                    title="Confirm Adjustment" 
                    onPress={() => onConfirm(parseInt(qty) || 0, reason)}
                    variant={type === 'IN' ? 'primary' : 'danger'} 
                    className={`mt-2 ${type === 'OUT' ? 'bg-orange-600' : ''}`}
                />
            </View>
        </View>
    </Modal>
  );
};

export const StockList = ({sidebar}: {sidebar: boolean}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'All' | 'Low Stock'>('All');
    const [modalVisible, setModalVisible] = useState(false);
    const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
    const [selectedItem, setSelectedItem] = useState<typeof MOCK_STOCK_DATA[0] | null>(null);

    // Mock local state update
    const [stockItems, setStockItems] = useState(MOCK_STOCK_DATA);

    const filteredItems = stockItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'Low Stock' ? item.stock <= item.minLevel : true;
        return matchesSearch && matchesFilter;
    });

    const lowStockCount = stockItems.filter(i => i.stock <= i.minLevel).length;

    const handleAdjust = (item: typeof MOCK_STOCK_DATA[0], type: 'IN' | 'OUT') => {
        setSelectedItem(item);
        setAdjustType(type);
        setModalVisible(true);
    };

    const confirmAdjustment = (qty: number, reason: string) => {
        if (!selectedItem || qty <= 0) return;

        setStockItems(prev => prev.map(item => {
            if (item.id === selectedItem.id) {
                return {
                    ...item,
                    stock: adjustType === 'IN' ? item.stock + qty : Math.max(0, item.stock - qty)
                };
            }
            return item;
        }));
        setModalVisible(false);
    };

    const renderItem = ({ item }: { item: typeof MOCK_STOCK_DATA[0] }) => {
        const isLow = item.stock <= item.minLevel;
        const isOut = item.stock === 0;

        return (
            <Card className={`mb-3 flex-row items-center p-3 border-l-4 ${isOut ? 'border-l-gray-400 opacity-80' : isLow ? 'border-l-red-500' : 'border-l-green-500'}`}>
                {/* Icon/Image */}
                <View className="w-12 h-12 bg-gray-100 rounded-lg mr-3 items-center justify-center">
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} className="w-12 h-12 rounded-lg" />
                    ) : (
                        <FontAwesome6 name="box" size={20} color="#9ca3af" iconStyle="solid" />
                    )}
                </View>

                {/* Info */}
                <View className="flex-1 mr-2">
                    <Text className="text-base font-bold text-gray-800" numberOfLines={1}>{item.name}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-gray-500 text-xs mr-2">Min: {item.minLevel}</Text>
                        {isLow && (
                             <View className="bg-red-100 px-2 py-0.5 rounded">
                                 <Text className="text-red-700 text-[10px] font-bold">LOW STOCK</Text>
                             </View>
                        )}
                    </View>
                </View>

                {/* Stock Level */}
                <View className="items-end mr-4 min-w-[50px]">
                    <Text className={`text-xl font-bold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.stock}
                    </Text>
                    <Text className="text-[10px] text-gray-400">{item.unit}</Text>
                </View>

                {/* Actions */}
                <View className="flex-row gap-2">
                     <TouchableOpacity 
                        onPress={() => handleAdjust(item, 'IN')}
                        className="w-9 h-9 bg-green-50 rounded-lg items-center justify-center border border-green-200 active:bg-green-100"
                     >
                         <FontAwesome6 name="plus" size={14} color="#16a34a" iconStyle="solid"/>
                     </TouchableOpacity>
                     
                     <TouchableOpacity 
                        onPress={() => handleAdjust(item, 'OUT')}
                        className="w-9 h-9 bg-orange-50 rounded-lg items-center justify-center border border-orange-200 active:bg-orange-100"
                     >
                         <FontAwesome6 name="minus" size={14} color="#ea580c" iconStyle="solid"/>
                     </TouchableOpacity>
                </View>
            </Card>
        );
    };

    return (
        <View className="flex-1 bg-white px-4 pt-2">
            <View className={`flex-row justify-between items-center mb-2 mt-2 ${sidebar ? 'ps-0' : 'ps-14'}`}>
                <Text className="text-2xl font-bold text-gray-900">Stock</Text>
                <NotificationBell />
            </View>

            <View className="flex-row gap-3 mb-4">
                <TouchableOpacity 
                    onPress={() => setFilter('All')}
                    className={`flex-1 p-3 rounded-xl border ${filter === 'All' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                >
                    <Text className="text-blue-800 font-bold text-xl">{stockItems.length}</Text>
                    <Text className="text-blue-600 text-xs">Total Items</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={() => setFilter('Low Stock')}
                    className={`flex-1 p-3 rounded-xl border ${filter === 'Low Stock' ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}
                >
                    <Text className="text-red-800 font-bold text-xl">{lowStockCount}</Text>
                    <Text className="text-red-600 text-xs">Low Stock Alert</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <Input 
                placeholder="Search stock items..." 
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            {/* List */}
            <FlatList
                className="flex-1"
                data={filteredItems}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View className="items-center justify-center py-10">
                        <Text className="text-gray-400">No stock items found.</Text>
                    </View>
                }
            />

            <AdjustmentModal 
                visible={modalVisible}
                type={adjustType}
                item={selectedItem}
                onClose={() => setModalVisible(false)}
                onConfirm={confirmAdjustment}
            />
        </View>
    );
};
