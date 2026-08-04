import { Table } from '../models/Table.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { Order } from '../models/Order.js';
import { getDashboardStats } from './analyticsService.js';
export async function getRestaurantSyncState(restaurantId) {
    const [tables, queue, kitchenOrders, stats] = await Promise.all([
        Table.find({ restaurantId }).sort({ number: 1 }),
        QueueEntry.find({
            restaurantId,
            status: { $in: ['waiting', 'notified', 'on_my_way', 'seated'] },
        })
            .sort({ position: 1, joinedAt: 1 })
            .populate('assignedTableId', 'number status')
            .populate('assignedTableIds', 'number status')
            .populate('preOrderId'),
        Order.find({
            restaurantId,
            status: { $in: ['confirmed', 'cooking', 'ready'] },
        })
            .sort({ createdAt: 1 })
            .populate('queueEntryId', 'customer partySize position assignedTableId'),
        getDashboardStats(restaurantId),
    ]);
    return {
        tables,
        queue,
        kitchenOrders,
        stats,
    };
}
