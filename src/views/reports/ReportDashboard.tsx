import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { NotificationBell } from '../ui/NotificationBell';

// Mock Component for Charts/Data
const ReportSection = ({ title, value, subtext }: { title: string, value: string, subtext?: string }) => (
  <Card className="flex-1 m-2 p-4 items-center justify-center bg-green-50 border-green-100">
    <Text className="text-gray-500 text-sm font-medium uppercase">{title}</Text>
    <Text className="text-2xl font-bold text-gray-900 my-1">{value}</Text>
    {subtext && <Text className="text-xs text-green-600">{subtext}</Text>}
  </Card>
);

import { ReportController } from '../../controllers/ReportController';

// ...

export const ReportDashboard = () => {
  const [activeTab, setActiveTab] = useState<'SALES' | 'VIP' | 'FINANCE'>('SALES');
  const [dailyStats, setDailyStats] = useState<{ totalSales: number, transactionCount: number }>({ totalSales: 0, transactionCount: 0 });
  const [topProducts, setTopProducts] = useState<{ name: string, total_sold: number, total_revenue: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const stats = await ReportController.getDailyStats();
        if (stats) setDailyStats(stats);
        const top = await ReportController.getTopProducts();
        setTopProducts(top as any);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [activeTab]);

  const renderTabs = () => (
    <View className="flex-row mb-6 bg-gray-200 rounded-lg p-1">
      {(['SALES', 'VIP', 'FINANCE'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          className={`flex-1 py-2 items-center rounded-md ${activeTab === tab ? 'bg-white shadow-sm' : ''
            }`}
        >
          <Text className={`font-bold ${activeTab === tab ? 'text-gray-900' : 'text-gray-500'}`}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-white px-4 pb-4 pt-2">
      <View className="flex-row justify-between items-center mb-4 mt-2">
        <View className="flex-1" />
        <NotificationBell />
      </View>

      <Text className="text-3xl font-bold text-gray-900 mb-6">Dashboard</Text>

      {renderTabs()}

      {activeTab === 'SALES' && (
        <View>
          <Text className="text-xl font-bold mb-4">Today's Sales</Text>
          <View className="flex-row">
            <ReportSection title="Gross Sales" value={`Rp ${dailyStats.totalSales?.toLocaleString() || '0'}`} subtext="Today" />
            <ReportSection title="Transactions" value={`${dailyStats.transactionCount || 0}`} />
          </View>
          <View className="mt-4">
            <Text className="text-lg font-semibold mb-2">Top Products</Text>
            {topProducts.map((item, idx) => (
              <View key={idx} className="flex-row justify-between py-3 border-b border-gray-100">
                <Text className="text-gray-700">{idx + 1}. {item.name}</Text>
                <Text className="font-bold text-gray-900">{item.total_sold} sold</Text>
              </View>
            ))}
            {topProducts.length === 0 && <Text className="text-gray-500">No sales yet.</Text>}
          </View>
        </View>
      )}

      {activeTab === 'VIP' && (
        <View>
          <Text className="text-xl font-bold mb-4">VIP Room Utilization</Text>
          <View className="flex-row">
            <ReportSection title="Hours Sold" value="12.5 hrs" />
            <ReportSection title="Occupancy" value="65%" subtext="Peak hour: 20:00" />
          </View>
          <Card className="mt-4 p-4">
            <Text className="font-semibold mb-2">Revenue by Room</Text>
            <View className="h-40 items-center justify-center bg-gray-50 rounded">
              <Text className="text-gray-400">Chart Placeholder</Text>
            </View>
          </Card>
        </View>
      )}

      {activeTab === 'FINANCE' && (
        <View>
          <Text className="text-xl font-bold mb-4">Financial Overview</Text>
          <Card className="mb-4 bg-gray-900">
            <View className="p-4">
              <Text className="text-gray-400">Total Net Revenue</Text>
              <Text className="text-4xl font-bold text-white">Rp 15,450,000</Text>
            </View>
          </Card>
          <View className="gap-2">
            <View className="flex-row justify-between p-3 bg-gray-50 rounded">
              <Text className="text-gray-600">Total Tax Collected</Text>
              <Text className="font-bold">Rp 1,545,000</Text>
            </View>
            <View className="flex-row justify-between p-3 bg-gray-50 rounded">
              <Text className="text-gray-600">Discounts Given</Text>
              <Text className="font-bold text-red-500">- Rp 250,000</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};
