import { Router } from 'express';
import { WhatsAppWebhookController } from '../controllers/whatsappWebhookController.js';
import { WhatsAppController } from '../controllers/whatsappController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// --- META CLOUD API WEBHOOK ENDPOINTS ---
// GET /api/whatsapp/webhook or /api/webhooks/whatsapp (verification)
router.get('/webhook', WhatsAppWebhookController.verifyWebhook);

// POST /api/whatsapp/webhook or /api/webhooks/whatsapp (event notifications)
router.post('/webhook', WhatsAppWebhookController.handleWebhookEvent);

// --- RESTAURANT CONFIGURATION ENDPOINTS ---
router.get('/settings/:restaurantId', authMiddleware, WhatsAppController.getSettings);
router.put('/settings/:restaurantId', authMiddleware, WhatsAppController.updateSettings);
router.post('/test-send', authMiddleware, WhatsAppController.sendTestMessage);
router.get('/logs/:restaurantId', authMiddleware, WhatsAppController.getLogs);

export default router;