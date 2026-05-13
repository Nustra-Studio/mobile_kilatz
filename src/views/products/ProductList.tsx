import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { NotificationBell } from '../ui/NotificationBell';
import { Product } from '../../types';
import { Category as CategoryModelType } from '../../models/CategoryModel';

// Mock data for initial visualization - would come from API
// const MOCK_CATEGORIES: Category[] = [ ... ]; // Removed usage

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Nasi Goreng Spesial', price: 25000, categoryId: '1', isActive: true, imageUrl: 'https://via.placeholder.com/150' },
  { id: 2, name: 'Es Teh Manis', price: 5000, categoryId: '2', isActive: true, imageUrl: 'https://via.placeholder.com/150' },
  { id: 3, name: 'Kentang Goreng', price: 15000, categoryId: '3', isActive: true },
  { id: 4, name: 'Pisang Bakar', price: 12000, categoryId: '4', isActive: false },
  { id: 5, name: 'Ayam Bakar Madu', price: 30000, categoryId: '1', isActive: true },
  { id: 6, name: 'Jus Alpukat', price: 15000, categoryId: '2', isActive: true },
];

interface ProductListProps {
  onEditProduct?: (product: Product) => void;
  onAddProduct?: () => void;
  onProductPress?: (product: Product) => void;
  products?: Product[];
}

import { ProductController } from '../../controllers/ProductController';
import { CategoryController } from '../../controllers/CategoryController';

export const ProductList = ({ onEditProduct, onAddProduct, onProductPress }: ProductListProps) => {
  const { width } = useWindowDimensions(); // Move hook call to top
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<CategoryModelType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const cats = await CategoryController.getCategories();
      // Add 'All' option manually for UI
      setCategories([{ id: 'all', name: 'All', type: 'OTHER' } as any, ...cats]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await ProductController.getProducts();
      // Map DB fields to UI fields
      const mappedData: Product[] = data.map((p: any) => ({
        ...p,
        categoryId: p.category || '1', // Default or map name to ID
        isActive: p.is_active === 1,
        id: p.id, // Ensure number
        imageUrl: p.image_uri
      }));
      setProducts(mappedData);
    } catch (e) {
      console.error('Failed to fetch products', e);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;

    // Filter by Category
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lowerQuery));
    }

    setFilteredProducts(result);
  }, [selectedCategory, searchQuery, products]);

  const renderProductItem = ({ item }: { item: Product }) => {
    // Landscape logic: Gunakan grid jika layar > 768px
    const isLandscape = width > 768;

    // TAMPILAN CARD (LANDSCAPE)
    if (isLandscape) {
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (onEditProduct) onEditProduct(item);
            else if (onProductPress) onProductPress(item);
          }}
          className="flex-1 m-2"
        >
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-0 overflow-hidden h-full">
            {/* Bagian Gambar (Full Width di atas) */}
            <View className="relative">
              <Image
                source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                className="w-full h-32 bg-gray-200"
                resizeMode="cover"
              />
              {/* Badge Status di Pojok Gambar (Mirip screenshot) */}
              <View className={`absolute top-2 right-2 px-2 py-1 rounded-md ${item.isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                <Text className="text-white text-[10px] font-bold">
                  {item.isActive ? 'AVAIL' : 'EMPTY'}
                </Text>
              </View>

              {/* Badge Kategori/Diskon (Opsional - meniru badge biru/kuning di gambar) */}
              <View className="absolute top-2 left-2 bg-blue-500 rounded-full w-6 h-6 items-center justify-center">
                <Text className="text-white text-[10px] font-bold">P</Text>
              </View>
            </View>

            {/* Bagian Konten Teks (Di bawah gambar) */}
            <View className="p-3 justify-between flex-1">
              <View>
                <Text
                  className="font-bold text-gray-800 text-base mb-1"
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                {/* Kategori kecil */}
                <Text className="text-xs text-gray-400 mb-2">
                  {categories.find(c => String(c.id) === String(item.categoryId))?.name || 'Menu'}
                </Text>
              </View>

              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-primary-600 font-bold text-lg">
                  Rp {item.price.toLocaleString('id-ID')}
                </Text>
                {/* Tombol kecil jika perlu, atau indikator lain */}
                <FontAwesome6
                  name="cart-plus"
                  size={14}
                  color="#9ca3af"
                  iconStyle="solid"
                />
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    }

    // TAMPILAN LIST (PORTRAIT) - Tetap seperti desain awal kamu
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (onEditProduct) onEditProduct(item);
          else if (onProductPress) onProductPress(item);
        }}
        className="mb-3 mx-1"
      >
        <Card className="flex-row items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
          <Image
            source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }}
            className="h-16 w-16 rounded-md bg-gray-200"
            resizeMode="cover"
          />
          <View className="ml-4 flex-1">
            <Text className="font-bold text-gray-800 text-lg" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-primary-700 font-semibold">
              Rp {item.price.toLocaleString('id-ID')}
            </Text>
            <Text className={`text-xs mt-1 ${item.isActive ? 'text-green-600' : 'text-red-500'}`}>
              {item.isActive ? 'Stok Tersedia' : 'Stok Habis'}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const numColumns = width > 1024 ? 4 : width > 768 ? 3 : 1;

  return (
    <View className={`flex-1 bg-gray-50 px-4 pb-4 ${onAddProduct ? 'pt-2' : 'pt-6'}`}>
      {onAddProduct && (
        <View className="flex-row justify-between items-center mb-2 mt-2">
          <View className="flex-1" />
          <NotificationBell />
        </View>
      )}

      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold text-gray-900">Products ({filteredProducts.length})</Text>
        {onAddProduct && <Button title="Add Product" size='sm' onPress={onAddProduct} />}
      </View>

      <Input
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Categories Horizontal Scroll */}
      <View className="mb-4 mt-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.name)}
              className={`mr-3 rounded-full px-4 py-2 flex-row items-center ${selectedCategory === cat.name ? 'bg-primary-600' : 'bg-white border border-gray-300'
                }`}
            >
              <FontAwesome6
                name={(cat.icon ?? 'circle') as any}
                size={14}
                color={selectedCategory === cat.name ? 'white' : '#374151'}
                iconStyle="solid"
                style={{ marginRight: 8 }}
              />
              <Text className={selectedCategory === cat.name ? 'text-white' : 'text-gray-700'}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        key={numColumns.toString()} // Force re-render on column change
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between', gap: 12 } : undefined}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No products found for "{searchQuery}".</Text>}
      />
    </View>
  );
};
