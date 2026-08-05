import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { Restaurant } from './models/Restaurant.js';
import { Table } from './models/Table.js';
import { MenuCategory, MenuItem } from './models/Menu.js';
import { User } from './models/User.js';
import { QueueEntry } from './models/QueueEntry.js';
async function seed() {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB for seeding...');
    await Promise.all([
        Restaurant.deleteMany({}),
        Table.deleteMany({}),
        MenuCategory.deleteMany({}),
        MenuItem.deleteMany({}),
        User.deleteMany({}),
        QueueEntry.deleteMany({}),
    ]);
    const restaurant = await Restaurant.create({
        name: 'Spice Garden',
        slug: 'spice-garden',
        address: '42 MG Road, Bangalore',
        whatsappPhone: '919876543210',
        settings: {
            avgTurnoverMinutes: 45,
            maxQueueSize: 50,
            preOrderEnabled: true,
        },
    });
    const tables = [];
    for (let i = 1; i <= 10; i++) {
        tables.push({
            restaurantId: restaurant._id,
            number: `T${i}`,
            capacity: i <= 4 ? 2 : i <= 7 ? 4 : 6,
            status: i <= 3 ? 'occupied' : i === 4 ? 'cleaning' : 'available',
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
    const sampleGuests = [
        { name: 'Amit Patel', phone: '9876543210', partySize: 2 },
        { name: 'Sneha Reddy', phone: '9876543211', partySize: 4 },
        { name: 'Rahul Mehta', phone: '9876543212', partySize: 3 },
        { name: 'Kavita Singh', phone: '9876543213', partySize: 2 },
    ];
    for (let i = 0; i < sampleGuests.length; i++) {
        await QueueEntry.create({
            restaurantId: restaurant._id,
            customer: { name: sampleGuests[i].name, phone: sampleGuests[i].phone },
            partySize: sampleGuests[i].partySize,
            position: i + 1,
            status: 'waiting',
            estimatedWaitMinutes: 15 + i * 8,
            joinedAt: new Date(Date.now() - (sampleGuests.length - i) * 600000),
        });
    }
    console.log('\n✅ Seed completed!\n');
    console.log('Restaurant: Spice Garden (slug: spice-garden)');
    console.log('\nLogin credentials (password: password123):');
    console.log('  Main Admin: admin@smartwaitlist.com');
    console.log('  Owner:      owner@spicegarden.com');
    console.log('  Staff:      staff@spicegarden.com');
    console.log('  Kitchen:    kitchen@spicegarden.com');
    console.log('\nCustomer join URL: http://localhost:5173/join/spice-garden\n');
    await mongoose.disconnect();
}
seed().catch(console.error);
