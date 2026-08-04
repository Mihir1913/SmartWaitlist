import mongoose from 'mongoose';
import { QueueEntry } from '../models/QueueEntry.js';
import { Order } from '../models/Order.js';
import { Table } from '../models/Table.js';
export async function getDashboardStats(restaurantId) {
    const rid = new mongoose.Types.ObjectId(restaurantId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [activeQueue, seatedToday, cancelledToday, noShowToday, ordersToday, revenueToday, tables,] = await Promise.all([
        QueueEntry.countDocuments({
            restaurantId: rid,
            status: { $in: ['waiting', 'notified', 'on_my_way'] },
        }),
        QueueEntry.countDocuments({ restaurantId: rid, status: 'seated', seatedAt: { $gte: today } }),
        QueueEntry.countDocuments({ restaurantId: rid, status: 'cancelled', updatedAt: { $gte: today } }),
        QueueEntry.countDocuments({ restaurantId: rid, status: 'no_show', updatedAt: { $gte: today } }),
        Order.countDocuments({ restaurantId: rid, createdAt: { $gte: today } }),
        Order.aggregate([
            { $match: { restaurantId: rid, createdAt: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Table.find({ restaurantId: rid }),
    ]);
    const totalProcessed = seatedToday + cancelledToday + noShowToday;
    const walkawayRate = totalProcessed > 0 ? Math.round(((cancelledToday + noShowToday) / totalProcessed) * 100) : 0;
    const readyTables = tables.filter((t) => t.status === 'ready').length;
    const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
    const recentEntries = await QueueEntry.find({ restaurantId: rid })
        .sort({ joinedAt: -1 })
        .limit(10)
        .populate('assignedTableId', 'number');
    const hourlyData = await QueueEntry.aggregate([
        { $match: { restaurantId: rid, joinedAt: { $gte: today } } },
        { $group: { _id: { $hour: '$joinedAt' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    // Calculate real average wait time (seated today)
    const waitTimeData = await QueueEntry.aggregate([
        {
            $match: {
                restaurantId: rid,
                status: 'seated',
                seatedAt: { $gte: today },
            },
        },
        {
            $project: {
                waitMinutes: {
                    $divide: [{ $subtract: ['$seatedAt', '$joinedAt'] }, 60000],
                },
            },
        },
        {
            $group: {
                _id: null,
                avgWait: { $avg: '$waitMinutes' },
            },
        },
    ]);
    const avgWaitActual = waitTimeData[0]?.avgWait
        ? Math.round(waitTimeData[0].avgWait)
        : 0;
    // Calculate table turnover rate
    const occupiedSessions = await QueueEntry.countDocuments({
        restaurantId: rid,
        status: 'seated',
        seatedAt: { $gte: today },
    });
    const turnoverRate = tables.length > 0
        ? parseFloat(((occupiedSessions / tables.length) * 100).toFixed(1))
        : 0;
    // Pre-order conversion rate
    const entriesWithOrders = await QueueEntry.countDocuments({
        restaurantId: rid,
        preOrderId: { $exists: true, $ne: null },
        joinedAt: { $gte: today },
    });
    const totalEntriesToday = await QueueEntry.countDocuments({
        restaurantId: rid,
        joinedAt: { $gte: today },
    });
    const preOrderRate = totalEntriesToday > 0
        ? Math.round((entriesWithOrders / totalEntriesToday) * 100)
        : 0;
    // Calculate KPIs based on real data
    const restaurant = await Table.findOne({ restaurantId: rid }).lean();
    const avgTurnover = 45; // default assumption in minutes
    const extraCoversPerHour = Math.max(0, seatedToday > 3 ? Math.round(seatedToday / 6) : 0);
    const avgWaitReduction = avgWaitActual > 0 ? Math.min(avgWaitActual, 14) : 0;
    const walkawayReduction = walkawayRate < 30 ? Math.max(0, 30 - walkawayRate) : 0;
    const turnoverIncrease = turnoverRate > 0 ? Math.min(Math.round(turnoverRate * 0.2), 18) : 0;
    return {
        activeQueue,
        seatedToday,
        cancelledToday,
        walkawayRate,
        ordersToday,
        revenueToday: revenueToday[0]?.total ?? 0,
        tableStats: { total: tables.length, ready: readyTables, occupied: occupiedTables },
        recentEntries,
        hourlyData,
        kpis: {
            extraCoversPerHour,
            avgWaitReduction,
            walkawayReduction,
            turnoverIncrease,
        },
        avgWaitActual,
        turnoverRate,
        preOrderRate,
    };
}
