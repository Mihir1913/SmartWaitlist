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
  Zap,
  CreditCard,
  BarChart3,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { api } from '../lib/api';
import QRCodeModal from '../components/QRCodeModal';
import InquiryModal from '../components/InquiryModal';

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
  const [showInquiryModal, setShowInquiryModal] = useState(false);
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
    <div className="min-h-screen bg-stone-50 text-surface-900 font-sans selection:bg-brand-500 selection:text-white">
      {/* ────────────────────────── NAVBAR ────────────────────────── */}
      <header className="bg-white/85 backdrop-blur-md sticky top-0 z-40 border-b border-stone-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-brand-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-black text-xl text-surface-900 tracking-tight">
                Smart Waitlist
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                Live Queue OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInquiryModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-stone-950 font-extrabold text-xs flex items-center gap-1.5 shadow transition transform active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>Inquire Now</span>
            </button>

            <Link
              to="/status"
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition"
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

      {/* ────────────────────────── HERO SECTION ────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 space-y-20">
        <section className="pt-12 pb-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-100 via-amber-100 to-brand-100 text-brand-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-brand-200 shadow-sm animate-pulse">
            <MessageCircle className="w-4 h-4 text-brand-600" />
            WhatsApp-Native Queue & Pre-Ordering System
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-surface-900 leading-[1.1] max-w-4xl mx-auto tracking-tight">
            Turn Waiting Guests Into <br />
            <span className="bg-gradient-to-r from-brand-600 via-amber-600 to-brand-600 bg-clip-text text-transparent">
              High-Turnover Revenue
            </span>
          </h1>

          <p className="text-stone-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Eliminate restaurant walkaways with instant WhatsApp notifications, pre-seating dish pre-orders, smart auto-tables, and a live drag-and-drop Kitchen KDS.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a href="#restaurants-section" className="btn-primary text-base px-6 py-3.5 shadow-xl shadow-brand-500/25">
              <Utensils className="w-4 h-4" />
              Explore Restaurants ({restaurants.length})
            </a>

            <button
              onClick={() => setShowInquiryModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-base flex items-center gap-2 shadow-xl transition transform active:scale-95 border border-stone-800"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Partner Your Restaurant (Inquire)</span>
            </button>
          </div>
        </section>

        {/* ────────────────────────── METRICS COUNTER ────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Restaurants', value: stats.totalRestaurants || restaurants.length, icon: Building2, color: 'text-amber-500' },
            { label: 'Guests Waiting Now', value: stats.totalQueues, icon: Users, color: 'text-orange-500' },
            { label: 'Tables Seated Today', value: stats.totalSeated || 24, icon: Armchair, color: 'text-emerald-500' },
            { label: 'Avg Wait Saved', value: '14 Mins', icon: Clock, color: 'text-blue-500' },
          ].map((m) => (
            <div key={m.label} className="bg-white border border-stone-200/90 p-5 rounded-3xl shadow-sm text-center space-y-1 hover:border-brand-300 transition">
              <div className={`w-11 h-11 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-2 ${m.color}`}>
                <m.icon className="w-5 h-5" />
              </div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-surface-900">{m.value}</div>
              <div className="text-xs text-stone-500 font-medium">{m.label}</div>
            </div>
          ))}
        </section>

        {/* ────────────────────────── WHY CHOOSE US SECTION ────────────────────────── */}
        <section className="space-y-8 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Why Choose Smart Waitlist
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-stone-900">
              Built for High-Volume Restaurants & Delightful Guests
            </h2>
            <p className="text-stone-600 text-sm">
              Six core technological advantages that eliminate walkaways and increase table turnover by up to 25%.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageCircle,
                title: 'WhatsApp-Native Queueing',
                desc: 'Guests receive real-time table updates on WhatsApp with zero app download required.',
                color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
              },
              {
                icon: Utensils,
                title: 'Pre-Seating Dish Orders',
                desc: 'Guests browse menus and pre-order dishes while waiting. Kitchen starts prep before seating.',
                color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
              },
              {
                icon: ChefHat,
                title: 'Live Drag & Drop KDS',
                desc: 'Real-time kitchen order board syncs instantly across staff tablets and customer status screens.',
                color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
              },
              {
                icon: CreditCard,
                title: 'Online UPI & Card Deposits',
                desc: 'Integrated Razorpay and UPI Intent payments to hold queue positions and reduce no-shows.',
                color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
              },
              {
                icon: BarChart3,
                title: 'Real-Time ROI Analytics',
                desc: 'Track turnover rate, walkaway reduction, revenue gained, and top-selling dishes by date range.',
                color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
              },
              {
                icon: Printer,
                title: 'Printable Acrylic QR Standees',
                desc: 'Generate high-res printable QR standees (Desk Frame, Table Card, Poster) in 1 tap.',
                color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-3xl border border-stone-200/90 p-6 space-y-3 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-stone-900 group-hover:text-brand-600 transition">
                  {f.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ────────────────────────── RESTAURANTS DIRECTORY ────────────────────────── */}
        <section id="restaurants-section" className="space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-2xl font-bold font-display text-surface-900">
                Partner Restaurants ({filteredRestaurants.length})
              </h2>
              <p className="text-xs text-stone-500">Scan QR Code or tap to join waitlist & pre-order dishes</p>
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

        {/* ────────────────────────── PARTNER INQUIRY CTA BANNER ────────────────────────── */}
        <section className="bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-white rounded-3xl p-8 sm:p-12 border border-stone-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800/60 inline-block">
              Restaurant Partner Onboarding
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
              Want to Onboard Your Restaurant?
            </h2>
            <p className="text-stone-300 text-sm leading-relaxed">
              Eliminate walkaways, automate table assignments, and boost dining revenue. Fill our 1-minute inquiry form to get started with instant WhatsApp setup.
            </p>
          </div>

          <button
            onClick={() => setShowInquiryModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-stone-950 font-extrabold rounded-2xl text-base shadow-xl flex items-center gap-2 transition transform active:scale-95 shrink-0"
          >
            <Building2 className="w-5 h-5" />
            <span>Inquire Now (Partner With Us)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </section>

        {/* ────────────────────────── PORTAL ACCESS ────────────────────────── */}
        <section className="pt-4 border-t border-stone-200">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
            <h3 className="font-display text-xl font-bold text-surface-900">Staff & Admin Operations</h3>
            <p className="text-xs text-stone-500">Access staff panels, kitchen displays, or restaurant administration</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/staff"
              className="card p-5 flex items-center gap-4 hover:border-brand-300 hover:shadow-lg transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-surface-900 group-hover:text-brand-600 transition text-sm">Staff Panel</div>
                <div className="text-xs text-stone-500">Table seating & queue management</div>
              </div>
            </Link>

            <Link
              to="/kitchen"
              className="card p-5 flex items-center gap-4 hover:border-brand-300 hover:shadow-lg transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-surface-900 group-hover:text-amber-600 transition text-sm">Kitchen Display (KDS)</div>
                <div className="text-xs text-stone-500">Drag & Drop order cooking board</div>
              </div>
            </Link>

            <Link
              to="/admin"
              className="card p-5 flex items-center gap-4 hover:border-brand-300 hover:shadow-lg transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-surface-900 group-hover:text-emerald-600 transition text-sm">Admin Dashboard</div>
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

      {/* Restaurant Partnership Inquiry Modal */}
      {showInquiryModal && (
        <InquiryModal onClose={() => setShowInquiryModal(false)} />
      )}
    </div>
  );
}
