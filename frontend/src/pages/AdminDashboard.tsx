import { useState, useMemo } from 'react';

import {
  LayoutDashboard,
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRestaurantState } from '../hooks/useRestaurantState';
import type { DashboardStats, QueueEntry, Table as Tbl } from '../types';

type TabKey = 'overview' | 'queue' | 'tables';

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
    stats.hourlyData.forEach((h: { _id: number; count: number }) => { dataMap[h._id] = h.count; });
    const maxCount = Math.max(1, ...Object.values(dataMap));
    return hours.map((h) => ({ hour: h, count: dataMap[h] || 0, height: ((dataMap[h] || 0) / maxCount) * 100 }));
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
  ];

  const kpis = stats?.kpis || { extraCoversPerHour: 0, avgWaitReduction: 0, walkawayReduction: 0, turnoverIncrease: 0 };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-surface-900">Admin Dashboard</h1>
              <p className="text-xs text-stone-500">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-600 hidden sm:inline">{user?.name}</span>
            <button onClick={logout} className="btn-secondary text-sm py-2 px-3 gap-1.5">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-stone-200 rounded w-24 mb-3" />
                <div className="h-8 bg-stone-200 rounded w-16" />
              </div>
            ))}
          </div>
        ) : tab === 'overview' ? (
          <OverviewTab
            stats={stats!}
            kpis={kpis}
            hourlyChart={hourlyChart}
          />
        ) : tab === 'queue' ? (
          <QueueTab
            entries={filteredEntries}
            filter={queueFilter}
            onFilterChange={setQueueFilter}
          />
        ) : (
          <TablesTab tables={(tablesData as { tables: Tbl[] } | undefined)?.tables || []} stats={stats} />
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
}: {
  stats: DashboardStats;
  kpis: DashboardStats['kpis'];
  hourlyChart: { hour: number; count: number; height: number }[];
}) {
  const kpiCards = [
    { label: 'Extra Covers/Hour', value: String(kpis.extraCoversPerHour), icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Avg Wait Reduction', value: `-${kpis.avgWaitReduction} min`, icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { label: 'Walkaway Reduction', value: `-${kpis.walkawayReduction}%`, icon: TrendingDown, color: 'text-amber-600 bg-amber-50' },
    { label: 'Turnover Increase', value: `+${kpis.turnoverIncrease}%`, icon: RefreshCw, color: 'text-purple-600 bg-purple-50' },
  ];

  const statCards = [
    { label: 'Active Queue', value: stats.activeQueue, icon: Users, color: 'text-brand-600' },
    { label: 'Seated Today', value: stats.seatedToday, icon: Armchair, color: 'text-emerald-600' },
    { label: 'Revenue Today', value: formatINR(stats.revenueToday), icon: IndianRupee, color: 'text-green-600' },
    {
      label: 'Walkaway Rate',
      value: `${stats.walkawayRate}%`,
      icon: AlertTriangle,
      color: stats.walkawayRate > 20 ? 'text-red-600' : 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Impact Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <div className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <div className="font-display text-2xl font-bold text-surface-900 mb-0.5">{kpi.value}</div>
            <div className="text-sm text-stone-500">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Today's Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-stone-500">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Hourly Activity Chart + Recent Activity */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Hourly Chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-display font-semibold text-surface-900 mb-4">Today's Queue Activity</h3>
          <div className="flex items-end gap-1.5 h-[200px] border-b border-stone-200 pb-1">
            {hourlyChart.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full">
                {h.count > 0 && (
                  <span className="text-[10px] font-medium text-stone-500 mb-1">{h.count}</span>
                )}
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${h.count > 0 ? 'bg-brand-500' : 'bg-stone-100'}`}
                  style={{ height: `${Math.max(h.count > 0 ? h.height : 4, 4)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-1">
            {hourlyChart.filter((_, i) => i % 2 === 0).map((h) => (
              <div key={h.hour} className="flex-1 text-center text-[10px] text-stone-400">
                {h.hour}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="lg:col-span-3 card p-6">
          <h3 className="font-display font-semibold text-surface-900 mb-4">Recent Queue Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="text-left pb-2 font-medium">Time</th>
                  <th className="text-left pb-2 font-medium">Customer</th>
                  <th className="text-left pb-2 font-medium hidden sm:table-cell">Party</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium hidden md:table-cell">Table</th>
                  <th className="text-right pb-2 font-medium hidden sm:table-cell">Wait</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEntries.map((entry: QueueEntry) => (
                  <tr key={entry._id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                    <td className="py-2.5 text-stone-600 whitespace-nowrap">{formatTime(entry.joinedAt)}</td>
                    <td className="py-2.5 font-medium text-surface-900">{entry.customer.name}</td>
                    <td className="py-2.5 text-stone-600 hidden sm:table-cell">{entry.partySize} guests</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[entry.status]}`}>
                        {statusLabels[entry.status]}
                      </span>
                    </td>
                    <td className="py-2.5 text-stone-600 hidden md:table-cell">
                      {entry.assignedTableId ? (entry.assignedTableId as { number: string }).number : '-'}
                    </td>
                    <td className="py-2.5 text-stone-600 text-right hidden sm:table-cell">~{entry.estimatedWaitMinutes} min</td>
                  </tr>
                ))}
                {stats.recentEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      No activity today yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Queue Activity Tab ─────────────── */
function QueueTab({
  entries,
  filter,
  onFilterChange,
}: {
  entries: QueueEntry[];
  filter: string;
  onFilterChange: (f: string) => void;
}) {
  const filters = [
    { value: 'all', label: 'All' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'notified', label: 'Notified' },
    { value: 'on_my_way', label: 'On My Way' },
    { value: 'seated', label: 'Seated' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Group entries by status
  const grouped = entries.reduce<Record<string, QueueEntry[]>>((acc, entry) => {
    const s = entry.status;
    if (!acc[s]) acc[s] = [];
    acc[s].push(entry);
    return acc;
  }, {});

  return (
    <div>
      {/* Filter Row */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-stone-400 flex-shrink-0" />
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-brand-600 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Entry Cards */}
      <div className="space-y-3">
        {filter === 'all' ? (
          // Grouped view
          Object.entries(grouped).map(([status, items]) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
                  {statusLabels[status]}
                </span>
                <span className="text-sm text-stone-400">({items.length})</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {items.map((entry) => (
                  <QueueCard key={entry._id} entry={entry} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entries.map((entry) => (
              <QueueCard key={entry._id} entry={entry} />
            ))}
          </div>
        )}

        {entries.length === 0 && (
          <div className="card p-12 text-center">
            <Activity className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">No queue entries found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QueueCard({ entry }: { entry: QueueEntry }) {
  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-surface-900">{entry.customer.name}</p>
          <p className="text-sm text-stone-500 flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3" />
            XXXX{entry.customer.phone.slice(-4)}
          </p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[entry.status]}`}>
          {statusLabels[entry.status]}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-stone-600 mt-3">
        <span>#{entry.position}</span>
        <span>{entry.partySize} guests</span>
        <span>~{entry.estimatedWaitMinutes} min</span>
        <span className="ml-auto text-stone-400">{timeAgo(entry.joinedAt)}</span>
      </div>
      {entry.assignedTableId && (
        <div className="mt-2 pt-2 border-t border-stone-100 text-sm">
          <span className="text-stone-500">Table: </span>
          <span className="font-medium text-brand-600">{(entry.assignedTableId as { number: string }).number}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Tables Tab ─────────────── */
function TablesTab({ tables, stats }: { tables: Tbl[]; stats?: DashboardStats }) {
  const statusConfig: Record<string, { label: string; bg: string; border: string }> = {
    available: { label: 'Available', bg: 'bg-emerald-100', border: 'border-emerald-300' },
    occupied: { label: 'Occupied', bg: 'bg-red-50', border: 'border-red-300' },
    cleaning: { label: 'Cleaning', bg: 'bg-amber-50', border: 'border-amber-300' },
    ready: { label: 'Ready', bg: 'bg-green-50', border: 'border-green-300' },
  };

  const counts = tables.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const total = tables.length || 1;
  const inUse = counts.occupied || 0;

  return (
    <div className="space-y-6">
      {/* Utilization Bar */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-surface-900 mb-4">Table Utilization</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-stone-500">{inUse} of {tables.length} tables in use</span>
          <span className="text-sm font-medium text-surface-900">{Math.round((inUse / total) * 100)}%</span>
        </div>
        <div className="h-4 bg-stone-100 rounded-full overflow-hidden flex">
          <div className="bg-red-400 transition-all duration-500" style={{ width: `${((counts.occupied || 0) / total) * 100}%` }} />
          <div className="bg-amber-400 transition-all duration-500" style={{ width: `${((counts.cleaning || 0) / total) * 100}%` }} />
          <div className="bg-emerald-400 transition-all duration-500" style={{ width: `${((counts.ready || 0) / total) * 100}%` }} />
          <div className="bg-stone-200 flex-1" />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-stone-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Occupied ({counts.occupied || 0})</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400" /> Cleaning ({counts.cleaning || 0})</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400" /> Ready ({counts.ready || 0})</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-stone-200" /> Available ({counts.available || 0})</span>
        </div>
      </div>

      {/* Table Grid (Read-Only) */}
      <div>
        <h3 className="font-display font-semibold text-surface-900 mb-4">All Tables</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {tables.map((table) => {
            const cfg = statusConfig[table.status];
            return (
              <div
                key={table._id}
                className={`card p-4 border-l-4 ${cfg.border} ${cfg.bg} text-center`}
              >
                <div className="font-display text-2xl font-bold text-surface-900">{table.number}</div>
                <div className="text-sm text-stone-500 mt-1">{table.capacity} seats</div>
                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[table.status]}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
          {tables.length === 0 && (
            <div className="col-span-full card p-12 text-center text-stone-400">
              No tables configured.
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-brand-600">{stats.tableStats.total}</div>
            <div className="text-sm text-stone-500">Total Tables</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.tableStats.ready}</div>
            <div className="text-sm text-stone-500">Ready Now</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.tableStats.occupied}</div>
            <div className="text-sm text-stone-500">Occupied</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.activeQueue}</div>
            <div className="text-sm text-stone-500">In Queue</div>
          </div>
        </div>
      )}
    </div>
  );
}
