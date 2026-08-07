import mongoose, { Schema } from 'mongoose';
const inquirySchema = new Schema({
    restaurantName: { type: String, required: true },
    ownerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: String, required: true },
    dailyFootfall: { type: String, default: '50-100 guests' },
    notes: String,
    status: {
        type: String,
        enum: ['pending', 'contacted', 'approved'],
        default: 'pending',
    },
}, { timestamps: true });
export const Inquiry = mongoose.model('Inquiry', inquirySchema);
