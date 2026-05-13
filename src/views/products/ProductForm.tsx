import React, { useState, useEffect } from 'react';
import { View, Text, Switch, ScrollView, Image, TouchableOpacity, Alert, Modal, FlatList, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Product } from '../../types';
import { ProductController } from '../../controllers/ProductController';
import { CategoryController } from '../../controllers/CategoryController';
import { Category } from '../../models/CategoryModel';

interface ProductFormProps {
  initialData?: Product | null;
  onSave: (data: Partial<Product>) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES = [
  'Food', 'Beverage', 'Snack', 'Dessert', 'Coffee',
  'Non-Coffee', 'Alcohol', 'Ingredient', 'Packaging', 'Service'
];

interface CategorySelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: string) => void;
  currentCategory: string;
}

const CategorySelectModal = ({ visible, onClose, onSelect, currentCategory }: CategorySelectModalProps) => {
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (visible) {
      CategoryController.getCategories().then(setCategories);
    } else {
      setSearch('');
    }
  }, [visible]);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl h-[70%] p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">Select Category</Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 rounded-full">
              <FontAwesome6 name="xmark" size={16} color="#4b5563" iconStyle="solid" />
            </TouchableOpacity>
          </View>

          <View className="bg-gray-100 rounded-xl flex-row items-center px-4 py-3 mb-4">
            <FontAwesome6 name="magnifying-glass" size={16} color="#9ca3af" iconStyle="solid" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Search category..."
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <FlatList
            data={filteredCategories}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item.name); // Using name for now assuming uniqueness, or ID if model updated
                  onClose();
                }}
                className={`p-4 border-b border-gray-100 flex-row justify-between items-center ${item.name === currentCategory ? 'bg-primary-50' : ''}`}
              >
                <View className="flex-row items-center">
                  <FontAwesome6 name={item.icon as any || 'circle'} size={14} color="#6b7280" style={{ marginRight: 10 }} />
                  <Text className={`text-base ${item.name === currentCategory ? 'text-primary-700 font-bold' : 'text-gray-800'}`}>
                    {item.name}
                  </Text>
                </View>
                {item.name === currentCategory && (
                  <FontAwesome6 name="check" size={16} color="#FEB400" iconStyle="solid" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

export const ProductForm = ({ initialData, onSave, onCancel }: ProductFormProps) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  // Stock is managed via Stock Management

  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Variants State
  const [variants, setVariants] = useState<{ name: string; price: string }[]>([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPrice(initialData.price.toString());
      setCostPrice(initialData.costPrice?.toString() || '');
      // Stock is not editable here

      setImageUrl(initialData.imageUrl || '');
      setCategoryId(initialData.categoryId);
      setIsActive(initialData.isActive);
      // Map existing variants if any
      if (initialData.variants) {
        setVariants(
          initialData.variants.map((v, i) => ({
            id: initialData?.variants?.[i]?.id || Math.random().toString(), // Mock ID gen
            name: v.name,
            price: v.priceModifier.toString(),
          }))
        );
      }
    }
  }, [initialData]);

  const addVariant = () => {
    if (newVariantName && newVariantPrice) {
      setVariants([...variants, { name: newVariantName, price: newVariantPrice }]);
      setNewVariantName('');
      setNewVariantPrice('');
    }
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const saveImageLocally = async (uri: string): Promise<string> => {
    if (!uri) return '';
    // If it's already a remote URL, keep it
    if (uri.startsWith('http')) return uri;
    // If it's already in our document directory, keep it (edit mode)
    if (uri.startsWith(((FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '') as string)) return uri;

    try {
      const filename = uri.split('/').pop() || `product_${Date.now()}.jpg`;
      const newPath = ((FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '') + filename;
      await FileSystem.copyAsync({
        from: uri,
        to: newPath
      });
      return newPath;
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image locally');
      return uri; // Fallback
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save image first
      const savedImageUrl = await saveImageLocally(imageUrl);

      await ProductController.saveProduct({
        id: initialData?.id,
        name,
        price: parseFloat(price) || 0,
        // costPrice: parseFloat(costPrice) || 0, // Model doesnt have costPrice yet, ignoring
        stock: initialData?.stock || 0, // Managed elsewhere or kept same
        image_uri: savedImageUrl, // Model uses image_uri
        category: categoryId,
        is_active: isActive ? 1 : 0,
        // Variants not yet supported in Model for MVP
      });

      await onSave({}); // Notify parent, payload doesn't matter if parent reloads
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={onCancel} className="mr-4 p-2 bg-gray-100 rounded-full">
          <FontAwesome6 name="arrow-left" size={20} color="#374151" iconStyle="solid" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">
          {initialData ? 'Edit Product' : 'Add New Product'}
        </Text>
      </View>

      <View className="items-center mb-6">
        <TouchableOpacity onPress={pickImage} className="items-center justify-center">
          {imageUrl ? (
            <View className="relative">
              <Image
                source={{ uri: imageUrl }}
                className="w-32 h-32 rounded-xl bg-gray-200"
                resizeMode="cover"
              />
              <View className="absolute bottom-0 right-0 bg-primary-600 p-2 rounded-full border-2 border-white shadow-sm">
                <FontAwesome6 name="camera" size={12} color="white" iconStyle="solid" />
              </View>
            </View>
          ) : (
            <View className="w-32 h-32 rounded-xl bg-gray-100 items-center justify-center border-2 border-dashed border-gray-300">
              <FontAwesome6 name="image" size={32} color="#9ca3af" iconStyle="solid" />
              <Text className="text-gray-400 text-xs mt-2 font-medium">Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Input
        label="Product Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Fried Rice"
      />

      <Input
        label="Selling Price (Rp)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        placeholder="0"
      />

      <Input
        label="Cost Price (Rp) - Optional"
        value={costPrice}
        onChangeText={setCostPrice}
        keyboardType="numeric"
        placeholder="0"
      />

      <View className="mb-4">
        <Text className="text-sm font-bold text-gray-700 mb-2">Category</Text>
        <TouchableOpacity
          onPress={() => setIsCategoryModalVisible(true)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row justify-between items-center"
        >
          <Text className={categoryId ? "text-gray-900" : "text-gray-400"}>
            {categoryId || "Select Category"}
          </Text>
          <FontAwesome6 name="chevron-down" size={14} color="#6b7280" iconStyle="solid" />
        </TouchableOpacity>
      </View>





      <View className="flex flex-row items-center justify-between mb-3">
        <Text className="mt-4 text-gray-600">Is Active</Text>

        <Switch value={isActive} onValueChange={setIsActive} />
      </View>

      <Button
        title={initialData ? 'Update Product' : 'Add Product'}
        onPress={handleSave}
        isLoading={isLoading}
      />

      <CategorySelectModal
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelect={setCategoryId}
        currentCategory={categoryId}
      />
    </ScrollView>
  );
};
