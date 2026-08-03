import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuCategoryDoc extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  sortOrder: number;
}

const menuCategorySchema = new Schema<IMenuCategoryDoc>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const MenuCategory = mongoose.model<IMenuCategoryDoc>('MenuCategory', menuCategorySchema);

export interface IMenuItemDoc extends Document {
  restaurantId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  prepTimeMinutes: number;
  gstRate: number;
}

const menuItemSchema = new Schema<IMenuItemDoc>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    imageUrl: String,
    isAvailable: { type: Boolean, default: true },
    prepTimeMinutes: { type: Number, default: 15 },
    gstRate: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export const MenuItem = mongoose.model<IMenuItemDoc>('MenuItem', menuItemSchema);
