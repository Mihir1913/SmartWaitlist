import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCodeModal from '../components/QRCodeModal';
import {
  Users,
  Clock,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  IndianRupee,
  Armchair,
  LogOut,
  Activity,
  Filter,
  BarChart3,
  Table2,
  Phone,
  UtensilsCrossed,
  UserPlus,
  Store,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  X,
  MapPin,
  Check,
  AlertCircle,
  FolderPlus,
  Building,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRestaurantState } from '../hooks/useRestaurantState';
import { api } from '../lib/api';
import type {
  DashboardStats,
  QueueEntry,
  Table as Tbl,
  MenuCategory,
  MenuItem,
  StaffUser,
  Restaurant,
} from '../types';

type TabKey = 'overview' | 'queue' | 'tables' | 'menu' | 'staff' | 'profile';

function formatINR(amount: number): string {
  return 'Rs ' + amount.toLocaleString('en-IN');
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

const statusColors: Record<string, string> = {
  waiting: 'bg-blue-100 text-blue-700',
  notified: 'bg-amber-100 text-amber-700',
  on_my_way: 'bg-green-100 text-green-700',
  seated: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-600',
};

const statusLabels: Record<string, string> = {
  waiting: 'Waiting',
  notified: 'Notified',
  on_my_way: 'On My Way',
  seated: 'Seated',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<TabKey>('overview');
  const [queueFilter, setQueueFilter] = useState('all');

  const { data: myRest } = useQuery({
    queryKey: ['myRestaurantAdminHeader', user?.restaurantId],
    queryFn: () => api.getMyRestaurant().catch(() => null),
    enabled: !!user,
  });
  const currentRestaurantName = myRest?.restaurant?.name || 'Restaurant Dashboard';

  const { state, isLoading } = useRestaurantState();
  const stats = state?.stats;
  const queueEntries = state?.queue ?? [];
  const tablesData = { tables: state?.tables ?? [] };
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Hourly chart data
  const hourlyChart = useMemo(() => {
    if (!stats?.hourlyData) return [];
    const hours = Array.from({ length: 12 }, (_, i) => i + 11); // 11 AM to 10 PM
    const dataMap: Record<number, number> = {};
    stats.hourlyData.forEach((h: { _id: number; count: number }) => {
      dataMap[h._id] = h.count;
    });
    const maxCount = Math.max(1, ...Object.values(dataMap));
    return hours.map((h) => ({
      hour: h,
      count: dataMap[h] || 0,
      height: ((dataMap[h] || 0) / maxCount) * 100,
    }));
  }, [stats?.hourlyData]);

  // Filtered queue entries
  const filteredEntries = useMemo(() => {
    if (!queueEntries) return [];
    if (queueFilter === 'all') return queueEntries;
    return queueEntries.filter((e: QueueEntry) => e.status === queueFilter);
  }, [queueEntries, queueFilter]);

  const tabs: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'queue', label: 'Queue Activity', icon: Activity },
    { key: 'tables', label: 'Tables', icon: Table2 },
    { key: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
    { key: 'staff', label: 'Staff Team', icon: Users },
    { key: 'profile', label: 'Restaurant Info', icon: Store },
  ];

  const kpis = stats?.kpis || {
    extraCoversPerHour: 0,
    avgWaitReduction: 0,
    walkawayReduction: 0,
    turnoverIncrease: 0,
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white">
              <Store className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-surface-900 flex items-center gap-2">
                <span className="text-brand-600 font-extrabold">{currentRestaurantName}</span>
                <span className="text-stone-400 font-medium text-base">— Owner Admin Panel</span>
              </h1>
              <p className="text-xs text-stone-500">Live Management & Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-surface-900">{user?.name || 'Owner'}</p>
              <p className="text-xs text-stone-500">{user?.email}</p>
            </div>
            <button
              onClick={async () => {
                if (confirm('Clear all dummy queue entries and reset tables to available?')) {
                  try {
                    await api.clearDummyData();
                    window.location.reload();
                  } catch (err) {
                    alert('Failed to clear dummy data');
                  }
                }
              }}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition"
              title="Clear sample waitlist data"
            >
              Clear Dummy Data
            </button>
            <button onClick={logout} className="btn-ghost flex items-center gap-2 text-stone-600">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Sub-header Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto border-t border-stone-100">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  active
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="p-12 text-center text-stone-400">Loading dashboard...</div>
        ) : tab === 'overview' ? (
          <OverviewTab
            stats={stats}
            kpis={kpis}
            hourlyChart={hourlyChart}
            today={today}
            queueEntries={queueEntries}
          />
        ) : tab === 'queue' ? (
          <QueueTab
            filteredEntries={filteredEntries}
            queueFilter={queueFilter}
            setQueueFilter={setQueueFilter}
          />
        ) : tab === 'tables' ? (
          <TablesTab tables={tablesData.tables} stats={stats} />
        ) : tab === 'menu' ? (
          <MenuTab />
        ) : tab === 'staff' ? (
          <StaffTab />
        ) : (
          <ProfileTab />
        )}
      </main>
    </div>
  );
}

/* ─────────────── Overview Tab ─────────────── */
function OverviewTab({
  stats,
  kpis,
  hourlyChart,
  today,
  queueEntries,
}: {
  stats?: DashboardStats;
  kpis: any;
  hourlyChart: any[];
  today: string;
  queueEntries: QueueEntry[];
}) {
  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold font-display text-surface-900">Today's Summary</h2>
          <p className="text-stone-500 text-sm mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* Financial ROI & Impact Executive Summary */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-white rounded-3xl p-6 border border-stone-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              💰
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Monthly ROI & Financial Impact Summary
              </h3>
              <p className="text-xs text-stone-400">
                Estimated revenue & operational time saved using SmartWaitlist
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
            SaaS Value Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 text-center space-y-1">
            <div className="text-xs text-stone-400 font-medium">Extra Covers / Month</div>
            <div className="font-display text-2xl font-extrabold text-emerald-400">+420 Guests</div>
            <div className="text-[11px] text-emerald-500 font-semibold">+14 tables served daily</div>
          </div>

          <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 text-center space-y-1">
            <div className="text-xs text-stone-400 font-medium">Wait Time Saved</div>
            <div className="font-display text-2xl font-extrabold text-amber-400">14 Mins/Guest</div>
            <div className="text-[11px] text-amber-500 font-semibold">Faster table turnover</div>
          </div>

          <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 text-center space-y-1">
            <div className="text-xs text-stone-400 font-medium">Pre-Order Revenue</div>
            <div className="font-display text-2xl font-extrabold text-blue-400">₹28,500/Mo</div>
            <div className="text-[11px] text-blue-500 font-semibold">Pre-cooked before seating</div>
          </div>

          <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 text-center space-y-1">
            <div className="text-xs text-stone-400 font-medium">Walkaway Reduction</div>
            <div className="font-display text-2xl font-extrabold text-purple-400">65% Saved</div>
            <div className="text-[11px] text-purple-500 font-semibold">WhatsApp live updates</div>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Queue</span>
            <Users className="w-5 h-5 text-brand-600" />
          </div>
          <div className="text-3xl font-extrabold text-surface-900">{stats?.activeQueue ?? 0}</div>
          <p className="text-xs text-stone-500 mt-1">Waiting customers right now</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Seated Today</span>
            <Armchair className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-surface-900">{stats?.seatedToday ?? 0}</div>
          <p className="text-xs text-stone-500 mt-1">Guests accommodated</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Walkaway Rate</span>
            <TrendingDown className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-surface-900">
            {stats?.walkawayRate ?? 0}%
          </div>
          <p className="text-xs text-stone-500 mt-1">Cancelled queue entries</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Revenue Today</span>
            <IndianRupee className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-surface-900">
            {formatINR(stats?.revenueToday ?? 0)}
          </div>
          <p className="text-xs text-stone-500 mt-1">From {stats?.ordersToday ?? 0} pre-orders</p>
        </div>
      </div>

      {/* Hourly Activity & Recent Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-display font-semibold text-surface-900 mb-4">
            Hourly Traffic Volume
          </h3>
          <div className="h-48 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-stone-200">
            {hourlyChart.map((item) => (
              <div
                key={item.hour}
                className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
              >
                <div
                  className="w-full bg-brand-500 group-hover:bg-brand-600 rounded-t transition-all duration-300 min-h-[4px]"
                  style={{ height: `${item.height}%` }}
                />
                <span className="text-[10px] text-stone-400 font-medium">{item.hour}:00</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-semibold text-surface-900 mb-4">Live Waiting List</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {queueEntries.slice(0, 5).map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100"
              >
                <div>
                  <p className="text-sm font-semibold text-surface-900">{entry.customer.name}</p>
                  <p className="text-xs text-stone-500">
                    {entry.partySize} guests • ~{entry.estimatedWaitMinutes}m wait
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[entry.status]
                  }`}
                >
                  {statusLabels[entry.status]}
                </span>
              </div>
            ))}
            {queueEntries.length === 0 && (
              <p className="text-xs text-stone-400 text-center py-4">No active waitlist entries</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Queue Tab ─────────────── */
function QueueTab({
  filteredEntries,
  queueFilter,
  setQueueFilter,
}: {
  filteredEntries: QueueEntry[];
  queueFilter: string;
  setQueueFilter: (val: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200">
        <h3 className="font-display font-bold text-surface-900 text-lg">Queue Entries Log</h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={queueFilter}
            onChange={(e) => setQueueFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-sm text-surface-900 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="waiting">Waiting</option>
            <option value="notified">Notified</option>
            <option value="on_my_way">On My Way</option>
            <option value="seated">Seated</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntries.map((entry) => (
          <div key={entry._id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-surface-900">{entry.customer.name}</p>
                <p className="text-sm text-stone-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" /> {entry.customer.phone}
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  statusColors[entry.status]
                }`}
              >
                {statusLabels[entry.status]}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-stone-600 mt-3">
              <span>Position #{entry.position}</span>
              <span>{entry.partySize} guests</span>
              <span>~{entry.estimatedWaitMinutes} min</span>
            </div>
          </div>
        ))}
        {filteredEntries.length === 0 && (
          <div className="col-span-full card p-12 text-center text-stone-400">
            No entries found matching filter.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Tables Tab ─────────────── */
function TablesTab({ tables: initialTables, stats }: { tables: Tbl[]; stats?: DashboardStats }) {
  const [tablesList, setTablesList] = useState<Tbl[]>(initialTables);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState<number>(4);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setTablesList(initialTables);
  }, [initialTables]);

  const statusConfig: Record<string, { label: string; bg: string; border: string }> = {
    available: { label: 'Available', bg: 'bg-emerald-50', border: 'border-emerald-400' },
    occupied: { label: 'Occupied', bg: 'bg-red-50', border: 'border-red-400' },
    cleaning: { label: 'Cleaning', bg: 'bg-amber-50', border: 'border-amber-400' },
    ready: { label: 'Ready', bg: 'bg-green-50', border: 'border-green-400' },
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.createTable(tableNumber, Number(capacity));
      setSuccessMsg(`Table "${tableNumber}" created successfully!`);
      setTablesList((prev) => [...prev, res.table]);
      setShowAddModal(false);
      setTableNumber('');
      setCapacity(4);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (tableId: string, newStatus: 'occupied' | 'cleaning' | 'ready') => {
    try {
      const res = await api.updateTableStatus(tableId, newStatus);
      setTablesList((prev) =>
        prev.map((t) => (t._id === tableId ? { ...t, status: res.table.status } : t))
      );
    } catch (err) {
      setError('Failed to update table status');
    }
  };

  const handleDeleteTable = async (tableId: string, numberStr: string) => {
    if (!confirm(`Are you sure you want to delete Table ${numberStr}?`)) return;
    try {
      await api.deleteTable(tableId);
      setTablesList((prev) => prev.filter((t) => t._id !== tableId));
      setSuccessMsg(`Deleted Table ${numberStr}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to delete table');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display text-surface-900">
            Dining Tables Layout ({tablesList.length})
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure tables and update live statuses (Occupied, Cleaning, Ready)
          </p>
        </div>

        <button
          onClick={() => {
            setTableNumber(`T${tablesList.length + 1}`);
            setShowAddModal(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Table
        </button>
      </div>

      {/* Table Cards Grid */}
      {tablesList.length === 0 ? (
        <div className="card p-12 text-center">
          <Table2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-stone-700">No tables created yet</h3>
          <p className="text-stone-500 text-sm mt-1">
            Create your dining tables (e.g. T1 with 2 seats, T2 with 4 seats) to start managing queue assignments.
          </p>
          <button
            onClick={() => {
              setTableNumber('T1');
              setShowAddModal(true);
            }}
            className="btn-primary mt-4 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create First Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tablesList.map((table) => {
            const cfg = statusConfig[table.status] || statusConfig.available;
            return (
              <div
                key={table._id}
                className={`bg-white rounded-2xl border ${cfg.border} shadow-sm p-4 flex flex-col justify-between space-y-3 relative group`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-2xl font-bold text-surface-900">
                      {table.number}
                    </div>
                    <div className="text-xs text-stone-500 font-medium">{table.capacity} Guests Capacity</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        statusColors[table.status] || 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {cfg.label}
                    </span>
                    <button
                      onClick={() => handleDeleteTable(table._id, table.number)}
                      className="p-1 text-stone-300 hover:text-red-600 transition rounded"
                      title="Delete Table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick Status Control Buttons */}
                <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-1">
                  {table.status !== 'occupied' && (
                    <button
                      onClick={() => handleUpdateStatus(table._id, 'occupied')}
                      className="text-[11px] font-semibold px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition"
                    >
                      Seat Guests
                    </button>
                  )}
                  {table.status !== 'cleaning' && (
                    <button
                      onClick={() => handleUpdateStatus(table._id, 'cleaning')}
                      className="text-[11px] font-semibold px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition"
                    >
                      Cleaning
                    </button>
                  )}
                  {table.status !== 'ready' && (
                    <button
                      onClick={() => handleUpdateStatus(table._id, 'ready')}
                      className="text-[11px] font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                    >
                      Mark Ready
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD TABLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-surface-900 text-lg">Add Dining Table</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Table Number / Label *
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. T1, T2, Outdoor-A"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Seating Capacity (Guests) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost text-stone-600"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Menu Management Tab ─────────────── */
function MenuTab() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  const [showAddItem, setShowAddItem] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);

  // Item Form state
  const [itemName, setItemName] = useState('');
  const [itemCatId, setItemCatId] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState<number>(100);
  const [itemPrepTime, setItemPrepTime] = useState<number>(15);
  const [itemGst, setItemGst] = useState<number>(5);
  const [itemAvailable, setItemAvailable] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await api.getOwnerMenu();
      setCategories(data.categories);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCategory(categoryName, categories.length + 1);
      setSuccessMsg(`Category "${categoryName}" created!`);
      setCategoryName('');
      setShowAddCategory(false);
      loadMenu();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const openAddItemModal = (catId?: string) => {
    setEditItem(null);
    setItemName('');
    setItemCatId(catId || categories[0]?._id || '');
    setItemDesc('');
    setItemPrice(150);
    setItemPrepTime(15);
    setItemGst(5);
    setItemAvailable(true);
    setShowAddItem(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditItem(item);
    setItemName(item.name);
    setItemCatId(item.categoryId);
    setItemDesc(item.description || '');
    setItemPrice(item.price);
    setItemPrepTime(item.prepTimeMinutes || 15);
    setItemGst(item.gstRate || 5);
    setItemAvailable(item.isAvailable);
    setShowAddItem(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editItem) {
        await api.updateMenuItem(editItem._id, {
          categoryId: itemCatId,
          name: itemName,
          description: itemDesc,
          price: Number(itemPrice),
          prepTimeMinutes: Number(itemPrepTime),
          gstRate: Number(itemGst),
          isAvailable: itemAvailable,
        });
        setSuccessMsg(`Item "${itemName}" updated!`);
      } else {
        await api.createMenuItem({
          categoryId: itemCatId,
          name: itemName,
          description: itemDesc,
          price: Number(itemPrice),
          prepTimeMinutes: Number(itemPrepTime),
          gstRate: Number(itemGst),
          isAvailable: itemAvailable,
        });
        setSuccessMsg(`New item "${itemName}" added!`);
      }
      setShowAddItem(false);
      loadMenu();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await api.updateMenuItem(item._id, { isAvailable: !item.isAvailable });
      loadMenu();
    } catch (err) {
      setError('Failed to update availability');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.deleteMenuItem(id);
      setSuccessMsg('Menu item deleted');
      loadMenu();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}" and all items in it?`)) return;
    try {
      await api.deleteCategory(id);
      setSuccessMsg(`Deleted category "${name}"`);
      loadMenu();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display text-surface-900">Menu & Pricing</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your restaurant items, prices, and availability for pre-ordering
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddCategory(true)}
            className="btn-ghost border border-stone-200 text-stone-700 flex items-center gap-2 text-sm"
          >
            <FolderPlus className="w-4 h-4 text-brand-600" />
            Add Category
          </button>
          <button
            onClick={() => openAddItemModal()}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-stone-400">Loading menu items...</div>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-stone-700">No categories created yet</h3>
          <p className="text-stone-500 text-sm mt-1">
            Create your first menu category (e.g. Starters, Main Course) to get started.
          </p>
          <button
            onClick={() => setShowAddCategory(true)}
            className="btn-primary mt-4 inline-flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" /> Add Category
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => {
            const categoryItems = items.filter(
              (item) => String(item.categoryId) === String(cat._id)
            );
            return (
              <div
                key={cat._id}
                className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                    <h3 className="text-lg font-bold text-surface-900">{cat.name}</h3>
                    <span className="text-xs text-stone-400">({categoryItems.length} items)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAddItemModal(cat._id)}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 px-3 py-1 bg-brand-50 rounded-lg transition"
                    >
                      + Add Item to {cat.name}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat._id, cat.name)}
                      className="text-stone-400 hover:text-red-600 p-1 transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryItems.map((item) => (
                    <div
                      key={item._id}
                      className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                        item.isAvailable
                          ? 'bg-stone-50/60 border-stone-200'
                          : 'bg-stone-100/70 border-stone-300 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-surface-900 text-base">{item.name}</h4>
                          <span className="font-bold text-brand-600 text-base whitespace-nowrap">
                            Rs {item.price}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-stone-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {item.prepTimeMinutes || 15}m prep
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-stone-200/60 mt-3">
                        <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isAvailable}
                            onChange={() => toggleAvailability(item)}
                            className="rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                          />
                          <span>{item.isAvailable ? 'Available' : 'Unavailable'}</span>
                        </label>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditItemModal(item)}
                            className="p-1.5 text-stone-500 hover:text-brand-600 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {categoryItems.length === 0 && (
                    <div className="col-span-full py-4 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
                      No items in this category yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-surface-900 text-lg">Add Menu Category</h3>
              <button
                onClick={() => setShowAddCategory(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Chef Specials, Desserts, Beverages"
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="btn-ghost text-stone-600"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT ITEM MODAL */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-surface-900 text-lg">
                {editItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setShowAddItem(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Category *</label>
                <select
                  required
                  value={itemCatId}
                  onChange={(e) => setItemCatId(e.target.value)}
                  className="input"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Paneer Butter Masala"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Short dish description, ingredients..."
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Price (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={itemPrepTime}
                    onChange={(e) => setItemPrepTime(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="itemAvail"
                  checked={itemAvailable}
                  onChange={(e) => setItemAvailable(e.target.checked)}
                  className="rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="itemAvail" className="text-xs text-stone-700 cursor-pointer">
                  Available for Pre-Ordering immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="btn-ghost text-stone-600"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : editItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Staff Team Tab ─────────────── */
function StaffTab() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'kitchen' | 'owner'>('staff');
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await api.getRestaurantStaff();
      setStaff(data.staff);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.createStaffUser({ name, email, password, role });
      setSuccessMsg(`Created ${role} account for ${name}`);
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('staff');
      loadStaff();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string, staffName: string) => {
    if (!confirm(`Are you sure you want to remove ${staffName}?`)) return;
    try {
      await api.deleteStaffUser(id);
      setSuccessMsg(`Removed staff member ${staffName}`);
      loadStaff();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff member');
    }
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display text-surface-900">Staff & Team Accounts</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage table management staff and kitchen display operators
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center justify-center gap-2 text-sm"
        >
          <UserPlus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-stone-400">Loading team list...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <div key={s._id} className="card p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-surface-900 text-base">{s.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      s.role === 'owner'
                        ? 'bg-amber-100 text-amber-800'
                        : s.role === 'kitchen'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {s.role}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">{s.email}</p>
              </div>

              {s.role !== 'owner' && (
                <button
                  onClick={() => handleDeleteStaff(s._id, s.name)}
                  className="p-1.5 text-stone-400 hover:text-red-600 transition rounded-lg"
                  title="Delete User Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-surface-900 text-lg">Add Team Account</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@spicegarden.com"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="input"
                >
                  <option value="staff">Staff (Table Management Panel)</option>
                  <option value="kitchen">Kitchen (Kitchen Display)</option>
                  <option value="owner">Owner (Full Admin Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost text-stone-600"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Profile Tab ─────────────── */
function ProfileTab() {
  const { state } = useRestaurantState();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [address, setAddress] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [description, setDescription] = useState('');
  const [openingHours, setOpeningHours] = useState('11:00 AM - 11:00 PM');
  const [cuisine, setCuisine] = useState('Multi-Cuisine & Dining');
  const [avgTurnover, setAvgTurnover] = useState(45);
  const [maxQueue, setMaxQueue] = useState(50);
  const [preOrder, setPreOrder] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    // Load logged in owner's restaurant details
    api
      .getMyRestaurant()
      .then((res) => {
        if (res.restaurant) {
          setName(res.restaurant.name);
          setSlug(res.restaurant.slug);
          setAddress(res.restaurant.address);
          setWhatsappPhone(res.restaurant.whatsappPhone || '');
          setDescription(res.restaurant.description || '');
          setOpeningHours(res.restaurant.openingHours || '11:00 AM - 11:00 PM');
          setCuisine(res.restaurant.cuisine || 'Multi-Cuisine & Dining');
          setAvgTurnover(res.restaurant.settings?.avgTurnoverMinutes || 45);
          setMaxQueue(res.restaurant.settings?.maxQueueSize || 50);
          setPreOrder(res.restaurant.settings?.preOrderEnabled ?? true);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await api.updateMyRestaurant({
        name,
        address,
        whatsappPhone,
        description,
        openingHours,
        cuisine,
        settings: {
          avgTurnoverMinutes: Number(avgTurnover),
          maxQueueSize: Number(maxQueue),
          preOrderEnabled: preOrder,
        },
      });
      setMsg('Restaurant details updated successfully!');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update restaurant profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Official QR Standee Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold font-display">Official Customer QR Standee</h3>
            <p className="text-xs text-orange-100 mt-0.5">
              Print or download your official QR Code standee to place on tables & entry counters.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowQR(true)}
          className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-5 py-2.5 rounded-xl shadow text-sm whitespace-nowrap transition transform active:scale-95 flex items-center gap-2"
        >
          <QrCode className="w-4 h-4" /> View & Print QR Standee
        </button>
      </div>

      {showQR && (
        <QRCodeModal
          restaurantName={name || 'Restaurant'}
          slug={slug || ''}
          address={address}
          whatsappPhone={whatsappPhone}
          onClose={() => setShowQR(false)}
        />
      )}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{msg}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Live WhatsApp Message Template Previewer */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 border border-stone-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            💬
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white">WhatsApp Notification Template Preview</h3>
            <p className="text-xs text-stone-400">Live preview of messages dispatched to waiting guests</p>
          </div>
        </div>

        {/* WhatsApp Phone Mockup */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 text-xs font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 text-emerald-300 font-bold">
            <span>WhatsApp Business Verified API</span>
            <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400">Live Template</span>
          </div>

          <div className="bg-stone-900 p-3.5 rounded-xl border border-stone-800 text-stone-200 leading-relaxed space-y-1.5">
            <p className="font-bold text-emerald-400">Hello Rahul Sharma! 👋</p>
            <p>
              You are successfully added to the queue at <strong className="text-white">{name || 'Your Restaurant'}</strong>!
            </p>
            <p className="text-amber-300 font-semibold pt-1">
              📍 Position: #1 in line • Est Wait: ~12 Mins
            </p>
            <p className="text-stone-400 text-[11px] pt-1">
              Tap link to track live cooking progress & menu pre-orders:
            </p>
            <p className="text-blue-400 underline font-semibold text-[11px] break-all">
              https://mihir1913.github.io/SmartWaitlist/status/6a7440bd44cadb267d9e225a
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold font-display text-surface-900">
            Restaurant Profile & Details
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure how your restaurant appears to guests joining the waitlist
          </p>
        </div>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                WhatsApp Phone *
              </label>
              <input
                type="text"
                required
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Cuisine Type / Category
              </label>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="e.g. North Indian, Fine Dining"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Opening Hours
              </label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="e.g. 11:00 AM - 11:00 PM"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Restaurant Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your dining atmosphere, specialties, or welcome message..."
              className="input"
            />
          </div>

          <div className="border-t border-stone-100 pt-4 space-y-4">
            <h3 className="text-sm font-bold text-surface-900">Waitlist Operational Settings</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Avg Turnover Time (minutes)
                </label>
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={avgTurnover}
                  onChange={(e) => setAvgTurnover(Number(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Max Queue Capacity
                </label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={maxQueue}
                  onChange={(e) => setMaxQueue(Number(e.target.value))}
                  className="input"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="profPreOrder"
                checked={preOrder}
                onChange={(e) => setPreOrder(e.target.checked)}
                className="rounded border-stone-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="profPreOrder" className="text-xs text-stone-700 cursor-pointer">
                Allow customers to pre-order food items while waiting in queue
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-stone-100">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving Changes...' : 'Save Profile Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
