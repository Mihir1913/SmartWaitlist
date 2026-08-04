import mongoose, { Schema } from 'mongoose';
const tableSchema = new Schema({
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
}, { timestamps: true });
tableSchema.index({ restaurantId: 1, status: 1 });
export const Table = mongoose.model('Table', tableSchema);
