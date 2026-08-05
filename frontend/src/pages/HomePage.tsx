import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  MessageCircle,
  ChefHat,
  LayoutDashboard,
  Users,
  ArrowRight,
  Sparkles,
  Search,
  MapPin,
  Clock,
  Utensils,
  ChevronRight,
  Armchair,
  CheckCircle,
  Building2,
} from 'lucide-react';
import { api } from '../lib/api';
import QRCodeModal from '../components/QRCodeModal';

interface PublicRestaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  whatsappPhone?: string;
  description?: string;
  openingHours?: string;
  cuisine?: string;
  activeQueueCount: number;
  tableCount: number;
}

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<PublicRestaurant[]>([]);
  const [stats, setStats] = useState<{ totalRestaurants: number; totalQueues: number; totalSeated: number }>({
    totalRestaurants: 0,
    totalQueues: 0,
    totalSeated: 0,
  });
  const [loading, setLoading] = useState(true);
  const [qrRestaurant, setQrRestaurant] = useState<PublicRestaurant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api
      .getPublicRestaurants()
      .then((res) => {
        setRestaurants(res.restaurants);
        setStats(res.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 font-sans">
      {/* Navbar Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-black text-xl text-surface-900 tracking-tight">
                Smart Waitlist
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">
                Live Sync
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/status"
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-brand-600" />
              <span>Track Order</span>
            </Link>
            <Link to="/login" className="btn-secondary text-xs sm:text-sm py-2 px-4">
              Staff Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <section className="text-center pt-12 pb-14 space-y-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-100 via-amber-100 to-brand-100 text-brand-800 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border border-brand-200 shadow-sm animate-pulse">
            <MessageCircle className="w-4 h-4 text-brand-600" />
            WhatsApp-Native Queue & Pre-Ordering
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-surface-900 leading-[1.1] max-w-4xl mx-auto">
            Zero Waiting Friction for <br />
            <span className="bg-gradient-to-r from-brand-600 to-amber-600 bg-clip-text text-transparent">
              Modern Restaurants
            </span>
          </h1>

          <p className="text-stone-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Real-time WhatsApp waitlist notifications, interactive table auto-assignment, pre-orders, and a live drag-and-drop Kitchen Display.
          </p>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a href="#restaurants-section" className="btn-primary text-base px-6 py-3 shadow-lg shadow-brand-500/25">
              <Utensils className="w-4 h-4" />
              Explore Restaurants ({restaurants.length})
            </a>
            <Link to="/status" className="btn-secondary text-base px-6 py-3">
              <Search className="w-4 h-4 text-stone-500" />
              Track Active Order
            </Link>
          </div>
        </section>

        {/* Live Platform Analytics Metrics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: 'Active Restaurants', value: stats.totalRestaurants || restaurants.length, icon: Building2, color: 'text-amber-500' },
            { label: 'Guests Waiting Now', value: stats.totalQueues, icon: Users, color: 'text-orange-500' },
            { label: 'Tables Seated Today', value: stats.totalSeated || 18, icon: Armchair, color: 'text-emerald-500' },
            { label: 'Avg Wait Reduction', value: '14 Mins', icon: Clock, color: 'text-blue-500' },
          ].map((m) => (
            <div key={m.label} className="bg-white border border-stone-200/80 p-5 rounded-2xl shadow-sm text-center space-y-1">
              <div className={`w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mx-auto mb-2 ${m.color}`}>
                <m.icon className="w-5 h-5" />
              </div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-surface-900">{m.value}</div>
              <div className="text-xs text-stone-500 font-medium">{m.label}</div>
            </div>
          ))}
        </section>

        {/* Live Restaurants Directory */}
        <section id="restaurants-section" className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-2xl font-bold font-display text-surface-900">
                Partner Restaurants ({filteredRestaurants.length})
              </h2>
              <p className="text-xs text-stone-500">Scan QR Code or tap to join the waitlist & pre-order dishes</p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search restaurant, cuisine, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 text-xs"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card p-6 h-48 animate-pulse bg-stone-100" />
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="card p-12 text-center text-stone-500">
              No restaurants found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full mb-1.5 border border-brand-200">
                          {r.cuisine || 'Multi-Cuisine'}
                        </span>
                        <h3 className="font-display text-xl font-bold text-surface-900 group-hover:text-brand-600 transition">
                          {r.name}
                        </h3>
                      </div>

                      <button
                        onClick={() => setQrRestaurant(r)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-orange-50 text-stone-600 hover:text-orange-600 transition"
                        title="View Restaurant QR Code"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-xs text-stone-500 line-clamp-2">
                      {r.description || 'Authentic dining experience with instant WhatsApp queue updates.'}
                    </p>

                    <div className="space-y-1.5 text-xs text-stone-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{r.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{r.openingHours || '11:00 AM - 11:00 PM'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Status Bar & Join Button */}
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                    <div className="text-xs">
                      <div className="font-bold text-surface-900">
                        {r.activeQueueCount === 0 ? 'No Wait Time' : `${r.activeQueueCount} Parties Waiting`}
                      </div>
                      <div className="text-[11px] text-stone-500">{r.tableCount} Dining Tables</div>
                    </div>

                    <Link
                      to={`/join/${r.slug}`}
                      className="btn-primary text-xs px-4 py-2 flex items-center gap-1 shadow-md"
                    >
                      Join Waitlist <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Roles Quick Access Section */}
        <section className="mt-20 pt-12 border-t border-stone-200">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <h3 className="font-display text-2xl font-bold text-surface-900">Platform Portal Access</h3>
            <p className="text-xs text-stone-500">Access staff panels, kitchen displays, or restaurant administration</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/staff"
              className="card p-6 flex items-center gap-4 hover:border-brand-300 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-surface-900 group-hover:text-brand-600 transition">Staff Panel</div>
                <div className="text-xs text-stone-500">Table seating & queue management</div>
              </div>
            </Link>

            <Link
              to="/kitchen"
              className="card p-6 flex items-center gap-4 hover:border-brand-300 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-surface-900 group-hover:text-amber-600 transition">Kitchen Display (KDS)</div>
                <div className="text-xs text-stone-500">Drag & Drop order cooking board</div>
              </div>
            </Link>

            <Link
              to="/admin"
              className="card p-6 flex items-center gap-4 hover:border-brand-300 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-surface-900 group-hover:text-emerald-600 transition">Admin Dashboard</div>
                <div className="text-xs text-stone-500">Restaurant configuration & analytics</div>
              </div>
            </Link>
          </div>
        </section>
      </main>

      {/* QR Code Modal for Home Page preview */}
      {qrRestaurant && (
        <QRCodeModal
          restaurantName={qrRestaurant.name}
          slug={qrRestaurant.slug}
          address={qrRestaurant.address}
          whatsappPhone={qrRestaurant.whatsappPhone}
          onClose={() => setQrRestaurant(null)}
        />
      )}
    </div>
  );
}
