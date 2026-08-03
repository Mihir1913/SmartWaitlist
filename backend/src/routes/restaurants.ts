import { Router } from 'express';
import { Restaurant } from '../models/Restaurant.js';
import { MenuCategory, MenuItem } from '../models/Menu.js';
import { getWhatsAppJoinUrl } from '../services/whatsappService.js';

const router = Router();

router.get('/:slug', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const categories = await MenuCategory.find({ restaurantId: restaurant._id }).sort({ sortOrder: 1 });
    const menuItems = await MenuItem.find({ restaurantId: restaurant._id, isAvailable: true });

    res.json({
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: restaurant.address,
        settings: restaurant.settings,
        whatsappJoinUrl: getWhatsAppJoinUrl(restaurant.slug, restaurant.whatsappPhone),
      },
      menu: categories.map((cat) => ({
        ...cat.toObject(),
        items: menuItems.filter((item) => item.categoryId.toString() === cat._id.toString()),
      })),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

export default router;
