import React from 'react';
import { View, ViewProps } from 'react-native';

export const Card = ({ children, className, ...props }: ViewProps) => {
  return (
    <View 
      className={`rounded-xl bg-white p-4 shadow-sm border border-gray-100 ${className}`} 
      {...props}
    >
      {children}
    </View>
  );
};
