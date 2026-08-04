import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flame,
  CheckCircle2,
  Circle,
  Clock,
  Users,
  UtensilsCrossed,
  ChefHat,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useRestaurantState } from '../hooks/useRestaurantState';
import type { Order } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */

function formatElapsed(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function formatNow(now: number): string {
  return new Date(now).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function getQe(order: Order) {
  return typeof order.queueEntryId === 'object' && order.queueEntryId !== null
    ? order.queueEntryId
    : null;
}

/* ═══════════════════════════════════════════════════════════════════════
   Flash tracker – records order IDs that just arrived / transitioned
   ═══════════════════════════════════════════════════════════════════════ */

function useFlashTracker() {
  const [flashes, setFlashes] = useState<Record<string, 'blue' | 'green'>>({});

  const flash = useCallback((id: string, color: 'blue' | 'green') => {
    setFlashes((prev) => ({ ...prev, [id]: color }));
    setTimeout(() => {
      setFlashes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 1500);
  }, []);

  return { flashes, flash };
}

/* ═══════════════════════════════════════════════════════════════════════
   Order Card
   ═══════════════════════════════════════════════════════════════════════ */

function OrderCard({
  order,
  flashColor,
  onStartCooking,
  onMarkReady,
  cookingElapsed,
}: {
  order: Order;
  flashColor?: 'blue' | 'green';
  onStartCooking: (id: string) => void;
  onMarkReady: (id: string) => void;
  cookingElapsed: string | null;
}) {
  const qe = getQe(order);
  const dualReady = order.triggers.tableReady && order.triggers.customerOnMyWay;

  const borderColor =
    order.status === 'ready'
      ? 'border-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
      : order.status === 'cooking'
        ? 'border-amber-500'
        : '';

  const flashClass = flashColor === 'blue'
    ? 'animate-flash-blue'
    : flashColor === 'green'
      ? 'animate-flash-green'
      : '';

  return (
    <div
      className={`card bg-gray-900 border border-gray-700 ${borderColor} ${flashClass} flex flex-col gap-2 p-3 text-sm select-none`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-8 min-w-[2rem] rounded-lg bg-gray-700 text-base font-bold text-white">
            #{qe?.position ?? '—'}
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-white text-base">
              {qe?.customer?.name ?? 'Guest'}
            </p>
            <p className="text-gray-400 text-xs flex items-center gap-1">
              <Users size={12} />
              Table for {qe?.partySize ?? '?'}
              {qe?.assignedTableId && typeof qe.assignedTableId === 'object' && (
                <span className="ml-1 text-brand-600 font-medium">
                  T{qe.assignedTableId.number}
                </span>
              )}
            </p>
          </div>
        </div>
        {qe?.joinedAt && (
          <span className="text-gray-500 text-xs flex items-center gap-1">
            <Clock size={12} />
            {formatElapsed(qe.joinedAt)}
          </span>
        )}
      </div>

      {/* Dual trigger indicator (only for confirmed) */}
      {order.status === 'confirmed' && (
        <div className="flex items-center gap-3 rounded-lg bg-gray-800 px-2.5 py-1.5">
          <span className="flex items-center gap-1.5 text-xs">
            {order.triggers.tableReady ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <Circle size={16} className="text-gray-500" />
            )}
            <span className={order.triggers.tableReady ? 'text-emerald-400' : 'text-gray-500'}>
              Table Ready
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            {order.triggers.customerOnMyWay ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <Circle size={16} className="text-gray-500" />
            )}
            <span className={order.triggers.customerOnMyWay ? 'text-emerald-400' : 'text-gray-500'}>
              On Way
            </span>
          </span>
          {dualReady && (
            <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 rounded px-2 py-0.5">
              Ready to Cook
            </span>
          )}
        </div>
      )}

      {/* Items */}
      <ul className="flex flex-col gap-1">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-gray-200">
            <span className="inline-flex items-center justify-center h-5 min-w-[1.5rem] rounded bg-gray-700 text-[11px] font-bold text-gray-300 shrink-0 mt-0.5">
              x{item.qty}
            </span>
            <div className="leading-tight">
              <span className="font-medium text-white">{item.name}</span>
              {item.notes && (
                <p className="text-amber-400/80 text-xs italic">{item.notes}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-700/60">
        <span className="text-base font-bold text-white">₹{order.total}</span>
        {order.status === 'cooking' && cookingElapsed && (
          <span className="flex items-center gap-1 text-amber-400 font-mono text-xs font-semibold">
            <Flame size={14} />
            {cookingElapsed}
          </span>
        )}
        {order.status === 'ready' && order.readyAt && (
          <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 size={14} />
            {formatElapsed(order.readyAt)} ago
          </span>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-1">
        {order.status === 'confirmed' && dualReady && (
          <button
            onClick={() => onStartCooking(order._id)}
            className="btn btn-primary w-full py-3 text-base font-bold animate-pulse rounded-xl"
          >
            <Flame size={18} className="mr-1.5" />
            Start Cooking
          </button>
        )}
        {order.status === 'cooking' && (
          <button
            onClick={() => onMarkReady(order._id)}
            className="btn btn-success w-full py-3 text-base font-bold rounded-xl"
          >
            <CheckCircle2 size={18} className="mr-1.5" />
            Mark Ready
          </button>
        )}
        {order.status === 'ready' && (
          <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-sm py-2 rounded-xl bg-emerald-400/10">
            <UtensilsCrossed size={16} />
            SERVED
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Column
   ═══════════════════════════════════════════════════════════════════════ */

function Column({
  title,
  icon,
  count,
  orders,
  accentColor,
  emptyMessage,
  onStartCooking,
  onMarkReady,
  flashes,
  cookingTimers,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  orders: Order[];
  accentColor: string;
  emptyMessage: string;
  onStartCooking: (id: string) => void;
  onMarkReady: (id: string) => void;
  flashes: Record<string, 'blue' | 'green'>;
  cookingTimers: Record<string, string>;
}) {
  return (
    <div className="flex flex-col min-w-0">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 pb-2 mb-2 border-b-2" style={{ borderColor: accentColor }}>
        {icon}
        <h2 className="text-lg font-bold text-white tracking-wide uppercase">{title}</h2>
        <span
          className="ml-auto inline-flex items-center justify-center h-7 min-w-[1.75rem] rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1" style={{ scrollbarWidth: 'thin' }}>
        {orders.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-600 text-sm italic">{emptyMessage}</p>
          </div>
        )}
        {orders.map((o) => (
          <OrderCard
            key={o._id}
            order={o}
            flashColor={flashes[o._id]}
            onStartCooking={onStartCooking}
            onMarkReady={onMarkReady}
            cookingElapsed={o.status === 'cooking' ? (cookingTimers[o._id] ?? null) : null}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   KitchenDisplay (default export)
   ═══════════════════════════════════════════════════════════════════════ */

export default function KitchenDisplay() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { flashes, flash } = useFlashTracker();
  const [now, setNow] = useState(Date.now());
  const prevOrderIds = useRef<Set<string>>(new Set());

  // Tick every second for timers & clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { state, isLoading } = useRestaurantState((event, data) => {
    if (event === 'order:cooking' || event === 'order:ready') {
      const payload = data as { order?: Order };
      if (payload?.order) {
        flash(payload.order._id, 'green');
      }
    }
  });

  const orders: Order[] = state?.kitchenOrders ?? [];

  /* ── Detect new orders for flash ────────────────────────────────── */
  useEffect(() => {
    const currentIds = new Set(orders.map((o) => o._id));
    for (const id of currentIds) {
      if (!prevOrderIds.current.has(id)) {
        flash(id, 'blue');
      }
    }
    prevOrderIds.current = currentIds;
    // Only run when orders reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, flash]);

  /* ── Socket ─────────────────────────────────────────────────────── */
  /* Real-time sync is handled by the shared restaurant state hook */

  /* ── Mutations ──────────────────────────────────────────────────── */
  const startCookingMutation = useMutation({
    mutationFn: (orderId: string) => api.startCooking(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantSync', user?.restaurantId] });
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: (orderId: string) => api.markOrderReady(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantSync', user?.restaurantId] });
    },
  });

  /* ── Derived columns (FIFO – oldest first) ──────────────────────── */
  const confirmed = orders
    .filter((o) => o.status === 'confirmed')
    .sort((a, b) => {
      const qeA = getQe(a);
      const qeB = getQe(b);
      return (qeA?.position ?? Infinity) - (qeB?.position ?? Infinity);
    });

  const cooking = orders
    .filter((o) => o.status === 'cooking')
    .sort((a, b) => new Date(a.cookingStartedAt!).getTime() - new Date(b.cookingStartedAt!).getTime());

  const ready = orders
    .filter((o) => o.status === 'ready')
    .sort((a, b) => new Date(a.readyAt!).getTime() - new Date(b.readyAt!).getTime());

  /* ── Cooking timers ─────────────────────────────────────────────── */
  const cookingTimers: Record<string, string> = {};
  for (const o of cooking) {
    if (o.cookingStartedAt) {
      cookingTimers[o._id] = formatElapsed(o.cookingStartedAt);
    }
  }

  /* ── Loading ────────────────────────────────────────────────────── */
  if (isLoading || !user) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <ChefHat size={48} className="text-gray-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes flash-blue {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
          30% { box-shadow: 0 0 24px 6px rgba(59,130,246,0.5); }
          60% { box-shadow: 0 0 12px 2px rgba(59,130,246,0.25); }
        }
        @keyframes flash-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
          30% { box-shadow: 0 0 24px 6px rgba(16,185,129,0.55); }
          60% { box-shadow: 0 0 12px 2px rgba(16,185,129,0.25); }
        }
        .animate-flash-blue { animation: flash-blue 1.5s ease-out; }
        .animate-flash-green { animation: flash-green 1.5s ease-out; }
      `}</style>

      {/* ── Top Bar ── */}
      <header className="flex items-center gap-4 px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <Flame size={24} className="text-orange-400" />
          <h1 className="text-xl font-bold tracking-tight">Kitchen Display</h1>
        </div>

        {/* Count badges */}
        <div className="flex items-center gap-2 ml-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">
            {confirmed.length} New
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">
            {cooking.length} Cooking
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
            {ready.length} Ready
          </span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <span className="text-gray-400 text-sm font-mono tabular-nums">{formatNow(now)}</span>
          <span className="text-gray-500 text-sm">{user.name}</span>
        </div>
      </header>

      {/* ── Main 3-column layout ── */}
      <main className="flex-1 grid grid-cols-3 gap-4 p-4 min-h-0">
        <Column
          title="New Orders"
          icon={<Clock size={20} className="text-blue-400" />}
          count={confirmed.length}
          orders={confirmed}
          accentColor="#3b82f6"
          emptyMessage="No new orders"
          onStartCooking={(id) => startCookingMutation.mutate(id)}
          onMarkReady={markReadyMutation.mutate}
          flashes={flashes}
          cookingTimers={cookingTimers}
        />

        <Column
          title="Cooking"
          icon={<Flame size={20} className="text-amber-400" />}
          count={cooking.length}
          orders={cooking}
          accentColor="#f59e0b"
          emptyMessage="Nothing cooking"
          onStartCooking={startCookingMutation.mutate}
          onMarkReady={markReadyMutation.mutate}
          flashes={flashes}
          cookingTimers={cookingTimers}
        />

        <Column
          title="Ready"
          icon={<CheckCircle2 size={20} className="text-emerald-400" />}
          count={ready.length}
          orders={ready}
          accentColor="#10b981"
          emptyMessage="Nothing ready"
          onStartCooking={startCookingMutation.mutate}
          onMarkReady={markReadyMutation.mutate}
          flashes={flashes}
          cookingTimers={cookingTimers}
        />
      </main>
    </div>
  );
}