import mongoose, { Schema } from 'mongoose';
const orderSchema = new Schema({
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
}, { timestamps: true });
orderSchema.index({ restaurantId: 1, status: 1 });
export const Order = mongoose.model('Order', orderSchema);
