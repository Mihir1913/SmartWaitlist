import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
// Import Models & Services
import { Restaurant } from '../models/Restaurant.js';
import { Table } from '../models/Table.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { Order } from '../models/Order.js';
import { MenuItem, MenuCategory } from '../models/Menu.js';
import { joinQueue, cancelQueueEntry } from '../services/queueService.js';
import { createPreOrder, markOnMyWayForOrder, markOrderReady, updateOrderStatus, addItemsToOrder } from '../services/orderService.js';
import { updateTableStatus } from '../services/tableService.js';
test.before(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartwaitlist_test';
    try {
        await mongoose.connect(mongoUri);
    }
    catch (err) {
        console.warn('MongoDB connection warning in test setup:', err);
    }
});
test.after(async () => {
    if (mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
    }
    await mongoose.disconnect();
});
test('Complete Restaurant Flow: Queue -> Pre-order -> Table Assign -> Dual Trigger -> Cooking -> Serving -> Exit', async () => {
    // Skip execution if database is not connected
    if (mongoose.connection.readyState !== 1) {
        console.log('Skipping DB integration test - No active MongoDB connection');
        return;
    }
    // 1. Setup Test Restaurant & Tables
    const restaurant = await Restaurant.create({
        name: 'Integration Test Bistro',
        slug: 'integration-bistro-' + Date.now(),
        address: '123 Main Street',
        whatsappPhone: '+1234567890',
    });
    const restaurantId = restaurant._id.toString();
    const table1 = await Table.create({
        restaurantId,
        number: 'T-101',
        capacity: 2,
        status: 'occupied',
    });
    const table2 = await Table.create({
        restaurantId,
        number: 'T-102',
        capacity: 4,
        status: 'occupied',
    });
    const category = await MenuCategory.create({
        restaurantId,
        name: 'Mains',
        sortOrder: 1,
    });
    const menuItem = await MenuItem.create({
        restaurantId,
        categoryId: category._id,
        name: 'Truffle Pasta',
        description: 'Fresh truffle pasta',
        price: 25,
        isAvailable: true,
    });
    // 2. Customer Joins Queue
    const guest1 = await joinQueue(restaurantId, {
        name: 'Alice Smith',
        phone: '9876543210',
        partySize: 2,
    });
    assert.equal(guest1.position, 1);
    assert.equal(guest1.status, 'waiting');
    assert.equal(guest1.customer.name, 'Alice Smith');
    // 3. Customer Places Pre-order (Draft Status)
    const preOrder = await createPreOrder(guest1._id.toString(), [
        { menuItemId: menuItem._id.toString(), qty: 2, notes: 'Extra cheese' },
    ]);
    assert.equal(preOrder.status, 'confirmed');
    assert.equal(preOrder.items.length, 1);
    assert.equal(preOrder.subtotal, 50);
    assert.equal(preOrder.triggers.tableReady, false);
    assert.equal(preOrder.triggers.customerOnMyWay, false);
    // 4. Table 1 becomes ready -> Host updates Table status -> Auto assigns guest1
    await updateTableStatus(table1._id.toString(), 'ready');
    const updatedEntryAfterAssign = await QueueEntry.findById(guest1._id);
    assert.equal(updatedEntryAfterAssign?.status, 'notified');
    const updatedOrderAfterAssign = await Order.findById(preOrder._id);
    assert.equal(updatedOrderAfterAssign?.triggers.tableReady, true);
    // Order remains 'confirmed' because customer hasn't marked 'On My Way' yet
    assert.equal(updatedOrderAfterAssign?.status, 'confirmed');
    // 5. Customer Marks "On My Way" -> Satisfies Dual Trigger -> Auto-fires Order to Kitchen ('cooking')
    const entryOnMyWay = await markOnMyWayForOrder(guest1._id.toString());
    assert.equal(entryOnMyWay.status, 'on_my_way');
    const cookingOrder = await Order.findById(preOrder._id);
    assert.equal(cookingOrder?.triggers.customerOnMyWay, true);
    assert.equal(cookingOrder?.triggers.tableReady, true);
    // Dual trigger met -> auto moves to cooking!
    assert.equal(cookingOrder?.status, 'cooking');
    assert.ok(cookingOrder?.cookingStartedAt);
    // 7. Kitchen Staff Marks Order Ready
    const readyOrder = await markOrderReady(preOrder._id.toString());
    assert.equal(readyOrder.status, 'ready');
    assert.ok(readyOrder.readyAt);
    // 8. Guest Arrives -> Host Seats Guest at Table 1
    const occupiedTable = await updateTableStatus(table1._id.toString(), 'occupied');
    assert.equal(occupiedTable.status, 'occupied');
    const seatedEntry = await QueueEntry.findById(guest1._id);
    assert.equal(seatedEntry?.status, 'seated');
    // 9. Staff Serves Food & Adds In-Dining Dessert Order
    const servedOrder = await updateOrderStatus(preOrder._id.toString(), 'served');
    assert.equal(servedOrder.status, 'served');
    const updatedOrderWithAddon = await addItemsToOrder(preOrder._id.toString(), [
        { menuItemId: menuItem._id.toString(), qty: 1, notes: 'Dessert item' },
    ]);
    assert.equal(updatedOrderWithAddon.items.length, 2);
    assert.equal(updatedOrderWithAddon.subtotal, 75);
    // 10. Billing & Payment Completion
    const completedOrder = await updateOrderStatus(preOrder._id.toString(), 'completed');
    assert.equal(completedOrder.status, 'completed');
    // 11. Customer Departs -> Staff Marks Table 'cleaning' then 'ready'
    await updateTableStatus(table1._id.toString(), 'cleaning');
    const readyTable = await updateTableStatus(table1._id.toString(), 'ready');
    assert.equal(readyTable.status, 'ready');
});
test('Cancellation and Queue Management Exception Scenarios', async () => {
    if (mongoose.connection.readyState !== 1) {
        return;
    }
    const restaurant = await Restaurant.create({
        name: 'Cancellation Test Bistro',
        slug: 'cancel-bistro-' + Date.now(),
        address: '456 Side Street',
        whatsappPhone: '+9999999999',
    });
    const restaurantId = restaurant._id.toString();
    const guest = await joinQueue(restaurantId, {
        name: 'Bob Marley',
        phone: '9888888888',
        partySize: 4,
    });
    assert.equal(guest.status, 'waiting');
    const cancelledEntry = await cancelQueueEntry(guest._id.toString());
    assert.equal(cancelledEntry.status, 'cancelled');
});
