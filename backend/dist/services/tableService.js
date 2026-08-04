import { Table } from '../models/Table.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { Order } from '../models/Order.js';
import { emitToRestaurant, emitRestaurantSync } from './socket.js';
import { recalculateQueuePositions } from './queueService.js';
import { evaluateDualTrigger } from './orderService.js';
import { notifyTableReady } from './whatsappService.js';
import { getRestaurantSyncState } from './syncService.js';
const FREE_TABLE_STATUSES = ['available', 'ready'];
const MAX_TABLE_COMBINATION = 5;
export async function getTables(restaurantId) {
    return Table.find({ restaurantId }).sort({ number: 1 });
}
function parseTableNumeric(numberStr) {
    const digits = numberStr.match(/\d+/g);
    if (!digits)
        return null;
    return parseInt(digits.join(''), 10);
}
function adjacencyScore(tables) {
    const numericIds = tables
        .map((table) => parseTableNumeric(table.number))
        .filter((n) => typeof n === 'number')
        .sort((a, b) => a - b);
    if (numericIds.length !== tables.length)
        return 0;
    let score = 0;
    for (let i = 1; i < numericIds.length; i += 1) {
        if (numericIds[i] - numericIds[i - 1] === 1)
            score += 1;
    }
    return score;
}
function sortTableCombo(a, b) {
    return b.capacity - a.capacity || a.number.localeCompare(b.number, undefined, { numeric: true });
}
function chooseBestCombination(tables, partySize) {
    const sorted = tables.slice().sort(sortTableCombo);
    let bestTables = null;
    let bestTotalCapacity = 0;
    let bestAdjacency = 0;
    function backtrack(start, current, totalCapacity) {
        if (totalCapacity >= partySize) {
            const adjacency = adjacencyScore(current);
            if (!bestTables ||
                current.length < bestTables.length ||
                (current.length === bestTables.length && totalCapacity < bestTotalCapacity) ||
                (current.length === bestTables.length && totalCapacity === bestTotalCapacity && adjacency > bestAdjacency)) {
                bestTables = [...current];
                bestTotalCapacity = totalCapacity;
                bestAdjacency = adjacency;
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
async function getFreeTables(restaurantId) {
    return Table.find({
        restaurantId,
        status: { $in: [...FREE_TABLE_STATUSES] },
        $or: [{ currentQueueEntryId: { $exists: false } }, { currentQueueEntryId: null }],
    }).sort({ capacity: 1, number: 1 });
}
async function assignTablesToGuest(entry, tables) {
    const tableIds = tables.map((t) => t._id);
    await QueueEntry.updateMany({
        restaurantId: entry.restaurantId,
        _id: { $ne: entry._id },
        assignedTableIds: { $in: tableIds },
    }, { $unset: { assignedTableIds: '' } });
    await Table.updateMany({
        restaurantId: entry.restaurantId,
        currentQueueEntryId: entry._id,
        _id: { $nin: tableIds },
    }, { $unset: { currentQueueEntryId: '' } });
    entry.status = 'notified';
    entry.assignedTableIds = tableIds;
    entry.assignedTableId = tableIds[0];
    entry.notifiedAt = new Date();
    await entry.save();
    const updatePayload = { currentQueueEntryId: entry._id };
    if (tableIds.length > 1) {
        updatePayload.combinedGroupId = `group-${entry._id.toString()}`;
    }
    await Table.updateMany({ _id: { $in: tableIds } }, updatePayload);
    if (entry.preOrderId) {
        await Order.findByIdAndUpdate(entry.preOrderId, {
            'triggers.tableReady': true,
        });
        await evaluateDualTrigger(entry.preOrderId.toString());
    }
    const tableSummary = tables.map((t) => ({ _id: t._id, number: t.number, capacity: t.capacity }));
    emitToRestaurant(entry.restaurantId.toString(), 'queue:notified', { entry, tables: tableSummary });
    notifyTableReady(entry.customer.phone, entry.customer.name, tableSummary.map((t) => t.number).join(', ')).catch((err) => console.error('Failed to send table-ready WhatsApp notification:', err));
    await recalculateQueuePositions(entry.restaurantId.toString());
    emitRestaurantSync(entry.restaurantId.toString(), await getRestaurantSyncState(entry.restaurantId.toString()));
    return entry;
}
export async function assignWaitingGuestsToFreeTables(restaurantId) {
    const freeTables = await getFreeTables(restaurantId);
    if (freeTables.length === 0)
        return [];
    const waitingGuests = await QueueEntry.find({
        restaurantId,
        status: 'waiting',
    }).sort({ joinedAt: 1 });
    const assignedGuests = [];
    let availableTables = [...freeTables];
    for (const guest of waitingGuests) {
        const combo = chooseBestCombination(availableTables, guest.partySize);
        if (!combo)
            continue;
        await assignTablesToGuest(guest, combo);
        assignedGuests.push(guest);
        const usedIds = new Set(combo.map((table) => table._id.toString()));
        availableTables = availableTables.filter((table) => !usedIds.has(table._id.toString()));
        if (availableTables.length === 0)
            break;
    }
    return assignedGuests;
}
export async function assignNextGuestToTable(table) {
    const assigned = await assignWaitingGuestsToFreeTables(table.restaurantId.toString());
    return assigned.length > 0 ? assigned[0] : null;
}
export async function updateTableStatus(tableId, status) {
    const table = await Table.findById(tableId);
    if (!table)
        throw new Error('Table not found');
    const restaurantId = table.restaurantId.toString();
    table.status = status;
    table.lastStatusChangeAt = new Date();
    if (status === 'ready') {
        table.currentQueueEntryId = undefined;
        await table.save();
        const assignedGuest = await assignNextGuestToTable(table);
        if (!assignedGuest) {
            await recalculateQueuePositions(restaurantId);
        }
        emitToRestaurant(restaurantId, 'table:statusChanged', { table });
        emitRestaurantSync(restaurantId, await getRestaurantSyncState(restaurantId));
        return table;
    }
    if (status === 'occupied') {
        if (table.currentQueueEntryId) {
            const entry = await QueueEntry.findById(table.currentQueueEntryId);
            if (entry) {
                entry.status = 'seated';
                entry.seatedAt = new Date();
                await entry.save();
            }
            table.currentQueueEntryId = undefined;
        }
        await table.save();
        await recalculateQueuePositions(restaurantId);
        emitToRestaurant(restaurantId, 'table:statusChanged', { table });
        emitRestaurantSync(restaurantId, await getRestaurantSyncState(restaurantId));
        return table;
    }
    if (status === 'cleaning') {
        table.currentQueueEntryId = undefined;
        await table.save();
        await recalculateQueuePositions(restaurantId);
        emitToRestaurant(restaurantId, 'table:statusChanged', { table });
        emitRestaurantSync(restaurantId, await getRestaurantSyncState(restaurantId));
        return table;
    }
    await table.save();
    emitToRestaurant(restaurantId, 'table:statusChanged', { table });
    emitRestaurantSync(restaurantId, await getRestaurantSyncState(restaurantId));
    return table;
}
export async function assignTableToGuest(tableId, queueEntryId) {
    const table = await Table.findById(tableId);
    const entry = await QueueEntry.findById(queueEntryId);
    if (!table || !entry)
        throw new Error('Table or queue entry not found');
    // ensure one guest, one table
    await QueueEntry.updateMany({
        restaurantId: table.restaurantId,
        _id: { $ne: entry._id },
        assignedTableId: entry.assignedTableId,
    }, { $unset: { assignedTableId: '' } });
    await Table.updateMany({
        restaurantId: table.restaurantId,
        _id: { $ne: table._id },
        currentQueueEntryId: entry._id,
    }, { $unset: { currentQueueEntryId: '' } });
    entry.assignedTableId = table._id;
    entry.status = 'notified';
    entry.notifiedAt = new Date();
    await entry.save();
    table.currentQueueEntryId = entry._id;
    await table.save();
    emitToRestaurant(table.restaurantId.toString(), 'queue:notified', { entry, table });
    emitRestaurantSync(table.restaurantId.toString(), await getRestaurantSyncState(table.restaurantId.toString()));
    return { table, entry };
}
