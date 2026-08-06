import axios from 'axios';
import { config } from '../config/index.js';
import { WhatsAppSettings } from '../models/WhatsAppSettings.js';
import { WhatsAppLog } from '../models/WhatsAppLog.js';
export class WhatsAppService {
    /**
     * Resolve WhatsApp credentials for a given restaurant or fallback to global config
     */
    static async getCredentials(restaurantId) {
        if (restaurantId) {
            const dbSettings = await WhatsAppSettings.findOne({ restaurantId, isActive: true }).lean();
            if (dbSettings && dbSettings.phoneNumberId && dbSettings.accessToken) {
                return {
                    phoneNumberId: dbSettings.phoneNumberId,
                    accessToken: dbSettings.accessToken,
                    businessAccountId: dbSettings.businessAccountId || config.whatsappBusinessAccountId,
                    verifyToken: dbSettings.verifyToken || config.whatsappVerifyToken,
                    templates: {
                        waitlistJoin: dbSettings.templates?.waitlistJoin || 'waitlist_join_confirmation',
                        tableReady: dbSettings.templates?.tableReady || 'table_ready_notification',
                        reservationConfirm: dbSettings.templates?.reservationConfirm || 'reservation_confirmation',
                        reservationReminder: dbSettings.templates?.reservationReminder || 'reservation_reminder',
                        bookingCancel: dbSettings.templates?.bookingCancel || 'booking_cancellation',
                        restaurantWelcome: dbSettings.templates?.restaurantWelcome || 'restaurant_welcome',
                    },
                };
            }
        }
        return {
            phoneNumberId: config.whatsappPhoneNumberId,
            accessToken: config.whatsappAccessToken,
            businessAccountId: config.whatsappBusinessAccountId,
            verifyToken: config.whatsappVerifyToken,
            templates: {
                waitlistJoin: 'waitlist_join_confirmation',
                tableReady: 'table_ready_notification',
                reservationConfirm: 'reservation_confirmation',
                reservationReminder: 'reservation_reminder',
                bookingCancel: 'booking_cancellation',
                restaurantWelcome: 'restaurant_welcome',
            },
        };
    }
    /**
     * Format phone number to E.164 international format without +
     */
    static formatPhoneNumber(phone) {
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            cleaned = '91' + cleaned; // Default to India country code if 10 digits
        }
        return cleaned;
    }
    /**
     * Core method to post message payload to Meta WhatsApp Cloud API with retries
     */
    static async postToMetaCloudApi(credentials, payload, retries = 3) {
        const url = `https://graph.facebook.com/${config.whatsappApiVersion}/${credentials.phoneNumberId}/messages`;
        let lastError = null;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await axios.post(url, payload, {
                    headers: {
                        Authorization: `Bearer ${credentials.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                });
                const data = response.data;
                const messageId = data?.messages?.[0]?.id;
                return { messageId, responseData: data };
            }
            catch (err) {
                lastError = err instanceof Error ? err : new Error('Meta API request failed');
                console.warn(`[WhatsAppCloudService] Attempt ${attempt}/${retries} failed:`, lastError.message);
                if (attempt < retries) {
                    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
                }
            }
        }
        throw lastError || new Error('Failed to send message via Meta Cloud API after retries');
    }
    /**
     * Send Meta WhatsApp Template Message
     */
    static async sendTemplateMessage(to, templateName, languageCode = 'en_US', parameters = [], restaurantId) {
        const formattedTo = this.formatPhoneNumber(to);
        const credentials = await this.getCredentials(restaurantId);
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedTo,
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode },
                components: parameters.length > 0 ? [{ type: 'body', parameters }] : [],
            },
        };
        const logEntry = await WhatsAppLog.create({
            restaurantId,
            to: formattedTo,
            type: 'template',
            templateName,
            status: 'queued',
            payload,
        });
        if (!credentials.phoneNumberId || !credentials.accessToken) {
            console.log(`[WhatsAppCloudService MockLog] To: ${formattedTo} | Template: ${templateName}`);
            logEntry.status = 'sent';
            logEntry.metaMessageId = `mock_meta_${Date.now()}`;
            await logEntry.save();
            return { success: true, messageId: logEntry.metaMessageId, mocked: true };
        }
        try {
            const { messageId, responseData } = await this.postToMetaCloudApi(credentials, payload);
            logEntry.status = 'sent';
            logEntry.metaMessageId = messageId;
            logEntry.response = responseData;
            await logEntry.save();
            return { success: true, messageId };
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Send template failed';
            logEntry.status = 'failed';
            logEntry.error = errorMsg;
            await logEntry.save();
            throw err;
        }
    }
    /**
     * Send Standard WhatsApp Free-Form Text Message (Within 24hr Customer Window)
     */
    static async sendTextMessage(to, textBody, restaurantId) {
        const formattedTo = this.formatPhoneNumber(to);
        const credentials = await this.getCredentials(restaurantId);
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedTo,
            type: 'text',
            text: { body: textBody },
        };
        const logEntry = await WhatsAppLog.create({
            restaurantId,
            to: formattedTo,
            type: 'text',
            status: 'queued',
            payload,
        });
        if (!credentials.phoneNumberId || !credentials.accessToken) {
            console.log(`[WhatsAppCloudService TextMock] To: ${formattedTo} | Body: ${textBody}`);
            logEntry.status = 'sent';
            logEntry.metaMessageId = `mock_meta_${Date.now()}`;
            await logEntry.save();
            return { success: true, messageId: logEntry.metaMessageId, mocked: true };
        }
        try {
            const { messageId, responseData } = await this.postToMetaCloudApi(credentials, payload);
            logEntry.status = 'sent';
            logEntry.metaMessageId = messageId;
            logEntry.response = responseData;
            await logEntry.save();
            return { success: true, messageId };
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Send text failed';
            logEntry.status = 'failed';
            logEntry.error = errorMsg;
            await logEntry.save();
            throw err;
        }
    }
    /* ═══════════════════════════════════════════════════════════════════════
       Workflow Trigger Wrappers
       ═══════════════════════════════════════════════════════════════════════ */
    /**
     * 1. Send Waitlist Join Confirmation
     */
    static async sendWaitlistJoinConfirmation(phone, customerName, position, estWait, restaurantId) {
        const credentials = await this.getCredentials(restaurantId);
        const params = [
            { type: 'text', text: customerName },
            { type: 'text', text: String(position) },
            { type: 'text', text: String(estWait) },
        ];
        try {
            return await this.sendTemplateMessage(phone, credentials.templates.waitlistJoin, 'en_US', params, restaurantId);
        }
        catch {
            // Fallback text message if template is not registered in Meta dashboard yet
            const fallbackText = `Hello ${customerName}! 👋 You are added to the waitlist. Position: #${position} | Estimated wait: ~${estWait} mins.`;
            return await this.sendTextMessage(phone, fallbackText, restaurantId);
        }
    }
    /**
     * 2. Send Table Ready Notification
     */
    static async sendTableReadyNotification(phone, customerName, tableNumber, restaurantId) {
        const credentials = await this.getCredentials(restaurantId);
        const params = [
            { type: 'text', text: customerName },
            { type: 'text', text: tableNumber },
        ];
        try {
            return await this.sendTemplateMessage(phone, credentials.templates.tableReady, 'en_US', params, restaurantId);
        }
        catch {
            const fallbackText = `🎉 Great news ${customerName}! Your table ${tableNumber} is ready! Please proceed to the host stand.`;
            return await this.sendTextMessage(phone, fallbackText, restaurantId);
        }
    }
    /**
     * 3. Send Reservation Confirmation
     */
    static async sendReservationConfirmation(phone, customerName, partySize, dateStr, timeStr, restaurantId) {
        const credentials = await this.getCredentials(restaurantId);
        const params = [
            { type: 'text', text: customerName },
            { type: 'text', text: String(partySize) },
            { type: 'text', text: dateStr },
            { type: 'text', text: timeStr },
        ];
        try {
            return await this.sendTemplateMessage(phone, credentials.templates.reservationConfirm, 'en_US', params, restaurantId);
        }
        catch {
            const fallbackText = `✅ Reservation Confirmed for ${customerName}! Party of ${partySize} on ${dateStr} at ${timeStr}.`;
            return await this.sendTextMessage(phone, fallbackText, restaurantId);
        }
    }
    /**
     * 4. Send Reservation Reminder
     */
    static async sendReservationReminder(phone, customerName, timeStr, restaurantId) {
        const credentials = await this.getCredentials(restaurantId);
        const params = [
            { type: 'text', text: customerName },
            { type: 'text', text: timeStr },
        ];
        try {
            return await this.sendTemplateMessage(phone, credentials.templates.reservationReminder, 'en_US', params, restaurantId);
        }
        catch {
            const fallbackText = `🔔 Reminder: Hi ${customerName}, your dining reservation is scheduled for today at ${timeStr}. See you soon!`;
            return await this.sendTextMessage(phone, fallbackText, restaurantId);
        }
    }
    /**
     * 5. Send Booking Cancellation Message
     */
    static async sendBookingCancellation(phone, customerName, reason, restaurantId) {
        const credentials = await this.getCredentials(restaurantId);
        const params = [
            { type: 'text', text: customerName },
            { type: 'text', text: reason || 'Requested by guest' },
        ];
        try {
            return await this.sendTemplateMessage(phone, credentials.templates.bookingCancel, 'en_US', params, restaurantId);
        }
        catch {
            const fallbackText = `Notice: Hi ${customerName}, your queue/reservation has been cancelled (${reason || 'as requested'}).`;
            return await this.sendTextMessage(phone, fallbackText, restaurantId);
        }
    }
    /**
     * 6. Send Restaurant Welcome Message
     */
    static async sendRestaurantWelcome(phone, customerName, restaurantName, restaurantId) {
        const credentials = await this.getCredentials(restaurantId);
        const params = [
            { type: 'text', text: customerName },
            { type: 'text', text: restaurantName },
        ];
        try {
            return await this.sendTemplateMessage(phone, credentials.templates.restaurantWelcome, 'en_US', params, restaurantId);
        }
        catch {
            const fallbackText = `Welcome to ${restaurantName}, ${customerName}! Thank you for dining with us.`;
            return await this.sendTextMessage(phone, fallbackText, restaurantId);
        }
    }
    /**
     * Update message status from incoming Meta Webhook (sent, delivered, read, failed)
     */
    static async updateMessageStatus(metaMessageId, status, errorReason) {
        const log = await WhatsAppLog.findOne({ metaMessageId });
        if (log) {
            log.status = status;
            if (errorReason)
                log.error = errorReason;
            await log.save();
            console.log(`[WhatsAppCloudService WebhookStatus] Message ${metaMessageId} status updated to: ${status}`);
        }
        return log;
    }
}
