import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Hash, Clock, Users, Phone, CheckCircle2, Circle,
  Footprints, PartyPopper, XCircle, AlertTriangle,
  Armchair, ShoppingBag, Loader2, ArrowLeft, Search, Flame, Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import type { QueueEntry, Order } from '../types';

interface EntryResponse {
  entry: QueueEntry & { restaurantId?: string };
  restaurant?: { name: string; slug: string; id: string };
  order?: Order;
}

function formatJoinedTime(d: string): string {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function maskPhone(p: string): string {
  return p.length < 4 ? p : '--------' + p.slice(-4);
}

function OrderCookingProgress({ order }: { order?: Order }) {
  if (!order) return null;

  const steps = [
    { key: 'confirmed', label: 'Order Received', icon: CheckCircle2, color: 'text-blue-500' },
    { key: 'cooking', label: 'Cooking in Kitchen', icon: Flame, color: 'text-amber-500' },
    { key: 'ready', label: 'Food Ready', icon: Sparkles, color: 'text-emerald-500' },
    { key: 'completed', label: 'Served to Table', icon: PartyPopper, color: 'text-purple-500' },
  ];

  const currentIdx = steps.findIndex((s) => s.key === order.status);
  const activeIdx = currentIdx >= 0 ? currentIdx : 0;

  return (
    <div className="card p-5 bg-gradient-to-br from-stone-900 to-stone-950 text-white border border-stone-800 space-y-4">
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-orange-400" />
          <h3 className="font-display font-bold text-base text-white">Pre-Order Cooking Tracker</h3>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
          {order.status}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="grid grid-cols-4 gap-2 text-center pt-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx <= activeIdx;
          const isActive = idx === activeIdx;

          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                  isDone
                    ? 'bg-orange-500 border-orange-400 text-stone-950 font-bold shadow-lg shadow-orange-500/20'
                    : 'bg-stone-900 border-stone-800 text-stone-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  isActive ? 'text-orange-400' : isDone ? 'text-stone-300' : 'text-stone-600'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Order Items */}
      <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800/80 space-y-1 text-xs text-stone-300">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <span>{item.qty}x {item.name}</span>
            <span className="text-stone-400 font-mono">₹{item.price * item.qty}</span>
          </div>
        ))}
        <div className="pt-2 border-t border-stone-800 flex justify-between font-bold text-white text-sm">
          <span>Total Pre-Order:</span>
          <span className="text-orange-400">₹{order.total}</span>
        </div>
      </div>
    </div>
  );
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
  const pct = (doneCount / (STEPS.length - 1)) * 100;
  const isTerm = ['cancelled', 'no_show'].includes(status);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-stone-200 z-0" />
        <div
          className="absolute top-5 left-6 h-0.5 bg-green-400 z-0 transition-all duration-700"
          style={{ width: pct + '%' }}
        />
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
              <span
                className={
                  'text-xs font-semibold mt-2 transition-colors ' +
                  (st === 'done'
                    ? 'text-green-700'
                    : st === 'active' && !isTerm
                    ? 'text-brand-700'
                    : 'text-stone-400')
                }
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CustomerStatus() {
  const { entryId: urlEntryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [searchCode, setSearchCode] = useState('');

  // Fallback to localStorage saved customer session
  const activeEntryId = urlEntryId || localStorage.getItem('customer_queue_id') || '';

  const fetchEntry = useCallback(async (): Promise<EntryResponse> => {
    if (!activeEntryId) throw new Error('NO_ID');
    const res = await fetch('/api/queue/entry/' + activeEntryId);
    if (!res.ok) {
      if (res.status === 404) throw new Error('NOT_FOUND');
      throw new Error('Failed to fetch');
    }
    return res.json();
  }, [activeEntryId]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['queueEntry', activeEntryId],
    queryFn: fetchEntry,
    enabled: !!activeEntryId,
    refetchInterval: 5000,
    retry: 1,
  });

  const entry = data?.entry;
  const order = data?.order;
  const restaurantName = data?.restaurant?.name;
  const restaurantId = entry?.restaurantId ?? data?.restaurant?.id;

  const socketCb = useRef((_ev: string, _d: unknown) => {
    queryClient.invalidateQueries({ queryKey: ['queueEntry', activeEntryId] });
  });
  socketCb.current = (_ev, _d) => {
    queryClient.invalidateQueries({ queryKey: ['queueEntry', activeEntryId] });
  };
  useSocket(restaurantId, (ev, d) => socketCb.current(ev, d));

  const cancelMut = useMutation({
    mutationFn: () => api.cancelQueue(activeEntryId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queueEntry', activeEntryId] });
      setConfirmCancel(false);
      localStorage.removeItem('customer_queue_id');
    },
  });

  const omwMut = useMutation({
    mutationFn: () => api.onMyWay(activeEntryId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queueEntry', activeEntryId] });
    },
  });

  const [displayWait, setDisplayWait] = useState<number | null>(null);
  useEffect(() => {
    if (entry?.estimatedWaitMinutes != null && entry.status === 'waiting')
      setDisplayWait(entry.estimatedWaitMinutes);
  }, [entry?.estimatedWaitMinutes, entry?.status]);

  useEffect(() => {
    if (displayWait == null || displayWait <= 0) return;
    const t = setInterval(() => setDisplayWait((p) => (p != null && p > 0 ? p - 1 : 0)), 60000);
    return () => clearInterval(t);
  }, [displayWait]);

  // If no entry ID exists in URL or localStorage, render a clean search form
  if (!activeEntryId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full card p-8 text-center space-y-6 shadow-xl border border-stone-200">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-600/30">
            <Search className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-surface-900">Track Order & Waitlist</h2>
            <p className="text-sm text-stone-500 mt-1">
              Enter your 10-digit phone number or Queue Entry ID to check live position
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchCode.trim()) {
                localStorage.setItem('customer_queue_id', searchCode.trim());
                navigate(`/status/${searchCode.trim()}`);
              }
            }}
            className="space-y-4"
          >
            <input
              type="text"
              required
              placeholder="e.g. 9876543210 or Entry ID"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="input text-center text-lg font-semibold"
            />
            <button type="submit" className="btn-primary w-full py-3 text-base">
              Track Order Status
            </button>
          </form>

          <div className="pt-4 border-t border-stone-100 text-xs text-stone-400">
            Smart Waitlist • Real-Time Queue Tracker
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return <Skeleton />;

  const notFound = error instanceof Error && error.message === 'NOT_FOUND';
  if (isError || !entry) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center px-4">
        <div className="card p-8 max-w-sm text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-stone-900">
            {notFound ? 'Queue Entry Not Found' : 'Error Loading Status'}
          </h2>
          <p className="text-sm text-stone-500">
            {notFound
              ? 'This queue entry may have expired or been removed.'
              : 'Failed to fetch queue entry details.'}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('customer_queue_id');
              navigate('/');
            }}
            className="btn-primary w-full"
          >
            Back to Restaurants
          </button>
        </div>
      </div>
    );
  }

  const isSeated = entry.status === 'seated';
  const isCancelled = entry.status === 'cancelled';
  const isNoShow = entry.status === 'no_show';
  const isNotified = entry.status === 'notified';
  const isOnMyWay = entry.status === 'on_my_way';

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
            #{entry.position}
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
              <p className="text-sm text-stone-500">
                This queue reservation is no longer active.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full bg-gradient-to-br from-brand-500 to-amber-600 text-white shadow-2xl shadow-brand-500/30 mx-auto">
                <span className="text-xs uppercase tracking-wider font-semibold opacity-90">Position</span>
                <span className="font-display text-5xl font-black">{entry.position}</span>
                <span className="text-[11px] font-medium opacity-90">in line</span>
              </div>

              <div>
                <h2 className="font-display text-xl font-bold text-surface-900">
                  {entry.customer.name}
                </h2>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  Party of {entry.partySize} guests • Joined at {formatJoinedTime(entry.joinedAt.toString())}
                </p>
              </div>

              {/* Wait Time Estimate */}
              {entry.status === 'waiting' && displayWait != null && (
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
                    <strong>Your Table is Ready!</strong> Please tap below to let staff know you are heading over.
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
        <StatusStepper status={entry.status} />

        {/* Order Cooking Progress Tracker (If Pre-Order Exists) */}
        {order && <OrderCookingProgress order={order} />}

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
    </div>
  );
}
