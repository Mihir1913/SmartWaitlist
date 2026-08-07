import { useState, useEffect, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
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
  Ban,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useRestaurantState } from '../hooks/useRestaurantState';
import type { Order, MenuItem } from '../types';

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
    title: 'Ready for Table',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400 border-emerald-500/30',
    borderColor: 'border-emerald-500/40',
    icon: CheckCircle2,
    allowedNextStatus: 'completed',
    buttonLabel: 'Serve / Complete',
  },
  {
    id: 'completed',
    title: 'Served / Completed',
    badgeBg: 'bg-stone-800',
    badgeText: 'text-stone-400 border-stone-700',
    borderColor: 'border-stone-800',
    icon: CheckCircle2,
  },
];

function KitchenOrderCard({
  order,
  column,
  onStatusChange,
  isMoving,
  onDragStart,
}: {
  order: Order;
  column: KanbanColumn;
  onStatusChange: (id: string, status: OrderStatus) => void;
  isMoving: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const qe = getQe(order);

  const toggleItem = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, order._id)}
      className={`bg-stone-900 rounded-2xl p-4 border transition-all duration-200 shadow-xl space-y-3 cursor-grab active:cursor-grabbing ${
        column.borderColor
      } ${isMoving ? 'opacity-50 scale-95' : 'hover:border-orange-500/50'}`}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-stone-600 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-extrabold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-500/30">
                #{order.orderNumber || order._id.slice(-4).toUpperCase()}
              </span>
              <span className="font-bold text-sm text-white">
                {qe?.customer?.name || 'Guest'}
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

      {/* Action Button */}
      {column.allowedNextStatus && column.buttonLabel && (
        <button
          disabled={isMoving}
          onClick={() => onStatusChange(order._id, column.allowedNextStatus!)}
          className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
        >
          <span>{column.buttonLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default function KitchenDisplay() {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  const [now, setNow] = useState(Date.now());
  const [movingOrderId, setMovingOrderId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<OrderStatus | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [showStockOutModal, setShowStockOutModal] = useState(false);

  const { state } = useRestaurantState((event: string, data: unknown) => {
    if (event === 'order:created') {
      const order = data as Order;
      setNotificationMsg(`🔔 New Pre-Order #${order?.orderNumber || 'New'} Received!`);
      setTimeout(() => setNotificationMsg(null), 5000);
    }
  });

  const { data: menuData, refetch: refetchMenu } = useQuery({
    queryKey: ['restaurantMenuKds', restaurantId],
    queryFn: () => api.getRestaurant('spice-garden'),
  });

  const restaurantName = menuData?.restaurant?.name || 'Spice Garden';

  const menuCategories = menuData?.menu ?? [];

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

  const handleToggleItemAvailability = async (item: MenuItem) => {
    try {
      await api.updateMenuItem(item._id, { isAvailable: !item.isAvailable });
      refetchMenu();
    } catch {
      alert('Failed to update dish availability');
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
              <span className="text-orange-400 font-black">{restaurantName}</span>
              <span className="text-stone-400 font-medium font-display text-base">— Kitchen Display System (KDS)</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Live Sync Active
              </span>
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Drag & Drop Orders to Update Live Cooking Status Across Staff Tablets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowStockOutModal(true)}
            className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/50 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Ban className="w-4 h-4 text-red-400" />
            <span>Quick 86 / Stock-Out Dishes</span>
          </button>

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

      {/* Kanban Grid */}
      <main className="flex-1 p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full min-w-[1000px]">
          {KANBAN_COLUMNS.map((col) => {
            const ColumnIcon = col.icon;
            const colOrders = orders.filter((o) => {
              if (col.id === 'completed') return o.status === 'completed' || o.status === 'served';
              return o.status === col.id;
            });
            const isTarget = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`bg-stone-900/60 border rounded-3xl p-4 flex flex-col transition-all ${
                  isTarget ? 'border-orange-500 bg-stone-900/90 ring-2 ring-orange-500/30' : 'border-stone-800/80'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <ColumnIcon className="w-5 h-5 text-orange-400" />
                    <h2 className="font-display font-bold text-sm text-stone-200">{col.title}</h2>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${col.badgeBg} ${col.badgeText}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-4 overflow-y-auto pr-1 min-h-[400px]">
                  {colOrders.map((order) => (
                    <KitchenOrderCard
                      key={order._id}
                      order={order}
                      column={col}
                      onStatusChange={handleStatusChange}
                      isMoving={movingOrderId === order._id}
                      onDragStart={handleDragStart}
                    />
                  ))}

                  {colOrders.length === 0 && (
                    <div className="h-48 border-2 border-dashed border-stone-800/60 rounded-2xl flex flex-col items-center justify-center text-stone-600 text-xs">
                      No orders in this column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Quick 86 Stock Out Modal */}
      {showStockOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-stone-100 animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-400" />
                <h3 className="font-display font-bold text-base text-white">86 / Disable Dishes (Stock Out)</h3>
              </div>
              <button onClick={() => setShowStockOutModal(false)} className="text-stone-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {menuCategories.map((cat) => (
                <div key={cat._id}>
                  <h4 className="font-bold text-xs uppercase text-stone-500 tracking-wider mb-2">{cat.name}</h4>
                  <div className="space-y-2">
                    {cat.items.map((item: MenuItem) => (
                      <div key={item._id} className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs text-stone-200">{item.name}</p>
                          <p className="text-[11px] text-stone-500">₹{item.price}</p>
                        </div>
                        <button
                          onClick={() => handleToggleItemAvailability(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            item.isAvailable
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 hover:bg-red-950 hover:text-red-400'
                              : 'bg-red-950 text-red-400 border border-red-500/40 hover:bg-emerald-950 hover:text-emerald-400'
                          }`}
                        >
                          {item.isAvailable ? 'In Stock (Available)' : '86-ed (Sold Out)'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}