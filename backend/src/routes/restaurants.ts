import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Restaurant } from '../models/Restaurant.js';
import { Table } from '../models/Table.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { MenuCategory, MenuItem } from '../models/Menu.js';
import { User } from '../models/User.js';
import { Inquiry } from '../models/Inquiry.js';
import { getWhatsAppJoinUrl } from '../services/whatsappService.js';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.js';
import { runSeed } from '../services/seedService.js';

const router = Router();

router.post('/inquiry', async (req, res) => {
  try {
    const { restaurantName, ownerName, phone, email, city, dailyFootfall, notes } = req.body;
    if (!restaurantName || !ownerName || !phone || !email) {
      return res.status(400).json({ error: 'Please provide restaurant name, owner name, phone, and email' });
    }
    const inquiry = await Inquiry.create({
      restaurantName,
      ownerName,
      phone,
      email,
      city: city || 'Not specified',
      dailyFootfall: dailyFootfall || '50-100 guests',
      notes: notes || '',
    });
    res.status(201).json({ success: true, message: 'Inquiry submitted successfully!', inquiry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(3).optional(),
  whatsappPhone: z.string().min(5).optional(),
  description: z.string().optional(),
  openingHours: z.string().optional(),
  cuisine: z.string().optional(),
  settings: z.object({
    avgTurnoverMinutes: z.number().optional(),
    maxQueueSize: z.number().optional(),
    preOrderEnabled: z.boolean().optional(),
  }).optional(),
});

const categorySchema = z.object({
  name: z.string().min(1),
  sortOrder: z.number().optional(),
});

const menuItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().default(''),
  price: z.number().min(0),
  isAvailable: z.boolean().optional().default(true),
  prepTimeMinutes: z.number().optional().default(15),
  gstRate: z.number().optional().default(5),
});

const updateMenuItemSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
  prepTimeMinutes: z.number().optional(),
  gstRate: z.number().optional(),
});

const createStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['staff', 'kitchen', 'owner']),
});

// --- PUBLIC ROUTES ---

// GET /api/restaurants/public/list - Get public list of restaurants with live metrics for home page
router.get('/public/list', async (req, res) => {
  try {
    const restaurants = await Restaurant.find().lean();
    const result = await Promise.all(
      restaurants.map(async (r) => {
        const [activeQueueCount, tableCount] = await Promise.all([
          QueueEntry.countDocuments({
            restaurantId: r._id,
            status: { $in: ['waiting', 'notified', 'on_my_way'] },
          }),
          Table.countDocuments({ restaurantId: r._id }),
        ]);

        return {
          id: r._id,
          name: r.name,
          slug: r.slug,
          address: r.address,
          whatsappPhone: r.whatsappPhone,
          description: r.description || '',
          openingHours: r.openingHours || '11:00 AM - 11:00 PM',
          cuisine: r.cuisine || 'Multi-Cuisine & Fine Dining',
          location: r.location,
          activeQueueCount,
          tableCount,
        };
      })
    );

    const totalQueues = await QueueEntry.countDocuments({ status: { $in: ['waiting', 'notified', 'on_my_way'] } });
    const totalSeated = await QueueEntry.countDocuments({ status: 'seated' });

    res.json({
      restaurants: result,
      stats: {
        totalRestaurants: result.length,
        totalQueues,
        totalSeated,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public restaurant list' });
  }
});

// GET /api/restaurants/:slug
router.get('/:slug', async (req, res) => {
  try {
    const requestedSlug = (req.params.slug || '').trim();
    const safeSlugRegex = requestedSlug.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    // Tier 1: Case-insensitive slug match
    let restaurant = await Restaurant.findOne({
      slug: { $regex: new RegExp(`^${safeSlugRegex}$`, 'i') },
    });

    // Tier 2: Match by restaurant name (e.g. 'spice-garden' -> 'Spice Garden')
    if (!restaurant) {
      const formattedName = requestedSlug.replace(/-/g, ' ');
      const safeNameRegex = formattedName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      restaurant = await Restaurant.findOne({
        name: { $regex: new RegExp(`^${safeNameRegex}$`, 'i') },
      });
    }

    // Tier 3: Auto-seed if database has 0 restaurants
    if (!restaurant) {
      const count = await Restaurant.countDocuments();
      if (count === 0) {
        console.log('[Auto-Seed] No restaurants found in DB. Triggering auto-seed...');
        await runSeed(true);
        restaurant = await Restaurant.findOne();
      }
    }

    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const categories = await MenuCategory.find({ restaurantId: restaurant._id }).sort({ sortOrder: 1 });
    const menuItems = await MenuItem.find({ restaurantId: restaurant._id, isAvailable: true });

    res.json({
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: restaurant.address,
        whatsappPhone: restaurant.whatsappPhone,
        description: restaurant.description || '',
        openingHours: restaurant.openingHours || '11:00 AM - 11:00 PM',
        cuisine: restaurant.cuisine || 'Multi-Cuisine & Dining',
        settings: restaurant.settings,
        whatsappJoinUrl: getWhatsAppJoinUrl(restaurant.slug, restaurant.whatsappPhone),
      },
      menu: categories.map((cat) => ({
        ...cat.toObject(),
        items: menuItems.filter((item) => item.categoryId.toString() === cat._id.toString()),
      })),
    });
  } catch (err) {
    console.error('Fetch restaurant error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// --- OWNER-PROTECTED ROUTES ---

// GET /api/restaurants/my-restaurant - Get owner's restaurant details
router.get('/my-restaurant', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'No restaurant assigned to user' });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    res.json({ restaurant });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restaurant details' });
  }
});

// --- OWNER-PROTECTED ROUTES ---

// PUT /api/restaurants/my-restaurant - Update profile & settings
router.put('/my-restaurant', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'No restaurant assigned to user' });

    const payload = updateProfileSchema.parse(req.body);
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    if (payload.name) restaurant.name = payload.name;
    if (payload.address) restaurant.address = payload.address;
    if (payload.whatsappPhone) restaurant.whatsappPhone = payload.whatsappPhone;
    if (payload.description !== undefined) restaurant.description = payload.description;
    if (payload.openingHours !== undefined) restaurant.openingHours = payload.openingHours;
    if (payload.cuisine !== undefined) restaurant.cuisine = payload.cuisine;
    if (payload.settings) {
      restaurant.settings = { ...restaurant.settings, ...payload.settings };
    }

    await restaurant.save();
    res.json({ message: 'Restaurant updated successfully', restaurant });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message });
    res.status(500).json({ error: 'Failed to update restaurant profile' });
  }
});

// GET /api/restaurants/my-restaurant/menu - Get full menu (including unavailable items)
router.get('/my-restaurant/menu', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'No restaurant assigned' });

    const categories = await MenuCategory.find({ restaurantId }).sort({ sortOrder: 1 });
    const items = await MenuItem.find({ restaurantId }).sort({ createdAt: -1 });

    res.json({ categories, items });
  } catch {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// POST /api/restaurants/my-restaurant/menu/categories - Add category
router.post('/my-restaurant/menu/categories', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'No restaurant assigned' });

    const { name, sortOrder } = categorySchema.parse(req.body);
    const category = await MenuCategory.create({
      restaurantId,
      name,
      sortOrder: sortOrder ?? 0,
    });

    res.status(201).json({ message: 'Category added', category });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message });
    res.status(500).json({ error: 'Failed to add category' });
  }
});

// PUT /api/restaurants/my-restaurant/menu/categories/:id - Update category
router.put('/my-restaurant/menu/categories/:id', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params;
    const { name, sortOrder } = categorySchema.partial().parse(req.body);

    const category = await MenuCategory.findOne({ _id: id, restaurantId });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    if (name) category.name = name;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    await category.save();

    res.json({ message: 'Category updated', category });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message });
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/restaurants/my-restaurant/menu/categories/:id - Delete category
router.delete('/my-restaurant/menu/categories/:id', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params;

    const category = await MenuCategory.findOneAndDelete({ _id: id, restaurantId });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    await MenuItem.deleteMany({ categoryId: id, restaurantId });

    res.json({ message: 'Category and related items deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// POST /api/restaurants/my-restaurant/menu/items - Add menu item
router.post('/my-restaurant/menu/items', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'No restaurant assigned' });

    const payload = menuItemSchema.parse(req.body);
    const item = await MenuItem.create({
      restaurantId,
      categoryId: payload.categoryId,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      isAvailable: payload.isAvailable,
      prepTimeMinutes: payload.prepTimeMinutes,
      gstRate: payload.gstRate,
    });

    res.status(201).json({ message: 'Menu item created', item });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message });
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PUT /api/restaurants/my-restaurant/menu/items/:id - Update menu item
router.put('/my-restaurant/menu/items/:id', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params;
    const payload = updateMenuItemSchema.parse(req.body);

    const item = await MenuItem.findOne({ _id: id, restaurantId });
    if (!item) return res.status(404).json({ error: 'Menu item not found' });

    if (payload.categoryId) item.categoryId = payload.categoryId as any;
    if (payload.name) item.name = payload.name;
    if (payload.description !== undefined) item.description = payload.description;
    if (payload.price !== undefined) item.price = payload.price;
    if (payload.isAvailable !== undefined) item.isAvailable = payload.isAvailable;
    if (payload.prepTimeMinutes !== undefined) item.prepTimeMinutes = payload.prepTimeMinutes;
    if (payload.gstRate !== undefined) item.gstRate = payload.gstRate;

    await item.save();
    res.json({ message: 'Menu item updated', item });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message });
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE /api/restaurants/my-restaurant/menu/items/:id - Delete menu item
router.delete('/my-restaurant/menu/items/:id', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params;

    const item = await MenuItem.findOneAndDelete({ _id: id, restaurantId });
    if (!item) return res.status(404).json({ error: 'Menu item not found' });

    res.json({ message: 'Menu item deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// GET /api/restaurants/my-restaurant/staff - Get staff accounts
router.get('/my-restaurant/staff', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'No restaurant assigned' });

    const staffUsers = await User.find({ restaurantId }).select('-password').sort({ createdAt: -1 });
    res.json({ staff: staffUsers });
  } catch {
    res.status(500).json({ error: 'Failed to fetch staff list' });
  }
});

// POST /api/restaurants/my-restaurant/staff - Add staff user
router.post('/my-restaurant/staff', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'No restaurant assigned' });

    const payload = createStaffSchema.parse(req.body);

    const existing = await User.findOne({ email: payload.email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'A user with this email already exists' });

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const user = await User.create({
      restaurantId,
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: hashedPassword,
      role: payload.role,
    });

    res.status(201).json({
      message: 'Staff account created',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message });
    res.status(500).json({ error: 'Failed to create staff account' });
  }
});

// DELETE /api/restaurants/my-restaurant/staff/:id - Remove staff user
router.delete('/my-restaurant/staff/:id', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params;

    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findOneAndDelete({ _id: id, restaurantId });
    if (!user) return res.status(404).json({ error: 'Staff account not found' });

    res.json({ message: `Staff member ${user.name} removed` });
  } catch {
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

export default router;
