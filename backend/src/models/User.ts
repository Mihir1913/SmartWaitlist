import mongoose, { Schema, Document } from 'mongoose';
import type { UserRole } from '../types/index.js';

export interface IUserDoc extends Document {
  restaurantId?: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

const userSchema = new Schema<IUserDoc>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: false, index: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['superadmin', 'owner', 'staff', 'kitchen'], required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUserDoc>('User', userSchema);
