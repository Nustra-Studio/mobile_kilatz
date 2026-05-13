import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { VipRoom, VipSession } from '../../types';

interface RoomTimerProps {
    room: VipRoom;
    initialSession?: VipSession;
    onStartSession: (durationMinutes?: number) => void;
    onStopSession: (finalCost: number) => void;
}

export const RoomTimer = ({ room, initialSession, onStartSession, onStopSession }: RoomTimerProps) => {
    // ... (useState lines)
    // ... (useEffect lines)
    // ... (cost calc lines) 
    // Wait, I need to keep the context lines or just replace the interface and specific lines.

    // Actually, replace interface first.

    // Then replace call site.

    // I will use multiple ReplaceFileContent calls or match carefully.
    // Interface is lines 8-13.
    // Call site is line 139.

    // I'll do interface first.
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isActive, setIsActive] = useState(room.status === 'OCCUPIED');
    const [isPaused, setIsPaused] = useState(false);

    // Initialize from session data
    useEffect(() => {
        if (initialSession) {
            setIsActive(true);
            if (initialSession.mode === 'PACKAGE') {
                setRemainingSeconds((initialSession.initialDuration || 0) * 60);
            } else {
                setElapsedSeconds(0);
            }
        }
    }, [initialSession]);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && !isPaused) {
            interval = setInterval(() => {
                if (initialSession?.mode === 'PACKAGE') {
                    setRemainingSeconds(prev => {
                        if (prev <= 0) {
                            setIsActive(false); // End of package
                            return 0;
                        }
                        return prev - 1;
                    });
                } else {
                    setElapsedSeconds(prev => prev + 1);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, isPaused, initialSession]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const currentSeconds = initialSession?.mode === 'PACKAGE' ? remainingSeconds : elapsedSeconds;

    // Cost calculation
    let currentCost = 0;
    if (initialSession?.mode === 'PACKAGE') {
        currentCost = initialSession.totalPrice;
    } else {
        currentCost = (elapsedSeconds / 3600) * (room.pricePerHour || 0); // Using room price as base
    }

    return (
        <View className="flex-1 bg-gray-50 p-4 pt-6">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
                <TouchableOpacity onPress={() => onStopSession(0)} className="p-2 bg-white rounded-full border border-gray-200 shadow-sm">
                    <FontAwesome6 name="arrow-left" size={20} color="#4b5563" iconStyle="solid" />
                </TouchableOpacity>
                <View className="items-center">
                    <Text className="text-xl font-bold text-gray-900">{room.name}</Text>
                    {initialSession?.customerName && <Text className="text-sm text-gray-600 font-medium">{initialSession.customerName}</Text>}
                    <Text className="text-xs text-gray-500">Rate: Rp {room.pricePerHour.toLocaleString()}/hr</Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${isActive ? 'bg-green-100' : 'bg-gray-200'}`}>
                    <Text className={`text-xs font-bold ${isActive ? 'text-green-700' : 'text-gray-600'}`}>
                        {isActive ? (isPaused ? 'PAUSED' : 'ACTIVE') : 'IDLE'}
                    </Text>
                </View>
            </View>

            {/* Main Timer Card */}
            <Card className="flex-1 items-center justify-center mb-6 border-0 shadow-lg bg-white rounded-3xl">
                <View className="items-center mb-10">
                    <Text className="text-gray-400 text-sm uppercase tracking-widest font-semibold mb-2">
                        {initialSession?.mode === 'PACKAGE' ? 'Remaining Time' : 'Session Duration'}
                    </Text>
                    <Text className={`text-7xl font-mono font-bold tracking-tighter ${initialSession?.mode === 'PACKAGE' && remainingSeconds < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatTime(currentSeconds)}
                    </Text>
                    {initialSession?.mode === 'PACKAGE' && (
                        <Text className="text-green-600 font-bold mt-2">{initialSession.packageId ? 'Package Active' : 'Custom Package'}</Text>
                    )}
                </View>

                <View className="w-full bg-gray-50 p-6 rounded-2xl border border-gray-100 flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-500 text-xs font-semibold uppercase">Current Bill</Text>
                        <Text className="text-3xl font-bold text-green-600">Rp {Math.ceil(currentCost).toLocaleString()}</Text>
                    </View>
                    <FontAwesome6 name="coins" size={32} color="#16a34a" iconStyle="solid" />
                </View>
            </Card>

            {/* Controls */}
            <View className="mb-6">
                {!isActive && initialSession?.mode !== 'PACKAGE' ? ( // Only show Start button if not autostarted via package
                    <Button
                        title="Start Session"
                        size="lg"
                        onPress={() => {
                            setIsActive(true);
                            setIsPaused(false);
                            onStartSession();
                        }}
                    />
                ) : (
                    <View className="flex-row gap-4">
                        <TouchableOpacity
                            onPress={() => setIsPaused(!isPaused)}
                            className="flex-1 bg-white border-2 border-gray-200 items-center justify-center p-4 rounded-xl active:bg-gray-50"
                        >
                            <FontAwesome6 name={isPaused ? "play" : "pause"} size={24} color="#4b5563" iconStyle="solid" />
                            <Text className="text-gray-600 font-bold mt-1">{isPaused ? "Resume" : "Pause"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setIsActive(false);
                                setIsPaused(false);
                                const cost = (initialSession?.mode === 'PACKAGE') ? initialSession.totalPrice : (elapsedSeconds / 3600) * (room.pricePerHour || 0);
                                onStopSession(Math.ceil(cost));
                                setElapsedSeconds(0);
                            }}
                            className="flex-1 bg-red-50 border-2 border-red-100 items-center justify-center p-4 rounded-xl active:bg-red-100"
                        >
                            <FontAwesome6 name="stop" size={24} color="#dc2626" iconStyle="solid" />
                            <Text className="text-red-600 font-bold mt-1">Stop & Bill</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Quick Actions (Optional) */}
            {isActive && (
                <View className="flex-row justify-center gap-6">
                    <TouchableOpacity className="items-center">
                        <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mb-1">
                            <FontAwesome6 name="utensils" size={20} color="#2563eb" iconStyle="solid" />
                        </View>
                        <Text className="text-xs text-gray-500 font-medium">Order Food</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="items-center">
                        <View className="w-12 h-12 bg-purple-50 rounded-full items-center justify-center mb-1">
                            <FontAwesome6 name="clock" size={20} color="#9333ea" iconStyle="solid" />
                        </View>
                        <Text className="text-xs text-gray-500 font-medium">Extend 30m</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};
