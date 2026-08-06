import { Router } from 'express';
import { WhatsAppWebhookController } from '../controllers/whatsappWebhookController.js';
import { WhatsAppController } from '../controllers/whatsappController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// --- META CLOUD API WEBHOOK ENDPOINTS ---
// Handles GET verification on /, /webhook, /api/whatsapp, /api/whatsapp/webhook, /api/webhooks/whatsapp
router.get('/', WhatsAppWebhookController.verifyWebhook);
router.get('/webhook', WhatsAppWebhookController.verifyWebhook);

// Handles POST events on /, /webhook, /api/whatsapp, /api/whatsapp/webhook, /api/webhooks/whatsapp
router.post('/', WhatsAppWebhookController.handleWebhookEvent);
router.post('/webhook', WhatsAppWebhookController.handleWebhookEvent);

// --- RESTAURANT CONFIGURATION ENDPOINTS ---
router.get('/settings/:restaurantId', authMiddleware, WhatsAppController.getSettings);
router.put('/settings/:restaurantId', authMiddleware, WhatsAppController.updateSettings);
router.post('/test-send', authMiddleware, WhatsAppController.sendTestMessage);
router.get('/logs/:restaurantId', authMiddleware, WhatsAppController.getLogs);

export default router;