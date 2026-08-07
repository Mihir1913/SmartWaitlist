import { useState } from 'react';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Lock,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api';

interface PaymentModalProps {
  type: 'preorder' | 'deposit';
  amount: number;
  orderId?: string;
  queueEntryId?: string;
  onSuccess: (paymentId: string) => void;
  onClose: () => void;
}

export default function PaymentModal({
  type,
  amount,
  orderId,
  queueEntryId,
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const [method, setMethod] = useState<'upi' | 'card' | 'sandbox'>('sandbox');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');

    try {
      if (method === 'sandbox') {
        const res = await api.mockPay({
          type,
          orderId,
          queueEntryId,
          amount,
          paymentMethod: 'upi',
        });
        onSuccess(res.paymentId);
      } else {
        // Create session
        const sessionRes = await api.createPaymentOrder({
          type,
          orderId,
          queueEntryId,
          amount,
          paymentMethod: method,
        });

        const session = sessionRes.session;

        // Check if Razorpay script is loaded
        if (typeof (window as any).Razorpay !== 'undefined') {
          const options = {
            key: session.keyId,
            amount: session.amount,
            currency: session.currency,
            name: 'Smart Waitlist Pre-Payment',
            description: type === 'preorder' ? 'Pre-Order Dish Payment' : 'Queue Security Deposit',
            order_id: session.razorpayOrderId,
            handler: async (response: any) => {
              await api.verifyPayment({
                type,
                orderId,
                queueEntryId,
                paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                paymentMethod: method,
              });
              onSuccess(response.razorpay_payment_id || `pay_${Date.now()}`);
            },
            prefill: {
              contact: '9876543210',
            },
            theme: {
              color: '#ea580c',
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          // Fallback to mock pay if script not loaded
          const res = await api.mockPay({
            type,
            orderId,
            queueEntryId,
            amount,
            paymentMethod: method,
          });
          onSuccess(res.paymentId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-stone-900 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 flex items-center justify-center font-bold">
              💳
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 font-display">
                {type === 'preorder' ? 'Online Pre-Payment' : 'Queue Security Deposit'}
              </h3>
              <p className="text-xs text-stone-500">256-Bit SSL Encrypted Payment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Summary */}
        <div className="bg-stone-900 text-white rounded-2xl p-5 text-center space-y-1 shadow-lg">
          <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Total Amount Payable</p>
          <div className="font-display text-4xl font-extrabold text-amber-400">₹{amount}</div>
          <p className="text-[11px] text-stone-400">
            {type === 'preorder' ? 'Pre-Order Confirmation' : 'Fully Refundable Queue Deposit'}
          </p>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Select Payment Method:
          </label>
          <div className="space-y-2">
            {[
              {
                id: 'sandbox',
                label: '⚡ 1-Tap Sandbox Test Pay (Instant)',
                desc: 'Zero-friction test payment without live card',
                badge: 'Instant Sandbox',
                color: 'border-orange-500 bg-orange-50/50',
              },
              {
                id: 'upi',
                label: '📲 UPI / Google Pay / PhonePe / Paytm',
                desc: 'Pay directly using any UPI App',
                badge: 'Razorpay UPI',
                color: 'border-emerald-500 bg-emerald-50/50',
              },
              {
                id: 'card',
                label: '💳 Debit / Credit Card / NetBanking',
                desc: 'Visa, MasterCard, RuPay, Banking',
                badge: 'Razorpay / Stripe',
                color: 'border-blue-500 bg-blue-50/50',
              },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id as any)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                  method === m.id
                    ? `${m.color} border-2 shadow-sm`
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-stone-900">{m.label}</p>
                  <p className="text-[11px] text-stone-500">{m.desc}</p>
                </div>
                <span className="text-[10px] font-bold bg-stone-900 text-white px-2 py-0.5 rounded-full shrink-0">
                  {m.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-stone-950 font-extrabold rounded-2xl shadow-lg text-sm flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{loading ? 'Processing Payment...' : `Pay ₹${amount} Now`}</span>
        </button>

        <p className="text-[11px] text-stone-400 text-center flex items-center justify-center gap-1 font-mono">
          <Lock className="w-3 h-3 text-stone-400" /> Protected by Razorpay & 256-bit Encryption
        </p>
      </div>
    </div>
  );
}
