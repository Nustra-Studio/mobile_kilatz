export type Product = {
  id: number;
  name: string;
  categoryId: string;
  price: number;
  costPrice?: number;
  stock?: number;
  imageUrl?: string;
  isActive: boolean;
  variants?: ProductVariant[];
  taxRate?: number; // per product tax override if needed
  // Compatibility with Model
  category?: string; // used in Model instead of categoryId sometimes? I used category in Model.
  // I should align Model and Type. Model has `category` (string name or id?). Model has `category` TEXT.
  // ProductList filters by matching string.
};

export type ProductVariant = {
  id: string;
  name: string; // e.g., "Large", "Less Sugar"
  priceModifier: number; // e.g., +5000
};

export type Category = {
  id: string;
  name: string;
  type: 'FOOD' | 'DRINK' | 'SNACK' | 'KARAOKE';
  icon?: string;
};

export type CartItem = {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  variants?: ProductVariant[];
  discount?: number;
  note?: string;
};

export type Transaction = {
  id: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'CASH' | 'QRIS' | 'DEBIT';
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  employeeId: string;
};

export type VipRoom = {
  id: number;
  name: string;
  capacity: number;
  pricePerHour: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  currentSessionId?: number; // string -> number
  currentSession?: VipSession; // For UI display
  variationId?: string; // Default variation
};

export type VipRoomVariation = {
  id: string;
  name: string; // "Small", "Large", "VVIP"
  pricePerHour: number;
};

export type VipRoomPackage = {
  id: string;
  name: string; // "Happy Hour", "3 Hours"
  durationMinutes: number;
  price: number;
};

export type VipSession = {
  id: number;
  roomId: number;
  customerName: string;
  startTime: string; // ISO
  endTime?: string;
  mode: 'OPEN' | 'PACKAGE';
  packageId?: string;
  initialDuration?: number; // For packages
  durationMinutes: number; // For record keeping
  totalPrice: number;
  status: 'ACTIVE' | 'COMPLETED';
};

export type Employee = {
  id: string;
  name: string;
  role: 'CASHIER' | 'SUPERVISOR' | 'OWNER';
  pin?: string; // specific for simple login
};
