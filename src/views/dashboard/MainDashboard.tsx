import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Card } from '../ui/Card';
import { NotificationBell } from '../ui/NotificationBell';

type ScreenName = 'LOGIN' | 'DASHBOARD' | 'POS' | 'PRODUCTS' | 'ROOMS' | 'REPORTS' | 'STOCK' | 'SETTINGS';


const SummaryCard = ({ title, value, icon, color, subtext }: { title: string, value: string, icon: string, color: string, subtext?: string }) => (
  <Card className="flex-1 m-1 p-4 bg-white border-l-4" style={{ borderLeftColor: color }}>
    <View className="flex-row justify-between items-start">
        <View>
            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">{title}</Text>
            <Text className="text-2xl font-bold text-gray-900">{value}</Text>
            {subtext && <Text className="text-xs text-gray-400 mt-1">{subtext}</Text>}
        </View>
        <View className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
            <FontAwesome6 name={icon as any} size={20} color={color} iconStyle="solid" />
        </View>
    </View>
  </Card>
);

export const MainDashboard = ({ sidebar, onNavigate }: { sidebar: boolean; onNavigate: (screen: ScreenName) => void }) => {
  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pb-4 pt-2">
      {/* Header */}
      <View className={`flex-row justify-between transition-all items-center mb-6 mt-2 ${sidebar ? 'ps-2' : 'ps-14'}`}>
         <View>
             <Text className="text-2xl font-bold text-gray-900">Overview</Text>
             <Text className="text-gray-500 text-sm">Welcome back, Admin</Text>
         </View>
         <NotificationBell />
      </View>

      {/* Summary Grid */}
      <View className="flex-row mb-2">
         <SummaryCard 
            title="Total Sales" 
            value="Rp 2.5M" 
            icon="money-bill-wave" 
            color="#16a34a" 
            subtext="+12% vs yesterday"
         />
         <SummaryCard 
            title="Transactions" 
            value="45" 
            icon="receipt" 
            color="#2563eb" 
            subtext="Total orders today"
         />
      </View>

      <View className="flex-row mb-6">
         <SummaryCard 
            title="Low Stock" 
            value="3 Items" 
            icon="triangle-exclamation" 
            color="#dc2626" 
            subtext="Needs attention"
         />
         <SummaryCard 
            title="Active Rooms" 
            value="2 / 5" 
            icon="microphone" 
            color="#9333ea" 
            subtext="60% occupancy"
         />
      </View>

      {/* Quick Actions */}
      <View className="flex-row flex-wrap gap-2 mb-8">
          <TouchableOpacity 
            onPress={() => onNavigate('PRODUCTS')}
            className="bg-white p-4 rounded-xl flex-1 border border-gray-100 items-center justify-center shadow-sm"
          >
              <FontAwesome6 name="plus" size={20} color="#4b5563" iconStyle="solid" />
              <Text className="mt-2 font-medium text-gray-700">Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onNavigate('REPORTS')}
            className="bg-white p-4 rounded-xl flex-1 border border-gray-100 items-center justify-center shadow-sm"
          >
              <FontAwesome6 name="file-invoice" size={20} color="#4b5563" iconStyle="solid" />
              <Text className="mt-2 font-medium text-gray-700">Daily Report</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onNavigate('POS')} // Assuming New Member might be relevant to POS or Customers later
            className="bg-white p-4 rounded-xl flex-1 border border-gray-100 items-center justify-center shadow-sm"
          >
              <FontAwesome6 name="cart-shopping" size={20} color="#4b5563" iconStyle="solid" />
              <Text className="mt-2 font-medium text-gray-700">POS</Text>
          </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <Text className="text-lg font-bold text-gray-900 mb-3">Recent Transactions</Text>
      <View className="bg-white rounded-xl border border-gray-100 mb-6">
          {MOCK_RECENT_TRANSACTIONS.map((tx, index) => (
              <View key={tx.id} className={`p-4 flex-row justify-between items-center ${index !== MOCK_RECENT_TRANSACTIONS.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                          <FontAwesome6 name="receipt" size={14} color="#2563eb" iconStyle="solid" />
                      </View>
                      <View>
                          <Text className="font-bold text-gray-900">{tx.customer}</Text>
                          <Text className="text-gray-500 text-xs">{tx.items} • {tx.time}</Text>
                      </View>
                  </View>
                  <Text className="font-bold text-green-600">{tx.total}</Text>
              </View>
          ))}
          <TouchableOpacity 
            onPress={() => onNavigate('REPORTS')}
            className="p-3 bg-gray-50 border-t border-gray-100 items-center rounded-b-xl"
          >
              <Text className="text-gray-500 font-medium text-sm">View All Transactions</Text>
          </TouchableOpacity>
      </View>
      
    </ScrollView>
  );
};

const MOCK_RECENT_TRANSACTIONS = [
    { id: 'TX001', customer: 'Walk-in Customer', items: '2 Items', time: '10:30 AM', total: 'Rp 45.000' },
    { id: 'TX002', customer: 'Table 4 (VIP)', items: '5 Items', time: '11:15 AM', total: 'Rp 250.000' },
    { id: 'TX003', customer: 'Budi Santoso', items: '1 Item', time: '11:45 AM', total: 'Rp 15.000' },
];
