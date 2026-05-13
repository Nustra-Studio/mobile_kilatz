import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { CategoryController } from '../../controllers/CategoryController';
import { Category } from '../../models/CategoryModel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

export const CategoryList = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState<Category['type']>('FOOD');
    const [icon, setIcon] = useState('burger');

    const fetchCategories = async () => {
        try {
            const data = await CategoryController.getCategories();
            setCategories(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSave = async () => {
        try {
            if (editingCategory) {
                await CategoryController.updateCategory(editingCategory.id, { name, type, icon });
            } else {
                await CategoryController.addCategory(name, type, icon);
            }
            setIsModalVisible(false);
            resetForm();
            fetchCategories();
        } catch (e) {
            Alert.alert('Error', 'Failed to save category');
        }
    };

    const handleDelete = async (id: number) => {
        Alert.alert('Delete Category', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await CategoryController.deleteCategory(id);
                    fetchCategories();
                }
            }
        ]);
    };

    const resetForm = () => {
        setName('');
        setType('FOOD');
        setIcon('burger');
        setEditingCategory(null);
    };

    const openEdit = (cat: Category) => {
        setEditingCategory(cat);
        setName(cat.name);
        setType(cat.type);
        setIcon(cat.icon || 'burger');
        setIsModalVisible(true);
    };

    const renderItem = ({ item }: { item: Category }) => (
        <Card className="mb-3 p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-4">
                    <FontAwesome6 name={item.icon as any || 'circle'} size={18} color="#FEB400" iconStyle="solid" />
                </View>
                <View>
                    <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
                    <Text className="text-xs text-gray-500">{item.type}</Text>
                </View>
            </View>
            <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => openEdit(item)} className="p-2">
                    <FontAwesome6 name="pen-to-square" size={18} color="#4b5563" iconStyle="solid" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-2">
                    <FontAwesome6 name="trash" size={18} color="#ef4444" iconStyle="solid" />
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View className="flex-1 bg-gray-50 p-4 pt-6">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-gray-900">Categories</Text>
                <Button title="Add New" size="sm" onPress={() => { resetForm(); setIsModalVisible(true); }} />
            </View>

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No categories found.</Text>}
            />

            <Modal visible={isModalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-center p-4">
                    <View className="bg-white rounded-xl p-6">
                        <Text className="text-xl font-bold mb-4">{editingCategory ? 'Edit Category' : 'New Category'}</Text>

                        <Input label="Name" value={name} onChangeText={setName} placeholder="Category Name" />

                        <Text className="mb-2 font-bold text-gray-700">Type</Text>
                        <View className="flex-row gap-2 mb-4">
                            {['FOOD', 'DRINK', 'SNACK'].map(t => (
                                <TouchableOpacity
                                    key={t}
                                    onPress={() => setType(t as any)}
                                    className={`px-4 py-2 rounded-full border ${type === t ? 'bg-primary-50 border-primary-500' : 'bg-white border-gray-300'}`}
                                >
                                    <Text className={type === t ? 'text-primary-700 font-bold' : 'text-gray-600'}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text className="mb-2 font-bold text-gray-700">Icon</Text>
                        <View className="flex-row flex-wrap gap-4 mb-4">
                            {[
                                'burger', 'glass-water', 'bowl-food', 'ice-cream',
                                'pizza-slice', 'mug-hot', 'utensils', 'martini-glass',
                                'beer-mug-empty', 'carrot', 'apple-whole', 'fish',
                                'drumstick-bite', 'bread-slice', 'cake-candles', 'box'
                            ].map((iconName) => (
                                <TouchableOpacity
                                    key={iconName}
                                    onPress={() => setIcon(iconName)}
                                    className={`w-12 h-12 rounded-full items-center justify-center border ${icon === iconName ? 'bg-primary-100 border-primary-500' : 'bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <FontAwesome6
                                        name={iconName as any}
                                        size={20}
                                        color={icon === iconName ? '#FEB400' : '#4b5563'}
                                        iconStyle="solid"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="flex-row gap-3 mt-4">
                            <Button title="Cancel" variant="secondary" onPress={() => setIsModalVisible(false)} className="flex-1" />
                            <Button title="Save" onPress={handleSave} className="flex-1" />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
