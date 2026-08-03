import { config } from '../config/index.js';

export interface WhatsAppMessage {
  to: string;
  template: string;
  params: string[];
}

const messageLog: WhatsAppMessage[] = [];

export function getWhatsAppJoinUrl(slug: string, restaurantPhone?: string) {
  const phone = restaurantPhone || config.whatsappPhone;
  const text = encodeURIComponent(`JOIN-${slug}`);
  return `https://wa.me/${phone}?text=${text}`;
}

export async function sendWhatsAppNotification(message: WhatsAppMessage) {
  messageLog.push(message);
  console.log(`[WhatsApp] To: ${message.to} | ${message.template}: ${message.params.join(', ')}`);
  return { success: true, messageId: `msg_${Date.now()}` };
}

export async function notifyQueueJoined(phone: string, name: string, position: number, eta: number) {
  return sendWhatsAppNotification({
    to: phone,
    template: 'queue_joined',
    params: [name, String(position), String(eta)],
  });
}

export async function notifyTableReady(phone: string, name: string, tableNumber: string) {
  return sendWhatsAppNotification({
    to: phone,
    template: 'table_ready',
    params: [name, tableNumber],
  });
}

export async function notifyOrderCooking(phone: string, name: string) {
  return sendWhatsAppNotification({
    to: phone,
    template: 'order_cooking',
    params: [name],
  });
}

export function getMessageLog() {
  return messageLog;
}

export function parseWhatsAppJoinMessage(text: string): { slug: string } | null {
  const match = text.match(/^JOIN-([a-z0-9-]+)$/i);
  if (!match) return null;
  return { slug: match[1].toLowerCase() };
}
