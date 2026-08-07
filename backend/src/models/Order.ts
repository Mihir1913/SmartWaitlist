import mongoose, { Schema, Document } from 'mongoose';
import type { OrderStatus } from '../types/index.js';

export interface IOrderItemDoc {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  qty: number;
  price: number;
  notes?: string;
}

export interface IOrderDoc extends Document {
  restaurantId: mongoose.Types.ObjectId;
  queueEntryId: mongoose.Types.ObjectId;
  items: IOrderItemDoc[];
  subtotal: number;
  gst: number;
  total: number;
  status: OrderStatus;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'razorpay' | 'stripe' | 'upi' | 'cash';
  paymentId?: string;
  razorpayOrderId?: string;
  triggers: {
    tableReady: boolean;
    customerOnMyWay: boolean;
    dualTriggerMetAt?: Date;
  };
  cookingStartedAt?: Date;
  readyAt?: Date;
}

const orderSchema = new Schema<IOrderDoc>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    queueEntryId: { type: Schema.Types.ObjectId, ref: 'QueueEntry', required: true },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        name: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        notes: String,
      },
    ],
    subtotal: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'cooking', 'ready', 'served', 'completed'],
      default: 'draft',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe', 'upi', 'cash'],
      default: 'cash',
    },
    paymentId: { type: String, default: '' },
    razorpayOrderId: { type: String, default: '' },
    triggers: {
      tableReady: { type: Boolean, default: false },
      customerOnMyWay: { type: Boolean, default: false },
      dualTriggerMetAt: Date,
    },
    cookingStartedAt: Date,
    readyAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ restaurantId: 1, status: 1 });

export const Order = mongoose.model<IOrderDoc>('Order', orderSchema);
