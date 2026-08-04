import mongoose, { Schema } from 'mongoose';
const userSchema = new Schema({
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['owner', 'staff', 'kitchen'], required: true },
}, { timestamps: true });
export const User = mongoose.model('User', userSchema);
