import { Restaurant } from '../models/Restaurant.js';
import { Table } from '../models/Table.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { emitToRestaurant, emitRestaurantSync } from './socket.js';
import { getRestaurantSyncState } from './syncService.js';

const ACTIVE_QUEUE_STATUSES = ['waiting', 'notified', 'on_my_way'];
const FREE_TABLE_STATUSES = ['available', 'ready'];
const MAX_TABLE_COMBINATION = 5;

function sortQueuePriority(entries: Array<InstanceType<typeof QueueEntry>>) {
  return entries.sort((a, b) => {
    const aVip = (a as any).isVip ? 0 : 1;
    const bVip = (b as any).isVip ? 0 : 1;
    if (aVip !== bVip) return aVip - bVip;
    if (a.partySize !== b.partySize) return a.partySize - b.partySize;
    return a.joinedAt.getTime() - b.joinedAt.getTime();
  });
}

function sortTableCombo(a: InstanceType<typeof Table>, b: InstanceType<typeof Table>) {
  return b.capacity - a.capacity || a.number.localeCompare(b.number, undefined, { numeric: true });
}

function chooseBestCombination(
  tables: Array<InstanceType<typeof Table>>,
  partySize: number,
): Array<InstanceType<typeof Table>> | null {
  const sorted = tables.slice().sort(sortTableCombo);
  let bestTables: Array<InstanceType<typeof Table>> | null = null;
  let bestTotalCapacity = 0;

  function backtrack(start: number, current: Array<InstanceType<typeof Table>>, totalCapacity: number) {
    if (totalCapacity >= partySize) {
      if (
        !bestTables ||
        current.length < bestTables.length ||
        (current.length === bestTables.length && totalCapacity < bestTotalCapacity)
      ) {
        bestTables = [...current];
        bestTotalCapacity = totalCapacity;
      }
      return;
    }

    if (current.length >= MAX_TABLE_COMBINATION || start >= sorted.length) {
      return;
    }

    for (let i = start; i < sorted.length; i += 1) {
      const table = sorted[i];
      current.push(table);
      backtrack(i + 1, current, totalCapacity + table.capacity);
      current.pop();
    }
  }

  backtrack(0, [], 0);
  return bestTables;
}

async function getFreeTables(restaurantId: string) {
  return Table.find({
    restaurantId,
    status: { $in: FREE_TABLE_STATUSES },
    $or: [{ currentQueueEntryId: { $exists: false } }, { currentQueueEntryId: null }],
  }).sort({ capacity: 1, number: 1 });
}

export async function calculateETA(restaurantId: string): Promise<number> {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return 0;

  const waitingEntries = await QueueEntry.find({
    restaurantId,
    status: { $in: ACTIVE_QUEUE_STATUSES },
  }).sort({ joinedAt: 1 });

  const availTables = await getFreeTables(restaurantId);
  if (waitingEntries.length > 0) {
    const firstParty = waitingEntries[0].partySize;
    const combo = chooseBestCombination(availTables, firstParty);
    if (combo) {
      return 5;
    }
  }

  const totalTables = await Table.countDocuments({ restaurantId });
  const unavailableTables = await Table.countDocuments({
    restaurantId,
    status: { $in: ['occupied', 'cleaning'] },
  });
  const effectiveTables = Math.max(1, Math.ceil((totalTables - unavailableTables) * 0.75));

  const avgTurnover = restaurant.settings.avgTurnoverMinutes;
  const queueWeight = waitingEntries.reduce((sum, entry) => sum + Math.max(1, Math.ceil(entry.partySize / 4)), 0);
  return Math.ceil((queueWeight * avgTurnover) / effectiveTables);
}

export async function recalculateQueuePositions(restaurantId: string) {
  const entries = await QueueEntry.find({
    restaurantId,
    status: { $in: ACTIVE_QUEUE_STATUSES },
  }).sort({ joinedAt: 1 });

  const restaurant = await Restaurant.findById(restaurantId);
  const totalTablesCount = await Table.countDocuments({ restaurantId });
  const totalTables = Math.max(1, totalTablesCount);
  const avgTurnover = restaurant?.settings.avgTurnoverMinutes ?? 45;
  const timePerPosition = Math.max(3, Math.ceil(avgTurnover / totalTables));

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    entry.position = i + 1;
    if (entry.assignedTableId || entry.status === 'notified' || entry.status === 'on_my_way') {
      entry.estimatedWaitMinutes = 5;
    } else {
      entry.estimatedWaitMinutes = Math.max(5, Math.min(60, i * timePerPosition + 5));
    }
    await entry.save();
  }

  emitToRestaurant(restaurantId, 'queue:updated', { entries });
  emitRestaurantSync(restaurantId, await getRestaurantSyncState(restaurantId));
  return entries;
}

export async function joinQueue(
  restaurantId: string,
  data: { name: string; phone: string; partySize: number }
): Promise<InstanceType<typeof QueueEntry>> {
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

  const entry = await QueueEntry.create({
    restaurantId,
    customer: { name: data.name, phone: data.phone },
    partySize: data.partySize,
    position: activeCount + 1,
    status: 'waiting',
    estimatedWaitMinutes: 0,
    joinedAt: new Date(),
  });

  const { assignWaitingGuestsToFreeTables } = await import('./tableService.js');
  const assigned = await assignWaitingGuestsToFreeTables(restaurantId);
  if (!assigned.some((guest) => guest._id.toString() === entry._id.toString())) {
    await recalculateQueuePositions(restaurantId);
    emitToRestaurant(restaurantId, 'queue:joined', { entry });
    emitRestaurantSync(restaurantId, await getRestaurantSyncState(restaurantId));
  }

  const found = await QueueEntry.findById(entry._id)
    .populate('assignedTableId', 'number status')
    .populate('assignedTableIds', 'number status')
    .populate('preOrderId');

  if (!found) {
    throw new Error('Failed to load queue entry after creation');
  }

  return found;
}

export async function markOnMyWay(entryId: string) {
  const entry = await QueueEntry.findById(entryId);
  if (!entry) throw new Error('Queue entry not found');

  entry.status = 'on_my_way';
  entry.onMyWayAt = new Date();
  await entry.save();

  emitToRestaurant(entry.restaurantId.toString(), 'queue:onMyWay', { entry });
  emitRestaurantSync(entry.restaurantId.toString(), await getRestaurantSyncState(entry.restaurantId.toString()));
  return entry;
}

export async function cancelQueueEntry(entryId: string) {
  const entry = await QueueEntry.findById(entryId);
  if (!entry) throw new Error('Queue entry not found');

  const restaurantId = entry.restaurantId.toString();
  const assignedTableId = entry.assignedTableId?.toString();
  const assignedTableIds = entry.assignedTableIds?.map((id) => id.toString()) ?? [];

  entry.status = 'cancelled';
  entry.assignedTableId = undefined;
  entry.assignedTableIds = undefined;
  await entry.save();

  if (assignedTableId || assignedTableIds.length > 0) {
    const tableIds = new Set([assignedTableId, ...assignedTableIds].filter(Boolean));
    for (const id of tableIds) {
      const table = await Table.findById(id);
      if (table && table.currentQueueEntryId?.toString() === entry._id.toString()) {
        table.currentQueueEntryId = undefined;
        table.combinedGroupId = undefined;
        await table.save();
      }
    }
  }

  const { assignWaitingGuestsToFreeTables } = await import('./tableService.js');
  const assigned = await assignWaitingGuestsToFreeTables(restaurantId);
  if (assigned.length === 0) {
    await recalculateQueuePositions(restaurantId);
    emitRestaurantSync(restaurantId, await getRestaurantSyncState(restaurantId));
  }

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
