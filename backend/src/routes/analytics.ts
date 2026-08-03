import { Router } from 'express';
import { getDashboardStats } from '../services/analyticsService.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/:restaurantId', authMiddleware, requireRole('owner', 'staff'), async (req, res) => {
  try {
    const stats = await getDashboardStats(req.params.restaurantId as string);
    res.json({ stats });
  } catch {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
