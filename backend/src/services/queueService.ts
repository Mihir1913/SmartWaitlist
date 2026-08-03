import { Restaurant } from '../models/Restaurant.js';
import { Table } from '../models/Table.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { emitToRestaurant } from './socket.js';

const ACTIVE_QUEUE_STATUSES = ['waiting', 'notified', 'on_my_way'];

export async function calculateETA(restaurantId: string): Promise<number> {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return 0;

  const readyTables = await Table.countDocuments({ restaurantId, status: 'ready' });
  const waitingCount = await QueueEntry.countDocuments({
    restaurantId,
    status: { $in: ACTIVE_QUEUE_STATUSES },
  });

  if (readyTables > 0) return 5;
  if (waitingCount === 0) return 0;

  const avgTurnover = restaurant.settings.avgTurnoverMinutes;
  const occupiedTables = await Table.countDocuments({
    restaurantId,
    status: { $in: ['occupied', 'cleaning'] },
  });
  const totalTables = await Table.countDocuments({ restaurantId });
  const availableCapacity = Math.max(1, totalTables - occupiedTables);

  return Math.ceil((waitingCount * avgTurnover) / availableCapacity);
}

export async function recalculateQueuePositions(restaurantId: string) {
  const entries = await QueueEntry.find({
    restaurantId,
    status: { $in: ACTIVE_QUEUE_STATUSES },
  }).sort({ joinedAt: 1 });

  const baseETA = await calculateETA(restaurantId);
  const restaurant = await Restaurant.findById(restaurantId);
  const avgTurnover = restaurant?.settings.avgTurnoverMinutes ?? 45;

  for (let i = 0; i < entries.length; i++) {
    entries[i].position = i + 1;
    entries[i].estimatedWaitMinutes = Math.max(5, baseETA + i * Math.ceil(avgTurnover / 2));
    await entries[i].save();
  }

  emitToRestaurant(restaurantId, 'queue:updated', { entries });
  return entries;
}

export async function joinQueue(
  restaurantId: string,
  data: { name: string; phone: string; partySize: number }
) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new Error('Restaurant not found');

  const activeCount = await QueueEntry.countDocuments({
    restaurantId,
    status: { $in: ACTIVE_QUEUE_STATUSES },
  });
  if (activeCount >= restaurant.settings.maxQueueSize) {
    throw new Error('Queue is full. Please try again later.');
  }

  const existing = await QueueEntry.findOne({
    restaurantId,
    'customer.phone': data.phone,
    status: { $in: ACTIVE_QUEUE_STATUSES },
  });
  if (existing) {
    return existing;
  }

  const position = activeCount + 1;
  const estimatedWaitMinutes = await calculateETA(restaurantId);

  const entry = await QueueEntry.create({
    restaurantId,
    customer: { name: data.name, phone: data.phone },
    partySize: data.partySize,
    position,
    status: 'waiting',
    estimatedWaitMinutes: Math.max(5, estimatedWaitMinutes + position * 5),
    joinedAt: new Date(),
  });

  await recalculateQueuePositions(restaurantId);
  emitToRestaurant(restaurantId, 'queue:joined', { entry });

  return entry;
}

export async function markOnMyWay(entryId: string) {
  const entry = await QueueEntry.findById(entryId);
  if (!entry) throw new Error('Queue entry not found');

  entry.status = 'on_my_way';
  entry.onMyWayAt = new Date();
  await entry.save();

  emitToRestaurant(entry.restaurantId.toString(), 'queue:onMyWay', { entry });
  return entry;
}

export async function cancelQueueEntry(entryId: string) {
  const entry = await QueueEntry.findById(entryId);
  if (!entry) throw new Error('Queue entry not found');

  entry.status = 'cancelled';
  await entry.save();
  await recalculateQueuePositions(entry.restaurantId.toString());

  return entry;
}

export async function getQueue(restaurantId: string) {
  return QueueEntry.find({
    restaurantId,
    status: { $in: [...ACTIVE_QUEUE_STATUSES, 'seated'] },
  })
    .sort({ position: 1 })
    .populate('assignedTableId', 'number status')
    .populate('preOrderId');
}

export async function getNextInQueue(restaurantId: string) {
  return QueueEntry.findOne({
    restaurantId,
    status: { $in: ['waiting', 'notified'] },
  }).sort({ position: 1 });
}
