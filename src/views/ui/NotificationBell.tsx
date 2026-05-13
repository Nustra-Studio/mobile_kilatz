import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

// Mock Notification Data
const MOCK_NOTIFICATIONS = [
    { id: '1', title: 'New Order', message: 'Table 4 ordered 2 Nasi Goreng', time: '2m ago', read: false },
    { id: '2', title: 'Stock Alert', message: 'Aqua 600ml is running low (5 left)', time: '15m ago', read: false },
    { id: '3', title: 'Shift End', message: 'Cashier shift ends in 30 mins', time: '1h ago', read: true },
    { id: '4', title: 'System', message: 'Daily backup completed successfully', time: '2h ago', read: true },
];

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <View className="relative z-50">
      <TouchableOpacity 
        onPress={() => setIsOpen(!isOpen)}
        className="p-3 bg-white rounded-full border border-gray-200 shadow-sm relative"
      >
        <FontAwesome6 name="bell" size={20} color="#4b5563" iconStyle="solid" />
        {unreadCount > 0 && (
            <View className="absolute top-0 right-0 bg-red-500 rounded-full w-5 h-5 items-center justify-center border-2 border-white">
                <Text className="text-white text-[10px] font-bold">{unreadCount}</Text>
            </View>
        )}
      </TouchableOpacity>

      {/* Popover */}
      {isOpen && (
         <>
            {/* Backdrop to close on click outside (simulated for simple popover) */}
             <Modal transparent visible={isOpen} animationType="fade">
                 <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
                     <View className="flex-1 bg-transparent" />
                 </TouchableWithoutFeedback>
                 
                 {/* The Actual Popover Content - Positioned absolutely based on screen coordinates effectively */}
                 <View 
                    className="absolute top-16 right-4 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden elevation-5"
                 >
                    <View className="p-4 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
                        <Text className="font-bold text-gray-900">Notifications</Text>
                        <TouchableOpacity onPress={() => setIsOpen(false)}>
                             <Text className="text-xs text-blue-600 font-semibold">Mark all read</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView className="max-h-80">
                        {MOCK_NOTIFICATIONS.map((notif) => (
                            <TouchableOpacity key={notif.id} className={`p-4 border-b border-gray-50 ${!notif.read ? 'bg-blue-50/30' : 'bg-white'}`}>
                                <View className="flex-row justify-between mb-1">
                                    <Text className="font-semibold text-gray-800 text-sm">{notif.title}</Text>
                                    <Text className="text-xs text-gray-400">{notif.time}</Text>
                                </View>
                                <Text className="text-gray-500 text-xs leading-5">{notif.message}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    
                    <TouchableOpacity className="p-3 items-center border-t border-gray-100 bg-gray-50">
                        <Text className="text-xs font-bold text-gray-500">View All History</Text>
                    </TouchableOpacity>
                 </View>
             </Modal>
         </>
      )}
    </View>
  );
};
