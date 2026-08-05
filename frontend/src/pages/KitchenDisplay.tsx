import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Flame,
  CheckCircle2,
  Clock,
  Users,
  UtensilsCrossed,
  ChefHat,
  GripVertical,
  ArrowRight,
  Sparkles,
  Check,
  RefreshCw,
  AlertCircle,
  Volume2,
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

type OrderStatus = 'confirmed' | 'cooking' | 'ready' | 'completed';

interface KanbanColumn {
  id: OrderStatus;
  title: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  icon: typeof Flame;
  allowedNextStatus?: OrderStatus;
  buttonLabel?: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'confirmed',
    title: 'New Pre-Orders',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400 border-blue-500/30',
    borderColor: 'border-blue-500/40',
    icon: UtensilsCrossed,
    allowedNextStatus: 'cooking',
    buttonLabel: 'Start Cooking',
  },
  {
    id: 'cooking',
    title: 'Cooking In Progress',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400 border-amber-500/30',
    borderColor: 'border-amber-500/40',
    icon: Flame,
    allowedNextStatus: 'ready',
    buttonLabel: 'Mark Ready',
  },
  {
    id: 'ready',
    title: 'Ready for Pickup',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400 border-emerald-500/30',
    borderColor: 'border-emerald-500/40',
    icon: CheckCircle2,
    allowedNextStatus: 'completed',
    buttonLabel: 'Serve Order',
  },
  {
    id: 'completed',
    title: 'Served / Completed',
    badgeBg: 'bg-stone-500/20',
    badgeText: 'text-stone-400 border-stone-500/30',
    borderColor: 'border-stone-500/40',
    icon: Check,
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   Draggable Order Card
   ═══════════════════════════════════════════════════════════════════════ */

function DraggableOrderCard({
  order,
  onStatusChange,
  onDragStart,
}: {
  order: Order;
  onStatusChange: (id: string, nextStatus: OrderStatus) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const qe = getQe(order);
  const dualReady = order.triggers?.tableReady && order.triggers?.customerOnMyWay;
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleItem = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const currentCol = KANBAN_COLUMNS.find((c) => c.id === order.status);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, order._id)}
      className="bg-stone-900 border border-stone-700/80 hover:border-orange-500/60 rounded-2xl p-4 text-stone-100 shadow-lg cursor-grab active:cursor-grabbing transition-all hover:shadow-orange-500/10 group space-y-3 relative overflow-hidden"
    >
      {/* Dual Trigger Flash Bar */}
      {dualReady && order.status === 'confirmed' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400 animate-pulse" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="text-stone-500 group-hover:text-stone-300 transition">
            <GripVertical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">
                {qe?.customer?.name ?? 'Guest'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
                #{qe?.position ?? 'Queue'}
              </span>
            </div>
            <p className="text-xs text-stone-400 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-orange-400" />
                {qe?.partySize ?? 2} guests
              </span>
              {qe?.assignedTableId && typeof qe.assignedTableId === 'object' && (
                <span className="font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  T{qe.assignedTableId.number}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Elapsed Timer */}
        <div className="text-right">
          <div className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-lg">
            <Clock className="w-3 h-3" />
            {formatElapsed(order.createdAt || new Date().toISOString())}
          </div>
        </div>
      </div>

      {/* Order Items List */}
      <div className="bg-stone-950/80 rounded-xl p-3 border border-stone-800 space-y-2">
        {order.items.map((item, idx) => (
          <div
            key={idx}
            onClick={() => toggleItem(idx)}
            className="flex items-center justify-between text-xs cursor-pointer select-none py-1 border-b border-stone-900 last:border-0"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                  checkedItems[idx]
                    ? 'bg-emerald-500 border-emerald-400 text-stone-950'
                    : 'border-stone-600 bg-stone-900 text-transparent'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span
                className={`font-semibold ${
                  checkedItems[idx] ? 'line-through text-stone-500' : 'text-stone-200'
                }`}
              >
                {item.qty}x {item.name}
              </span>
            </div>
            {item.notes && (
              <span className="text-[11px] text-amber-300 italic font-mono">
                {item.notes}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Triggers Status Bar */}
      <div className="flex items-center justify-between text-[11px] bg-stone-800/60 p-2 rounded-xl border border-stone-700/50">
        <span className="text-stone-400 font-medium">Triggers Status:</span>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full font-bold ${
              order.triggers?.tableReady
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : 'bg-stone-900 text-stone-500'
            }`}
          >
            Table Ready
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-bold ${
              order.triggers?.customerOnMyWay
                ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                : 'bg-stone-900 text-stone-500'
            }`}
          >
            On My Way
          </span>
        </div>
      </div>

      {/* Action Button for direct tap */}
      {currentCol?.allowedNextStatus && currentCol?.buttonLabel && (
        <button
          onClick={() => onStatusChange(order._id, currentCol.allowedNextStatus!)}
          className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition transform active:scale-98"
        >
          <span>{currentCol.buttonLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Kitchen Display Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function KitchenDisplay() {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;
  const [now, setNow] = useState(Date.now());
  const [dragOverCol, setDragOverCol] = useState<OrderStatus | null>(null);
  const [movingOrderId, setMovingOrderId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  const queryClient = useQueryClient();

  // Socket sync hook
  const { state, isLoading } = useRestaurantState((event, data) => {
    if (event === 'order:created') {
      setNotificationMsg('🔔 New Pre-Order Received!');
      setTimeout(() => setNotificationMsg(''), 4000);
    } else if (event === 'order:cooking') {
      setNotificationMsg('🔥 Order Moved to Cooking!');
      setTimeout(() => setNotificationMsg(''), 3000);
    } else if (event === 'order:ready') {
      setNotificationMsg('✅ Order Marked Ready for Pickup!');
      setTimeout(() => setNotificationMsg(''), 3000);
    }
  });

  // Clock tick for timer updates
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const orders: Order[] = state?.orders ?? state?.kitchenOrders ?? [];

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setMovingOrderId(orderId);
    try {
      await api.updateOrderStatus(orderId, nextStatus);
      if (restaurantId) {
        queryClient.invalidateQueries({ queryKey: ['restaurantSync', restaurantId] });
      }
    } catch (err) {
      console.error('Failed to move order:', err);
    } finally {
      setMovingOrderId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: OrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const orderId = e.dataTransfer.getData('text/plain');
    if (orderId) {
      handleStatusChange(orderId, targetStatus);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Kitchen Display Top Navigation Bar */}
      <header className="bg-stone-900 border-b border-stone-800 px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl text-white flex items-center gap-2">
              Kitchen Display System (KDS)
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Live Sync Active
              </span>
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Drag & Drop Orders to Update Live Cooking Status Across Staff Tablets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {notificationMsg && (
            <div className="bg-orange-500/20 border border-orange-500/40 text-orange-300 px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>{notificationMsg}</span>
            </div>
          )}

          <div className="text-right">
            <div className="font-mono text-lg font-bold text-orange-400">
              {formatNow(now)}
            </div>
            <div className="text-xs text-stone-500">Real-Time Sync</div>
          </div>
        </div>
      </header>

      {/* Main Kanban Drag & Drop Columns Grid */}
      <main className="flex-1 p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 h-full min-w-[1100px]">
          {KANBAN_COLUMNS.map((col) => {
            const ColumnIcon = col.icon;
            const columnOrders = orders.filter((o) => o.status === col.id);
            const isOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`bg-stone-900/60 border-2 ${
                  isOver
                    ? 'border-orange-500 bg-orange-500/5 shadow-2xl scale-[1.01]'
                    : col.borderColor
                } rounded-3xl p-4 flex flex-col gap-4 transition-all duration-200 min-h-[600px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${col.badgeBg} ${col.badgeText}`}>
                      <ColumnIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-white text-base">
                        {col.title}
                      </h2>
                      <p className="text-[11px] text-stone-500">
                        {columnOrders.length} orders
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${col.badgeBg} ${col.badgeText} border`}
                  >
                    {columnOrders.length}
                  </span>
                </div>

                {/* Column Orders List */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {columnOrders.length === 0 ? (
                    <div className="h-44 border-2 border-dashed border-stone-800 rounded-2xl flex flex-col items-center justify-center text-center p-4 text-stone-600 space-y-2">
                      <ColumnIcon className="w-8 h-8 opacity-30" />
                      <p className="text-xs font-medium">Drag order card here</p>
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <DraggableOrderCard
                        key={order._id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        onDragStart={handleDragStart}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}