import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
  Receipt,
  Plus,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useRestaurantState } from '../hooks/useRestaurantState';
import BillReceiptModal from '../components/BillReceiptModal';
import type { Table, QueueEntry, Order, MenuItem } from '../types';

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

  const { data: myRest } = useQuery({
    queryKey: ['myRestaurantStaffHeader', user?.restaurantId],
    queryFn: () => api.getMyRestaurant().catch(() => null),
    enabled: !!user,
  });
  const restaurantName = myRest?.restaurant?.name || 'Staff Panel';

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

  const [billModalOrder, setBillModalOrder] = useState<{ order: Order; entry?: QueueEntry } | null>(null);
  const [addDishesEntry, setAddDishesEntry] = useState<QueueEntry | null>(null);
  const [staffCart, setStaffCart] = useState<Record<string, number>>({});
  const [staffNotes, setStaffNotes] = useState<Record<string, string>>({});
  const [isAddingDishes, setIsAddingDishes] = useState(false);

  const { data: menuData } = useQuery({
    queryKey: ['staffPanelMenuData', user?.restaurantId],
    queryFn: () => api.getOwnerMenu().catch(() => ({ categories: [], items: [] })),
    enabled: !!addDishesEntry,
  });
  const menuCategories = menuData?.categories ?? [];

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
              <h1 className="font-display font-bold text-lg text-stone-900 flex items-center gap-2">
                <span className="text-brand-600 font-extrabold">{restaurantName}</span>
                <span className="text-stone-400 font-normal text-sm">— Staff Panel</span>
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Live Sync Active
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
                        hover:shadow-md group ${assigned ? 'border-amber-400 bg-amber-50/30 ring-2 ring-amber-200/80' : `${cfg.border} ${cfg.bg} ${cfg.ring}`}`}
                    >
                      {/* ── Row 1: number + badge ── */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-extrabold text-stone-800 tracking-tight">
                            T{table.number}
                          </span>
                          {(table.status === 'ready' || assigned) && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                            assigned ? 'bg-amber-100 text-amber-800 border border-amber-300' : cfg.badge
                          }`}
                        >
                          {assigned ? `Reserved (${assigned.customer.name})` : cfg.label}
                        </span>
                      </div>

                      {/* ── Row 2: capacity ── */}
                      <div className="flex items-center gap-1.5 text-stone-500 text-sm mb-1">
                        <Users className="w-4 h-4" />
                        <span>Capacity: {table.capacity}</span>
                      </div>

                      {/* ── Assigned guest pill ── */}
                      {assigned && (
                        <div className="flex items-center gap-2 mt-2 mb-4 px-3 py-2 rounded-lg bg-amber-100/70 border border-amber-300">
                          <UserCircle className="w-4 h-4 text-amber-700 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-amber-900 truncate">
                              {assigned.customer.name}
                            </p>
                            <p className="text-[11px] text-amber-700 font-semibold">
                              {assigned.partySize} guest{assigned.partySize > 1 ? 's' : ''} • Table Assigned
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ── Action button ── */}
                      <div className="mt-4 min-h-[48px] flex items-stretch">
                        {assigned ? (
                          <button
                            onClick={() =>
                              updateStatus.mutate({ tableId: table._id, status: 'occupied' })
                            }
                            disabled={mutating}
                            className="w-full text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow transition"
                          >
                            {mutating ? 'Seating Guest…' : `Seat ${assigned.customer.name} (Mark Seated)`}
                          </button>
                        ) : cfg.buttonLabel && cfg.nextStatus ? (
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

                            {/* In-Dining Order Action Buttons for Staff */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 mt-2">
                              {entry.assignedTableId && (
                                <button
                                  onClick={() => {
                                    const targetTableId = typeof entry.assignedTableId === 'object' ? (entry.assignedTableId as any)._id : entry.assignedTableId;
                                    const tableNum = typeof entry.assignedTableId === 'object' ? entry.assignedTableId.number : '';
                                    updateStatus.mutate({ tableId: targetTableId, status: 'occupied' });
                                    showToast(`Seated ${entry.customer.name} at Table T${tableNum}!`, 'success');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                                >
                                  <Armchair className="w-3 h-3 text-white" />
                                  <span>Seat at T{typeof entry.assignedTableId === 'object' ? entry.assignedTableId.number : ''}</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setAddDishesEntry(entry);
                                  setStaffCart({});
                                  setStaffNotes({});
                                }}
                                className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-bold border border-orange-200 transition flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3 text-orange-600" />
                                <span>Add Dishes to Table</span>
                              </button>

                              {entry.preOrderId && (
                                <button
                                  onClick={() => {
                                    const targetOrder = orders.find((o) => o._id === (typeof entry.preOrderId === 'object' ? entry.preOrderId._id : entry.preOrderId)) || (typeof entry.preOrderId === 'object' ? entry.preOrderId : null);
                                    if (targetOrder) {
                                      setBillModalOrder({ order: targetOrder, entry });
                                    } else {
                                      showToast('Order details loading...');
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                                >
                                  <Receipt className="w-3 h-3 text-amber-400" />
                                  <span>Print / View Bill PDF</span>
                                </button>
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

      {/* Bill Receipt Printable Modal */}
      {billModalOrder && (
        <BillReceiptModal
          restaurantName={restaurantName}
          entry={billModalOrder.entry}
          order={billModalOrder.order}
          onClose={() => setBillModalOrder(null)}
        />
      )}

      {/* Staff Add Dishes Modal */}
      {addDishesEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-stone-900 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-stone-900 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                  Add In-Dining Dishes for {addDishesEntry.customer.name}
                </h3>
                <p className="text-xs text-stone-500">Select dishes to add to this active dining table order</p>
              </div>
              <button onClick={() => setAddDishesEntry(null)} className="text-stone-400 hover:text-stone-900 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {menuCategories.map((cat: any) => (
                <div key={cat._id} className="space-y-2">
                  <h4 className="font-bold text-xs text-stone-500 uppercase tracking-wider">{cat.name}</h4>
                  <div className="space-y-2">
                    {cat.items.map((item: MenuItem) => {
                      const qty = staffCart[item._id] || 0;
                      return (
                        <div key={item._id} className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 bg-stone-50/50">
                          <div>
                            <p className="font-bold text-xs text-stone-900">{item.name}</p>
                            <p className="text-xs font-mono text-orange-600 font-bold">₹{item.price}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {qty > 0 && (
                              <button
                                onClick={() => setStaffCart((prev) => ({ ...prev, [item._id]: Math.max(0, qty - 1) }))}
                                className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 font-bold text-xs"
                              >
                                -
                              </button>
                            )}
                            {qty > 0 && <span className="font-mono font-bold text-xs px-1">{qty}</span>}
                            <button
                              onClick={() => setStaffCart((prev) => ({ ...prev, [item._id]: qty + 1 }))}
                              className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">
                Selected: {Object.values(staffCart).reduce((a, b) => a + b, 0)} items
              </span>
              <button
                onClick={async () => {
                  const targetOrderId = typeof addDishesEntry.preOrderId === 'object' ? addDishesEntry.preOrderId._id : addDishesEntry.preOrderId;
                  const itemsToAdd = Object.entries(staffCart)
                    .filter(([_, qty]) => qty > 0)
                    .map(([menuItemId, qty]) => ({ menuItemId, qty, notes: staffNotes[menuItemId] }));
                  if (itemsToAdd.length === 0) return;

                  setIsAddingDishes(true);
                  try {
                    if (targetOrderId) {
                      await api.addOrderItems(targetOrderId, itemsToAdd);
                    } else {
                      await api.preOrder(addDishesEntry._id, itemsToAdd);
                    }
                    showToast('Dishes added to table order successfully!', 'success');
                    setAddDishesEntry(null);
                    queryClient.invalidateQueries({ queryKey: ['restaurantSync', user!.restaurantId] });
                  } catch (err) {
                    showToast('Failed to add dishes');
                  } finally {
                    setIsAddingDishes(false);
                  }
                }}
                disabled={isAddingDishes || Object.values(staffCart).reduce((a, b) => a + b, 0) === 0}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50"
              >
                {isAddingDishes ? 'Adding...' : 'Confirm & Add to Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
