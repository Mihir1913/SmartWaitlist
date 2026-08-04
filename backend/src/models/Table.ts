import mongoose, { Schema, Document } from 'mongoose';
import type { TableStatus } from '../types/index.js';

export interface ITableDoc extends Document {
  restaurantId: mongoose.Types.ObjectId;
  number: string;
  capacity: number;
  status: TableStatus;
  currentQueueEntryId?: mongoose.Types.ObjectId;
  combinedGroupId?: string;
  lastStatusChangeAt: Date;
}

const tableSchema = new Schema<ITableDoc>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    number: { type: String, required: true },
    capacity: { type: Number, required: true },
    status: {
      type: String,
      enum: ['available', 'occupied', 'cleaning', 'ready'],
      default: 'available',
    },
    currentQueueEntryId: { type: Schema.Types.ObjectId, ref: 'QueueEntry' },
    combinedGroupId: { type: String, default: undefined },
    lastStatusChangeAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

tableSchema.index({ restaurantId: 1, status: 1 });

export const Table = mongoose.model<ITableDoc>('Table', tableSchema);
