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
    const [userCount, restaurantCount] = await Promise.all([
        User.countDocuments(),
        Restaurant.countDocuments(),
    ]);
    if (!force && userCount > 0 && restaurantCount > 0) {
        console.log(`[Auto-Seed] Database contains ${userCount} users & ${restaurantCount} restaurants. Skipping seed.`);
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
    await MenuItem.insertMany(menuData.map((item) => ({
        restaurantId: restaurant._id,
        categoryId: categories[item.cat]._id,
        name: item.name,
        description: item.desc,
        price: item.price,
        isAvailable: true,
        prepTimeMinutes: 15,
        gstRate: 5,
    })));
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
    console.log('[Auto-Seed] ✅ Clean database initialization complete! Spice Garden restaurant created.');
    return true;
}
export async function seedDemoSimulation(restaurantId) {
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
    if (!restaurant)
        throw new Error('No restaurant found for demo simulation');
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
        // Link assigned table to Vikram Malhotra
        await QueueEntry.findByIdAndUpdate(createdEntries[2]._id, { assignedTableId: tables[2]._id });
    }
    // 5. Create 2 realistic pre-orders
    if (items.length >= 2 && createdEntries.length >= 2) {
        // Order 1: Confirmed
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
        // Order 2: Cooking In Progress
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
