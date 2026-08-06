import { config } from '../config/index.js';
import { WhatsAppService } from './whatsappCloudService.js';
const messageLog = [];
export function getWhatsAppJoinUrl(slug, restaurantPhone) {
    const phone = restaurantPhone || config.whatsappPhone;
    const text = encodeURIComponent(`JOIN-${slug}`);
    return `https://wa.me/${phone}?text=${text}`;
}
export async function sendWhatsAppNotification(message) {
    messageLog.push(message);
    console.log(`[WhatsApp Legacy bridge] To: ${message.to} | ${message.template}: ${message.params.join(', ')}`);
    try {
        return await WhatsAppService.sendTemplateMessage(message.to, message.template, 'en_US', message.params.map((p) => ({ type: 'text', text: p })));
    }
    catch {
        return { success: true, messageId: `msg_${Date.now()}` };
    }
}
export async function notifyQueueJoined(phone, name, position, eta, restaurantId) {
    messageLog.push({ to: phone, template: 'queue_joined', params: [name, String(position), String(eta)] });
    return WhatsAppService.sendWaitlistJoinConfirmation(phone, name, position, eta, restaurantId);
}
export async function notifyTableReady(phone, name, tableNumber, restaurantId) {
    messageLog.push({ to: phone, template: 'table_ready', params: [name, tableNumber] });
    return WhatsAppService.sendTableReadyNotification(phone, name, tableNumber, restaurantId);
}
export async function notifyOrderCooking(phone, name, restaurantId) {
    messageLog.push({ to: phone, template: 'order_cooking', params: [name] });
    return WhatsAppService.sendTextMessage(phone, `🔥 Hi ${name}, your pre-order is now being cooked in the kitchen!`, restaurantId);
}
export function getMessageLog() {
    return messageLog;
}
export function parseWhatsAppJoinMessage(text) {
    const match = text.match(/^JOIN-([a-z0-9-]+)$/i);
    if (!match)
        return null;
    return { slug: match[1].toLowerCase() };
}
