import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { VipRoom } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface RoomFormProps {
  initialData?: VipRoom | null;
  onSave: (data: Partial<VipRoom>) => Promise<void>;
  onCancel: () => void;
}

export const RoomForm = ({ initialData, onSave, onCancel }: RoomFormProps) => {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [status, setStatus] = useState<VipRoom['status']>('AVAILABLE');
  // 1. Tambahkan state IP TV
  const [tvIpAddress, setTvIpAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCapacity(initialData.capacity?.toString() || '');
      setPricePerHour(initialData.pricePerHour?.toString() || '');
      setStatus(initialData.status);
      // Load tv_ip_address jika ada (cast ke any jika di type belum ada)
      setTvIpAddress((initialData as any).tv_ip_address || '');
    }
  }, [initialData]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({
        id: initialData?.id,
        name,
        capacity: parseInt(capacity) || 0,
        pricePerHour: parseFloat(pricePerHour) || 0,
        status,
        tv_ip_address: tvIpAddress, // 2. Sertakan IP TV ke payload
      } as any);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const StatusButton = ({ value, label, color }: { value: VipRoom['status'], label: string, color: string }) => (
    <TouchableOpacity
      onPress={() => setStatus(value)}
      className={`flex-1 p-3 rounded-lg border mr-2 items-center justify-center ${status === value ? `bg-${color}-50 border-${color}-500` : 'bg-white border-gray-200'}`}
    >
      <Text className={`font-bold ${status === value ? `text-${color}-700` : 'text-gray-500'}`}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={onCancel} className="mr-4 p-2 bg-gray-100 rounded-full">
          <FontAwesome6 name="arrow-left" size={20} color="#374151" iconStyle="solid" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">
          {initialData ? 'Edit Room' : 'Add New Room'}
        </Text>
      </View>

      <Input
        label="Room Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. VIP 1"
      />

      <Input
        label="Capacity (Pax)"
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="numeric"
        placeholder="e.g. 6"
      />

      <Input
        label="Price Per Hour (Rp)"
        value={pricePerHour}
        onChangeText={setPricePerHour}
        keyboardType="numeric"
        placeholder="e.g. 50000"
      />

      {/* 3. Tambahkan Input form TV IP Address */}
      <Input
        label="TV IP Address (Opsional)"
        value={tvIpAddress}
        onChangeText={setTvIpAddress}
        placeholder="e.g. 192.168.1.15"
        keyboardType="numeric"
      />

      <Text className="mb-2 text-sm font-semibold text-gray-700">Initial Status</Text>
      <View className="flex-row mb-6">
        <StatusButton value="AVAILABLE" label="Available" color="green" />
        <StatusButton value="OCCUPIED" label="Occupied" color="red" />
        <StatusButton value="MAINTENANCE" label="Maintenance" color="gray" />
      </View>

      <Button
        title={initialData ? 'Update Room' : 'Add Room'}
        onPress={handleSave}
        isLoading={isLoading}
      />
    </ScrollView>
  );
};