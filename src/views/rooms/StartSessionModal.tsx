import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { VipRoom, VipRoomPackage, VipSession } from '../../types';

// Reusing MOCK_PACKAGES for now - in real app fetch from API/Context
const MOCK_PACKAGES: VipRoomPackage[] = [
    { id: '1', name: 'Happy Hour 2Hr', durationMinutes: 120, price: 80000 },
    { id: '2', name: 'Family Packet 3Hr', durationMinutes: 180, price: 150000 },
    { id: '3', name: 'Night Owl 5Hr', durationMinutes: 300, price: 250000 },
];

const MOCK_VARIATIONS = [
    { id: 'v1', name: 'Standard', multiplier: 1 },
    { id: 'v2', name: 'Large Room', multiplier: 1.5 },
    { id: 'v3', name: 'VVIP Suite', multiplier: 2.0 },
];

interface StartSessionModalProps {
    visible: boolean;
    room: VipRoom | null;
    onClose: () => void;
    onStart: (sessionData: Partial<VipSession>) => void;
}

export const StartSessionModal = ({ visible, room, onClose, onStart }: StartSessionModalProps) => {
    const [step, setStep] = useState(1);
    const [customerName, setCustomerName] = useState('');
    const [selectedVariation, setSelectedVariation] = useState(MOCK_VARIATIONS[0]);
    const [mode, setMode] = useState<'OPEN' | 'PACKAGE'>('OPEN');
    const [selectedPackage, setSelectedPackage] = useState<VipRoomPackage | null>(null);

    if (!room) return null;

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else handleConfirm();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleConfirm = () => {
        onStart({
            customerName,
            mode,
            packageId: selectedPackage?.id,
            initialDuration: selectedPackage?.durationMinutes,
            durationMinutes: selectedPackage?.durationMinutes || 0,
            startTime: new Date().toISOString(),
            // For OPEN mode, total price calculates later. For PACKAGE, it's fixed.
            totalPrice: mode === 'PACKAGE' ? selectedPackage?.price || 0 : 0
        });
        // Reset
        setStep(1);
        setCustomerName('');
        setMode('OPEN');
        setSelectedPackage(null);
    };

    const currentPricePerHour = room.pricePerHour * selectedVariation.multiplier;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl h-[85%] p-6">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center">
                            {step > 1 && (
                                <TouchableOpacity onPress={handleBack} className="mr-3">
                                    <FontAwesome6 name="arrow-left" size={18} color="#4b5563" iconStyle="solid" />
                                </TouchableOpacity>
                            )}
                            <Text className="text-xl font-bold text-gray-900">Start Session: {room.name}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <FontAwesome6 name="xmark" size={20} color="#9ca3af" iconStyle="solid" />
                        </TouchableOpacity>
                    </View>

                    {/* Steps Indicator */}
                    <View className="flex-row mb-8 items-center justify-center">
                        {[1, 2, 3].map(s => (
                            <View key={s} className="flex-row items-center">
                                <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= s ? 'bg-green-600' : 'bg-gray-200'}`}>
                                    <Text className="text-white font-bold">{s}</Text>
                                </View>
                                {s < 3 && <View className={`w-10 h-1 mx-2 ${step > s ? 'bg-green-600' : 'bg-gray-200'}`} />}
                            </View>
                        ))}
                    </View>

                    <ScrollView className="flex-1">
                        {step === 1 && (
                            <View>
                                <Text className="text-lg font-bold text-gray-800 mb-4">Who is the customer?</Text>
                                <Input
                                    label="Customer Name"
                                    value={customerName}
                                    onChangeText={setCustomerName}
                                    placeholder="Enter customer name"
                                />
                                <Text className="text-lg font-bold text-gray-800 mt-6 mb-4">Select Room Variation</Text>
                                <View className="flex-row flex-wrap gap-3">
                                    {MOCK_VARIATIONS.map(v => (
                                        <TouchableOpacity
                                            key={v.id}
                                            onPress={() => setSelectedVariation(v)}
                                            className={`p-4 rounded-xl border-2 w-[48%] mb-2 ${selectedVariation.id === v.id ? 'bg-green-50 border-green-500' : 'bg-white border-gray-100'}`}
                                        >
                                            <Text className="font-bold text-gray-900">{v.name}</Text>
                                            <Text className="text-xs text-gray-500">x{v.multiplier} Rate</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {step === 2 && (
                            <View>
                                <Text className="text-lg font-bold text-gray-800 mb-4">Choose Pricing Mode</Text>

                                <TouchableOpacity
                                    onPress={() => setMode('OPEN')}
                                    className={`p-5 rounded-xl border-2 mb-4 flex-row items-center justify-between ${mode === 'OPEN' ? 'bg-green-50 border-green-500' : 'bg-white border-gray-100'}`}
                                >
                                    <View>
                                        <Text className="font-bold text-lg text-gray-900">Open Billing</Text>
                                        <Text className="text-gray-500">Pay by the hour (Count-up)</Text>
                                    </View>
                                    <Text className="font-bold text-green-700">Rp {currentPricePerHour.toLocaleString()}/hr</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setMode('PACKAGE')}
                                    className={`p-5 rounded-xl border-2 mb-4 flex-row items-center justify-between ${mode === 'PACKAGE' ? 'bg-green-50 border-green-500' : 'bg-white border-gray-100'}`}
                                >
                                    <View>
                                        <Text className="font-bold text-lg text-gray-900">Package</Text>
                                        <Text className="text-gray-500">Fixed duration & price</Text>
                                    </View>
                                </TouchableOpacity>

                                {mode === 'PACKAGE' && (
                                    <View className="pl-4 border-l-2 border-gray-200">
                                        <Text className="font-bold text-gray-700 mb-3">Select a Package:</Text>
                                        {MOCK_PACKAGES.map(pkg => (
                                            <TouchableOpacity
                                                key={pkg.id}
                                                onPress={() => setSelectedPackage(pkg)}
                                                className={`p-3 rounded-lg border mb-2 flex-row justify-between items-center ${selectedPackage?.id === pkg.id ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}`}
                                            >
                                                <View>
                                                    <Text className="font-bold text-gray-800">{pkg.name}</Text>
                                                    <Text className="text-xs text-gray-500">{pkg.durationMinutes} mins</Text>
                                                </View>
                                                <Text className="font-bold text-blue-700">Rp {pkg.price.toLocaleString()}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {step === 3 && (
                            <View className="items-center py-6">
                                <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
                                    <FontAwesome6 name="check" size={40} color="#15803d" iconStyle="solid" />
                                </View>
                                <Text className="text-2xl font-bold text-gray-900 mb-2">Ready to Start?</Text>
                                <Text className="text-gray-500 text-center mb-8 px-4">
                                    Starting session for <Text className="font-bold text-gray-900">{customerName || 'Walk-in'}</Text> in <Text className="font-bold text-gray-900">{room.name} ({selectedVariation.name})</Text>.
                                </Text>

                                <View className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-gray-500">Mode</Text>
                                        <Text className="font-bold text-gray-900">{mode === 'OPEN' ? 'Open Billing' : 'Package'}</Text>
                                    </View>
                                    {mode === 'PACKAGE' && selectedPackage && (
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-gray-500">Package</Text>
                                            <Text className="font-bold text-gray-900">{selectedPackage.name}</Text>
                                        </View>
                                    )}
                                    <View className="border-t border-gray-200 my-2 pt-2 flex-row justify-between">
                                        <Text className="font-bold text-gray-700">Rate / Price</Text>
                                        <Text className="font-bold text-green-700">
                                            {mode === 'OPEN'
                                                ? `Rp ${currentPricePerHour.toLocaleString()}/hr`
                                                : `Rp ${selectedPackage?.price.toLocaleString()}`
                                            }
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View className="mt-4 pt-4 border-t border-gray-100">
                        <Button
                            title={step === 3 ? "Confirm & Start" : "Next"}
                            onPress={handleNext}
                            disabled={step === 1 && !customerName || step === 2 && mode === 'PACKAGE' && !selectedPackage}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};
