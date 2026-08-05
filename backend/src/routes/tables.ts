import { Router } from 'express';
import { z } from 'zod';
import { getTables, updateTableStatus } from '../services/tableService.js';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.js';
import { Table } from '../models/Table.js';

const router = Router();

// GET /api/tables/:restaurantId
router.get('/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const tables = await getTables(req.params.restaurantId as string);
    res.json({ tables });
  } catch {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// POST /api/tables - Create a new table for the restaurant owner
const createTableSchema = z.object({
  number: z.string().min(1),
  capacity: z.number().min(1).max(50),
});

router.post('/', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'No restaurant assigned' });

    const { number, capacity } = createTableSchema.parse(req.body);

    const existing = await Table.findOne({ restaurantId, number: number.trim() });
    if (existing) {
      return res.status(400).json({ error: `Table "${number}" already exists` });
    }

    const table = await Table.create({
      restaurantId,
      number: number.trim(),
      capacity,
      status: 'available',
    });

    res.status(201).json({ message: 'Table created', table });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message });
    res.status(500).json({ error: 'Failed to create table' });
  }
});

// DELETE /api/tables/:tableId - Delete a table
router.delete('/:tableId', authMiddleware, requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { tableId } = req.params;

    const table = await Table.findOneAndDelete({ _id: tableId, restaurantId });
    if (!table) return res.status(404).json({ error: 'Table not found' });

    res.json({ message: `Table ${table.number} deleted successfully` });
  } catch {
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

// PATCH /api/tables/:tableId/status - Update table status
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
