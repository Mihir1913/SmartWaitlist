import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { SuperAdminRestaurant, SuperAdminStats, AuditLog } from '../types';
import QRCodeModal from '../components/QRCodeModal';
import {
  Store,
  Plus,
  Search,
  Users,
  Edit3,
  Trash2,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Sparkles,
  AlertCircle,
  X,
  UserPlus,
  Building2,
  CheckCircle,
  Phone,
  MapPin,
  Clock,
  Layers,
  Settings,
  QrCode,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [restaurants, setRestaurants] = useState<SuperAdminRestaurant[]>([]);
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'restaurants' | 'audit'>('restaurants');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRestaurant, setEditRestaurant] = useState<SuperAdminRestaurant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SuperAdminRestaurant | null>(null);
  const [addUserTarget, setAddUserTarget] = useState<SuperAdminRestaurant | null>(null);
  const [qrTarget, setQrTarget] = useState<SuperAdminRestaurant | null>(null);

  // Form states - Create
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [address, setAddress] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [avgTurnover, setAvgTurnover] = useState(45);
  const [maxQueue, setMaxQueue] = useState(50);
  const [preOrder, setPreOrder] = useState(true);
  
  // Owner info for new restaurant
  const [createOwner, setCreateOwner] = useState(true);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  // Form states - Edit
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editAvgTurnover, setEditAvgTurnover] = useState(45);
  const [editMaxQueue, setEditMaxQueue] = useState(50);
  const [editPreOrder, setEditPreOrder] = useState(true);

  // Form states - Add User
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'owner' | 'staff' | 'kitchen'>('staff');

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getSuperAdminRestaurants();
      setRestaurants(data.restaurants);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getAuditLogs();
      setAuditLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else {
      fetchRestaurants();
    }
  }, [activeTab]);

  // Auto-generate slug from name in creation modal
  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setSlug(autoSlug);
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      const res = await api.createRestaurant({
        name,
        slug,
        address,
        whatsappPhone,
        settings: {
          avgTurnoverMinutes: Number(avgTurnover),
          maxQueueSize: Number(maxQueue),
          preOrderEnabled: preOrder,
        },
        owner: createOwner
          ? {
              name: ownerName,
              email: ownerEmail,
              password: ownerPassword,
            }
          : undefined,
      });

      setSuccessMsg(`Restaurant "${name}" created successfully!`);
      setShowAddModal(false);

      if (res.restaurant) {
        setQrTarget({
          id: res.restaurant.id,
          name: res.restaurant.name,
          slug: res.restaurant.slug,
          address: res.restaurant.address,
          whatsappPhone: res.restaurant.whatsappPhone,
          settings: res.restaurant.settings,
          createdAt: new Date().toISOString(),
          tableCount: 0,
          activeQueueCount: 0,
          usersCount: res.owner ? 1 : 0,
          owners: res.owner ? [{ id: res.owner.id, name: res.owner.name, email: res.owner.email }] : [],
        });
      }

      resetCreateForm();
      fetchRestaurants();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to create restaurant');
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setName('');
    setSlug('');
    setAddress('');
    setWhatsappPhone('');
    setAvgTurnover(45);
    setMaxQueue(50);
    setPreOrder(true);
    setCreateOwner(true);
    setOwnerName('');
    setOwnerEmail('');
    setOwnerPassword('');
  };

  const openEditModal = (r: SuperAdminRestaurant) => {
    setEditRestaurant(r);
    setEditName(r.name);
    setEditSlug(r.slug);
    setEditAddress(r.address);
    setEditWhatsapp(r.whatsappPhone || '');
    setEditAvgTurnover(r.settings?.avgTurnoverMinutes || 45);
    setEditMaxQueue(r.settings?.maxQueueSize || 50);
    setEditPreOrder(r.settings?.preOrderEnabled ?? true);
    setModalError('');
  };

  const handleUpdateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRestaurant) return;
    setSubmitting(true);
    setModalError('');
    try {
      await api.updateRestaurant(editRestaurant.id, {
        name: editName,
        slug: editSlug,
        address: editAddress,
        whatsappPhone: editWhatsapp,
        settings: {
          avgTurnoverMinutes: Number(editAvgTurnover),
          maxQueueSize: Number(editMaxQueue),
          preOrderEnabled: editPreOrder,
        },
      });

      setSuccessMsg(`Updated "${editName}" settings!`);
      setEditRestaurant(null);
      fetchRestaurants();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to update restaurant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRestaurant = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await api.deleteRestaurant(deleteTarget.id);
      setSuccessMsg(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
      fetchRestaurants();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete restaurant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserTarget) return;
    setSubmitting(true);
    setModalError('');
    try {
      await api.createRestaurantUser(addUserTarget.id, {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });

      setSuccessMsg(`User "${newUserName}" (${newUserRole}) added to ${addUserTarget.name}`);
      setAddUserTarget(null);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('staff');
      fetchRestaurants();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.owners.some((o) => o.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans pb-16">
      {/* Header */}
      <header className="bg-stone-950/80 backdrop-blur border-b border-stone-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ShieldCheck className="w-6 h-6 text-stone-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-white tracking-tight">
                  Main Admin Portal
                </h1>
                <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-500/20">
                  Superadmin
                </span>
              </div>
              <p className="text-xs text-stone-400">Platform & Restaurant Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-stone-200">{user?.name || 'Main Admin'}</p>
              <p className="text-xs text-stone-400">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-2 rounded-xl text-sm font-medium transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Success Toast */}
        {successMsg && (
          <div className="bg-emerald-900/50 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-900/50 border border-red-500/30 text-red-200 px-4 py-3 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-stone-800/60 border border-stone-700/60 rounded-2xl p-5 backdrop-blur">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Restaurants</span>
              <Store className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {stats?.totalRestaurants ?? restaurants.length}
            </div>
            <p className="text-xs text-stone-400 mt-1">Active platform instances</p>
          </div>

          <div className="bg-stone-800/60 border border-stone-700/60 rounded-2xl p-5 backdrop-blur">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Queues</span>
              <Layers className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {stats?.totalActiveQueues ?? 0}
            </div>
            <p className="text-xs text-stone-400 mt-1">Waiting customers right now</p>
          </div>

          <div className="bg-stone-800/60 border border-stone-700/60 rounded-2xl p-5 backdrop-blur">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Tables</span>
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {stats?.totalTables ?? 0}
            </div>
            <p className="text-xs text-stone-400 mt-1">Configured dining tables</p>
          </div>

          <div className="bg-stone-800/60 border border-stone-700/60 rounded-2xl p-5 backdrop-blur">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Platform Users</span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {stats?.totalUsers ?? 0}
            </div>
            <p className="text-xs text-stone-400 mt-1">Owners, staff & kitchen team</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-stone-800 pb-2 px-1">
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`pb-3 text-sm font-semibold transition relative ${
              activeTab === 'restaurants'
                ? 'text-amber-400'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Restaurants
            {activeTab === 'restaurants' && (
              <span className="absolute bottom-[-2px] left-0 w-full h-0.5 bg-amber-400 rounded-t-md" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-sm font-semibold transition relative ${
              activeTab === 'audit'
                ? 'text-amber-400'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Audit Logs
            {activeTab === 'audit' && (
              <span className="absolute bottom-[-2px] left-0 w-full h-0.5 bg-amber-400 rounded-t-md" />
            )}
          </button>
        </div>

        {activeTab === 'restaurants' ? (
          <>
            {/* Action Header & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by name, slug, email or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-800/80 border border-stone-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>

              <button
                onClick={() => {
                  resetCreateForm();
                  setModalError('');
                  setShowAddModal(true);
                }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-stone-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition transform active:scale-95 text-sm"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                Add New Restaurant
              </button>
            </div>

            {/* Restaurant List Section */}
            <div className="bg-stone-800/40 border border-stone-800 rounded-2xl overflow-hidden backdrop-blur">
              {loading ? (
                <div className="p-12 text-center text-stone-400">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading restaurants...
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="p-12 text-center">
              <Store className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-stone-300">No restaurants found</h3>
              <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
                {searchQuery
                  ? 'No restaurants match your search term.'
                  : 'Get started by creating your first restaurant instance.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 bg-stone-700 hover:bg-stone-600 text-white text-sm font-medium px-4 py-2 rounded-xl inline-flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" /> Add Restaurant
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-900/80 text-stone-400 border-b border-stone-800 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Restaurant</th>
                    <th className="px-6 py-4">Owner Info</th>
                    <th className="px-6 py-4">Metrics</th>
                    <th className="px-6 py-4">Settings</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80">
                  {filteredRestaurants.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white text-base flex items-center gap-2">
                          {r.name}
                          <a
                            href={`/join/${r.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-stone-400 hover:text-amber-400 transition"
                            title="Open Customer Waitlist Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="text-xs text-amber-400 font-mono mt-0.5">/join/{r.slug}</div>
                        <div className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-stone-500" />
                          {r.address}
                        </div>
                        <div className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-stone-500" />
                          {r.whatsappPhone}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {r.owners.length > 0 ? (
                          <div className="space-y-1">
                            {r.owners.map((owner) => (
                              <div key={owner.id} className="text-xs">
                                <span className="font-medium text-stone-200">{owner.name}</span>
                                <span className="text-stone-400 block">{owner.email}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-500/80 italic">No owner assigned</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-stone-900 border border-stone-700 text-stone-300 text-xs px-2.5 py-1 rounded-lg">
                            {r.tableCount} Tables
                          </span>
                          <span className="bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs px-2.5 py-1 rounded-lg">
                            {r.activeQueueCount} Waiting
                          </span>
                          <span className="bg-stone-900 border border-stone-700 text-stone-300 text-xs px-2.5 py-1 rounded-lg">
                            {r.usersCount} Staff
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-stone-400 space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-500" />
                          <span>Turnover: {r.settings?.avgTurnoverMinutes || 45} mins</span>
                        </div>
                        <div>Max Queue: {r.settings?.maxQueueSize || 50}</div>
                        <div>
                          Pre-Orders:{' '}
                          <span
                            className={
                              r.settings?.preOrderEnabled ? 'text-emerald-400 font-medium' : 'text-stone-500'
                            }
                          >
                            {r.settings?.preOrderEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setQrTarget(r)}
                            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-orange-400 rounded-lg transition flex items-center gap-1.5 text-xs"
                            title="View & Download QR Code"
                          >
                            <QrCode className="w-4 h-4 text-orange-400" />
                            <span className="hidden md:inline font-medium">QR Code</span>
                          </button>
                          <button
                            onClick={() => {
                              setAddUserTarget(r);
                              setModalError('');
                            }}
                            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg transition"
                            title="Add Staff or Owner User"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400 rounded-lg transition"
                            title="Edit Restaurant Settings"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="p-2 bg-stone-800 hover:bg-red-950/60 text-stone-400 hover:text-red-400 rounded-lg transition"
                            title="Delete Restaurant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    ) : (
          <div className="bg-stone-800/40 border border-stone-800 rounded-2xl overflow-hidden backdrop-blur">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-display text-white">System Audit Logs</h2>
                <span className="bg-stone-800 text-stone-300 px-3 py-1 rounded-lg text-xs font-medium border border-stone-700">
                  {auditLogs.length} Records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-700/50 text-stone-400">
                      <th className="py-3 px-4 font-semibold">Time</th>
                      <th className="py-3 px-4 font-semibold">User</th>
                      <th className="py-3 px-4 font-semibold">Action</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">IP Address</th>
                      <th className="py-3 px-4 font-semibold">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="border-b border-stone-800/50 hover:bg-stone-800/50 transition">
                        <td className="py-3 px-4 whitespace-nowrap text-stone-400">
                          {new Date(log.createdAt).toLocaleString(undefined, { 
                            year: 'numeric', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit', second: '2-digit' 
                          })}
                        </td>
                        <td className="py-3 px-4">
                          {log.userEmail ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-stone-200">{log.userEmail}</span>
                              <span className="text-xs text-stone-500 capitalize">{log.userRole || 'User'}</span>
                            </div>
                          ) : (
                            <span className="text-stone-500 italic">Guest</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-amber-400">{log.action}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.statusCode >= 200 && log.statusCode < 300
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {log.statusCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-stone-400">{log.ipAddress}</td>
                        <td className="py-3 px-4 text-stone-400 flex items-center gap-1.5 whitespace-nowrap">
                          <MapPin className="w-3.5 h-3.5" />
                          {log.location || 'Unknown'}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && !loading && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-stone-500">
                          No audit logs recorded yet.
                        </td>
                      </tr>
                    )}
                    {loading && auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-stone-400">
                          Loading audit logs...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* CREATE RESTAURANT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create New Restaurant</h3>
                  <p className="text-xs text-stone-400">Set up a new restaurant & owner account</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="bg-red-900/40 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateRestaurant} className="space-y-4 text-sm">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Restaurant Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1">
                      Restaurant Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Royal Spice Bistro"
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. royal-spice"
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full restaurant street address"
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="e.g. 919876543210"
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-stone-800">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Initial Settings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1">
                      Avg Turnover (minutes)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={240}
                      value={avgTurnover}
                      onChange={(e) => setAvgTurnover(Number(e.target.value))}
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1">
                      Max Queue Capacity
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={500}
                      value={maxQueue}
                      onChange={(e) => setMaxQueue(Number(e.target.value))}
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="preOrder"
                    checked={preOrder}
                    onChange={(e) => setPreOrder(e.target.checked)}
                    className="rounded border-stone-700 text-amber-500 focus:ring-amber-500 bg-stone-800"
                  />
                  <label htmlFor="preOrder" className="text-xs text-stone-300 cursor-pointer">
                    Enable Customer Pre-Ordering while in Queue
                  </label>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-stone-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Restaurant Owner Credentials
                  </h4>
                  <label className="flex items-center gap-2 text-xs text-stone-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createOwner}
                      onChange={(e) => setCreateOwner(e.target.checked)}
                      className="rounded border-stone-700 text-amber-500 focus:ring-amber-500 bg-stone-800"
                    />
                    Create Owner User Now
                  </label>
                </div>

                {createOwner && (
                  <div className="space-y-3 bg-stone-950/60 border border-stone-800 p-3.5 rounded-2xl">
                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1">
                        Owner Name *
                      </label>
                      <input
                        type="text"
                        required={createOwner}
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Owner full name"
                        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-300 mb-1">
                          Owner Email *
                        </label>
                        <input
                          type="email"
                          required={createOwner}
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          placeholder="owner@restaurant.com"
                          className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-300 mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          required={createOwner}
                          minLength={6}
                          value={ownerPassword}
                          onChange={(e) => setOwnerPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-300 hover:bg-stone-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-5 py-2 rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RESTAURANT MODAL */}
      {editRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Restaurant</h3>
                  <p className="text-xs text-stone-400">{editRestaurant.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditRestaurant(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="bg-red-900/40 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {modalError}
              </div>
            )}

            <form onSubmit={handleUpdateRestaurant} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  WhatsApp Phone
                </label>
                <input
                  type="text"
                  required
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Avg Turnover (min)
                  </label>
                  <input
                    type="number"
                    value={editAvgTurnover}
                    onChange={(e) => setEditAvgTurnover(Number(e.target.value))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Max Queue Size
                  </label>
                  <input
                    type="number"
                    value={editMaxQueue}
                    onChange={(e) => setEditMaxQueue(Number(e.target.value))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editPreOrder"
                  checked={editPreOrder}
                  onChange={(e) => setEditPreOrder(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 focus:ring-amber-500 bg-stone-800"
                />
                <label htmlFor="editPreOrder" className="text-xs text-stone-300 cursor-pointer">
                  Enable Pre-Orders
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditRestaurant(null)}
                  className="px-4 py-2 rounded-xl text-stone-300 hover:bg-stone-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-5 py-2 rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {addUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add Staff / Owner</h3>
                  <p className="text-xs text-stone-400">For {addUserTarget.name}</p>
                </div>
              </div>
              <button
                onClick={() => setAddUserTarget(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="bg-red-900/40 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="sarah@restaurant.com"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Account Role *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="staff">Staff (Table Management)</option>
                  <option value="kitchen">Kitchen (Order Display)</option>
                  <option value="owner">Owner (Full Admin Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setAddUserTarget(null)}
                  className="px-4 py-2 rounded-xl text-stone-300 hover:bg-stone-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-5 py-2 rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delete Restaurant?</h3>
              <p className="text-sm text-stone-400 mt-1">
                Are you sure you want to delete <strong className="text-white">{deleteTarget.name}</strong>?
                This will permanently delete all associated tables, menus, orders, queue entries, and user accounts.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-stone-300 hover:bg-stone-800 transition text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRestaurant}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl transition text-sm disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {qrTarget && (
        <QRCodeModal
          restaurantName={qrTarget.name}
          slug={qrTarget.slug}
          address={qrTarget.address}
          whatsappPhone={qrTarget.whatsappPhone}
          onClose={() => setQrTarget(null)}
        />
      )}
    </div>
  );
}
