import { Router } from 'express';
import { z } from 'zod';
import { Restaurant } from '../models/Restaurant.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { joinQueue, markOnMyWay } from '../services/queueService.js';
import { parseWhatsAppJoinMessage, notifyQueueJoined } from '../services/whatsappService.js';

const router = Router();

const webhookSchema = z.object({
  from: z.string(),
  message: z.string(),
  name: z.string().optional(),
});

router.post('/', async (req, res) => {
  try {
    const { from, message, name } = webhookSchema.parse(req.body);
    const parsed = parseWhatsAppJoinMessage(message.trim());

    if (parsed) {
      const restaurant = await Restaurant.findOne({ slug: parsed.slug });
      if (!restaurant) {
        return res.json({ reply: 'Sorry, restaurant not found.' });
      }

      const customerName = name || 'Guest';
      const entry = await joinQueue(restaurant._id.toString(), {
        name: customerName,
        phone: from,
        partySize: 2,
      });

      await notifyQueueJoined(from, customerName, entry.position, entry.estimatedWaitMinutes);

      return res.json({
        reply: `Welcome to ${restaurant.name}! You're #${entry.position} in queue. Estimated wait: ~${entry.estimatedWaitMinutes} min.`,
        entry,
      });
    }

    if (message.toLowerCase() === 'on my way') {
      const entry = await QueueEntry.findOne({
        'customer.phone': from,
        status: 'notified',
      });

      if (entry) {
        await markOnMyWay(entry._id.toString());
        return res.json({
          reply: `Thanks ${entry.customer.name}! You're on your way. Your table will be ready soon!`,
          action: 'on_my_way',
          entry,
        });
      }

      return res.json({
        reply: 'You are not currently in a notified position. Join a queue first by sending JOIN-{restaurant-slug}.',
      });
    }

    res.json({ reply: 'Send JOIN-{restaurant-slug} to join the waitlist, or tap "On My Way" when notified.' });
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;