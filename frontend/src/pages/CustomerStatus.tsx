import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Footprints,
  UtensilsCrossed,
  Circle,
  PartyPopper,
  Search,
  Plus,
  ShoppingBag,
  Leaf,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import PaymentModal from '../components/PaymentModal';
import BillReceiptModal from '../components/BillReceiptModal';
import type { QueueEntry, Order, MenuItem } from '../types';

function formatJoinedTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <header className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-stone-200 animate-pulse" />
        <div className="space-y-2">
          <div className="w-36 h-5 bg-stone-200 rounded animate-pulse" />
          <div className="w-24 h-4 bg-stone-200 rounded animate-pulse" />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 pb-8 flex flex-col items-center pt-10 space-y-6">
        <div className="w-40 h-40 rounded-full bg-stone-200 animate-pulse" />
        <div className="w-32 h-8 bg-stone-200 rounded animate-pulse" />
        <div className="w-full max-w-xs h-3 bg-stone-200 rounded-full animate-pulse" />
        <div className="w-full h-16 bg-stone-200 rounded-2xl animate-pulse" />
        <div className="w-full h-12 bg-stone-200 rounded-xl animate-pulse" />
      </main>
    </div>
  );
}

const STEPS = [
  { key: 'joined', label: 'Joined' },
  { key: 'in_queue', label: 'In Queue' },
  { key: 'notified', label: 'Notified' },
  { key: 'on_my_way', label: 'On My Way' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

function stepState(sk: StepKey, status: QueueEntry['status']): 'done' | 'active' | 'future' {
  if (sk === 'joined') return 'done';
  if (sk === 'in_queue') {
    if (['notified', 'on_my_way', 'seated'].includes(status)) return 'done';
    return status === 'waiting' ? 'active' : 'future';
  }
  if (sk === 'notified') {
    if (['on_my_way', 'seated'].includes(status)) return 'done';
    return status === 'notified' ? 'active' : 'future';
  }
  if (sk === 'on_my_way') {
    if (status === 'seated') return 'done';
    return status === 'on_my_way' ? 'active' : 'future';
  }
  return 'future';
}

function StatusStepper({ status }: { status: QueueEntry['status'] }) {
  const doneCount = STEPS.filter((s) => stepState(s.key, status) === 'done').length;
  const progressPct = Math.min(100, Math.max(0, (doneCount / (STEPS.length - 1)) * 100));
  const isTerm = ['cancelled', 'no_show'].includes(status);

  return (
    <div className="card p-4 overflow-hidden">
      <div className="flex items-center justify-between relative">
        {/* Progress track container bounded between left-6 and right-6 */}
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-stone-200 z-0 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-700 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {STEPS.map((step) => {
          const st = stepState(step.key, status);
          return (
            <div key={step.key} className="flex flex-col items-center z-10 relative flex-1">
              <div
                className={
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ' +
                  (st === 'done'
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                    : st === 'active' && !isTerm
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-md'
                    : 'bg-stone-100 text-stone-400')
                }
              >
                {st === 'done' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : st === 'active' && !isTerm ? (
                  <Circle className="w-4 h-4 fill-white" />
                ) : (
                  <Circle className="w-4 h-4 text-stone-300" />
                )}
              </div>
              <span className="text-[11px] font-medium text-stone-600 mt-2 text-center leading-tight">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderTracker({ order, onPayClick }: { order: Order; onPayClick: () => void }) {
  const steps = [
    { status: 'confirmed', label: 'Confirmed', icon: Circle },
    { status: 'cooking', label: 'Cooking', icon: UtensilsCrossed },
    { status: 'ready', label: 'Ready', icon: CheckCircle2 },
    { status: 'served', label: 'Served', icon: PartyPopper },
  ];

  const currentIdx = steps.findIndex((s) => s.status === order.status);

  return (
    <div className="card p-5 bg-gradient-to-br from-stone-900 to-stone-950 text-white border-stone-800 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-amber-400" />
          <h3 className="font-display font-bold text-sm text-white">Pre-Order Cooking Progress</h3>
        </div>
        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/40">
          ₹{order.totalAmount || order.total}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1 relative text-center">
        {steps.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = step.icon;

          return (
            <div key={step.status} className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-amber-500 text-stone-950 font-bold ring-4 ring-amber-500/20 shadow-lg scale-110'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-stone-800 text-stone-500 border border-stone-700'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] leading-tight font-medium ${
                  isCurrent ? 'text-amber-400 font-bold' : isDone ? 'text-stone-300' : 'text-stone-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Order Item List */}
      <div className="bg-stone-900/90 rounded-xl p-3 border border-stone-800 space-y-1.5 text-xs text-stone-300">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <span>
              {item.qty}x {item.name} {item.notes ? <span className="text-[10px] text-amber-400 font-italic">({item.notes})</span> : ''}
            </span>
            <span className="font-mono text-stone-400">₹{item.price * item.qty}</span>
          </div>
        ))}
      </div>

      {/* Payment Status Bar */}
      <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
        {order.paymentStatus === 'paid' ? (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Paid Online via UPI / Razorpay
          </span>
        ) : (
          <button
            onClick={onPayClick}
            className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
          >
            💳 Pay ₹{order.totalAmount || order.total} Online Now
          </button>
        )}
      </div>
    </div>
  );
}

export default function CustomerStatus() {
  const { entryId: paramId } = useParams<{ entryId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchCode, setSearchCode] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);

  const effectiveId = paramId || localStorage.getItem('customer_queue_id') || undefined;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['queueEntry', effectiveId],
    queryFn: () => api.getQueueEntry(effectiveId!),
    enabled: !!effectiveId,
    refetchInterval: 5000, // Poll every 5s for real-time status updates
  });

  const entry = data?.entry;
  const restaurantName = data?.restaurant?.name;
  const restaurantSlug = data?.restaurant?.slug;
  const order = data?.order;

  // Query restaurant menu for the pre-order modal
  const { data: menuData } = useQuery({
    queryKey: ['restaurantMenu', restaurantSlug],
    queryFn: () => api.getRestaurant(restaurantSlug!),
    enabled: !!restaurantSlug && showAddMenuModal,
  });

  const menuCategories = menuData?.menu ?? [];

  // State for Add Pre-Order Modal
  const [cart, setCart] = useState<Record<string, number>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const omwMut = useMutation({
    mutationFn: () => api.onMyWay(effectiveId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queueEntry', effectiveId] });
    },
  });

  const cancelMut = useMutation({
    mutationFn: () => api.cancelQueue(effectiveId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queueEntry', effectiveId] });
      setConfirmCancel(false);
    },
  });

  const handleAddPreOrderSubmit = async () => {
    const items = Object.entries(cart).map(([menuItemId, qty]) => ({
      menuItemId,
      qty,
      notes: itemNotes[menuItemId] || '',
    }));
    if (items.length === 0) return;
    setIsSubmittingOrder(true);
    try {
      if (order?._id) {
        await api.addOrderItems(order._id, items);
      } else {
        await api.preOrder(effectiveId!, items);
      }
      setShowAddMenuModal(false);
      setCart({});
      setItemNotes({});
      queryClient.invalidateQueries({ queryKey: ['queueEntry', effectiveId] });
    } catch (err) {
      alert('Failed to submit pre-order');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const displayWait = entry?.estimatedWaitMinutes;

  if (!effectiveId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
        <div className="card p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-surface-900">Track Your Waitlist Status</h2>
          <p className="text-stone-500 text-xs">Enter your 10-digit phone number or short tracking code</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchCode.trim()) navigate(`/status/${encodeURIComponent(searchCode.trim())}`);
            }}
            className="space-y-3"
          >
            <input
              type="text"
              required
              placeholder="e.g. 9876543210 or Tracking Code"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="input text-center text-lg font-semibold"
            />
            <button type="submit" className="btn-primary w-full py-3 text-base">
              Track Order Status
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) return <Skeleton />;

  const isSeated = entry?.status === 'seated';
  const isCancelled = entry?.status === 'cancelled';
  const isNoShow = entry?.status === 'no_show';
  const isNotified = entry?.status === 'notified';
  const isOnMyWay = entry?.status === 'on_my_way';

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-stone-50 to-white pb-12">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-stone-200/60">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-xl hover:bg-stone-100 transition">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <div>
              <h1 className="font-display font-bold text-base text-surface-900 leading-tight">
                {restaurantName || 'Smart Waitlist'}
              </h1>
              <p className="text-xs text-stone-500 font-medium">Live Waitlist Tracker</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg">
            #{entry?.position}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Main Queue Position Ring / Status Badge */}
        <div className="card p-8 text-center space-y-4 shadow-xl border-stone-200/80 relative overflow-hidden">
          {isSeated ? (
            <div className="space-y-3">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <PartyPopper className="w-10 h-10" />
              </div>
              <h2 className="font-display text-2xl font-bold text-emerald-900">Your Table is Ready!</h2>
              <p className="text-sm text-stone-600 max-w-xs mx-auto">
                Please proceed to the host stand. Enjoy your dining experience!
              </p>
            </div>
          ) : isCancelled || isNoShow ? (
            <div className="space-y-3">
              <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="font-display text-2xl font-bold text-red-900">
                {isCancelled ? 'Entry Cancelled' : 'Marked as No-Show'}
              </h2>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full bg-gradient-to-br from-brand-500 to-amber-600 text-white shadow-2xl shadow-brand-500/30 mx-auto">
                <span className="text-xs uppercase tracking-wider font-semibold opacity-90">Position</span>
                <span className="font-display text-5xl font-black">{entry?.position}</span>
                <span className="text-[11px] font-medium opacity-90">in line</span>
              </div>

              <div>
                <h2 className="font-display text-xl font-bold text-surface-900">
                  {entry?.customer.name}
                </h2>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  Party of {entry?.partySize} guests • Joined at {formatJoinedTime(entry?.joinedAt.toString() || '')}
                </p>
              </div>

              {/* Wait Time Estimate */}
              {entry?.status === 'waiting' && displayWait != null && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-center gap-3 text-amber-900">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-sm font-semibold">
                    Estimated Wait: ~{displayWait} mins
                  </span>
                </div>
              )}

              {/* On My Way Action */}
              {isNotified && (
                <div className="space-y-3 pt-2">
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-900 text-sm">
                    <strong>Your Table is Ready!</strong> Tap below to let staff know you are heading over.
                  </div>
                  <button
                    onClick={() => omwMut.mutate()}
                    disabled={omwMut.isPending}
                    className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25"
                  >
                    <Footprints className="w-5 h-5" />
                    {omwMut.isPending ? 'Updating Status...' : "I'm On My Way!"}
                  </button>
                </div>
              )}

              {isOnMyWay && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-blue-900 text-sm flex items-center justify-center gap-2 font-semibold">
                  <Footprints className="w-5 h-5 text-blue-600" />
                  Status: Heading to Host Stand
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stepper Status */}
        {entry && <StatusStepper status={entry.status} />}

        {/* Order Cooking Progress Tracker (If Pre-Order Exists) */}
        {order && <OrderTracker order={order} onPayClick={() => setShowPayModal(true)} />}

        {showPayModal && order && (
          <PaymentModal
            type="preorder"
            amount={order.totalAmount || order.total}
            orderId={order._id}
            onSuccess={() => {
              setShowPayModal(false);
              queryClient.invalidateQueries({ queryKey: ['queueEntry', effectiveId] });
            }}
            onClose={() => setShowPayModal(false)}
          />
        )}

        {/* Print / Download Bill Receipt PDF Button */}
        {order && (
          <button
            onClick={() => setShowBillModal(true)}
            className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-2xl shadow text-sm flex items-center justify-center gap-2 transition border border-stone-800"
          >
            <span>📄 Print / Download Digital Bill Invoice (PDF)</span>
          </button>
        )}

        {showBillModal && order && (
          <BillReceiptModal
            restaurantName={restaurantName || 'Restaurant'}
            entry={entry}
            order={order}
            onClose={() => setShowBillModal(false)}
          />
        )}

        {/* Add / Edit Pre-Order Dishes Button */}
        {!isSeated && !isCancelled && !isNoShow && (
          <button
            onClick={() => setShowAddMenuModal(true)}
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-stone-950 font-bold rounded-2xl shadow text-sm flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{order ? 'Add More Dishes to Pre-Order' : 'Pre-Order Dishes While Waiting'}</span>
          </button>
        )}

        {/* Cancel Queue Entry */}
        {!isSeated && !isCancelled && !isNoShow && (
          <div className="pt-2 text-center">
            {confirmCancel ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl space-y-3">
                <p className="text-sm font-medium text-red-900">Cancel queue reservation?</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="btn-ghost text-stone-600 py-1.5 px-4 text-xs"
                  >
                    Keep Reservation
                  </button>
                  <button
                    onClick={() => cancelMut.mutate()}
                    disabled={cancelMut.isPending}
                    className="bg-red-600 text-white font-bold py-1.5 px-4 rounded-xl text-xs"
                  >
                    {cancelMut.isPending ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCancel(true)}
                className="text-xs text-stone-400 hover:text-red-600 transition font-medium"
              >
                Cancel My Queue Reservation
              </button>
            )}
          </div>
        )}
      </main>

      {/* Add Pre-Order Modal */}
      {showAddMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h3 className="font-display font-bold text-lg text-surface-900">Pre-Order Dishes</h3>
              </div>
              <button onClick={() => setShowAddMenuModal(false)} className="text-stone-400 hover:text-stone-900 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {menuCategories.map((cat) => (
                <div key={cat._id}>
                  <h4 className="font-bold text-xs uppercase text-stone-400 tracking-wider mb-2">{cat.name}</h4>
                  <div className="space-y-2">
                    {cat.items.map((item: MenuItem) => (
                      <div key={item._id} className="p-3 border border-stone-200 rounded-xl space-y-2 bg-stone-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sm text-stone-900 flex items-center gap-1">
                              {item.isVeg ? <span className="text-emerald-600">🟢</span> : <span className="text-red-600">🔴</span>}
                              {item.name}
                            </span>
                            <p className="text-xs text-brand-600 font-bold">₹{item.price}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setCart((prev) => {
                                  const qty = (prev[item._id] || 0) - 1;
                                  if (qty <= 0) {
                                    const next = { ...prev };
                                    delete next[item._id];
                                    return next;
                                  }
                                  return { ...prev, [item._id]: qty };
                                });
                              }}
                              className="w-7 h-7 rounded bg-white border border-stone-300 font-bold"
                            >
                              −
                            </button>
                            <span className="w-5 text-center font-bold text-xs">{cart[item._id] || 0}</span>
                            <button
                              onClick={() => {
                                setCart((prev) => ({ ...prev, [item._id]: (prev[item._id] || 0) + 1 }));
                              }}
                              className="w-7 h-7 rounded bg-white border border-stone-300 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {cart[item._id] > 0 && (
                          <input
                            type="text"
                            placeholder="Notes (e.g. Less spicy)..."
                            value={itemNotes[item._id] || ''}
                            onChange={(e) => setItemNotes((prev) => ({ ...prev, [item._id]: e.target.value }))}
                            className="w-full text-xs bg-white border border-stone-200 rounded px-2 py-1"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={handleAddPreOrderSubmit}
                disabled={isSubmittingOrder || Object.keys(cart).length === 0}
                className="btn-primary w-full py-3 text-sm font-bold"
              >
                {isSubmittingOrder ? 'Submitting...' : `Confirm Pre-Order (${Object.values(cart).reduce((a, b) => a + b, 0)} items)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
