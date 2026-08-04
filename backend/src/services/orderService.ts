import { Order } from '../models/Order.js';
import { MenuItem } from '../models/Menu.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { emitToRestaurant, emitRestaurantSync } from './socket.js';
import { notifyOrderCooking } from './whatsappService.js';
import { getRestaurantSyncState } from './syncService.js';

export async function evaluateDualTrigger(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) return null;

  const { tableReady, customerOnMyWay } = order.triggers;
  if (tableReady && customerOnMyWay && order.status === 'confirmed') {
    order.status = 'cooking';
    order.triggers.dualTriggerMetAt = new Date();
    order.cookingStartedAt = new Date();
    await order.save();

    emitToRestaurant(order.restaurantId.toString(), 'order:cooking', { order });
    emitRestaurantSync(order.restaurantId.toString(), await getRestaurantSyncState(order.restaurantId.toString()));

    const entry = await QueueEntry.findById(order.queueEntryId);
    if (entry) {
      notifyOrderCooking(entry.customer.phone, entry.customer.name).catch((err) =>
        console.error('Failed to send cooking WhatsApp notification:', err)
      );
    }

    return order;
  }
  return order;
}

export async function createPreOrder(
  queueEntryId: string,
  items: { menuItemId: string; qty: number; notes?: string }[]
) {
  const entry = await QueueEntry.findById(queueEntryId);
  if (!entry) throw new Error('Queue entry not found');

  const orderItems = [];
  let subtotal = 0;
  let gst = 0;

  for (const item of items) {
    const menuItem = await MenuItem.findById(item.menuItemId);
    if (!menuItem || !menuItem.isAvailable) continue;

    const lineTotal = menuItem.price * item.qty;
    const lineGst = (lineTotal * menuItem.gstRate) / 100;
    subtotal += lineTotal;
    gst += lineGst;

    orderItems.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      qty: item.qty,
      price: menuItem.price,
      notes: item.notes,
    });
  }

  const order = await Order.create({
    restaurantId: entry.restaurantId,
    queueEntryId: entry._id,
    items: orderItems,
    subtotal,
    gst,
    total: subtotal + gst,
    status: 'confirmed',
    triggers: { tableReady: false, customerOnMyWay: entry.status === 'on_my_way' },
  });

  entry.preOrderId = order._id;
  await entry.save();

  if (entry.status === 'on_my_way') {
    order.triggers.customerOnMyWay = true;
    await order.save();
  }

  await evaluateDualTrigger(order._id.toString());
  emitToRestaurant(entry.restaurantId.toString(), 'order:created', { order, entry });
  emitRestaurantSync(entry.restaurantId.toString(), await getRestaurantSyncState(entry.restaurantId.toString()));

  return order;
}

export async function getKitchenOrders(restaurantId: string) {
  return Order.find({
    restaurantId,
    status: { $in: ['confirmed', 'cooking', 'ready'] },
  })
    .sort({ createdAt: 1 })
    .populate('queueEntryId', 'customer partySize position');
}

export async function startCooking(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  order.status = 'cooking';
  order.cookingStartedAt = new Date();
  await order.save();

  emitToRestaurant(order.restaurantId.toString(), 'order:cooking', { order });
  emitRestaurantSync(order.restaurantId.toString(), await getRestaurantSyncState(order.restaurantId.toString()));
  return order;
}

export async function markOrderReady(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  order.status = 'ready';
  order.readyAt = new Date();
  await order.save();

  emitToRestaurant(order.restaurantId.toString(), 'order:ready', { order });
  emitRestaurantSync(order.restaurantId.toString(), await getRestaurantSyncState(order.restaurantId.toString()));
  return order;
}

export async function markOnMyWayForOrder(queueEntryId: string) {
  const entry = await QueueEntry.findById(queueEntryId);
  if (!entry) throw new Error('Queue entry not found');

  entry.status = 'on_my_way';
  entry.onMyWayAt = new Date();
  await entry.save();

  if (entry.preOrderId) {
    await Order.findByIdAndUpdate(entry.preOrderId, {
      'triggers.customerOnMyWay': true,
    });
    await evaluateDualTrigger(entry.preOrderId.toString());
  }

  emitToRestaurant(entry.restaurantId.toString(), 'queue:onMyWay', { entry });
  emitRestaurantSync(entry.restaurantId.toString(), await getRestaurantSyncState(entry.restaurantId.toString()));
  return entry;
}
