import { Table } from '../models/Table.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { Order } from '../models/Order.js';
import { emitToRestaurant } from './socket.js';
import { getNextInQueue, recalculateQueuePositions } from './queueService.js';
import { evaluateDualTrigger } from './orderService.js';
import { notifyTableReady } from './whatsappService.js';

export async function getTables(restaurantId: string) {
  return Table.find({ restaurantId }).sort({ number: 1 });
}

export async function updateTableStatus(
  tableId: string,
  status: 'occupied' | 'cleaning' | 'ready'
) {
  const table = await Table.findById(tableId);
  if (!table) throw new Error('Table not found');

  const restaurantId = table.restaurantId.toString();
  table.status = status;
  table.lastStatusChangeAt = new Date();

  if (status === 'ready') {
    const nextGuest = await getNextInQueue(restaurantId);
    if (nextGuest) {
      nextGuest.status = 'notified';
      nextGuest.notifiedAt = new Date();
      nextGuest.assignedTableId = table._id;
      await nextGuest.save();

      table.currentQueueEntryId = nextGuest._id;

      if (nextGuest.preOrderId) {
        await Order.findByIdAndUpdate(nextGuest.preOrderId, {
          'triggers.tableReady': true,
        });
        await evaluateDualTrigger(nextGuest.preOrderId.toString());
      }

      emitToRestaurant(restaurantId, 'queue:notified', {
        entry: nextGuest,
        table,
      });

      // Send WhatsApp notification that table is ready
      notifyTableReady(nextGuest.customer.phone, nextGuest.customer.name, table.number).catch((err) =>
        console.error('Failed to send table-ready WhatsApp notification:', err)
      );
    }
  }

  if (status === 'occupied' && table.currentQueueEntryId) {
    const entry = await QueueEntry.findById(table.currentQueueEntryId);
    if (entry) {
      entry.status = 'seated';
      entry.seatedAt = new Date();
      await entry.save();
      await recalculateQueuePositions(restaurantId);
    }
    table.currentQueueEntryId = undefined;
  }

  if (status === 'cleaning') {
    table.currentQueueEntryId = undefined;
  }

  await table.save();
  emitToRestaurant(restaurantId, 'table:statusChanged', { table });

  return table;
}

export async function assignTableToGuest(tableId: string, queueEntryId: string) {
  const table = await Table.findById(tableId);
  const entry = await QueueEntry.findById(queueEntryId);
  if (!table || !entry) throw new Error('Table or queue entry not found');

  entry.assignedTableId = table._id;
  entry.status = 'notified';
  entry.notifiedAt = new Date();
  await entry.save();

  table.currentQueueEntryId = entry._id;
  await table.save();

  emitToRestaurant(table.restaurantId.toString(), 'queue:notified', { entry, table });
  return { table, entry };
}
