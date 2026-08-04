import { config } from '../config/index.js';
const messageLog = [];
export function getWhatsAppJoinUrl(slug, restaurantPhone) {
    const phone = restaurantPhone || config.whatsappPhone;
    const text = encodeURIComponent(`JOIN-${slug}`);
    return `https://wa.me/${phone}?text=${text}`;
}
export async function sendWhatsAppNotification(message) {
    messageLog.push(message);
    console.log(`[WhatsApp] To: ${message.to} | ${message.template}: ${message.params.join(', ')}`);
    return { success: true, messageId: `msg_${Date.now()}` };
}
export async function notifyQueueJoined(phone, name, position, eta) {
    return sendWhatsAppNotification({
        to: phone,
        template: 'queue_joined',
        params: [name, String(position), String(eta)],
    });
}
export async function notifyTableReady(phone, name, tableNumber) {
    return sendWhatsAppNotification({
        to: phone,
        template: 'table_ready',
        params: [name, tableNumber],
    });
}
export async function notifyOrderCooking(phone, name) {
    return sendWhatsAppNotification({
        to: phone,
        template: 'order_cooking',
        params: [name],
    });
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
