import { WhatsAppSettings } from '../models/WhatsAppSettings.js';
import { WhatsAppLog } from '../models/WhatsAppLog.js';
import { WhatsAppService } from '../services/whatsappCloudService.js';
export class WhatsAppController {
    /**
     * GET /api/whatsapp/settings/:restaurantId
     */
    static async getSettings(req, res) {
        try {
            const { restaurantId } = req.params;
            let settings = await WhatsAppSettings.findOne({ restaurantId });
            if (!settings) {
                settings = await WhatsAppSettings.create({ restaurantId });
            }
            res.json({ settings });
        }
        catch {
            res.status(500).json({ error: 'Failed to fetch WhatsApp settings' });
        }
    }
    /**
     * PUT /api/whatsapp/settings/:restaurantId
     */
    static async updateSettings(req, res) {
        try {
            const { restaurantId } = req.params;
            const { phoneNumberId, accessToken, businessAccountId, verifyToken, templates, isActive } = req.body;
            const settings = await WhatsAppSettings.findOneAndUpdate({ restaurantId }, {
                phoneNumberId,
                accessToken,
                businessAccountId,
                verifyToken,
                templates,
                isActive: isActive ?? true,
            }, { new: true, upsert: true });
            res.json({ settings, message: 'WhatsApp settings updated successfully!' });
        }
        catch {
            res.status(400).json({ error: 'Failed to update WhatsApp settings' });
        }
    }
    /**
     * POST /api/whatsapp/test-send
     */
    static async sendTestMessage(req, res) {
        try {
            const { to, message, restaurantId } = req.body;
            if (!to)
                return res.status(400).json({ error: 'Recipient phone number (to) is required' });
            const result = await WhatsAppService.sendTextMessage(to, message || 'Test notification from Smart Waitlist!', restaurantId);
            res.json({ success: true, result });
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Test send failed';
            res.status(400).json({ error: errorMsg });
        }
    }
    /**
     * GET /api/whatsapp/logs/:restaurantId
     */
    static async getLogs(req, res) {
        try {
            const { restaurantId } = req.params;
            const logs = await WhatsAppLog.find({ restaurantId }).sort({ createdAt: -1 }).limit(100);
            res.json({ logs });
        }
        catch {
            res.status(500).json({ error: 'Failed to fetch WhatsApp message logs' });
        }
    }
}
