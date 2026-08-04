// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'restaurant_staff' | 'admin';
}

// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cuisine?: string;
  address?: string;
  phone?: string;
  imageUrl?: string;
  maxQueueSize?: number;
  averageWaitTime?: number;
}

// Menu types
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

// Queue types
export interface QueueEntry {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  status: 'waiting' | 'on-my-way' | 'seated' | 'cancelled';
  joinedAt: string;
  estimatedWaitTime?: number;
  tableId?: string;
}

// Table types
export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: number;
  capacity: number;
  status: 'ready' | 'occupied' | 'cleaning';
}

// Order types
export interface Order {
  id: string;
  restaurantId: string;
  queueEntryId: string;
  items: {
    menuItemId: string;
    qty: number;
    notes?: string;
  }[];
  status: 'pending' | 'cooking' | 'ready' | 'delivered' | 'cancelled';
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

// Analytics types
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  customersServed: number;
  averageWaitTime: number;
  peakHour: string;
}
