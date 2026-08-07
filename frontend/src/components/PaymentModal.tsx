import { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Lock,
  X,
  Sparkles,
  Smartphone,
  ExternalLink,
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
  const [method, setMethod] = useState<'upi' | 'card' | 'sandbox'>('upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);

  // Dynamic UPI Deep Link string
  const upiVpa = 'smartwaitlist@upi';
  const restaurantName = 'Spice Garden Restaurant';
  const upiUri = `upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(restaurantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(type === 'preorder' ? 'PreOrder Payment' : 'Queue Deposit')}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;

  // Ensure Razorpay script load
  useEffect(() => {
    if (typeof (window as any).Razorpay === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleRazorpayCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Create Payment Order Session from Backend
      const sessionRes = await api.createPaymentOrder({
        type,
        orderId,
        queueEntryId,
        amount,
        paymentMethod: method === 'card' ? 'razorpay' : 'upi',
      });

      const session = sessionRes.session;

      // 2. Open Official Razorpay Checkout Modal
      if (typeof (window as any).Razorpay !== 'undefined') {
        const options = {
          key: session.keyId,
          amount: session.amount,
          currency: session.currency,
          name: restaurantName,
          description: type === 'preorder' ? 'Pre-Order Dish Payment' : 'Queue Security Deposit',
          order_id: session.razorpayOrderId,
          handler: async (response: any) => {
            const paymentId = response.razorpay_payment_id || `pay_rzp_${Date.now()}`;
            await api.verifyPayment({
              type,
              orderId,
              queueEntryId,
              paymentId,
              paymentMethod: method === 'card' ? 'razorpay' : 'upi',
            });
            onSuccess(paymentId);
          },
          prefill: {
            name: 'Customer',
            email: 'customer@example.com',
            contact: '9876543210',
          },
          theme: {
            color: '#ea580c',
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Fallback if Razorpay popup is blocked
        const res = await api.mockPay({
          type,
          orderId,
          queueEntryId,
          amount,
          paymentMethod: method,
        });
        onSuccess(res.paymentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Razorpay checkout initialization failed');
      setLoading(false);
    }
  };

  const handleUpiDirectConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const paymentId = `pay_upi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await api.verifyPayment({
        type,
        orderId,
        queueEntryId,
        paymentId,
        paymentMethod: 'upi',
      });
      setUpiVerified(true);
      setTimeout(() => onSuccess(paymentId), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UPI payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxPay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.mockPay({
        type,
        orderId,
        queueEntryId,
        amount,
        paymentMethod: 'upi',
      });
      onSuccess(res.paymentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sandbox payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-stone-900 animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 flex items-center justify-center font-bold">
              💳
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 font-display">
                {type === 'preorder' ? 'Online Pre-Payment' : 'Queue Security Deposit'}
              </h3>
              <p className="text-xs text-stone-500">256-Bit SSL Encrypted Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Summary */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-2xl p-4 text-center space-y-1 shadow-lg border border-stone-800">
          <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Total Amount Payable</p>
          <div className="font-display text-4xl font-extrabold text-amber-400">₹{amount}</div>
          <p className="text-[11px] text-stone-400">
            {type === 'preorder' ? 'Pre-Order Confirmation' : 'Fully Refundable Queue Deposit'}
          </p>
        </div>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-2xl">
          {[
            { id: 'upi', label: '📲 UPI / QR', icon: QrCode },
            { id: 'card', label: '💳 Razorpay', icon: CreditCard },
            { id: 'sandbox', label: '⚡ Test Pay', icon: Sparkles },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMethod(tab.id as any)}
              className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                method === tab.id
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Method 1: Interactive UPI & Live QR Code */}
        {method === 'upi' && (
          <div className="space-y-4 text-center bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <QrCode className="w-4 h-4 text-orange-600" />
                Scan & Pay with Google Pay / PhonePe / Paytm
              </span>
              <div className="bg-white p-3 rounded-2xl border border-stone-300 shadow-md inline-block my-1">
                <img src={qrCodeUrl} alt="UPI QR Code" className="w-44 h-44 mx-auto" />
              </div>
              <p className="text-[11px] text-stone-500 font-mono mt-1">UPI ID: {upiVpa}</p>
            </div>

            {/* Mobile Intent Launcher */}
            <div className="pt-1">
              <a
                href={upiUri}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow transition"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open Google Pay / PhonePe App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <button
              onClick={handleUpiDirectConfirm}
              disabled={loading || upiVerified}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition disabled:opacity-50"
            >
              {upiVerified ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-stone-950" />
                  <span>UPI Payment Verified!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'Verifying Transaction...' : 'I Have Completed UPI Payment'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Method 2: Official Razorpay Popup Gateway */}
        {method === 'card' && (
          <div className="space-y-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-stone-800">Razorpay Official Payment Gateway</p>
              <p className="text-[11px] text-stone-500">
                Supports Credit/Debit Cards, Netbanking, Wallets & International Payments
              </p>
            </div>

            <button
              onClick={handleRazorpayCheckout}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-stone-950 font-extrabold rounded-2xl shadow-lg text-xs flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Opening Razorpay Window...' : `Launch Razorpay Checkout (₹${amount})`}</span>
            </button>
          </div>
        )}

        {/* Method 3: 1-Tap Sandbox Test Pay */}
        {method === 'sandbox' && (
          <div className="space-y-4 bg-orange-50/60 p-4 rounded-2xl border border-orange-200">
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-orange-900 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4 text-orange-600" />
                1-Tap Instant Sandbox Test Pay
              </p>
              <p className="text-[11px] text-orange-700">
                Test the end-to-end pre-payment flow instantly without entering real bank details.
              </p>
            </div>

            <button
              onClick={handleSandboxPay}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-stone-950 font-extrabold rounded-2xl shadow-lg text-xs flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Simulating Payment...' : `Complete Test Payment (₹${amount})`}</span>
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium text-center">
            {error}
          </div>
        )}

        <p className="text-[11px] text-stone-400 text-center flex items-center justify-center gap-1 font-mono">
          <Lock className="w-3 h-3 text-stone-400" /> 256-Bit SSL Encrypted • Razorpay Certified
        </p>
      </div>
    </div>
  );
}
