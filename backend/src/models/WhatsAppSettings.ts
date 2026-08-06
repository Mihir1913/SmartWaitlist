import mongoose, { Schema, Document } from 'mongoose';

export interface IWhatsAppTemplates {
  waitlistJoin: string;
  tableReady: string;
  reservationConfirm: string;
  reservationReminder: string;
  bookingCancel: string;
  restaurantWelcome: string;
}

export interface IWhatsAppSettingsDoc extends Document {
  restaurantId: mongoose.Types.ObjectId;
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  verifyToken: string;
  templates: IWhatsAppTemplates;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const whatsappSettingsSchema = new Schema<IWhatsAppSettingsDoc>(
  {
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
  },
  { timestamps: true }
);

export const WhatsAppSettings = mongoose.model<IWhatsAppSettingsDoc>('WhatsAppSettings', whatsappSettingsSchema);
