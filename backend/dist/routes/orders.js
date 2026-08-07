import { Router } from 'express';
import { getKitchenOrders, startCooking, markOrderReady, updateOrderStatus, evaluateDualTrigger, addItemsToOrder, } from '../services/orderService.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
router.get('/:restaurantId/kitchen', authMiddleware, async (req, res) => {
    try {
        const orders = await getKitchenOrders(req.params.restaurantId);
        res.json({ orders });
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch kitchen orders' });
    }
});
router.post('/:orderId/add-items', authMiddleware, async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Please provide items array' });
        }
        const order = await addItemsToOrder(req.params.orderId, items);
        res.json({ order, message: 'Items added to order successfully' });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add items to order';
        res.status(400).json({ error: message });
    }
});
router.patch('/:orderId/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['confirmed', 'cooking', 'ready', 'completed', 'served'].includes(status)) {
            return res.status(400).json({ error: 'Invalid order status' });
        }
        const order = await updateOrderStatus(req.params.orderId, status);
        res.json({ order });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update order status';
        res.status(400).json({ error: message });
    }
});
router.patch('/:orderId/start-cooking', authMiddleware, async (req, res) => {
    try {
        const order = await startCooking(req.params.orderId);
        res.json({ order });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start cooking';
        res.status(400).json({ error: message });
    }
});
router.patch('/:orderId/mark-ready', authMiddleware, async (req, res) => {
    try {
        const order = await markOrderReady(req.params.orderId);
        res.json({ order });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mark ready';
        res.status(400).json({ error: message });
    }
});
router.post('/:orderId/evaluate-trigger', authMiddleware, async (req, res) => {
    try {
        const order = await evaluateDualTrigger(req.params.orderId);
        res.json({ order });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to evaluate trigger';
        res.status(400).json({ error: message });
    }
});
export default router;
