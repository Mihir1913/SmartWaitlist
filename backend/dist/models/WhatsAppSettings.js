import mongoose, { Schema } from 'mongoose';
const whatsappSettingsSchema = new Schema({
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, unique: true, index: true },
    phoneNumberId: { type: String, default: '' },
    accessToken: { type: String, default: '' },
    businessAccountId: { type: String, default: '' },
    verifyToken: { type: String, default: '' },
    templates: {
        waitlistJoin: { type: String, default: 'waitlist_join_confirmation' },
        tableReady: { type: String, default: 'table_ready_notification' },
        reservationConfirm: { type: String, default: 'reservation_confirmation' },
        reservationReminder: { type: String, default: 'reservation_reminder' },
        bookingCancel: { type: String, default: 'booking_cancellation' },
        restaurantWelcome: { type: String, default: 'restaurant_welcome' },
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
export const WhatsAppSettings = mongoose.model('WhatsAppSettings', whatsappSettingsSchema);
