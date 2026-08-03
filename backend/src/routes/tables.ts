import { Router } from 'express';
import { z } from 'zod';
import { getTables, updateTableStatus } from '../services/tableService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const tables = await getTables(req.params.restaurantId as string);
    res.json({ tables });
  } catch {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

const statusSchema = z.object({
  status: z.enum(['occupied', 'cleaning', 'ready']),
});

router.patch('/:tableId/status', authMiddleware, async (req, res) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const table = await updateTableStatus(req.params.tableId as string, status);
    res.json({ table });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update table';
    res.status(400).json({ error: message });
  }
});

export default router;
