import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading,
  className,
  ...props
}: ButtonProps) => {
  const baseStyles = "flex-row items-center justify-center rounded-lg active:opacity-80";

  const variants = {
    primary: "bg-primary-400 border border-primary-500",
    secondary: "bg-gray-600",
    danger: "bg-red-600",
    outline: "bg-transparent border border-primary-400",
  };

  const sizeVariants = {
    sm: "py-2 px-3",
    md: "py-3 px-6",
    lg: "py-4 px-8"
  };

  const textVariants = {
    primary: "text-white",
    secondary: "text-white",
    danger: "text-white",
    outline: "text-primary-600",
  };

  const textSizeVariants = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <TouchableOpacity
      className={`${baseStyles} ${variants[variant]} ${sizeVariants[size]} ${props.disabled ? 'opacity-50' : ''} ${className}`}
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#FEB400' : '#FFF'} />
      ) : (
        <Text className={`font-bold ${textVariants[variant]} ${textSizeVariants[size]}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
