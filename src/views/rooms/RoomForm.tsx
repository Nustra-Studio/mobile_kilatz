import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { VipRoom } from '../../types';

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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCapacity(initialData.capacity.toString());
      setPricePerHour(initialData.pricePerHour.toString());
      setStatus(initialData.status);
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
      });
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
