import bcrypt from 'bcryptjs';
import { Restaurant } from '../models/Restaurant.js';
import { Table } from '../models/Table.js';
import { MenuCategory, MenuItem } from '../models/Menu.js';
import { User } from '../models/User.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { Order } from '../models/Order.js';
import { config } from '../config/index.js';

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

export async function runSeed(force = true) {
  console.log('[Database-Reset] Preserving SuperAdmin while wiping all old restaurant data...');

  // 1. Preserve existing superadmin user if present
  const existingSuperAdmin = await User.findOne({ role: 'superadmin' });

  // 2. Wipe old data
  await Promise.all([
    Restaurant.deleteMany({}),
    Table.deleteMany({}),
    MenuCategory.deleteMany({}),
    MenuItem.deleteMany({}),
    User.deleteMany({ role: { $ne: 'superadmin' } }),
    QueueEntry.deleteMany({}),
    Order.deleteMany({}),
  ]);

  // 3. Create fresh production restaurant
  const restaurant = await Restaurant.create({
    name: 'Spice Garden Fine Dining',
    slug: 'spice-garden',
    address: '42 MG Road, Indiranagar, Bangalore',
    whatsappPhone: '919876543210',
    description: 'Authentic Indian Cuisine, Mughlai Delicacies & Fine Dining Experience',
    openingHours: '11:00 AM - 11:00 PM',
    cuisine: 'North Indian & Mughlai',
    location: { lat: 12.9784, lng: 77.6408 },
    settings: {
      avgTurnoverMinutes: 45,
      maxQueueSize: 50,
      preOrderEnabled: true,
    },
  });

  await Restaurant.insertMany([
    {
      name: 'Truffles Burger Joint',
      slug: 'truffles-koramangala',
      address: 'Koramangala 5th Block, Bangalore',
      whatsappPhone: '919876543211',
      description: 'Legendary burgers, steaks and shakes.',
      openingHours: '11:00 AM - 11:00 PM',
      cuisine: 'American & Fast Food',
      location: { lat: 12.9352, lng: 77.6245 },
      settings: { avgTurnoverMinutes: 30, maxQueueSize: 50, preOrderEnabled: false },
    },
    {
      name: 'Toit Brewpub',
      slug: 'toit-indiranagar',
      address: '100 Feet Road, Indiranagar, Bangalore',
      whatsappPhone: '919876543212',
      description: 'Craft beers and wood-fired pizzas.',
      openingHours: '12:00 PM - 01:00 AM',
      cuisine: 'Continental & Pub Food',
      location: { lat: 12.9798, lng: 77.6406 },
      settings: { avgTurnoverMinutes: 90, maxQueueSize: 100, preOrderEnabled: true },
    }
  ]);

  // 4. Create 8 clean tables all in 'available' status
  const tables = [
    { restaurantId: restaurant._id, number: 'T1', capacity: 2, status: 'available' },
    { restaurantId: restaurant._id, number: 'T2', capacity: 2, status: 'available' },
    { restaurantId: restaurant._id, number: 'T3', capacity: 4, status: 'available' },
    { restaurantId: restaurant._id, number: 'T4', capacity: 4, status: 'available' },
    { restaurantId: restaurant._id, number: 'T5', capacity: 4, status: 'available' },
    { restaurantId: restaurant._id, number: 'T6', capacity: 6, status: 'available' },
    { restaurantId: restaurant._id, number: 'T7', capacity: 6, status: 'available' },
    { restaurantId: restaurant._id, number: 'T8', capacity: 8, status: 'available' },
  ];
  await Table.insertMany(tables);

  // 5. Create 4 structured menu categories
  const categories = await MenuCategory.insertMany([
    { restaurantId: restaurant._id, name: 'Starters & Appetizers', sortOrder: 1 },
    { restaurantId: restaurant._id, name: 'Main Course', sortOrder: 2 },
    { restaurantId: restaurant._id, name: 'Desserts & Sweets', sortOrder: 3 },
    { restaurantId: restaurant._id, name: 'Beverages & Shakes', sortOrder: 4 },
  ]);

  // 6. Create rich menu items with dietary badges (Veg, Non-Veg, Vegan)
  const menuItemsData = [
    // Starters (cat 0)
    { cat: 0, name: 'Paneer Tikka', desc: 'Grilled cottage cheese marinated in aromatic spices', price: 280, isVeg: true, isVegan: false, prep: 15 },
    { cat: 0, name: 'Chicken Tikka', desc: 'Juicy tender chicken bites grilled in charcoal tandoor', price: 340, isVeg: false, isVegan: false, prep: 15 },
    { cat: 0, name: 'Crispy Corn', desc: 'Golden fried sweet corn tossed with herbs and lemon', price: 220, isVeg: true, isVegan: true, prep: 10 },
    { cat: 0, name: 'Hara Bhara Kabab', desc: 'Pan-fried spinach and green pea patties', price: 240, isVeg: true, isVegan: false, prep: 12 },

    // Main Course (cat 1)
    { cat: 1, name: 'Butter Chicken', desc: 'Tender chicken pieces cooked in rich creamy tomato butter gravy', price: 390, isVeg: false, isVegan: false, prep: 20 },
    { cat: 1, name: 'Paneer Butter Masala', desc: 'Cottage cheese cubes cooked in velvety rich gravy', price: 320, isVeg: true, isVegan: false, prep: 18 },
    { cat: 1, name: 'Dal Makhani', desc: 'Slow-cooked black lentils finished with cream and butter', price: 270, isVeg: true, isVegan: false, prep: 15 },
    { cat: 1, name: 'Veg Dum Biryani', desc: 'Fragrant basmati rice layered with seasonal vegetables and spices', price: 290, isVeg: true, isVegan: false, prep: 20 },
    { cat: 1, name: 'Chicken Dum Biryani', desc: 'Hyderabadi style aromatic chicken dum biryani', price: 360, isVeg: false, isVegan: false, prep: 20 },
    { cat: 1, name: 'Garlic Naan', desc: 'Freshly baked tandoori bread topped with garlic and butter', price: 70, isVeg: true, isVegan: false, prep: 5 },

    // Desserts (cat 2)
    { cat: 2, name: 'Gulab Jamun', desc: 'Warm milk dumplings soaked in cardamom sugar syrup', price: 130, isVeg: true, isVegan: false, prep: 5 },
    { cat: 2, name: 'Rasmalai', desc: 'Soft cottage cheese disks in chilled saffron milk', price: 160, isVeg: true, isVegan: false, prep: 5 },

    // Beverages (cat 3)
    { cat: 3, name: 'Fresh Lime Soda', desc: 'Refreshing lime and mint cooler (Sweet / Salted)', price: 90, isVeg: true, isVegan: true, prep: 5 },
    { cat: 3, name: 'Mango Lassi', desc: 'Traditional sweet yogurt smoothie with Alphanso mango pulp', price: 130, isVeg: true, isVegan: false, prep: 5 },
  ];

  await MenuItem.insertMany(
    menuItemsData.map((item) => ({
      restaurantId: restaurant._id,
      categoryId: categories[item.cat]._id,
      name: item.name,
      description: item.desc,
      price: item.price,
      isAvailable: true,
      prepTimeMinutes: item.prep,
      gstRate: 5,
      isVeg: item.isVeg,
      isVegan: item.isVegan,
    }))
  );

  // 7. Create SuperAdmin & Restaurant Credentials
  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash(config.superAdminPassword, 10);

  if (!existingSuperAdmin) {
    await User.create({
      email: config.superAdminEmail,
      password: adminPasswordHash,
      name: 'Main Platform Admin',
      role: 'superadmin',
    });
  }

  await User.insertMany([
    {
      restaurantId: restaurant._id,
      email: 'owner@spicegarden.com',
      password: defaultPasswordHash,
      name: 'Rajesh Kumar (Owner)',
      role: 'owner',
    },
    {
      restaurantId: restaurant._id,
      email: 'staff@spicegarden.com',
      password: defaultPasswordHash,
      name: 'Priya Sharma (Staff)',
      role: 'staff',
    },
    {
      restaurantId: restaurant._id,
      email: 'kitchen@spicegarden.com',
      password: defaultPasswordHash,
      name: 'Chef Anand (Kitchen)',
      role: 'kitchen',
    },
  ]);

  console.log('[Database-Reset] ✅ Database successfully reset with Spice Garden Fine Dining & structured menu!');
  return true;
}

export async function seedDemoSimulation(restaurantId?: string) {
  let restaurant = null;
  if (restaurantId) {
    restaurant = await Restaurant.findById(restaurantId);
  }
  if (!restaurant) {
    restaurant = await Restaurant.findOne({ slug: 'spice-garden' });
  }
  if (!restaurant) {
    restaurant = await Restaurant.findOne();
  }
  if (!restaurant) {
    await runSeed(true);
    restaurant = await Restaurant.findOne();
  }
  if (!restaurant) throw new Error('No restaurant found for demo simulation');

  const rId = restaurant._id;

  // 1. Wipe existing queue entries and orders for this restaurant
  await Promise.all([
    QueueEntry.deleteMany({ restaurantId: rId }),
    Order.deleteMany({ restaurantId: rId }),
  ]);

  // 2. Fetch menu items for realistic pre-orders
  const items = await MenuItem.find({ restaurantId: rId }).limit(6);

  // 3. Create 5 realistic queue entries
  const entriesData = [
    { name: 'Rahul Sharma', phone: '9876543210', partySize: 4, position: 1, status: 'waiting', wait: 12 },
    { name: 'Ananya Verma', phone: '9876543211', partySize: 2, position: 2, status: 'waiting', wait: 20 },
    { name: 'Vikram Malhotra', phone: '9876543212', partySize: 5, position: 3, status: 'notified', wait: 5 },
    { name: 'Priya Nair', phone: '9876543213', partySize: 3, position: 4, status: 'on_my_way', wait: 2 },
    { name: 'Amitabh Kapoor', phone: '9876543214', partySize: 6, position: 5, status: 'waiting', wait: 35 },
  ];

  const createdEntries = [];
  for (const d of entriesData) {
    const entry = await QueueEntry.create({
      restaurantId: rId,
      customer: { name: d.name, phone: d.phone },
      partySize: d.partySize,
      position: d.position,
      status: d.status,
      estimatedWaitMinutes: d.wait,
      joinedAt: new Date(Date.now() - (6 - d.position) * 8 * 60 * 1000),
      notifiedAt: d.status !== 'waiting' ? new Date(Date.now() - 4 * 60 * 1000) : undefined,
      onMyWayAt: d.status === 'on_my_way' ? new Date(Date.now() - 2 * 60 * 1000) : undefined,
    });
    createdEntries.push(entry);
  }

  // 4. Update table statuses realistically
  const tables = await Table.find({ restaurantId: rId });
  if (tables.length >= 4) {
    await Table.findByIdAndUpdate(tables[0]._id, { status: 'occupied' });
    await Table.findByIdAndUpdate(tables[1]._id, { status: 'cleaning' });
    await Table.findByIdAndUpdate(tables[2]._id, { status: 'ready', currentQueueEntryId: createdEntries[2]._id });
    await Table.findByIdAndUpdate(tables[3]._id, { status: 'available' });
    
    await QueueEntry.findByIdAndUpdate(createdEntries[2]._id, { assignedTableId: tables[2]._id });
  }

  // 5. Create 2 realistic pre-orders
  if (items.length >= 2 && createdEntries.length >= 2) {
    const o1 = await Order.create({
      restaurantId: rId,
      queueEntryId: createdEntries[0]._id,
      items: [
        { menuItemId: items[0]._id, name: items[0].name, qty: 2, price: items[0].price },
        { menuItemId: items[1]._id, name: items[1].name, qty: 1, price: items[1].price },
      ],
      subtotal: items[0].price * 2 + items[1].price,
      gst: Math.round((items[0].price * 2 + items[1].price) * 0.05),
      total: Math.round((items[0].price * 2 + items[1].price) * 1.05),
      status: 'confirmed',
      triggers: { tableReady: true, customerOnMyWay: false },
    });
    await QueueEntry.findByIdAndUpdate(createdEntries[0]._id, { preOrderId: o1._id });

    const o2 = await Order.create({
      restaurantId: rId,
      queueEntryId: createdEntries[3]._id,
      items: [
        { menuItemId: items[1]._id, name: items[1].name, qty: 2, price: items[1].price },
      ],
      subtotal: items[1].price * 2,
      gst: Math.round(items[1].price * 2 * 0.05),
      total: Math.round(items[1].price * 2 * 1.05),
      status: 'cooking',
      cookingStartedAt: new Date(Date.now() - 5 * 60 * 1000),
      triggers: { tableReady: true, customerOnMyWay: true, dualTriggerMetAt: new Date(Date.now() - 5 * 60 * 1000) },
    });
    await QueueEntry.findByIdAndUpdate(createdEntries[3]._id, { preOrderId: o2._id });
  }

  return { message: 'Demo simulation dataset loaded successfully!', restaurantId: rId.toString() };
}
