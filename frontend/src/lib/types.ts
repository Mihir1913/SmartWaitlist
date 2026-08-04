// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'staff' | 'kitchen';
  restaurantId: string;
}

// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  settings: {
    avgTurnoverMinutes: number;
    maxQueueSize: number;
    preOrderEnabled: boolean;
  };
  whatsappJoinUrl: string;
}

// Menu types
export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  prepTimeMinutes: number;
}

export interface MenuCategory {
  _id: string;
  name: string;
  items: MenuItem[];
}

// Queue types
export interface QueueEntry {
  _id: string;
  customer: { name: string; phone: string };
  partySize: number;
  position: number;
  status: 'waiting' | 'notified' | 'on_my_way' | 'seated' | 'cancelled' | 'no_show';
  estimatedWaitMinutes: number;
  joinedAt: string;
  assignedTableId?: { number: string; status: string };
  preOrderId?: Order;
}

// Table types
export interface Table {
  _id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'cleaning' | 'ready';
  currentQueueEntryId?: string;
}

// Order types
export interface Order {
  _id: string;
  queueEntryId: QueueEntry | string;
  items: { name: string; qty: number; price: number; notes?: string }[];
  subtotal: number;
  gst: number;
  total: number;
  status: 'draft' | 'confirmed' | 'cooking' | 'ready' | 'served';
  triggers: {
    tableReady: boolean;
    customerOnMyWay: boolean;
    dualTriggerMetAt?: string;
  };
  cookingStartedAt?: string;
  readyAt?: string;
}

// Analytics types
export interface DashboardStats {
  activeQueue: number;
  seatedToday: number;
  cancelledToday: number;
  walkawayRate: number;
  ordersToday: number;
  revenueToday: number;
  tableStats: { total: number; ready: number; occupied: number };
  recentEntries: QueueEntry[];
  hourlyData: { _id: number; count: number }[];
  kpis: {
    extraCoversPerHour: number;
    avgWaitReduction: number;
    walkawayReduction: number;
    turnoverIncrease: number;
  };
}
