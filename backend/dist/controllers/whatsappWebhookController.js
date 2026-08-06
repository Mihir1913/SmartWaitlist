import { config } from '../config/index.js';
import { WhatsAppService } from '../services/whatsappCloudService.js';
import { WhatsAppLog } from '../models/WhatsAppLog.js';
import { Restaurant } from '../models/Restaurant.js';
import { joinQueue } from '../services/queueService.js';
import { WhatsAppSettings } from '../models/WhatsAppSettings.js';
export class WhatsAppWebhookController {
    /**
     * Meta Webhook Verification (GET /api/whatsapp/webhook)
     * Responds to Meta verification challenge using hub.verify_token
     */
    static async verifyWebhook(req, res) {
        try {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];
            if (!mode || !token) {
                return res.status(400).send('Missing hub.mode or hub.verify_token');
            }
            // Check against global verify token or database tokens
            let isVerified = token === config.whatsappVerifyToken;
            if (!isVerified) {
                const matchingSetting = await WhatsAppSettings.findOne({ verifyToken: token });
                if (matchingSetting)
                    isVerified = true;
            }
            if (mode === 'subscribe' && isVerified) {
                console.log('[WhatsAppWebhookController] Webhook verified successfully!');
                return res.status(200).send(challenge);
            }
            console.warn('[WhatsAppWebhookController] Webhook verification failed! Invalid verify_token:', token);
            return res.status(403).send('Forbidden: Invalid verify token');
        }
        catch (err) {
            console.error('[WhatsAppWebhookController] Verify error:', err);
            return res.status(500).send('Internal Server Error');
        }
    }
    /**
     * Meta Webhook Event Handler (POST /api/whatsapp/webhook)
     * Receives incoming messages and status updates (sent, delivered, read, failed)
     */
    static async handleWebhookEvent(req, res) {
        try {
            const body = req.body;
            // Ensure event is from WhatsApp API
            if (!body.object || body.object !== 'whatsapp_business_account') {
                return res.status(404).send('Not a WhatsApp Business Account event');
            }
            const entries = body.entry || [];
            for (const entry of entries) {
                const changes = entry.changes || [];
                for (const change of changes) {
                    const value = change.value;
                    if (!value)
                        continue;
                    // 1. Process Status Updates (sent, delivered, read, failed)
                    if (value.statuses && Array.isArray(value.statuses)) {
                        for (const statusObj of value.statuses) {
                            const messageId = statusObj.id;
                            const status = statusObj.status; // 'sent' | 'delivered' | 'read' | 'failed'
                            const errorMsg = statusObj.errors?.[0]?.title || statusObj.errors?.[0]?.message;
                            await WhatsAppService.updateMessageStatus(messageId, status, errorMsg);
                        }
                    }
                    // 2. Process Incoming Customer Messages / Replies
                    if (value.messages && Array.isArray(value.messages)) {
                        for (const msg of value.messages) {
                            const fromPhone = msg.from;
                            const messageType = msg.type;
                            let textBody = '';
                            if (messageType === 'text') {
                                textBody = msg.text?.body || '';
                            }
                            else if (messageType === 'button') {
                                textBody = msg.button?.text || '';
                            }
                            else if (messageType === 'interactive') {
                                textBody = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
                            }
                            textBody = textBody.trim();
                            console.log(`[WhatsAppWebhookController Incoming] From: ${fromPhone} | Body: "${textBody}"`);
                            await WhatsAppLog.create({
                                to: fromPhone,
                                type: 'incoming',
                                status: 'delivered',
                                metaMessageId: msg.id,
                                payload: msg,
                            });
                            // Process Serva Bot Triggers: JOIN-{slug} or "on my way"
                            const joinMatch = textBody.match(/^JOIN-([a-z0-9-]+)$/i);
                            if (joinMatch) {
                                const slug = joinMatch[1].toLowerCase();
                                const restaurant = await Restaurant.findOne({ slug });
                                if (restaurant) {
                                    const customerName = msg.profile?.name || 'Guest';
                                    const qEntry = await joinQueue(restaurant._id.toString(), {
                                        name: customerName,
                                        phone: fromPhone,
                                        partySize: 2,
                                    });
                                    await WhatsAppService.sendWaitlistJoinConfirmation(fromPhone, customerName, qEntry.position, qEntry.estimatedWaitMinutes, restaurant._id.toString());
                                }
                            }
                            else if (textBody.toLowerCase() === 'on my way') {
                                // Find guest's active notified entry
                                const activeEntry = await WhatsAppLog.findOne({ to: fromPhone, status: 'delivered' });
                                if (activeEntry?.restaurantId) {
                                    await WhatsAppService.sendTextMessage(fromPhone, `Thanks! We have marked you as 'On My Way'. Your table will be ready shortly!`, activeEntry.restaurantId.toString());
                                }
                            }
                        }
                    }
                }
            }
            // Meta requires immediate 200 OK HTTP response
            return res.status(200).send('EVENT_RECEIVED');
        }
        catch (err) {
            console.error('[WhatsAppWebhookController] Event error:', err);
            return res.status(500).send('Webhook processing error');
        }
    }
}
