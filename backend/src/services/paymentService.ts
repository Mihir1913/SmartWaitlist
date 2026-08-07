import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { QueueEntry } from '../models/QueueEntry.js';

export interface CreatePaymentOptions {
  type: 'preorder' | 'deposit';
  orderId?: string;
  queueEntryId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: 'razorpay' | 'stripe' | 'upi' | 'cash';
}

export class PaymentService {
  /**
   * Initialize Payment Session (Creates Razorpay / Sandbox Order ID)
   */
  static async createPaymentSession(options: CreatePaymentOptions) {
    const { type, orderId, queueEntryId, amount, paymentMethod = 'razorpay' } = options;

    const razorpayOrderId = `order_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (type === 'preorder' && orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.razorpayOrderId = razorpayOrderId;
        order.paymentStatus = 'pending';
        order.paymentMethod = paymentMethod;
        await order.save();
      }
    } else if (type === 'deposit' && queueEntryId) {
      const queueEntry = await QueueEntry.findById(queueEntryId);
      if (queueEntry) {
        queueEntry.depositAmount = amount;
        await queueEntry.save();
      }
    }

    return {
      razorpayOrderId,
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_smartwaitlist_demo',
      type,
      orderId,
      queueEntryId,
    };
  }

  /**
   * Verify Razorpay Payment Signature
   */
  static verifyRazorpaySignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dev_secret_key';
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return expectedSignature === razorpaySignature;
  }

  /**
   * Confirm Payment & Update Database Status (Online UPI / Razorpay / Sandbox)
   */
  static async confirmPayment(payload: {
    type: 'preorder' | 'deposit';
    orderId?: string;
    queueEntryId?: string;
    paymentId: string;
    paymentMethod?: 'razorpay' | 'stripe' | 'upi' | 'cash';
  }) {
    const { type, orderId, queueEntryId, paymentId, paymentMethod = 'upi' } = payload;

    if (type === 'preorder' && orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.paymentMethod = paymentMethod;
        order.paymentId = paymentId;
        order.status = 'confirmed';
        await order.save();
        return { success: true, order };
      }
    } else if (type === 'deposit' && queueEntryId) {
      const entry = await QueueEntry.findById(queueEntryId);
      if (entry) {
        entry.isDepositPaid = true;
        entry.depositPaymentId = paymentId;
        await entry.save();
        return { success: true, entry };
      }
    }

    throw new Error('Target record not found for payment confirmation');
  }
}
