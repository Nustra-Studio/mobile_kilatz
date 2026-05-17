import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, BackHandler, Modal, useWindowDimensions, useColorScheme as RNuseColorScheme } from 'react-native';
import { useColorScheme } from 'nativewind';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Button } from './ui/Button';

// Import Screens
import { SplashScreen } from './SplashScreen';
import { LoginScreen } from './employees/LoginScreen';
import { RegisterScreen } from './employees/RegisterScreen';
import { ProductList } from './products/ProductList';
import { ProductForm } from './products/ProductForm';
import { POSScreen } from './transactions/POSScreen';
import { RoomList } from './rooms/RoomList';
import { RoomTimer } from './rooms/RoomTimer';
import { RoomForm } from './rooms/RoomForm';
import { StartSessionModal } from './rooms/StartSessionModal';
import { ReportDashboard } from './reports/ReportDashboard';
import { CategoryList } from './categories/CategoryList';
import { StockList } from './stock/StockList';
import { SettingsScreen } from './settings/SettingsScreen';
import { MainDashboard } from './dashboard/MainDashboard';
import { Product, VipRoom } from '../types';
import { RoomController } from '../controllers/RoomController';
import { AuthController } from '../controllers/AuthController';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SyncController } from '../controllers/SyncController';

type ScreenName = 'SPLASH' | 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'POS' | 'PRODUCTS' | 'CATEGORIES' | 'ROOMS' | 'REPORTS' | 'STOCK' | 'SETTINGS';

const NavigationHarnessContent = () => {
  const { width } = useWindowDimensions();
  const isTablet = width > 768; // Breakpoint for Tablet/Desktop
  const { isAuthenticated, isLoading, employee, clearAuth } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [currentScreen, setCurrentScreen] = useState<ScreenName>('SPLASH');
  const [splashAnimationDone, setSplashAnimationDone] = useState(false);
  const [screenStack, setScreenStack] = useState<ScreenName[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(isTablet); // Default open on tablet
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (isTablet) setSidebarOpen(true);
    else setSidebarOpen(false);
  }, [isTablet]);

  // Mock State for inter-screen navigation demo
  const [editingProduct, setEditingProduct] = useState<Product | 'NEW' | null>(null);
  const [editingRoom, setEditingRoom] = useState<VipRoom | 'NEW' | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<VipRoom | null>(null);
  const [startSessionRoom, setStartSessionRoom] = useState<VipRoom | null>(null);
  // Session data to pass to timer
  const [currentSessionData, setCurrentSessionData] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

  // Handle transition after splash + auth load
  useEffect(() => {
    if (currentScreen === 'SPLASH' && splashAnimationDone && !isLoading) {
      setCurrentScreen(isAuthenticated ? 'DASHBOARD' : 'LOGIN');
    }
  }, [splashAnimationDone, isLoading, isAuthenticated, currentScreen]);

  // Check authentication on mount — only after splash finishes
  useEffect(() => {
    // Only redirect if NOT loading and NOT on splash/auth screens
    if (!isLoading && currentScreen !== 'SPLASH' && currentScreen !== 'LOGIN' && currentScreen !== 'REGISTER') {
      if (!isAuthenticated) {
        setCurrentScreen('LOGIN');
      }
    }
  }, [isAuthenticated, isLoading, currentScreen]);

  // Sync lifecycle — login, background, logout
  useEffect(() => {
    if (isAuthenticated && currentScreen === 'DASHBOARD') {
      // On login: pull master data & push any pending
      SyncController.onLoginSync()
        .then(() => setSyncStatus('done'))
        .catch(() => setSyncStatus('error'))
        .finally(() => setTimeout(() => setSyncStatus('idle'), 3000));

      // Start background sync every 5 minutes
      SyncController.startBackgroundSync();
    }

    if (!isAuthenticated) {
      // Stop background when logged out
      SyncController.stopBackgroundSync();
    }

    // Cleanup on unmount
    return () => {
      SyncController.stopBackgroundSync();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentScreen]);

  const navigateTo = (screen: ScreenName) => {
    if (currentScreen !== screen) {
      setScreenStack(prev => [...prev, currentScreen]);
      setCurrentScreen(screen);
      setEditingProduct(null);
      setEditingRoom(null);
      setSelectedRoom(null);
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (showExitConfirm) {
        setShowExitConfirm(false);
        return true;
      }

      if (editingProduct) {
        setEditingProduct(null);
        return true;
      }
      if (editingRoom) {
        setEditingRoom(null);
        return true;
      }
      if (selectedRoom) {
        setSelectedRoom(null);
        return true;
      }

      if (screenStack.length > 0) {
        const previousScreen = screenStack[screenStack.length - 1];
        setScreenStack(prev => prev.slice(0, -1));
        setCurrentScreen(previousScreen);
        return true;
      }

      if (currentScreen !== 'LOGIN') {
        setCurrentScreen('LOGIN');
        return true;
      }

      setShowExitConfirm(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [screenStack, currentScreen, editingProduct, editingRoom, selectedRoom, showExitConfirm]);

  useEffect(() => {
    if (editingProduct || editingRoom || selectedRoom) {
      setSidebarOpen(false);
    }
  }, [editingProduct, editingRoom, selectedRoom]);

  const renderContent = () => {
    switch (currentScreen) {
      case 'SPLASH':
        return (
          <SplashScreen
            onFinish={() => setSplashAnimationDone(true)}
          />
        );
      case 'LOGIN':
        // Return login screen directly without any navigation wrapper
        return (
          <LoginScreen
            onLogin={() => { navigateTo('DASHBOARD'); }}
            onRegister={() => { navigateTo('REGISTER'); }}
          />
        );
      case 'REGISTER':
        return (
          <RegisterScreen
            onBack={() => setCurrentScreen('LOGIN')}
            onSuccess={() => setCurrentScreen('LOGIN')}
          />
        );
      case 'DASHBOARD':
        return <MainDashboard sidebar={isSidebarOpen} onNavigate={navigateTo} />;
      case 'POS':
        return <POSScreen sidebar={isSidebarOpen} />;
      case 'PRODUCTS':
        if (editingProduct === 'NEW' || editingProduct) {
          return <ProductForm
            initialData={editingProduct === 'NEW' ? null : editingProduct}
            onCancel={() => setEditingProduct(null)}
            onSave={async () => setEditingProduct(null)}
          />;
        }
        return <ProductList
          onAddProduct={() => setEditingProduct('NEW')}
          onEditProduct={(p) => setEditingProduct(p)}
        />;
      case 'ROOMS':
        if (editingRoom === 'NEW' || editingRoom) {
          return <RoomForm
            initialData={editingRoom === 'NEW' ? null : editingRoom}
            onCancel={() => setEditingRoom(null)}
            onSave={async (data) => {
              try {
                // Map UI fields to DB fields
                const dbData = {
                  name: data.name,
                  hourly_rate: data.pricePerHour,
                  capacity: data.capacity,
                  status: data.status,
                  tv_ip_address: (data as any).tv_ip_address,
                };

                if (editingRoom === 'NEW') {
                  await RoomController.addRoom(dbData as any);
                } else if (editingRoom && editingRoom.id) {
                  await RoomController.updateRoom(editingRoom.id, dbData as any);
                }
                setEditingRoom(null);
              } catch (e) {
                console.error('Failed to save room', e);
              }
            }}
          />;
        }
        if (selectedRoom) {
          return <RoomTimer
            room={selectedRoom}
            initialSession={currentSessionData}
            onStartSession={() => { }}
            onStopSession={async (finalCost) => {
              // End Session logic
              try {
                const sessionId = currentSessionData?.id;
                if (sessionId) {
                  await RoomController.stopSession(sessionId, finalCost);
                }
              } catch (e) {
                console.error('Failed to stop session', e);
              }
              setSelectedRoom(null);
              setCurrentSessionData(null);
            }}
          />;
        }
        return <RoomList
          onRoomSelect={(room) => {
            if (room.status === 'AVAILABLE') {
              setStartSessionRoom(room);
            } else {
              setSelectedRoom(room);
            }
          }}
          sidebar={isSidebarOpen}
          onAddRoom={() => setEditingRoom('NEW')}
          onEditRoom={(r) => setEditingRoom(r)}
        />;
      case 'REPORTS':
        return <ReportDashboard />;
      case 'CATEGORIES':
        return <CategoryList />;
      case 'STOCK':
        return <StockList sidebar={isSidebarOpen} />;
      case 'SETTINGS':
        return <SettingsScreen />;
      default:
        return <Text>Unknown Screen</Text>;
    }
  };

  const NavItem = ({ name, label, icon }: { name: ScreenName, label: string, icon: string }) => {
    const isActive = currentScreen === name;
    return (
      <TouchableOpacity
        onPress={() => navigateTo(name)}
        className={`flex-row items-center px-4 py-3 mx-3 mb-1 rounded-xl ${isActive ? 'bg-primary-50' : 'bg-transparent'}`}
      >
        <View className="w-8 items-center mr-3">
          <FontAwesome6 name={icon as any} size={20} color={isActive ? '#FEB400' : '#9ca3af'} iconStyle="solid" />
        </View>
        <Text className={`text-base ${isActive ? 'text-primary-700 font-bold' : 'text-gray-500 font-medium'}`}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // If on auth screens (splash/login/register), show without sidebar/navbar
  if (currentScreen === 'SPLASH' || currentScreen === 'LOGIN' || currentScreen === 'REGISTER') {
    const authBg = isDark ? '#0F0A00' : '#F9FAFB';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: currentScreen === 'SPLASH' ? '#0F0A00' : authBg }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={currentScreen === 'SPLASH' ? '#0F0A00' : authBg} />
        {renderContent()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 flex-row pt-8 relative">
      <StatusBar barStyle="dark-content" />

      {/* Sidebar */}
      <View
        className={`absolute top-8 bottom-0 left-0 w-64 bg-white border-r border-gray-100 shadow-sm z-50`}
        style={{ transform: [{ translateX: isSidebarOpen ? 0 : -260 }] }}
      >
        <View className="p-6 mb-2 flex flex-row justify-between items-center">
          <View>
            <Text className="text-primary-600 text-2xl font-extrabold tracking-tight">Kasir Kilatz</Text>
            <Text className="text-gray-400 text-xs mt-1 font-medium">v1.2.0 • Pro</Text>
          </View>
          <TouchableOpacity onPress={() => setSidebarOpen(false)} className="p-2 bg-gray-50 rounded-full">
            <FontAwesome6 name="xmark" size={16} color="#9ca3af" iconStyle="solid" />
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1">
          <NavItem name="DASHBOARD" label="Dashboard" icon="house" />
          <NavItem name="POS" label="Cashier POS" icon="cart-shopping" />
          <NavItem name="ROOMS" label="VIP Rooms" icon="microphone" />
          <NavItem name="PRODUCTS" label="Products" icon="burger" />
          <NavItem name="CATEGORIES" label="Categories" icon="list" />
          <NavItem name="STOCK" label="Stock" icon="box" />
          <NavItem name="REPORTS" label="Reports" icon="chart-simple" />
          <NavItem name="SETTINGS" label="Settings" icon="gear" />
        </ScrollView>

        {/* User Profile & Logout Section */}
        <View className="mb-6 mx-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3 border border-primary-200">
              <FontAwesome6 name="user" size={16} color="#FEB400" iconStyle="solid" />
            </View>
            <View>
              <Text className="text-gray-900 font-bold text-sm">{employee?.name || 'User'}</Text>
              <Text className="text-primary-600 text-xs font-semibold">Cashier</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={async () => {
              // Flush pending transactions BEFORE logout
              await SyncController.onLogoutSync();
              await AuthController.logout();
              clearAuth();
              setCurrentScreen('LOGIN');
            }}
            className="p-2 bg-white rounded-full shadow-sm border border-gray-200"
          >
            <FontAwesome6 name="arrow-right-from-bracket" size={14} color="#dc2626" iconStyle="solid" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View
        className={`flex-1 bg-gray-50 h-full z-20 transition-all duration-500 overflow-hidden`}
        style={{ transform: [{ translateX: isSidebarOpen ? 256 : 0 }] }}
      >
        {/* Toggle Button for when sidebar is closed (or always accessible) */}
        {!isSidebarOpen && !editingProduct && !editingRoom && !selectedRoom && (
          <TouchableOpacity
            onPress={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-40 bg-white p-3 rounded-full shadow-sm border border-gray-200"
          >
            <FontAwesome6 name="bars" size={20} color="#4b5563" iconStyle='solid' />
          </TouchableOpacity>
        )}



        {renderContent()}
      </View>

      {/* Exit Confirmation Modal */}
      <Modal visible={showExitConfirm} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-2">Exit App?</Text>
            <Text className="text-gray-600 mb-6">Are you sure you want to exit the application?</Text>
            <View className="flex-row justify-end space-x-3 gap-3">
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowExitConfirm(false)}
                className="flex-1"
              />
              <Button
                title="Exit"
                variant="danger"
                onPress={() => BackHandler.exitApp()}
                className="flex-1"
              />
            </View>
          </View>
        </View>
      </Modal>

      <StartSessionModal
        visible={!!startSessionRoom}
        room={startSessionRoom}
        onClose={() => setStartSessionRoom(null)}
        onStart={async (sessionData) => {
          if (startSessionRoom) {
            try {
              await RoomController.startSession(startSessionRoom.id);
              const session = await RoomController.getActiveSession(startSessionRoom.id);

              // Merge DB session with UI extras
              const fullSession = {
                ...session,
                ...sessionData,
                id: session?.id,
                roomId: startSessionRoom.id,
              };

              const updatedRoom = { ...startSessionRoom, status: 'OCCUPIED' as const };
              setCurrentSessionData(fullSession);
              setSelectedRoom(updatedRoom);
              setStartSessionRoom(null);
            } catch (e) {
              console.error(e);
            }
          }
        }}
      />
    </SafeAreaView>
  );
};

// Wrap with AuthProvider
export const NavigationHarness = () => {
  return (
    <AuthProvider>
      <NavigationHarnessContent />
    </AuthProvider>
  );
};
