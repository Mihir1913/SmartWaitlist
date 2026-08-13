import mongoose from 'mongoose';
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

const ahmedabadRestaurants = [
  {
    name: 'Agashiye',
    slug: 'agashiye',
    address: 'The House of MG, Bhadra Road, Ahmedabad',
    whatsappPhone: '919876543001',
    description: 'Award-winning heritage rooftop restaurant serving authentic Gujarati Thali.',
    openingHours: '12:00 PM - 3:30 PM, 7:00 PM - 10:30 PM',
    cuisine: 'Gujarati',
    location: { lat: 23.0263, lng: 72.5813 },
    settings: { avgTurnoverMinutes: 60, maxQueueSize: 50, preOrderEnabled: true },
    menu: [
      { cat: 'Farsan', items: [{ name: 'Khaman Dhokla', desc: 'Steamed gram flour snack', price: 150, prep: 10 }] },
      { cat: 'Main Course', items: [{ name: 'Undhiyu', desc: 'Mixed vegetable dish', price: 350, prep: 20 }, { name: 'Puran Poli', desc: 'Sweet flatbread', price: 120, prep: 15 }] },
      { cat: 'Desserts', items: [{ name: 'Basundi', desc: 'Sweetened thick milk', price: 180, prep: 5 }] }
    ]
  },
  {
    name: 'Vishalla',
    slug: 'vishalla',
    address: 'Opp. APMC Market, Vasna, Ahmedabad',
    whatsappPhone: '919876543002',
    description: 'Village-themed traditional dining experience with cultural performances.',
    openingHours: '7:00 PM - 11:00 PM',
    cuisine: 'Traditional Gujarati',
    location: { lat: 23.0039, lng: 72.5414 },
    settings: { avgTurnoverMinutes: 90, maxQueueSize: 100, preOrderEnabled: false },
    menu: [
      { cat: 'Starters', items: [{ name: 'Muthiya', desc: 'Steamed spiced dumplings', price: 140, prep: 10 }] },
      { cat: 'Mains', items: [{ name: 'Bajra no Rotlo', desc: 'Millet flatbread with white butter', price: 90, prep: 10 }, { name: 'Sev Tameta', desc: 'Tomato curry with crispy sev', price: 210, prep: 15 }] },
      { cat: 'Desserts', items: [{ name: 'Mohanthal', desc: 'Gram flour fudge', price: 160, prep: 5 }] }
    ]
  },
  {
    name: 'Swati Snacks',
    slug: 'swati-snacks',
    address: 'Law Garden, Ellisbridge, Ahmedabad',
    whatsappPhone: '919876543003',
    description: 'Iconic spot for traditional regional snacks in a modern setting.',
    openingHours: '11:00 AM - 10:45 PM',
    cuisine: 'Street Food & Snacks',
    location: { lat: 23.0238, lng: 72.5638 },
    settings: { avgTurnoverMinutes: 45, maxQueueSize: 60, preOrderEnabled: true },
    menu: [
      { cat: 'Signatures', items: [{ name: 'Panki Chatni', desc: 'Rice pancake steamed in banana leaf', price: 200, prep: 15 }, { name: 'Fada Ni Khichdi', desc: 'Broken wheat and dal porridge', price: 220, prep: 15 }] },
      { cat: 'Street Food', items: [{ name: 'Pani Puri', desc: 'Crispy puris with tangy water', price: 90, prep: 5 }] },
      { cat: 'Drinks', items: [{ name: 'Sugarcane Juice', desc: 'Freshly pressed with ginger and lemon', price: 110, prep: 5 }] }
    ]
  },
  {
    name: 'Rajwadu',
    slug: 'rajwadu',
    address: 'Near Jivraj Tolnaka, Malav Talav, Ahmedabad',
    whatsappPhone: '919876543004',
    description: 'Royal Rajasthani and Gujarati dining in a majestic courtyard setting.',
    openingHours: '7:00 PM - 11:00 PM',
    cuisine: 'Rajasthani & Gujarati',
    location: { lat: 23.0035, lng: 72.5358 },
    settings: { avgTurnoverMinutes: 75, maxQueueSize: 80, preOrderEnabled: false },
    menu: [
      { cat: 'Appetizers', items: [{ name: 'Kachori', desc: 'Stuffed fried pastry', price: 130, prep: 10 }] },
      { cat: 'Main Course', items: [{ name: 'Dal Bati Churma', desc: 'Classic Rajasthani combination', price: 380, prep: 20 }, { name: 'Gatte ki Sabzi', desc: 'Gram flour dumplings in curd curry', price: 280, prep: 15 }] },
      { cat: 'Desserts', items: [{ name: 'Malpua', desc: 'Sweet pancakes with rabdi', price: 190, prep: 10 }] }
    ]
  },
  {
    name: 'Patang Hotel',
    slug: 'patang-hotel',
    address: 'Ashram Road, Ahmedabad',
    whatsappPhone: '919876543005',
    description: 'Ahmedabad’s famous revolving restaurant with panoramic city views.',
    openingHours: '7:00 PM - 11:00 PM',
    cuisine: 'Multi-Cuisine Buffet',
    location: { lat: 23.0298, lng: 72.5714 },
    settings: { avgTurnoverMinutes: 90, maxQueueSize: 40, preOrderEnabled: false },
    menu: [
      { cat: 'Soups', items: [{ name: 'Tomato Dhania Shorba', desc: 'Spiced tomato soup', price: 180, prep: 10 }] },
      { cat: 'Mains', items: [{ name: 'Paneer Lababdar', desc: 'Cottage cheese in rich gravy', price: 380, prep: 15 }, { name: 'Veg Hakka Noodles', desc: 'Indo-Chinese style noodles', price: 290, prep: 15 }] },
      { cat: 'Desserts', items: [{ name: 'Ice Cream Sundae', desc: 'Vanilla with chocolate sauce and nuts', price: 220, prep: 5 }] }
    ]
  },
  {
    name: 'Tomato\'s',
    slug: 'tomatos',
    address: 'C.G. Road, Navrangpura, Ahmedabad',
    whatsappPhone: '919876543006',
    description: 'Retro American diner serving Mexican, American, and Continental.',
    openingHours: '12:00 PM - 3:00 PM, 7:00 PM - 11:00 PM',
    cuisine: 'Mexican & American',
    location: { lat: 23.0365, lng: 72.5574 },
    settings: { avgTurnoverMinutes: 60, maxQueueSize: 70, preOrderEnabled: true },
    menu: [
      { cat: 'Starters', items: [{ name: 'Nachos Grande', desc: 'Tortilla chips with cheese and salsa', price: 320, prep: 10 }] },
      { cat: 'Mains', items: [{ name: 'Enchiladas', desc: 'Baked corn tortillas in sauce', price: 390, prep: 20 }, { name: 'Mac & Cheese', desc: 'Classic cheesy macaroni', price: 350, prep: 15 }] },
      { cat: 'Drinks', items: [{ name: 'Mocktail Blue Lagoon', desc: 'Refreshing blue curacao drink', price: 180, prep: 5 }] }
    ]
  },
  {
    name: 'Sasuji Dining Hall',
    slug: 'sasuji',
    address: 'C.G. Road, Navrangpura, Ahmedabad',
    whatsappPhone: '919876543007',
    description: 'Premium AC dining hall known for unlimited delicious Gujarati thalis.',
    openingHours: '11:00 AM - 3:00 PM, 7:00 PM - 10:30 PM',
    cuisine: 'Gujarati Thali',
    location: { lat: 23.0335, lng: 72.5562 },
    settings: { avgTurnoverMinutes: 50, maxQueueSize: 90, preOrderEnabled: false },
    menu: [
      { cat: 'Thali', items: [{ name: 'Unlimited Gujarati Thali', desc: 'Full thali with sweets, farsan, veg, roti, dal, rice', price: 400, prep: 5 }] },
      { cat: 'Extras', items: [{ name: 'Extra Shrikhand', desc: 'Sweet strained yogurt', price: 120, prep: 5 }] }
    ]
  },
  {
    name: 'Gordhan Thal',
    slug: 'gordhan-thal',
    address: 'S.G. Highway, Bodakdev, Ahmedabad',
    whatsappPhone: '919876543008',
    description: 'Grand traditional thali restaurant serving a feast fit for royalty.',
    openingHours: '11:00 AM - 3:30 PM, 7:00 PM - 11:00 PM',
    cuisine: 'Gujarati & Rajasthani',
    location: { lat: 23.0381, lng: 72.5118 },
    settings: { avgTurnoverMinutes: 60, maxQueueSize: 120, preOrderEnabled: false },
    menu: [
      { cat: 'Thali', items: [{ name: 'Premium Thali', desc: 'Elaborate traditional meal', price: 450, prep: 5 }] },
      { cat: 'Beverages', items: [{ name: 'Chaas', desc: 'Spiced buttermilk', price: 50, prep: 5 }] }
    ]
  },
  {
    name: 'Mocha',
    slug: 'mocha',
    address: 'Bodakdev, Ahmedabad',
    whatsappPhone: '919876543009',
    description: 'Trendy cafe offering global comfort food, coffees, and decadent desserts.',
    openingHours: '11:00 AM - 12:00 AM',
    cuisine: 'Cafe & Continental',
    location: { lat: 23.0360, lng: 72.5152 },
    settings: { avgTurnoverMinutes: 75, maxQueueSize: 50, preOrderEnabled: true },
    menu: [
      { cat: 'Coffee', items: [{ name: 'Cappuccino', desc: 'Classic espresso with frothy milk', price: 210, prep: 5 }] },
      { cat: 'Mains', items: [{ name: 'Penne Alfredo', desc: 'Pasta in creamy cheese sauce', price: 380, prep: 15 }, { name: 'Farmhouse Pizza', desc: 'Thin crust veg pizza', price: 420, prep: 20 }] },
      { cat: 'Desserts', items: [{ name: 'Chocolate Avalanche', desc: 'Signature chocolate dessert', price: 320, prep: 10 }] }
    ]
  },
  {
    name: 'Manek Chowk Eatery',
    slug: 'manek-chowk',
    address: 'Manek Chowk, Old City, Ahmedabad',
    whatsappPhone: '919876543010',
    description: 'Famous night street food market known for pav bhaji and cheese sandwiches.',
    openingHours: '8:00 PM - 2:00 AM',
    cuisine: 'Street Food',
    location: { lat: 23.0232, lng: 72.5855 },
    settings: { avgTurnoverMinutes: 30, maxQueueSize: 150, preOrderEnabled: true },
    menu: [
      { cat: 'Sandwiches', items: [{ name: 'Ghughra Sandwich', desc: 'Spicy layered grilled sandwich', price: 180, prep: 10 }, { name: 'Pineapple Cheese Sandwich', desc: 'Sweet and savory delight', price: 160, prep: 10 }] },
      { cat: 'Bhaji Pav', items: [{ name: 'Cheese Pav Bhaji', desc: 'Spicy mixed veg curry with buttery buns', price: 220, prep: 10 }] },
      { cat: 'Desserts', items: [{ name: 'Jamun Shots', desc: 'Fresh blackberry juice with salt rim', price: 120, prep: 5 }] }
    ]
  }
];

export async function runSeed(force = true) {
  console.log('[Database-Reset] Preserving SuperAdmin while wiping all old restaurant data...');

  const existingSuperAdmin = await User.findOne({ role: 'superadmin' });

  await Promise.all([
    Restaurant.deleteMany({}),
    Table.deleteMany({}),
    MenuCategory.deleteMany({}),
    MenuItem.deleteMany({}),
    User.deleteMany({ role: { $ne: 'superadmin' } }),
    QueueEntry.deleteMany({}),
    Order.deleteMany({}),
  ]);

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

  console.log(`[Database-Reset] Seeding ${ahmedabadRestaurants.length} Ahmedabad restaurants...`);

  for (const rData of ahmedabadRestaurants) {
    const restaurant = await Restaurant.create({
      name: rData.name,
      slug: rData.slug,
      address: rData.address,
      whatsappPhone: rData.whatsappPhone,
      description: rData.description,
      openingHours: rData.openingHours,
      cuisine: rData.cuisine,
      location: rData.location,
      settings: rData.settings,
    });

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

    for (let i = 0; i < rData.menu.length; i++) {
      const catData = rData.menu[i];
      const category = await MenuCategory.create({
        restaurantId: restaurant._id,
        name: catData.cat,
        sortOrder: i + 1,
      });

      const menuItems = catData.items.map(item => ({
        restaurantId: restaurant._id,
        categoryId: category._id,
        name: item.name,
        description: item.desc,
        price: item.price,
        isAvailable: true,
        prepTimeMinutes: item.prep,
        gstRate: 5,
        isVeg: true,
        isVegan: false,
      }));
      await MenuItem.insertMany(menuItems);
    }

    await User.create({
      restaurantId: restaurant._id,
      email: `owner@${rData.slug}.com`,
      password: defaultPasswordHash,
      name: `${rData.name} Owner`,
      role: 'owner',
    });
    
    await User.create({
      restaurantId: restaurant._id,
      email: `staff@${rData.slug}.com`,
      password: defaultPasswordHash,
      name: 'Head Waiter',
      role: 'staff',
    });
  }

  console.log('[Database-Reset] ✅ Database successfully seeded with 10 Ahmedabad restaurants!');
}
