import mongoose from 'mongoose';

export type TableStatus = 'available' | 'occupied' | 'cleaning' | 'ready';
export type QueueStatus = 'waiting' | 'notified' | 'on_my_way' | 'seated' | 'cancelled' | 'no_show';
export type OrderStatus = 'draft' | 'confirmed' | 'cooking' | 'ready' | 'served';
export type UserRole = 'owner' | 'staff' | 'kitchen';

export interface IRestaurant {
  name: string;
  slug: string;
  address: string;
  timezone: string;
  whatsappPhone: string;
  settings: {
    avgTurnoverMinutes: number;
    maxQueueSize: number;
    preOrderEnabled: boolean;
  };
}

export interface ITable {
  restaurantId: mongoose.Types.ObjectId;
  number: string;
  capacity: number;
  status: TableStatus;
  currentQueueEntryId?: mongoose.Types.ObjectId;
}

export interface IQueueEntry {
  restaurantId: mongoose.Types.ObjectId;
  customer: { name: string; phone: string };
  partySize: number;
  position: number;
  status: QueueStatus;
  estimatedWaitMinutes: number;
  joinedAt: Date;
  notifiedAt?: Date;
  onMyWayAt?: Date;
  seatedAt?: Date;
  assignedTableId?: mongoose.Types.ObjectId;
  assignedTableIds?: mongoose.Types.ObjectId[];
  preOrderId?: mongoose.Types.ObjectId;
}

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  qty: number;
  price: number;
  notes?: string;
}

export interface IOrder {
  restaurantId: mongoose.Types.ObjectId;
  queueEntryId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  gst: number;
  total: number;
  status: OrderStatus;
  triggers: {
    tableReady: boolean;
    customerOnMyWay: boolean;
    dualTriggerMetAt?: Date;
  };
  cookingStartedAt?: Date;
  readyAt?: Date;
}
