import { Router } from 'express';
import { z } from 'zod';
import { joinQueue, getQueue, cancelQueueEntry } from '../services/queueService.js';
import { createPreOrder, markOnMyWayForOrder } from '../services/orderService.js';
import { Restaurant } from '../models/Restaurant.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { notifyQueueJoined } from '../services/whatsappService.js';
import { authMiddleware } from '../middleware/auth.js';
import { getRestaurantSyncState } from '../services/syncService.js';
const router = Router();
const joinSchema = z.object({
    name: z.string().min(1),
    phone: z.string().min(10),
    partySize: z.number().min(1).max(20),
});
router.post('/:restaurantId/join', async (req, res) => {
    try {
        const data = joinSchema.parse(req.body);
        const entry = await joinQueue(req.params.restaurantId, data);
        await notifyQueueJoined(data.phone, data.name, entry.position, entry.estimatedWaitMinutes);
        res.status(201).json({ entry });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to join queue';
        res.status(400).json({ error: message });
    }
});
router.post('/join-by-slug/:slug', async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ slug: req.params.slug });
        if (!restaurant)
            return res.status(404).json({ error: 'Restaurant not found' });
        const data = joinSchema.parse(req.body);
        const entry = await joinQueue(restaurant._id.toString(), data);
        await notifyQueueJoined(data.phone, data.name, entry.position, entry.estimatedWaitMinutes);
        res.status(201).json({ entry, restaurant: { name: restaurant.name, slug: restaurant.slug } });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to join queue';
        res.status(400).json({ error: message });
    }
});
router.get('/entry/:entryId', async (req, res) => {
    try {
        const entry = await QueueEntry.findById(req.params.entryId)
            .populate('assignedTableId', 'number status')
            .populate({
            path: 'preOrderId',
            populate: { path: 'queueEntryId', select: 'customer partySize position' },
        });
        if (!entry)
            return res.status(404).json({ error: 'Queue entry not found' });
        res.json({ entry });
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch entry' });
    }
});
router.get('/:restaurantId', authMiddleware, async (req, res) => {
    try {
        const queue = await getQueue(req.params.restaurantId);
        res.json({ queue });
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch queue' });
    }
});
router.patch('/:entryId/on-my-way', async (req, res) => {
    try {
        const entry = await markOnMyWayForOrder(req.params.entryId);
        res.json({ entry });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update';
        res.status(400).json({ error: message });
    }
});
router.patch('/:entryId/cancel', async (req, res) => {
    try {
        const entry = await cancelQueueEntry(req.params.entryId);
        res.json({ entry });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to cancel';
        res.status(400).json({ error: message });
    }
});
router.get('/sync/:restaurantId', authMiddleware, async (req, res) => {
    try {
        const state = await getRestaurantSyncState(req.params.restaurantId);
        res.json({ state });
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch sync state' });
    }
});
const preOrderSchema = z.object({
    items: z.array(z.object({
        menuItemId: z.string(),
        qty: z.number().min(1),
        notes: z.string().optional(),
    })),
});
router.post('/:entryId/pre-order', async (req, res) => {
    try {
        const { items } = preOrderSchema.parse(req.body);
        const order = await createPreOrder(req.params.entryId, items);
        res.status(201).json({ order });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create pre-order';
        res.status(400).json({ error: message });
    }
});
export default router;
