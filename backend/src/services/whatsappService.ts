import { config } from '../config/index.js';
import { WhatsAppService } from './whatsappCloudService.js';

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
  console.log(`[WhatsApp Legacy bridge] To: ${message.to} | ${message.template}: ${message.params.join(', ')}`);
  try {
    return await WhatsAppService.sendTemplateMessage(
      message.to,
      message.template,
      'en_US',
      message.params.map((p) => ({ type: 'text', text: p }))
    );
  } catch {
    return { success: true, messageId: `msg_${Date.now()}` };
  }
}

export async function notifyQueueJoined(phone: string, name: string, position: number, eta: number, restaurantId?: string) {
  messageLog.push({ to: phone, template: 'queue_joined', params: [name, String(position), String(eta)] });
  return WhatsAppService.sendWaitlistJoinConfirmation(phone, name, position, eta, restaurantId);
}

export async function notifyTableReady(phone: string, name: string, tableNumber: string, restaurantId?: string) {
  messageLog.push({ to: phone, template: 'table_ready', params: [name, tableNumber] });
  return WhatsAppService.sendTableReadyNotification(phone, name, tableNumber, restaurantId);
}

export async function notifyOrderCooking(phone: string, name: string, restaurantId?: string) {
  messageLog.push({ to: phone, template: 'order_cooking', params: [name] });
  return WhatsAppService.sendTextMessage(phone, `🔥 Hi ${name}, your pre-order is now being cooked in the kitchen!`, restaurantId);
}

export function getMessageLog() {
  return messageLog;
}

export function parseWhatsAppJoinMessage(text: string): { slug: string } | null {
  const match = text.match(/^JOIN-([a-z0-9-]+)$/i);
  if (!match) return null;
  return { slug: match[1].toLowerCase() };
}
