import mongoose from 'mongoose';
import { QueueEntry } from '../models/QueueEntry.js';
import { Order } from '../models/Order.js';
import { Table } from '../models/Table.js';

export async function getDashboardStats(restaurantId: string, range = 'today') {
  const rid = new mongoose.Types.ObjectId(restaurantId);
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (range === '7d') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === '30d') {
    startDate.setDate(startDate.getDate() - 30);
  }

  const [
    activeQueue,
    seatedToday,
    cancelledToday,
    noShowToday,
    ordersToday,
    revenueToday,
    tables,
  ] = await Promise.all([
    QueueEntry.countDocuments({
      restaurantId: rid,
      status: { $in: ['waiting', 'notified', 'on_my_way'] },
    }),
    QueueEntry.countDocuments({ restaurantId: rid, status: 'seated', seatedAt: { $gte: startDate } }),
    QueueEntry.countDocuments({ restaurantId: rid, status: 'cancelled', updatedAt: { $gte: startDate } }),
    QueueEntry.countDocuments({ restaurantId: rid, status: 'no_show', updatedAt: { $gte: startDate } }),
    Order.countDocuments({ restaurantId: rid, createdAt: { $gte: startDate } }),
    Order.aggregate([
      { $match: { restaurantId: rid, createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
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
    { $match: { restaurantId: rid, joinedAt: { $gte: startDate } } },
    { $group: { _id: { $hour: '$joinedAt' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const topSellingItems = await Order.aggregate([
    { $match: { restaurantId: rid, createdAt: { $gte: startDate } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        totalQty: { $sum: '$items.qty' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
      },
    },
    { $sort: { totalQty: -1 } },
    { $limit: 5 },
  ]);

  // Calculate real average wait time (seated)
  const waitTimeData = await QueueEntry.aggregate([
    {
      $match: {
        restaurantId: rid,
        status: 'seated',
        seatedAt: { $gte: startDate },
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

  const occupiedSessions = await QueueEntry.countDocuments({
    restaurantId: rid,
    status: 'seated',
    seatedAt: { $gte: startDate },
  });
  const turnoverRate = tables.length > 0
    ? parseFloat(((occupiedSessions / tables.length) * 100).toFixed(1))
    : 0;

  const entriesWithOrders = await QueueEntry.countDocuments({
    restaurantId: rid,
    preOrderId: { $exists: true, $ne: null },
    joinedAt: { $gte: startDate },
  });
  const totalEntriesToday = await QueueEntry.countDocuments({
    restaurantId: rid,
    joinedAt: { $gte: startDate },
  });
  const preOrderRate = totalEntriesToday > 0
    ? Math.round((entriesWithOrders / totalEntriesToday) * 100)
    : 0;

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
    topSellingItems,
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
