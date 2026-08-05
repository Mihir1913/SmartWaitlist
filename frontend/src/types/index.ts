export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'owner' | 'staff' | 'kitchen';
  restaurantId?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  whatsappPhone?: string;
  description?: string;
  openingHours?: string;
  cuisine?: string;
  settings: {
    avgTurnoverMinutes: number;
    maxQueueSize: number;
    preOrderEnabled: boolean;
  };
  whatsappJoinUrl: string;
}

export interface SuperAdminRestaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  whatsappPhone: string;
  timezone?: string;
  settings: {
    avgTurnoverMinutes: number;
    maxQueueSize: number;
    preOrderEnabled: boolean;
  };
  createdAt: string;
  tableCount: number;
  activeQueueCount: number;
  usersCount: number;
  owners: { id: string; name: string; email: string }[];
}

export interface SuperAdminStats {
  totalRestaurants: number;
  totalActiveQueues: number;
  totalTables: number;
  totalUsers: number;
}

export interface QueueEntry {
  _id: string;
  customer: { name: string; phone: string };
  partySize: number;
  position: number;
  status: 'waiting' | 'notified' | 'on_my_way' | 'seated' | 'cancelled' | 'no_show';
  estimatedWaitMinutes: number;
  joinedAt: string;
  assignedTableId?: { number: string; status: string };
  assignedTableIds?: { number: string; status: string }[];
  preOrderId?: Order;
}

export interface Table {
  _id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'cleaning' | 'ready';
  currentQueueEntryId?: string;
}

export interface MenuItem {
  _id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  prepTimeMinutes: number;
  gstRate?: number;
}

export interface MenuCategory {
  _id: string;
  name: string;
  sortOrder?: number;
  items: MenuItem[];
}

export interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: 'owner' | 'staff' | 'kitchen';
  createdAt?: string;
}

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

export interface RestaurantSyncState {
  tables: Table[];
  queue: QueueEntry[];
  kitchenOrders: Order[];
  stats: DashboardStats;
}
