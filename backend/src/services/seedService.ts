import bcrypt from 'bcryptjs';
import { Restaurant } from '../models/Restaurant.js';
import { Table } from '../models/Table.js';
import { MenuCategory, MenuItem } from '../models/Menu.js';
import { User } from '../models/User.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { Order } from '../models/Order.js';

export async function clearDummyData() {
  console.log('[Clear-Data] Wiping queue entries, orders, and resetting all tables to available...');
  await Promise.all([
    QueueEntry.deleteMany({}),
    Order.deleteMany({}),
    Table.updateMany({}, { status: 'available', $unset: { currentQueueEntryId: '', combinedGroupId: '' } }),
  ]);
  console.log('[Clear-Data] ✅ All dummy queue entries and orders cleared cleanly!');
  return true;
}

export async function runSeed(force = false) {
  const userCount = await User.countDocuments();
  if (!force && userCount > 0) {
    console.log(`[Auto-Seed] Database already contains ${userCount} users. Skipping seed.`);
    return false;
  }

  console.log('[Auto-Seed] Seeding clean initial database records...');

  await Promise.all([
    Restaurant.deleteMany({}),
    Table.deleteMany({}),
    MenuCategory.deleteMany({}),
    MenuItem.deleteMany({}),
    User.deleteMany({}),
    QueueEntry.deleteMany({}),
    Order.deleteMany({}),
  ]);

  const restaurant = await Restaurant.create({
    name: 'Spice Garden',
    slug: 'spice-garden',
    address: '42 MG Road, Bangalore',
    whatsappPhone: '919876543210',
    description: 'Authentic Indian Cuisine & Fine Dining Experience',
    openingHours: '11:00 AM - 11:00 PM',
    cuisine: 'North Indian & Mughlai',
    settings: {
      avgTurnoverMinutes: 45,
      maxQueueSize: 50,
      preOrderEnabled: true,
    },
  });

  // Create clean initial tables all in 'available' status
  const tables = [];
  for (let i = 1; i <= 6; i++) {
    tables.push({
      restaurantId: restaurant._id,
      number: `T${i}`,
      capacity: i <= 2 ? 2 : i <= 4 ? 4 : 6,
      status: 'available',
    });
  }
  await Table.insertMany(tables);

  const categories = await MenuCategory.insertMany([
    { restaurantId: restaurant._id, name: 'Starters', sortOrder: 1 },
    { restaurantId: restaurant._id, name: 'Main Course', sortOrder: 2 },
    { restaurantId: restaurant._id, name: 'Beverages', sortOrder: 3 },
    { restaurantId: restaurant._id, name: 'Desserts', sortOrder: 4 },
  ]);

  const menuData = [
    { cat: 0, name: 'Paneer Tikka', desc: 'Grilled cottage cheese with spices', price: 280 },
    { cat: 0, name: 'Chicken 65', desc: 'Spicy fried chicken bites', price: 320 },
    { cat: 0, name: 'Veg Spring Rolls', desc: 'Crispy rolls with vegetables', price: 220 },
    { cat: 1, name: 'Butter Chicken', desc: 'Creamy tomato curry', price: 380 },
    { cat: 1, name: 'Dal Makhani', desc: 'Slow-cooked black lentils', price: 260 },
    { cat: 1, name: 'Biryani (Veg)', desc: 'Fragrant rice with vegetables', price: 290 },
    { cat: 1, name: 'Biryani (Chicken)', desc: 'Aromatic chicken biryani', price: 350 },
    { cat: 2, name: 'Fresh Lime Soda', desc: 'Refreshing lime drink', price: 80 },
    { cat: 2, name: 'Mango Lassi', desc: 'Sweet yogurt drink', price: 120 },
    { cat: 3, name: 'Gulab Jamun', desc: 'Warm milk dumplings', price: 120 },
    { cat: 3, name: 'Kulfi Falooda', desc: 'Traditional ice cream dessert', price: 150 },
  ];

  await MenuItem.insertMany(
    menuData.map((item) => ({
      restaurantId: restaurant._id,
      categoryId: categories[item.cat]._id,
      name: item.name,
      description: item.desc,
      price: item.price,
      isAvailable: true,
      prepTimeMinutes: 15,
      gstRate: 5,
    }))
  );

  const hashedPassword = await bcrypt.hash('password123', 10);
  await User.insertMany([
    {
      email: 'admin@smartwaitlist.com',
      password: hashedPassword,
      name: 'Main Platform Admin',
      role: 'superadmin',
    },
    {
      restaurantId: restaurant._id,
      email: 'owner@spicegarden.com',
      password: hashedPassword,
      name: 'Rajesh Kumar',
      role: 'owner',
    },
    {
      restaurantId: restaurant._id,
      email: 'staff@spicegarden.com',
      password: hashedPassword,
      name: 'Priya Sharma',
      role: 'staff',
    },
    {
      restaurantId: restaurant._id,
      email: 'kitchen@spicegarden.com',
      password: hashedPassword,
      name: 'Chef Anand',
      role: 'kitchen',
    },
  ]);

  console.log('[Auto-Seed] ✅ Clean database initialization complete! Zero dummy queue entries created.');
  return true;
}
