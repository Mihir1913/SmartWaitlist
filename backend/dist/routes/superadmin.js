import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { Restaurant } from '../models/Restaurant.js';
import { User } from '../models/User.js';
import { Table } from '../models/Table.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { MenuCategory, MenuItem } from '../models/Menu.js';
import { Order } from '../models/Order.js';
import { AuditLog } from '../models/AuditLog.js';
const router = Router();
// Protect all superadmin routes
router.use(authMiddleware, requireRole('superadmin'));
// Schema validations
const createRestaurantSchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    address: z.string().min(3),
    whatsappPhone: z.string().min(5),
    settings: z.object({
        avgTurnoverMinutes: z.number().default(45),
        maxQueueSize: z.number().default(50),
        preOrderEnabled: z.boolean().default(true),
    }).optional(),
    owner: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
    }).optional(),
});
const updateRestaurantSchema = z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
    address: z.string().min(3).optional(),
    whatsappPhone: z.string().min(5).optional(),
    settings: z.object({
        avgTurnoverMinutes: z.number().optional(),
        maxQueueSize: z.number().optional(),
        preOrderEnabled: z.boolean().optional(),
    }).optional(),
});
const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['owner', 'staff', 'kitchen']),
});
// GET /api/superadmin/restaurants - List all restaurants with metrics and owner info
router.get('/restaurants', async (req, res) => {
    try {
        const restaurants = await Restaurant.find().sort({ createdAt: -1 });
        const restaurantData = await Promise.all(restaurants.map(async (r) => {
            const [tableCount, activeQueueCount, owners, usersCount] = await Promise.all([
                Table.countDocuments({ restaurantId: r._id }),
                QueueEntry.countDocuments({ restaurantId: r._id, status: { $in: ['waiting', 'notified', 'on_my_way'] } }),
                User.find({ restaurantId: r._id, role: 'owner' }, 'name email'),
                User.countDocuments({ restaurantId: r._id }),
            ]);
            return {
                id: r._id,
                name: r.name,
                slug: r.slug,
                address: r.address,
                whatsappPhone: r.whatsappPhone,
                timezone: r.timezone,
                settings: r.settings,
                createdAt: r.createdAt,
                tableCount,
                activeQueueCount,
                usersCount,
                owners: owners.map((o) => ({ id: o._id, name: o.name, email: o.email })),
            };
        }));
        const platformStats = {
            totalRestaurants: restaurants.length,
            totalActiveQueues: restaurantData.reduce((acc, curr) => acc + curr.activeQueueCount, 0),
            totalTables: restaurantData.reduce((acc, curr) => acc + curr.tableCount, 0),
            totalUsers: await User.countDocuments(),
        };
        res.json({ restaurants: restaurantData, stats: platformStats });
    }
    catch (err) {
        console.error('Superadmin get restaurants error:', err);
        res.status(500).json({ error: 'Failed to fetch restaurants' });
    }
});
// POST /api/superadmin/restaurants - Create new restaurant (+ owner user if provided)
router.post('/restaurants', async (req, res) => {
    try {
        const payload = createRestaurantSchema.parse(req.body);
        const existingSlug = await Restaurant.findOne({ slug: payload.slug });
        if (existingSlug) {
            return res.status(400).json({ error: 'A restaurant with this slug already exists' });
        }
        if (payload.owner) {
            const existingUser = await User.findOne({ email: payload.owner.email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ error: 'A user with this email already exists' });
            }
        }
        const restaurant = await Restaurant.create({
            name: payload.name,
            slug: payload.slug.toLowerCase(),
            address: payload.address,
            whatsappPhone: payload.whatsappPhone,
            settings: payload.settings || {
                avgTurnoverMinutes: 45,
                maxQueueSize: 50,
                preOrderEnabled: true,
            },
        });
        let ownerUser = null;
        if (payload.owner) {
            const hashedPassword = await bcrypt.hash(payload.owner.password, 10);
            ownerUser = await User.create({
                restaurantId: restaurant._id,
                name: payload.owner.name,
                email: payload.owner.email.toLowerCase(),
                password: hashedPassword,
                role: 'owner',
            });
        }
        res.status(201).json({
            message: 'Restaurant created successfully',
            restaurant: {
                id: restaurant._id,
                name: restaurant.name,
                slug: restaurant.slug,
                address: restaurant.address,
                whatsappPhone: restaurant.whatsappPhone,
                settings: restaurant.settings,
            },
            owner: ownerUser
                ? { id: ownerUser._id, name: ownerUser.name, email: ownerUser.email, role: ownerUser.role }
                : null,
        });
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
        }
        console.error('Superadmin create restaurant error:', err);
        res.status(500).json({ error: 'Failed to create restaurant' });
    }
});
// PUT /api/superadmin/restaurants/:id - Update restaurant
router.put('/restaurants/:id', async (req, res) => {
    try {
        const payload = updateRestaurantSchema.parse(req.body);
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        if (payload.slug && payload.slug !== restaurant.slug) {
            const existing = await Restaurant.findOne({ slug: payload.slug });
            if (existing) {
                return res.status(400).json({ error: 'Slug is already taken by another restaurant' });
            }
            restaurant.slug = payload.slug.toLowerCase();
        }
        if (payload.name)
            restaurant.name = payload.name;
        if (payload.address)
            restaurant.address = payload.address;
        if (payload.whatsappPhone)
            restaurant.whatsappPhone = payload.whatsappPhone;
        if (payload.settings) {
            restaurant.settings = {
                ...restaurant.settings,
                ...payload.settings,
            };
        }
        await restaurant.save();
        res.json({ message: 'Restaurant updated', restaurant });
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
        }
        res.status(500).json({ error: 'Failed to update restaurant' });
    }
});
// DELETE /api/superadmin/restaurants/:id - Delete restaurant and all associated data
router.delete('/restaurants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        await Promise.all([
            Restaurant.findByIdAndDelete(id),
            User.deleteMany({ restaurantId: id }),
            Table.deleteMany({ restaurantId: id }),
            QueueEntry.deleteMany({ restaurantId: id }),
            MenuCategory.deleteMany({ restaurantId: id }),
            MenuItem.deleteMany({ restaurantId: id }),
            Order.deleteMany({ restaurantId: id }),
        ]);
        res.json({ message: `Restaurant ${restaurant.name} and all related data deleted successfully` });
    }
    catch (err) {
        console.error('Superadmin delete restaurant error:', err);
        res.status(500).json({ error: 'Failed to delete restaurant' });
    }
});
// POST /api/superadmin/restaurants/:id/users - Add user account to specific restaurant
router.post('/restaurants/:id/users', async (req, res) => {
    try {
        const { id } = req.params;
        const payload = createUserSchema.parse(req.body);
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'A user with this email already exists' });
        }
        const hashedPassword = await bcrypt.hash(payload.password, 10);
        const user = await User.create({
            restaurantId: restaurant._id,
            name: payload.name,
            email: payload.email.toLowerCase(),
            password: hashedPassword,
            role: payload.role,
        });
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                restaurantId: user.restaurantId,
            },
        });
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});
// POST /api/superadmin/reset-database - Reset database, preserve SuperAdmin, create fresh restaurant & menu
router.post('/reset-database', async (req, res) => {
    try {
        const { runSeed } = await import('../services/seedService.js');
        await runSeed(true);
        res.json({ message: 'Database wiped and fresh restaurant & menu initialized! SuperAdmin preserved.' });
    }
    catch (err) {
        console.error('Database reset error:', err);
        res.status(500).json({ error: 'Failed to reset database' });
    }
});
// GET /api/superadmin/audit-logs - Fetch all system movements/logs
router.get('/audit-logs', async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(1000);
        res.json(logs);
    }
    catch (err) {
        console.error('Superadmin get audit logs error:', err);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});
export default router;
