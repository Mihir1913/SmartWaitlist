import mongoose from 'mongoose';
import { Router } from 'express';
import { z } from 'zod';
import { joinQueue, getQueue, cancelQueueEntry } from '../services/queueService.js';
import { createPreOrder, markOnMyWayForOrder } from '../services/orderService.js';
import { Restaurant } from '../models/Restaurant.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { Order } from '../models/Order.js';
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
        try {
            await notifyQueueJoined(data.phone, data.name, entry.position, entry.estimatedWaitMinutes, req.params.restaurantId);
        }
        catch (wsErr) {
            console.warn('[QueueJoin] WhatsApp notification warning:', wsErr);
        }
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
        try {
            await notifyQueueJoined(data.phone, data.name, entry.position, entry.estimatedWaitMinutes, restaurant._id.toString());
        }
        catch (wsErr) {
            console.warn('[QueueJoinSlug] WhatsApp notification warning:', wsErr);
        }
        res.status(201).json({ entry, restaurant: { name: restaurant.name, slug: restaurant.slug } });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to join queue';
        res.status(400).json({ error: message });
    }
});
router.get('/entry/:entryId', async (req, res) => {
    try {
        const rawParam = req.params.entryId.trim();
        const searchParam = rawParam.replace(/^#/, '');
        let entry = null;
        // 1. Direct ObjectId match
        if (mongoose.Types.ObjectId.isValid(searchParam)) {
            entry = await QueueEntry.findById(searchParam)
                .populate('assignedTableId', 'number status')
                .populate({
                path: 'preOrderId',
                populate: { path: 'queueEntryId', select: 'customer partySize position' },
            });
        }
        // 2. Lookup by Phone Number
        if (!entry) {
            const cleanedPhone = searchParam.replace(/\D/g, '');
            if (cleanedPhone.length >= 10) {
                entry = await QueueEntry.findOne({
                    'customer.phone': { $regex: cleanedPhone + '$' },
                    status: { $in: ['waiting', 'notified', 'on_my_way', 'seated'] },
                })
                    .sort({ createdAt: -1 })
                    .populate('assignedTableId', 'number status')
                    .populate({
                    path: 'preOrderId',
                    populate: { path: 'queueEntryId', select: 'customer partySize position' },
                });
            }
        }
        // 3. Short Tracking Code lookup (matching last 6 hex chars of ObjectId)
        if (!entry && searchParam.length >= 4) {
            const allActive = await QueueEntry.find()
                .sort({ createdAt: -1 })
                .limit(100)
                .populate('assignedTableId', 'number status')
                .populate({
                path: 'preOrderId',
                populate: { path: 'queueEntryId', select: 'customer partySize position' },
            });
            entry =
                allActive.find((e) => e._id.toString().toLowerCase().endsWith(searchParam.toLowerCase())) || null;
        }
        if (!entry)
            return res.status(404).json({ error: 'Queue entry not found' });
        const restaurant = await Restaurant.findById(entry.restaurantId).select('name slug');
        const order = entry.preOrderId
            ? await Order.findOne({ queueEntryId: entry._id })
            : await Order.findOne({ queueEntryId: entry._id });
        res.json({ entry, restaurant, order });
    }
    catch (err) {
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
