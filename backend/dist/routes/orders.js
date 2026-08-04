import { Router } from 'express';
import { getKitchenOrders, startCooking, markOrderReady, evaluateDualTrigger, } from '../services/orderService.js';
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
