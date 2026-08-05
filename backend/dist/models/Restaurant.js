import mongoose, { Schema } from 'mongoose';
const restaurantSchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    whatsappPhone: { type: String, required: true },
    description: { type: String, default: '' },
    openingHours: { type: String, default: '11:00 AM - 11:00 PM' },
    cuisine: { type: String, default: 'Multi-Cuisine & Dining' },
    settings: {
        avgTurnoverMinutes: { type: Number, default: 45 },
        maxQueueSize: { type: Number, default: 50 },
        preOrderEnabled: { type: Boolean, default: true },
    },
}, { timestamps: true });
export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
