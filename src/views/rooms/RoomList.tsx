import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { RoomController } from '../../controllers/RoomController';
import { VipRoom } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { RoomPackageList } from './RoomPackageList';
import { RoomVariationList } from './RoomVariationList';
// 1. Import Modal Start Session
import { StartSessionModal } from './StartSessionModal';

interface RoomListProps {
  onRoomSelect: (room: VipRoom) => void;
  onAddRoom: () => void;
  onEditRoom: (room: VipRoom) => void;
  sidebar: boolean;
}

export const RoomList = ({ onRoomSelect, onAddRoom, onEditRoom, sidebar }: RoomListProps) => {
  const [activeTab, setActiveTab] = useState<'ROOMS' | 'PACKAGES' | 'VARIATIONS'>('ROOMS');
  const [rooms, setRooms] = useState<VipRoom[]>([]);

  // 2. State untuk handle logic TV & Sesi
  const [isStartModalVisible, setStartModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<VipRoom | null>(null);

  const fetchRooms = async () => {
    try {
      const data = await RoomController.getRooms();
      const roomsWithSessions = await Promise.all(data.map(async (r) => {
        let sessionData = undefined;
        if (r.status === 'OCCUPIED') {
          try {
            const session = await RoomController.getActiveSession(r.id);
            if (session) {
              sessionData = {
                ...session,
                roomId: r.id,
                customerName: 'Guest',
                mode: 'OPEN' as const,
                durationMinutes: 0,
                totalPrice: session.total_cost || 0,
                startTime: session.start_time,
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
          capacity: (r as any).capacity || 0,
          pricePerHour: r.hourly_rate,
          status: r.status as any,
          tv_ip_address: (r as any).tv_ip_address, // Tangkap data IP dari DB
          currentSession: sessionData
        };
      }));
      setRooms(roomsWithSessions as VipRoom[]);
    } catch (e) {
      console.error('Failed to fetch rooms', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'ROOMS') fetchRooms();
  }, [activeTab]);

  // --- LOGIC CONTROL TV & SESSION ---

  const handleRoomPress = (room: VipRoom) => {
    if (room.status === 'AVAILABLE') {
      // Buka modal Start Session
      setSelectedRoom(room);
      setStartModalVisible(true);
    } else if (room.status === 'OCCUPIED') {
      // Jika diklik tapi sedang isi, konfirmasi untuk menghentikan sesi
      Alert.alert(
        "Akhiri Sesi?",
        `Apakah Anda yakin ingin mengakhiri tagihan di ${room.name}? TV akan dikunci otomatis.`,
        [
          { text: "Batal", style: "cancel" },
          { text: "Ya, Akhiri", onPress: () => handleStopSession(room) }
        ]
      );
    } else {
      // Fallback misal untuk MAINTENANCE
      onRoomSelect(room);
    }
  };

  const handleStartSession = async (sessionData: any) => {
    if (!selectedRoom) return;
    try {
      // Panggil RoomController (sesuai modifikasi WebSocket sebelumnya)
      await RoomController.startSession(
        selectedRoom.id,
        sessionData.durationMinutes || 0,
        (selectedRoom as any).tv_ip_address
      );

      setStartModalVisible(false);
      setSelectedRoom(null);
      fetchRooms(); // Refresh List
    } catch (error) {
      console.error("Gagal start sesi:", error);
      Alert.alert("Peringatan", "Berhasil mencatat sesi tapi koneksi ke TV gagal.");
      setStartModalVisible(false);
      fetchRooms();
    }
  };

  const handleStopSession = async (room: VipRoom) => {
    if (!room.currentSession) return;
    try {
      await RoomController.stopSession(
        room.currentSession.id,
        room.currentSession.totalPrice || 0,
        (room as any).tv_ip_address
      );
      fetchRooms();
    } catch (error) {
      Alert.alert("Error", "Gagal mengakhiri sesi dan mematikan TV");
    }
  };

  const handleDeleteRoom = (room: VipRoom) => {
    Alert.alert(
      "Hapus Kamar",
      `Apakah Anda yakin ingin menghapus ${room.name}? Tindakan ini tidak bisa dibatalkan.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await RoomController.deleteRoom(room.id);
              fetchRooms();
            } catch (e) {
              Alert.alert("Error", "Gagal menghapus kamar");
            }
          }
        }
      ]
    );
  };
  // ----------------------------------

  const renderRoom = ({ item }: { item: VipRoom }) => {
    const isOccupied = item.status === 'OCCUPIED';
    const isAvailable = item.status === 'AVAILABLE';
    const session = item.currentSession;

    return (
      <TouchableOpacity onPress={() => handleRoomPress(item)} className="w-[49%] mb-4">
        <Card className={`h-56 justify-between border ${isOccupied ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-xl font-bold text-gray-800">{item.name}</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-xs text-gray-500 font-medium mr-2">{item.capacity || '-'} Pax</Text>
                <View className={`px-2 py-0.5 rounded-full ${isOccupied ? 'bg-red-50' : (isAvailable ? 'bg-green-50' : 'bg-gray-100')}`}>
                  <Text className={`text-[8px] font-bold uppercase ${isOccupied ? 'text-red-600' : (isAvailable ? 'text-green-600' : 'text-gray-500')}`}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-row">
              <TouchableOpacity onPress={() => onEditRoom(item)} className="mr-2 p-1 bg-gray-100 rounded-full">
                <FontAwesome6 name="pen" size={10} color="#6b7280" iconStyle="solid" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteRoom(item)} className="p-1 bg-red-100 rounded-full">
                <FontAwesome6 name="trash" size={10} color="#ef4444" iconStyle="solid" />
              </TouchableOpacity>
            </View>
          </View>

          {isOccupied && session ? (
            <View className="flex-1 justify-center mt-2">
              <View className="flex-row items-center mb-1">
                <FontAwesome6 name="user" size={12} color="#4b5563" iconStyle="solid" />
                <Text className="text-gray-700 ml-2 font-semibold text-sm">{session.customerName}</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <FontAwesome6 name={session.mode === 'PACKAGE' ? "box" : "clock"} size={12} color="#6b7280" iconStyle="solid" />
                <Text className="text-gray-500 ml-2 text-xs">
                  {session.mode === 'PACKAGE' ? 'Package' : 'Open Bill'}
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

          {!isOccupied && (
            <View className="mt-4 pt-3 border-t border-gray-100 flex-row justify-between items-center">
              <Text className="text-green-600 font-bold text-sm">Start Session</Text>
              <FontAwesome6 name="chevron-right" size={12} color="#16a34a" iconStyle="solid" />
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 px-4 pb-4 pt-6">
      <View className={`flex-row justify-between items-center mb-5 ${!sidebar ? 'pl-14' : ''}`}>
        <Text className="text-2xl font-bold text-gray-900">VIP Rooms</Text>
        {activeTab === 'ROOMS' && <Button title="Add Room" onPress={onAddRoom} size="sm" />}
      </View>

      <View className="flex-row mb-4 rounded-lg bg-white p-1 border border-gray-200 shadow-sm">
        <TouchableOpacity onPress={() => setActiveTab('ROOMS')} className={`flex-1 py-2 items-center rounded-md ${activeTab === 'ROOMS' ? 'bg-green-50' : ''}`}>
          <Text className={`font-bold ${activeTab === 'ROOMS' ? 'text-green-700' : 'text-gray-500'}`}>Room List</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('PACKAGES')} className={`flex-1 py-2 items-center rounded-md ${activeTab === 'PACKAGES' ? 'bg-green-50' : ''}`}>
          <Text className={`font-bold ${activeTab === 'PACKAGES' ? 'text-green-700' : 'text-gray-500'}`}>Packages</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('VARIATIONS')} className={`flex-1 py-2 items-center rounded-md ${activeTab === 'VARIATIONS' ? 'bg-green-50' : ''}`}>
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

      {/* Komponen Modal untuk Setting Sesi */}
      <StartSessionModal
        visible={isStartModalVisible}
        room={selectedRoom}
        onClose={() => {
          setStartModalVisible(false);
          setSelectedRoom(null);
        }}
        onStart={handleStartSession}
      />
    </View>
  );
};