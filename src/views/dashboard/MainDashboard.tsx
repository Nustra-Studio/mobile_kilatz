import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Card } from '../ui/Card';
import { NotificationBell } from '../ui/NotificationBell';
import { DashboardController } from '../../controllers/DashboardController';
import { useAuth } from '../../contexts/AuthContext';

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
  const { employee } = useAuth();
  const [summary, setSummary] = useState({
    totalSales: 0,
    transactionCount: 0,
    lowStockCount: 0,
    activeRooms: 0,
    totalRooms: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [s, txs] = await Promise.all([
      DashboardController.getSummary(),
      DashboardController.getRecentTransactions(3)
    ]);
    setSummary(s);
    setRecentTransactions(txs);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatRp = (n: number) =>
    'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0 }).replace(/,/g, '.');

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '--:--';
    }
  };

  return (
    <ScrollView 
      className="flex-1 bg-gray-50 px-4 pb-4 pt-2"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FEB400']} />
      }
    >
      {/* Header */}
      <View className={`flex-row justify-between transition-all items-center mb-6 mt-2 ${sidebar ? 'ps-2' : 'ps-14'}`}>
         <View>
             <Text className="text-2xl font-bold text-gray-900">Overview</Text>
             <Text className="text-gray-500 text-sm">Welcome back, {employee?.name || 'Admin'}</Text>
         </View>
         <NotificationBell />
      </View>

      {/* Summary Grid */}
      <View className="flex-row mb-2">
         <SummaryCard 
            title="Total Sales" 
            value={formatRp(summary.totalSales)} 
            icon="money-bill-wave" 
            color="#16a34a" 
            subtext="Penjualan hari ini"
         />
         <SummaryCard 
            title="Transactions" 
            value={String(summary.transactionCount)} 
            icon="receipt" 
            color="#2563eb" 
            subtext="Pesanan selesai"
         />
      </View>

      <View className="flex-row mb-6">
         <SummaryCard 
            title="Low Stock" 
            value={summary.lowStockCount > 0 ? `${summary.lowStockCount} Items` : 'Aman'} 
            icon="triangle-exclamation" 
            color={summary.lowStockCount > 0 ? "#dc2626" : "#16a34a"} 
            subtext={summary.lowStockCount > 0 ? "Struk menipis" : "Stok tersedia"}
         />
         <SummaryCard 
            title="Active Rooms" 
            value={`${summary.activeRooms} / ${summary.totalRooms}`} 
            icon="microphone" 
            color="#9333ea" 
            subtext={`${Math.round((summary.activeRooms / (summary.totalRooms || 1)) * 100)}% occupancy`}
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
            onPress={() => onNavigate('POS')}
            className="bg-white p-4 rounded-xl flex-1 border border-gray-100 items-center justify-center shadow-sm"
          >
              <FontAwesome6 name="cart-shopping" size={20} color="#4b5563" iconStyle="solid" />
              <Text className="mt-2 font-medium text-gray-700">POS</Text>
          </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <Text className="text-lg font-bold text-gray-900 mb-3">Recent Transactions</Text>
      <View className="bg-white rounded-xl border border-gray-100 mb-6">
          {recentTransactions.length === 0 ? (
            <View className="p-8 items-center">
              <Text className="text-gray-400">Belum ada transaksi</Text>
            </View>
          ) : (
            recentTransactions.map((tx, index) => (
                <View key={tx.id} className={`p-4 flex-row justify-between items-center ${index !== recentTransactions.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                            <FontAwesome6 name="receipt" size={14} color="#2563eb" iconStyle="solid" />
                        </View>
                        <View>
                            <Text className="font-bold text-gray-900">{tx.invoice_number}</Text>
                            <Text className="text-gray-500 text-xs">{tx.item_count} Items • {formatTime(tx.created_at)}</Text>
                        </View>
                    </View>
                    <Text className="font-bold text-green-600">{formatRp(tx.total_amount)}</Text>
                </View>
            ))
          )}
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


