import { Router } from 'express';
import { z } from 'zod';
import { PaymentService } from '../services/paymentService.js';
const router = Router();
const createPaymentSchema = z.object({
    type: z.enum(['preorder', 'deposit']),
    orderId: z.string().optional(),
    queueEntryId: z.string().optional(),
    amount: z.number().positive(),
    paymentMethod: z.enum(['razorpay', 'stripe', 'upi', 'cash']).optional(),
});
router.post('/create-order', async (req, res) => {
    try {
        const data = createPaymentSchema.parse(req.body);
        const session = await PaymentService.createPaymentSession(data);
        res.json({ session });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create payment session';
        res.status(400).json({ error: msg });
    }
});
const verifySchema = z.object({
    type: z.enum(['preorder', 'deposit']),
    orderId: z.string().optional(),
    queueEntryId: z.string().optional(),
    paymentId: z.string(),
    paymentMethod: z.enum(['razorpay', 'stripe', 'upi', 'cash']).optional(),
});
router.post('/verify', async (req, res) => {
    try {
        const data = verifySchema.parse(req.body);
        const result = await PaymentService.confirmPayment(data);
        res.json({ result });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Payment verification failed';
        res.status(400).json({ error: msg });
    }
});
router.post('/mock-pay', async (req, res) => {
    try {
        const { type, orderId, queueEntryId, amount, paymentMethod } = req.body;
        const paymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const result = await PaymentService.confirmPayment({
            type: type || 'preorder',
            orderId,
            queueEntryId,
            paymentId,
            paymentMethod: paymentMethod || 'upi',
        });
        res.json({ success: true, paymentId, result });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Mock payment failed';
        res.status(400).json({ error: msg });
    }
});
export default router;
