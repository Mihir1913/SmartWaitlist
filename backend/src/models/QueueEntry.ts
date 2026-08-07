import mongoose, { Schema, Document } from 'mongoose';
import type { QueueStatus } from '../types/index.js';

export interface IQueueEntryDoc extends Document {
  restaurantId: mongoose.Types.ObjectId;
  customer: { name: string; phone: string };
  partySize: number;
  position: number;
  status: QueueStatus;
  estimatedWaitMinutes: number;
  depositAmount?: number;
  isDepositPaid?: boolean;
  depositPaymentId?: string;
  joinedAt: Date;
  notifiedAt?: Date;
  onMyWayAt?: Date;
  seatedAt?: Date;
  assignedTableId?: mongoose.Types.ObjectId;
  assignedTableIds?: mongoose.Types.ObjectId[];
  preOrderId?: mongoose.Types.ObjectId;
}

const queueEntrySchema = new Schema<IQueueEntryDoc>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    partySize: { type: Number, required: true, min: 1 },
    position: { type: Number, required: true },
    status: {
      type: String,
      enum: ['waiting', 'notified', 'on_my_way', 'seated', 'cancelled', 'no_show'],
      default: 'waiting',
    },
    estimatedWaitMinutes: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0 },
    isDepositPaid: { type: Boolean, default: false },
    depositPaymentId: { type: String, default: '' },
    joinedAt: { type: Date, default: Date.now },
    notifiedAt: Date,
    onMyWayAt: Date,
    seatedAt: Date,
    assignedTableId: { type: Schema.Types.ObjectId, ref: 'Table' },
    assignedTableIds: [{ type: Schema.Types.ObjectId, ref: 'Table' }],
    preOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

queueEntrySchema.index({ restaurantId: 1, status: 1, position: 1 });
queueEntrySchema.index({ 'customer.phone': 1, restaurantId: 1 });

export const QueueEntry = mongoose.model<IQueueEntryDoc>('QueueEntry', queueEntrySchema);
