import mongoose, { Schema } from 'mongoose';
const menuCategorySchema = new Schema({
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
export const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);
const menuItemSchema = new Schema({
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    imageUrl: String,
    isAvailable: { type: Boolean, default: true },
    prepTimeMinutes: { type: Number, default: 15 },
    gstRate: { type: Number, default: 5 },
}, { timestamps: true });
export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
