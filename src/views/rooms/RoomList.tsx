import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { VipRoom } from '../../types';
import { RoomPackageList } from './RoomPackageList';
import { RoomVariationList } from './RoomVariationList';
import { RoomController } from '../../controllers/RoomController';

interface RoomListProps {
  onRoomSelect: (room: VipRoom) => void;
  onAddRoom: () => void;
  onEditRoom: (room: VipRoom) => void;
  sidebar: boolean;
}

export const RoomList = ({ onRoomSelect, onAddRoom, onEditRoom, sidebar }: RoomListProps) => {
  const [activeTab, setActiveTab] = React.useState<'ROOMS' | 'PACKAGES' | 'VARIATIONS'>('ROOMS');
  const [rooms, setRooms] = useState<VipRoom[]>([]);

  const fetchRooms = async () => {
    try {
      const data = await RoomController.getRooms();
      // Transform and fetch sessions for occupied rooms
      const roomsWithSessions = await Promise.all(data.map(async (r) => {
        let sessionData = undefined;
        if (r.status === 'OCCUPIED') {
          try {
            const session = await RoomController.getActiveSession(r.id);
            if (session) {
              sessionData = {
                ...session,
                roomId: r.id,
                // Map DB session fields to UI ViewSession if needed
                customerName: 'Guest',
                mode: 'OPEN' as const,
                durationMinutes: 0,
                totalPrice: session.total_cost || 0,
                startTime: session.start_time, // Map snake_case to camelCase
                status: session.status as any,
                id: session.id,
              };
            }
          } catch (e) {
            console.log('Error fetching session for room', r.id, e);
          }
        }

        return {
          id: r.id,
          name: r.name,
          capacity: 0, // DB doesn't have capacity. Update DB schema or default.
          pricePerHour: r.hourly_rate,
          status: r.status as any,
          currentSession: sessionData
        };
      }));
      setRooms(roomsWithSessions);
    } catch (e) {
      console.error('Failed to fetch rooms', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'ROOMS') {
      fetchRooms();
    }
  }, [activeTab]);

  const getStatusColor = (status: VipRoom['status']) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-200';
      case 'OCCUPIED': return 'bg-red-100 text-red-800 border-red-200';
      case 'MAINTENANCE': return 'bg-gray-200 text-gray-800 border-gray-300';
      default: return 'bg-white text-gray-800';
    }
  };

  const renderRoom = ({ item }: { item: VipRoom }) => {
    const isOccupied = item.status === 'OCCUPIED';
    const isAvailable = item.status === 'AVAILABLE';
    const session = item.currentSession;

    return (
      <TouchableOpacity onPress={() => onRoomSelect(item)} className="w-[49%] mb-4">
        <Card className={`h-56 justify-between border ${isOccupied ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>

          {/* Header */}
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-xl font-bold text-gray-800">{item.name}</Text>
              {isAvailable && <Text className="text-xs text-green-600 font-medium">{item.capacity || '-'} Pax</Text>}
            </View>
            <View className={`px-2 py-0.5 rounded-full ${isOccupied ? 'bg-red-100' : (isAvailable ? 'bg-green-100' : 'bg-gray-100')}`}>
              <Text className={`text-[10px] font-bold ${isOccupied ? 'text-red-700' : (isAvailable ? 'text-green-700' : 'text-gray-500')}`}>
                {item.status}
              </Text>
            </View>
          </View>

          {/* Content */}
          {isOccupied && session ? (
            <View className="flex-1 justify-center mt-2">
              <View className="flex-row items-center mb-1">
                <FontAwesome6 name="user" size={12} color="#4b5563" iconStyle="solid" />
                <Text className="text-gray-700 ml-2 font-semibold text-sm">{session.customerName}</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <FontAwesome6 name={session.mode === 'PACKAGE' ? "box" : "clock"} size={12} color="#6b7280" iconStyle="solid" />
                <Text className="text-gray-500 ml-2 text-xs">
                  {session.mode === 'PACKAGE' ? 'Package (3Hr)' : 'Open Bill'}
                </Text>
              </View>

              <View className="bg-white/60 p-2 rounded-lg border border-red-100 flex-row items-center justify-between">
                <Text className="text-xs text-red-400 font-bold uppercase">Bill</Text>
                <Text className="text-lg font-bold text-red-600">
                  Rp {session.totalPrice ? session.totalPrice.toLocaleString() : '---'}
                </Text>
              </View>
            </View>
          ) : (
            <View className="mt-4">
              <View className="flex-row items-baseline">
                <Text className="text-2xl font-bold text-gray-900">Rp {item.pricePerHour.toLocaleString().replace(/,000$/, 'k')}</Text>
                <Text className="text-gray-500 text-xs ml-1">/ hr</Text>
              </View>
              <Text className="text-gray-400 text-xs mt-1">Starting from</Text>
            </View>
          )}

          {/* Footer Actions (Only for Available really, or "View" for Occupied) */}
          {!isOccupied && (
            <View className="mt-4 pt-3 border-t border-gray-100 flex-row justify-between items-center">
              <Text className="text-green-600 font-bold text-sm">Start Session</Text>
              <FontAwesome6 name="chevron-right" size={12} color="#16a34a" iconStyle="solid" />
            </View>
          )}
        </Card>
      </TouchableOpacity>
    )
  };

  return (
    <View className="flex-1 bg-gray-50 px-4 pb-4 pt-6">
      <View className={`flex-row justify-between items-center mb-5 ${!sidebar ? 'pl-14' : ''}`}>
        <Text className="text-2xl font-bold text-gray-900">VIP Rooms</Text>
        {activeTab === 'ROOMS' && <Button title="Add Room" onPress={onAddRoom} size="sm" />}
      </View>

      {/* Tabs */}
      <View className={`flex-row mb-4 rounded-lg bg-white p-1 border border-gray-200 shadow-sm ${!sidebar ? '' : ''}`}>
        <TouchableOpacity
          onPress={() => setActiveTab('ROOMS')}
          className={`flex-1 py-2 items-center rounded-md ${activeTab === 'ROOMS' ? 'bg-green-50' : ''}`}
        >
          <Text className={`font-bold ${activeTab === 'ROOMS' ? 'text-green-700' : 'text-gray-500'}`}>Room List</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('PACKAGES')}
          className={`flex-1 py-2 items-center rounded-md ${activeTab === 'PACKAGES' ? 'bg-green-50' : ''}`}
        >
          <Text className={`font-bold ${activeTab === 'PACKAGES' ? 'text-green-700' : 'text-gray-500'}`}>Packages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('VARIATIONS')}
          className={`flex-1 py-2 items-center rounded-md ${activeTab === 'VARIATIONS' ? 'bg-green-50' : ''}`}
        >
          <Text className={`font-bold ${activeTab === 'VARIATIONS' ? 'text-green-700' : 'text-gray-500'}`}>Variations</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'ROOMS' ? (
        <FlatList
          data={rooms}
          renderItem={renderRoom}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No rooms available.</Text>}
        />
      ) : activeTab === 'PACKAGES' ? (
        <RoomPackageList />
      ) : (
        <RoomVariationList />
      )}

    </View>
  );
};
