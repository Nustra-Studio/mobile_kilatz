import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <View className="mb-4 w-full">
      {label && <Text className="mb-1 text-sm font-semibold text-gray-700">{label}</Text>}
      <TextInput
        placeholderTextColor="#9CA3AF"
        className={`w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 focus:border-green-500 focus:outline-none ${className}`}
        {...props}
      />
      {error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  );
};
