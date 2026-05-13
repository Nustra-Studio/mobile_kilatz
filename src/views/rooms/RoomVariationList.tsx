import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { VipRoomVariation } from '../../types';

// Mock variations
const MOCK_VARIATIONS_DATA: VipRoomVariation[] = [
    { id: '1', name: 'Standard Room', pricePerHour: 50000 },
    { id: '2', name: 'Large Room', pricePerHour: 75000 },
    { id: '3', name: 'VVIP Suite', pricePerHour: 150000 },
];

export const RoomVariationList = () => {
    const [variations, setVariations] = useState<VipRoomVariation[]>(MOCK_VARIATIONS_DATA);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleOpenModal = (variation?: VipRoomVariation) => {
        if (variation) {
            setEditingId(variation.id);
            setName(variation.name);
            setPrice(variation.pricePerHour.toString());
        } else {
            setEditingId(null);
            setName('');
            setPrice('');
        }
        setModalVisible(true);
    };

    const handleSave = () => {
        if (!name || !price) return;

        const newVariation: VipRoomVariation = {
            id: editingId || Date.now().toString(),
            name,
            pricePerHour: parseFloat(price)
        };

        if (editingId) {
            setVariations(prev => prev.map(v => v.id === editingId ? newVariation : v));
        } else {
            setVariations(prev => [...prev, newVariation]);
        }
        setModalVisible(false);
    };

    const handleDelete = (id: string) => {
        setVariations(prev => prev.filter(v => v.id !== id));
    };

    const renderItem = ({ item }: { item: VipRoomVariation }) => (
        <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex-row justify-between items-center shadow-sm">
            <View className="flex-row items-center">
                <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3 border border-purple-100">
                    <FontAwesome6 name="layer-group" size={16} color="#9333ea" iconStyle="solid" />
                </View>
                <View>
                    <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
                    <Text className="text-gray-500 text-sm">
                        Rate: <Text className="text-purple-700 font-semibold">Rp {item.pricePerHour.toLocaleString()}/hr</Text>
                    </Text>
                </View>
            </View>
            <View className="flex-row gap-2">
                <TouchableOpacity
                    onPress={() => handleOpenModal(item)}
                    className="p-2 bg-gray-100 rounded-lg"
                >
                    <FontAwesome6 name="pen" size={14} color="#374151" iconStyle="solid" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    className="p-2 bg-red-50 rounded-lg"
                >
                    <FontAwesome6 name="trash" size={14} color="#dc2626" iconStyle="solid" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View className="flex-1">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-700">Room Types & Pricing</Text>
                <Button title="Add Variation" size="sm" onPress={() => handleOpenModal()} />
            </View>

            <FlatList
                data={variations}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                ListEmptyComponent={
                    <Text className="text-center text-gray-400 mt-10">No variations defined.</Text>
                }
            />

            <Modal visible={modalVisible} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-center items-center p-4">
                    <View className="bg-white rounded-2xl w-full max-w-sm p-6">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-gray-900">{editingId ? 'Edit Variation' : 'New Variation'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <FontAwesome6 name="xmark" size={20} color="#6b7280" iconStyle="solid" />
                            </TouchableOpacity>
                        </View>

                        <Input label="Variation Name" value={name} onChangeText={setName} placeholder="e.g. VIP Suite" />
                        <Input label="Price Per Hour (Rp)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="100000" />

                        <Button title="Save Variation" onPress={handleSave} className="mt-4" />
                    </View>
                </View>
            </Modal>
        </View>
    );
};
