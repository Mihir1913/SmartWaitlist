import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Hash, Clock, Users, Phone, CheckCircle2, Circle,
  Footprints, PartyPopper, XCircle, AlertTriangle,
  Armchair, ShoppingBag, Loader2, ArrowLeft,
} from 'lucide-react';
import { api } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import type { QueueEntry, Order } from '../types';

interface EntryResponse {
  entry: QueueEntry & { restaurantId?: string };
  restaurant?: { name: string; slug: string; id: string };
}

function formatJoinedTime(d: string): string {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function maskPhone(p: string): string {
  return p.length < 4 ? p : '--------' + p.slice(-4);
}

function OrderBadge({ status }: { status: Order['status'] }) {
  const m: Record<string, [string, string]> = {
    draft: ['Draft', 'bg-stone-100 text-stone-600'],
    confirmed: ['Confirmed', 'bg-blue-100 text-blue-700'],
    cooking: ['Cooking', 'bg-amber-100 text-amber-700'],
    ready: ['Ready', 'bg-green-100 text-green-700'],
    served: ['Served', 'bg-emerald-100 text-emerald-700'],
  };
  const [label, cls] = m[status] || ['Unknown', 'bg-stone-100 text-stone-600'];
  const clsStr = `text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`;
  return <span className={clsStr}>{label}</span>;
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
  const doneCount = STEPS.filter(s => stepState(s.key, status) === 'done').length;
  const pct = (doneCount / (STEPS.length - 1)) * 100;
  const isTerm = ['cancelled', 'no_show'].includes(status);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-stone-200 z-0" />
        <div className="absolute top-5 left-6 h-0.5 bg-green-400 z-0 transition-all duration-700" style={{ width: pct + '%' }} />
        {STEPS.map(step => {
          const st = stepState(step.key, status);
          return (
            <div key={step.key} className="flex flex-col items-center z-10 relative flex-1">
              <div className={
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ' +
                (st === 'done' ? 'bg-green-500 text-white shadow-md shadow-green-200'
                  : st === 'active' && !isTerm ? 'bg-brand-600 text-white shadow-md shadow-green-200 animate-pulse'
                  : 'bg-white border-2 border-stone-200 text-stone-400')
              }>
                {st === 'done' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>
              <span className={
                'text-[10px] mt-1.5 font-medium leading-tight text-center ' +
                (st === 'done' ? 'text-green-700' : st === 'active' && !isTerm ? 'text-brand-700' : 'text-stone-400')
              }>
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
  const { entryId } = useParams<{ entryId: string }>();
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const fetchEntry = useCallback(async (): Promise<EntryResponse> => {
    const res = await fetch('/api/queue/entry/' + entryId);
    if (!res.ok) {
      if (res.status === 404) throw new Error('NOT_FOUND');
      throw new Error('Failed to fetch');
    }
    return res.json();
  }, [entryId]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['queueEntry', entryId],
    queryFn: fetchEntry,
    refetchInterval: 5000,
    retry: 1,
  });

  const entry = data?.entry;
  const restaurantName = data?.restaurant?.name;
  const restaurantId = entry?.restaurantId ?? data?.restaurant?.id;

  const socketCb = useRef((_ev: string, _d: unknown) => {
    queryClient.invalidateQueries({ queryKey: ['queueEntry', entryId] });
  });
  socketCb.current = (_ev, _d) => {
    queryClient.invalidateQueries({ queryKey: ['queueEntry', entryId] });
  };
  useSocket(restaurantId, (ev, d) => socketCb.current(ev, d));

  const cancelMut = useMutation({
    mutationFn: () => api.cancelQueue(entryId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['queueEntry', entryId] }); setConfirmCancel(false); },
  });

  const omwMut = useMutation({
    mutationFn: () => api.onMyWay(entryId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['queueEntry', entryId] }); },
  });

  const [displayWait, setDisplayWait] = useState<number | null>(null);
  useEffect(() => {
    if (entry?.estimatedWaitMinutes != null && entry.status === 'waiting') setDisplayWait(entry.estimatedWaitMinutes);
  }, [entry?.estimatedWaitMinutes, entry?.status]);
  useEffect(() => {
    if (displayWait == null || displayWait <= 0) return;
    const t = setInterval(() => setDisplayWait(p => (p != null && p > 0 ? p - 1 : 0)), 60000);
    return () => clearInterval(t);
  }, [displayWait]);

  if (isLoading) return <Skeleton />;

  const notFound = error instanceof Error && error.message === 'NOT_FOUND';
  if (isError || !entry) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            {notFound ? <AlertTriangle className="w-8 h-8 text-stone-400" /> : <XCircle className="w-8 h-8 text-red-400" />}
          </div>
          <h2 className="font-display text-xl font-bold mb-2">{notFound ? 'Entry Not Found' : 'Something Went Wrong'}</h2>
          <p className="text-stone-500 text-sm mb-6">{notFound ? "This queue entry doesn't exist or may have expired." : 'We could not load your queue status. Please try again.'}</p>
          <Link to="/" className="btn-primary w-full inline-block text-center">Go Home</Link>
        </div>
      </div>
    );
  }

  const isTerminal = ['cancelled', 'no_show'].includes(entry.status);
  const isSeated = entry.status === 'seated';
  const progressPct = Math.max(5, Math.min(100, 100 - (entry.position / 10) * 100));
  const preOrder = entry.preOrderId && typeof entry.preOrderId !== 'string' ? entry.preOrderId : null;
  const tableNum = entry.assignedTableId && typeof entry.assignedTableId !== 'string' ? entry.assignedTableId.number : null;

  const circleClass = isSeated ? 'bg-emerald-500 text-white'
    : entry.status === 'on_my_way' ? 'bg-blue-500 text-white'
    : entry.status === 'notified' ? 'bg-green-500 text-white'
    : 'bg-white text-brand-700 border-4 border-brand-200';

  const circleIcon = isSeated ? <PartyPopper className="w-10 h-10 mb-0.5" />
    : entry.status === 'on_my_way' ? <Footprints className="w-10 h-10 mb-0.5" />
    : <Hash className="w-6 h-6 mb-0.5 opacity-60" />;

  const circleText = isSeated ? 'Done' : String(entry.position);
  const circleSub = isSeated ? 'Seated' : entry.status === 'on_my_way' ? 'On Way' : 'in queue';

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <header className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
        <Link to="/" className="p-2 rounded-lg hover:bg-white/80 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-lg truncate">{restaurantName ?? 'Queue Status'}</h1>
          <p className="text-sm text-stone-500">Your waitlist tracker</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-12 space-y-5">
        {/* Terminal States */}
        {entry.status === 'cancelled' && (
          <div className="card p-6 text-center border-red-200 bg-red-50">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="font-display text-xl font-bold text-red-800 mb-1">Spot Cancelled</h2>
            <p className="text-sm text-red-600 mb-5">Your queue spot has been cancelled.</p>
            {restaurantName && <Link to={"/join/" + (data?.restaurant?.slug ?? '')} className="btn-primary w-full inline-block text-center">Re-Join Waitlist</Link>}
          </div>
        )}

        {entry.status === 'no_show' && (
          <div className="card p-6 text-center border-amber-200 bg-amber-50">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-amber-800 mb-1">Marked as No-Show</h2>
            <p className="text-sm text-amber-700 mb-5">You were marked as a no-show. Please contact the restaurant if this was a mistake.</p>
            {restaurantName && <Link to={"/join/" + (data?.restaurant?.slug ?? '')} className="btn-primary w-full inline-block text-center">Re-Join Waitlist</Link>}
          </div>
        )}

        {/* Position Display */}
        {!isTerminal && (
          <div>
            <div className="flex flex-col items-center pt-6 pb-2">
              <div className="relative mb-5">
                {entry.status === 'waiting' && (
                  <div className="absolute inset-0 rounded-full bg-brand-400/20 animate-ping" style={{ animationDuration: '3s' }} />
                )}
                {entry.status === 'notified' && (
                  <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                )}
                <div className={"relative w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-xl transition-all duration-500 " + circleClass}>
                  {circleIcon}
                  <span className="text-4xl font-extrabold leading-none">{circleText}</span>
                  <span className="text-xs font-medium opacity-70 mt-0.5">{circleSub}</span>
                </div>
              </div>

              {entry.status === 'waiting' && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-stone-500 text-sm mb-1">
                    <Clock className="w-4 h-4" /><span>Estimated wait</span>
                  </div>
                  <p className="text-3xl font-bold text-stone-800">
                    ~{displayWait ?? entry.estimatedWaitMinutes}{' '}<span className="text-lg font-medium text-stone-500">min</span>
                  </p>
                </div>
              )}

              {entry.status === 'notified' && (
                <div className="text-center">
                  <p className="text-lg font-bold text-green-800">You are next!</p>
                  <p className="text-sm text-green-600">Head to the restaurant now</p>
                </div>
              )}

              {entry.status === 'on_my_way' && (
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-800">Almost there!</p>
                  <p className="text-sm text-blue-600">Your table is being prepared</p>
                </div>
              )}

              {isSeated && (
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-800">You are seated! Enjoy your meal!</p>
                  {tableNum && <p className="text-sm text-emerald-600 mt-1">Table <span className="font-bold text-base">{tableNum}</span></p>}
                </div>
              )}
            </div>

            {entry.status === 'waiting' && (
              <div className="card px-5 py-3 mt-2">
                <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
                  <span>Queue progress</span>
                  <span className="font-semibold text-stone-700">#{entry.position}</span>
                </div>
                <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-1000" style={{ width: progressPct + '%' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Stepper */}
        <StatusStepper status={entry.status} />

        {/* Action Buttons */}
        {entry.status === 'waiting' && (
          <div className="card p-4">
            {!confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)} className="btn-danger w-full">Cancel My Spot</button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-700 text-center font-medium">Are you sure? You will lose your position.</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmCancel(false)} className="btn flex-1 bg-stone-100 text-stone-700 hover:bg-stone-200">Keep Waiting</button>
                  <button onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending} className="btn-danger flex-1 flex items-center justify-center gap-2">
                    {cancelMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Yes, Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {entry.status === 'notified' && (
          <div className="card p-5 text-center space-y-3">
            <button
              onClick={() => omwMut.mutate()}
              disabled={omwMut.isPending}
              className="btn-success w-full text-lg py-4 font-bold animate-pulse shadow-lg shadow-green-200"
            >
              {omwMut.isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</span> : "I'm On My Way!"}
            </button>
            {!confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)} className="text-sm text-stone-400 hover:text-red-500 transition underline">Cancel my spot</button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-red-600">Sure you want to cancel?</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => setConfirmCancel(false)} className="text-xs text-stone-500 hover:text-stone-700">No, keep it</button>
                  <button onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending} className="text-xs text-red-500 font-semibold hover:text-red-700">Yes, cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {entry.status === 'on_my_way' && (
          <div className="card p-5 text-center bg-blue-50 border-blue-200">
            <div className="flex items-center justify-center gap-2 text-blue-800 font-semibold text-lg mb-1">
              <Footprints className="w-5 h-5 animate-bounce" /> You are on your way!
            </div>
            <p className="text-sm text-blue-600">
              Please arrive within 10 minutes.{tableNum && <> Your table is <span className="font-bold">Table {tableNum}</span>.</>}
            </p>
          </div>
        )}

        {isSeated && (
          <div className="card p-5 text-center bg-emerald-50 border-emerald-200">
            <div className="flex items-center justify-center gap-2 text-emerald-800 font-semibold mb-1">
              <PartyPopper className="w-5 h-5" /> Enjoy Your Meal!
            </div>
            <p className="text-sm text-emerald-600">{tableNum ? 'You have been seated at Table ' + tableNum + '.' : 'You have been seated. Please check with the host.'}</p>
          </div>
        )}

        {/* Pre-Order Section */}
        {preOrder && preOrder.items && preOrder.items.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-5 h-5 text-brand-600" />
              <h3 className="font-semibold">Your Pre-Order</h3>
              <div className="ml-auto"><OrderBadge status={preOrder.status} /></div>
            </div>
            <div className="divide-y divide-stone-100">
              {preOrder.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{item.qty}x {item.name}</span>
                    {item.notes && <p className="text-xs text-stone-400 truncate">{item.notes}</p>}
                  </div>
                  <span className="text-sm font-semibold text-stone-700 ml-3">Rs {(item.price * item.qty).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-200 mt-2 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-stone-500"><span>Subtotal</span><span>Rs {preOrder.subtotal.toFixed(0)}</span></div>
              <div className="flex justify-between text-sm text-stone-500"><span>GST</span><span>Rs {preOrder.gst.toFixed(0)}</span></div>
              <div className="flex justify-between text-base font-bold text-stone-800"><span>Total</span><span>Rs {preOrder.total.toFixed(0)}</span></div>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Users className="w-4 h-4 text-blue-600" /></div>
            <div><p className="text-xs text-stone-400">Party Size</p><p className="font-semibold text-sm">Table for {entry.partySize}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center"><Clock className="w-4 h-4 text-amber-600" /></div>
            <div><p className="text-xs text-stone-400">Joined At</p><p className="font-semibold text-sm">{formatJoinedTime(entry.joinedAt)}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center"><Phone className="w-4 h-4 text-green-600" /></div>
            <div><p className="text-xs text-stone-400">Phone</p><p className="font-semibold text-sm">{maskPhone(entry.customer.phone)}</p></div>
          </div>
          {tableNum && !isSeated ? (
            <div className="card p-4 flex items-center gap-3 border-brand-200 bg-brand-50">
              <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center"><Armchair className="w-4 h-4 text-brand-600" /></div>
              <div><p className="text-xs text-stone-400">Table</p><p className="font-bold text-sm text-brand-700">{tableNum}</p></div>
            </div>
          ) : (
            <div className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-stone-50 flex items-center justify-center"><Armchair className="w-4 h-4 text-stone-400" /></div>
              <div><p className="text-xs text-stone-400">Table</p><p className="font-semibold text-sm text-stone-500">Not assigned</p></div>
            </div>
          )}
        </div>

        {isSeated && tableNum && (
          <div className="card p-5 text-center border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Armchair className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-700">Table {tableNum}</p>
            <p className="text-sm text-emerald-500 mt-1">Your assigned table</p>
          </div>
        )}

        {!isTerminal && !isSeated && (
          <p className="text-center text-xs text-stone-400 pt-2">This page auto-refreshes. No need to reload.</p>
        )}
      </main>
    </div>
  );
}
