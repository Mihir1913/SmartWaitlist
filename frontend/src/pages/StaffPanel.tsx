import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LogOut,
  Users,
  Clock,
  X,
  UserCircle,
  Timer,
  Armchair,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useRestaurantState } from '../hooks/useRestaurantState';
import type { Table, QueueEntry, Order } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   Status Configurations
   ═══════════════════════════════════════════════════════════════════════ */

interface TableStatusCfg {
  label: string;
  border: string;
  bg: string;
  ring: string;
  badge: string;
  nextStatus: 'occupied' | 'cleaning' | 'ready' | null;
  buttonLabel: string | null;
  buttonClass: string;
}

const TABLE_STATUS: Record<Table['status'], TableStatusCfg> = {
  available: {
    label: 'Available',
    border: 'border-emerald-300',
    bg: '',
    ring: '',
    badge: 'bg-emerald-100 text-emerald-700',
    nextStatus: 'occupied',
    buttonLabel: 'Mark Occupied',
    buttonClass: 'btn-primary',
  },
  occupied: {
    label: 'Occupied',
    border: 'border-red-300',
    bg: '',
    ring: '',
    badge: 'bg-red-100 text-red-700',
    nextStatus: 'cleaning',
    buttonLabel: 'Start Cleaning',
    buttonClass: 'btn-warning',
  },
  cleaning: {
    label: 'Cleaning',
    border: 'border-amber-300',
    bg: '',
    ring: '',
    badge: 'bg-amber-100 text-amber-700',
    nextStatus: 'ready',
    buttonLabel: 'Mark Ready',
    buttonClass: 'btn-success',
  },
  ready: {
    label: 'Ready',
    border: 'border-emerald-400',
    bg: 'bg-emerald-50/50',
    ring: 'ring-2 ring-emerald-200/80',
    badge: 'bg-emerald-100 text-emerald-700',
    nextStatus: null,
    buttonLabel: null,
    buttonClass: '',
  },
};

const QUEUE_BADGE: Record<string, string> = {
  waiting: 'bg-blue-100 text-blue-700',
  notified: 'bg-amber-100 text-amber-700',
  on_my_way: 'bg-emerald-100 text-emerald-700',
};

const QUEUE_LABEL: Record<string, string> = {
  waiting: 'Waiting',
  notified: 'Notified',
  on_my_way: 'On My Way',
};

/* ═══════════════════════════════════════════════════════════════════════
   Skeleton Components
   ═══════════════════════════════════════════════════════════════════════ */

function SkeletonTableCard() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-8 w-14 bg-stone-200 rounded-lg" />
        <div className="h-6 w-20 bg-stone-200 rounded-full" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-4 bg-stone-200 rounded" />
        <div className="h-4 w-16 bg-stone-200 rounded" />
      </div>
      <div className="h-11 bg-stone-200 rounded-xl" />
    </div>
  );
}

function SkeletonQueueItem() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 bg-stone-200 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 bg-stone-200 rounded" />
          <div className="h-3 w-36 bg-stone-200 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Toast
   ═══════════════════════════════════════════════════════════════════════ */

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg
        text-white text-sm font-medium max-w-sm ${
        type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
      }`}
      style={{ animation: 'toastIn 0.3s ease-out' }}
    >
      {type === 'error' ? (
        <AlertCircle className="w-4 h-4 shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      )}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="p-0.5 hover:opacity-70 transition">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   StaffPanel
   ═══════════════════════════════════════════════════════════════════════ */

export default function StaffPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state, isLoading: stateLoading } = useRestaurantState((event) => {
    if (event === 'order:ready') {
      showToast('🔔 Order is READY in the Kitchen! Serve to Table.', 'success');
    }
  });

  /* ── Clock ───────────────────────────────────────────────────────── */
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Toast ───────────────────────────────────────────────────────── */
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const showToast = useCallback(
    (msg: string, type: 'error' | 'success' = 'error') => setToast({ message: msg, type }),
    [],
  );

  /* ── Real-time flash counter ─────────────────────────────────────── */
  const [flashKey, setFlashKey] = useState(0);

  const tables: Table[] = state?.tables ?? [];
  const queue: QueueEntry[] = state?.queue ?? [];
  const orders: Order[] = state?.orders ?? state?.kitchenOrders ?? [];
  const tablesLoading = stateLoading;
  const queueLoading = stateLoading;

  const readyOrders = useMemo(() => {
    return orders.filter((o: Order) => o.status === 'ready');
  }, [orders]);

  /* ── Derived ─────────────────────────────────────────────────────── */
  const activeQueue = useMemo(
    () =>
      queue
        .filter((e) => ['waiting', 'notified', 'on_my_way'].includes(e.status))
        .sort((a, b) => a.position - b.position),
    [queue],
  );

  const queueMap = useMemo(() => {
    const m = new Map<string, QueueEntry>();
    queue.forEach((e) => m.set(e._id, e));
    return m;
  }, [queue]);

  const tableStats = useMemo(() => {
    const s = { available: 0, occupied: 0, cleaning: 0, ready: 0 } as Record<Table['status'], number>;
    tables.forEach((t) => s[t.status]++);
    return s;
  }, [tables]);

  /* ── Mutations ───────────────────────────────────────────────────── */
  const updateStatus = useMutation({
    mutationFn: ({ tableId, status }: { tableId: string; status: 'occupied' | 'cleaning' | 'ready' }) =>
      api.updateTableStatus(tableId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantSync', user!.restaurantId] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Failed to update table'),
  });

  const cancelEntry = useMutation({
    mutationFn: (entryId: string) => api.cancelQueue(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantSync', user!.restaurantId] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Failed to cancel entry'),
  });

  /* ── Sync refresh trigger ─────────────────────────────────────────── */
  useEffect(() => {
    setFlashKey((k) => k + 1);
  }, [state]);

  /* ── Handlers ────────────────────────────────────────────────────── */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isTableMutating = (id: string) =>
    updateStatus.isPending && updateStatus.variables?.tableId === id;

  /* ── Guard ───────────────────────────────────────────────────────── */
  if (!user) return null;

  /* ══════════════════════════════════════════════════════════════════ */
  /*  Render                                                          */
  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-stone-100">
      {/* ── Inline keyframes for toast ── */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ───────────────────────── HEADER ──────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/70 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1680px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
          {/* Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-md shadow-brand-600/20">
              <Armchair className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <h1 className="font-display font-bold text-lg text-stone-900">Staff Panel</h1>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Live
              </div>
            </div>
          </div>

          {/* Table summary chips – hidden on small screens */}
          <nav className="hidden md:flex items-center gap-1.5">
            {(['available', 'occupied', 'cleaning', 'ready'] as const).map((s) => (
              <span
                key={s}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${TABLE_STATUS[s].badge}`}
              >
                {tableStats[s]}
                <span className="hidden xl:inline font-semibold normal-case">
                  {TABLE_STATUS[s].label}
                </span>
              </span>
            ))}
          </nav>

          {/* Right: clock · user · logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-stone-400 font-mono tabular-nums">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(clock)}
            </div>
            <div className="hidden sm:block h-5 w-px bg-stone-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center">
                <UserCircle className="w-[18px] h-[18px] text-brand-600" />
              </div>
              <span className="hidden sm:inline text-sm font-medium text-stone-700 max-w-[120px] truncate">
                {user.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Kitchen Ready Alert Banner */}
      {readyOrders.length > 0 && (
        <div className="max-w-[1680px] mx-auto px-4 lg:px-6 pt-4">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-lg">
                🔥
              </div>
              <div>
                <h3 className="font-display font-extrabold text-base">
                  {readyOrders.length} Kitchen Order(s) Hot & Ready!
                </h3>
                <p className="text-xs text-emerald-100">
                  {readyOrders
                    .map((o: Order) => {
                      const qe = typeof o.queueEntryId === 'object' ? o.queueEntryId : null;
                      return `${qe?.customer?.name || 'Guest'} (${o.items.length} items)`;
                    })
                    .join(' • ')}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-white text-emerald-800 px-3.5 py-1.5 rounded-xl uppercase tracking-wider shadow">
              Serve to Table
            </span>
          </div>
        </div>
      )}

      {/* ───────────────────────── MAIN CONTAINER ───────────────────── */}
      <main className="max-w-[1680px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ════════════ TABLE GRID (left 65%) ════════════ */}
          <section className="lg:w-[65%] min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl text-stone-800 flex items-center gap-2">
                <Armchair className="w-5 h-5 text-brand-600" />
                Floor Plan
              </h2>
              <span className="text-sm text-stone-400">
                {tables.length} table{tables.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Loading */}
            {tablesLoading && (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonTableCard key={i} />
                ))}
              </div>
            )}

            {/* Empty */}
            {!tablesLoading && tables.length === 0 && (
              <div className="card p-12 text-center">
                <Armchair className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="font-semibold text-stone-500">No tables configured</p>
                <p className="text-sm text-stone-400 mt-1">Add tables from the admin dashboard</p>
              </div>
            )}

            {/* Grid */}
            {!tablesLoading && tables.length > 0 && (
              <div
                key={`tables-${flashKey}`}
                className="grid grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {tables.map((table) => {
                  const cfg = TABLE_STATUS[table.status];
                  const assigned = table.currentQueueEntryId
                    ? queueMap.get(table.currentQueueEntryId)
                    : undefined;
                  const mutating = isTableMutating(table._id);

                  return (
                    <div
                      key={table._id}
                      className={`bg-white rounded-2xl shadow-sm p-5 border-2 transition-all duration-300
                        hover:shadow-md group ${cfg.border} ${cfg.bg} ${cfg.ring}`}
                    >
                      {/* ── Row 1: number + badge ── */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-extrabold text-stone-800 tracking-tight">
                            T{table.number}
                          </span>
                          {table.status === 'ready' && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${cfg.badge}`}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      {/* ── Row 2: capacity ── */}
                      <div className="flex items-center gap-1.5 text-stone-500 text-sm mb-1">
                        <Users className="w-4 h-4" />
                        <span>Capacity: {table.capacity}</span>
                      </div>

                      {/* ── Assigned guest pill ── */}
                      {assigned && (
                        <div className="flex items-center gap-2 mt-2 mb-4 px-3 py-2 rounded-lg bg-brand-50 border border-brand-100">
                          <UserCircle className="w-4 h-4 text-brand-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-brand-800 truncate">
                              {assigned.customer.name}
                            </p>
                            <p className="text-[11px] text-brand-600">
                              {assigned.partySize} guest{assigned.partySize > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ── Action button ── */}
                      <div className="mt-4 min-h-[48px] flex items-stretch">
                        {cfg.buttonLabel && cfg.nextStatus ? (
                          <button
                            onClick={() =>
                              updateStatus.mutate({ tableId: table._id, status: cfg.nextStatus! })
                            }
                            disabled={mutating}
                            className={`${cfg.buttonClass} w-full text-sm ${
                              mutating ? 'opacity-60 cursor-wait' : ''
                            }`}
                          >
                            {mutating ? (
                              <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Updating…
                              </>
                            ) : (
                              cfg.buttonLabel
                            )}
                          </button>
                        ) : (
                          /* Ready state – no button */
                          <div className="w-full flex items-center justify-center gap-1.5 text-sm text-emerald-600 font-medium select-none">
                            <Sparkles className="w-4 h-4" />
                            Awaiting guest
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ════════════ QUEUE SIDEBAR (right 35%) ════════════ */}
          <section className="lg:w-[35%] min-w-0">
            <div className="lg:sticky lg:top-[88px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-xl text-stone-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-600" />
                  Queue
                  {activeQueue.length > 0 && (
                    <span className="ml-0.5 text-sm font-extrabold text-brand-700 bg-brand-100 px-2.5 py-0.5 rounded-full">
                      {activeQueue.length}
                    </span>
                  )}
                </h2>
                <span className="text-sm text-stone-400">
                  {activeQueue.filter((e) => e.status === 'waiting').length} waiting
                </span>
              </div>

              {/* Loading */}
              {queueLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonQueueItem key={i} />
                  ))}
                </div>
              )}

              {/* Empty */}
              {!queueLoading && activeQueue.length === 0 && (
                <div className="card p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-8 h-8 text-stone-300" />
                  </div>
                  <p className="font-semibold text-stone-500">No one in queue</p>
                  <p className="text-sm text-stone-400 mt-1">
                    New entries will appear here in real-time
                  </p>
                </div>
              )}

              {/* Queue list */}
              {!queueLoading && activeQueue.length > 0 && (
                <div
                  key={`queue-${flashKey}`}
                  className="space-y-3 max-h-[calc(100vh-160px)] lg:max-h-[calc(100vh-200px)] overflow-y-auto pr-1"
                >
                  {activeQueue.map((entry) => {
                    const cancelling =
                      cancelEntry.isPending && cancelEntry.variables === entry._id;

                    return (
                      <div
                        key={entry._id}
                        className={`card p-4 transition-all duration-300 hover:shadow-md ${
                          entry.status === 'on_my_way'
                            ? 'border-emerald-300 bg-emerald-50/30'
                            : entry.status === 'notified'
                              ? 'border-amber-200'
                              : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Position circle */}
                          <div className="shrink-0 w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                            <span className="text-sm font-extrabold text-stone-700">
                              #{entry.position}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Name + badge */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-stone-800 truncate">
                                {entry.customer.name}
                              </span>
                              <span
                                className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  QUEUE_BADGE[entry.status] ?? 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                {QUEUE_LABEL[entry.status] ?? entry.status}
                              </span>
                            </div>

                            {/* Party size + wait time */}
                            <div className="flex items-center gap-4 text-xs text-stone-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {entry.partySize} guest{entry.partySize !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer className="w-3.5 h-3.5" />
                                ~{entry.estimatedWaitMinutes} min
                              </span>
                            </div>

                            {/* Meta row */}
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(entry.joinedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {entry.customer.phone.slice(-4)}
                              </span>
                              {(entry.status === 'notified' || entry.status === 'on_my_way') &&
                                entry.assignedTableId && (
                                  <span
                                    className={`font-bold ${
                                      entry.status === 'on_my_way'
                                        ? 'text-emerald-600'
                                        : 'text-amber-600'
                                    }`}
                                  >
                                    &rarr; T{entry.assignedTableId.number}
                                  </span>
                                )}
                            </div>
                          </div>

                          {/* Cancel button */}
                          <button
                            onClick={() => cancelEntry.mutate(entry._id)}
                            disabled={cancelling}
                            className="shrink-0 mt-0.5 p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Remove from queue"
                          >
                            {cancelling ? (
                              <span className="w-4 h-4 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin block" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
