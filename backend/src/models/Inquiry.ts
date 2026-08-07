import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiryDoc extends Document {
  restaurantName: string;
  ownerName: string;
  phone: string;
  email: string;
  city: string;
  dailyFootfall?: string;
  notes?: string;
  status: 'pending' | 'contacted' | 'approved';
  createdAt: Date;
}

const inquirySchema = new Schema<IInquiryDoc>(
  {
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
  },
  { timestamps: true }
);

export const Inquiry = mongoose.model<IInquiryDoc>('Inquiry', inquirySchema);
