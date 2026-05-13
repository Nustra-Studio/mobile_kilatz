import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { VipRoomPackage } from '../../types';

// Mock packages
const MOCK_PACKAGES: VipRoomPackage[] = [
    { id: '1', name: 'Happy Hour 2Hr', durationMinutes: 120, price: 80000 },
    { id: '2', name: 'Family Packet 3Hr', durationMinutes: 180, price: 150000 },
    { id: '3', name: 'Night Owl 5Hr', durationMinutes: 300, price: 250000 },
];

export const RoomPackageList = () => {
    const [packages, setPackages] = useState<VipRoomPackage[]>(MOCK_PACKAGES);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [price, setPrice] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleOpenModal = (pkg?: VipRoomPackage) => {
        if (pkg) {
            setEditingId(pkg.id);
            setName(pkg.name);
            setDuration(pkg.durationMinutes.toString());
            setPrice(pkg.price.toString());
        } else {
            setEditingId(null);
            setName('');
            setDuration('');
            setPrice('');
        }
        setModalVisible(true);
    };

    const handleSave = () => {
        if (!name || !duration || !price) return;

        const newPackage: VipRoomPackage = {
            id: editingId || Date.now().toString(),
            name,
            durationMinutes: parseInt(duration),
            price: parseFloat(price)
        };

        if (editingId) {
            setPackages(prev => prev.map(p => p.id === editingId ? newPackage : p));
        } else {
            setPackages(prev => [...prev, newPackage]);
        }
        setModalVisible(false);
    };

    const handleDelete = (id: string) => {
        setPackages(prev => prev.filter(p => p.id !== id));
    };

    const renderItem = ({ item }: { item: VipRoomPackage }) => (
        <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex-row justify-between items-center shadow-sm">
            <View>
                <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
                <Text className="text-gray-500 text-sm">
                    {Math.floor(item.durationMinutes / 60)}h {item.durationMinutes % 60}m • Rp {item.price.toLocaleString()}
                </Text>
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
                <Text className="text-lg font-bold text-gray-700">Available Packages</Text>
                <Button title="Add Package" size="sm" onPress={() => handleOpenModal()} />
            </View>

            <FlatList
                data={packages}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                ListEmptyComponent={
                    <Text className="text-center text-gray-400 mt-10">No packages defined.</Text>
                }
            />

            <Modal visible={modalVisible} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-center items-center p-4">
                    <View className="bg-white rounded-2xl w-full max-w-sm p-6">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-gray-900">{editingId ? 'Edit Package' : 'New Package'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <FontAwesome6 name="xmark" size={20} color="#6b7280" iconStyle="solid" />
                            </TouchableOpacity>
                        </View>

                        <Input label="Package Name" value={name} onChangeText={setName} placeholder="e.g. Happy Hour" />
                        <Input label="Duration (Minutes)" value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="120" />
                        <Input label="Fixed Price (Rp)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="100000" />

                        <Button title="Save Package" onPress={handleSave} className="mt-4" />
                    </View>
                </View>
            </Modal>
        </View>
    );
};
