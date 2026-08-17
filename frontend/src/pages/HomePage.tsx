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
  CheckCircle2,
  Building2,
  Zap,
  CreditCard,
  BarChart3,
  Printer,
  ShieldCheck,
  Check,
  Crown,
  Star,
  Quote,
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
  Mail,
  PhoneCall,
  Globe,
  Heart,
  Shield,
  X,
  Navigation,
} from 'lucide-react';
import { api } from '../lib/api';
import QRCodeModal from '../components/QRCodeModal';
import InquiryModal from '../components/InquiryModal';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface PublicRestaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  whatsappPhone?: string;
  description?: string;
  openingHours?: string;
  cuisine?: string;
  location?: { lat: number; lng: number };
  activeQueueCount: number;
  tableCount: number;
  distanceKm?: number;
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
  const [annualBilling, setAnnualBilling] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const requestLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        setLocationError('Unable to retrieve your location. Please check browser permissions.');
        setIsLocating(false);
      }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

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

  let processedRestaurants = [...filteredRestaurants];
  if (userLocation) {
    processedRestaurants = processedRestaurants
      .map((r) => {
        if (r.location && r.location.lat && r.location.lng) {
          return {
            ...r,
            distanceKm: calculateDistance(
              userLocation.lat,
              userLocation.lng,
              r.location.lat,
              r.location.lng
            ),
          };
        }
        return r;
      })
      .sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
        if (a.distanceKm !== undefined) return -1;
        if (b.distanceKm !== undefined) return 1;
        return 0;
      });
  }

  return (
    <div className="min-h-screen bg-stone-50 text-surface-900 font-sans selection:bg-brand-500 selection:text-white flex flex-col justify-between">
      <div>
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
              { label: 'Active Restaurants', value: stats.totalRestaurants ?? restaurants.length, icon: Building2, color: 'text-amber-500' },
              { label: 'Guests Waiting Now', value: stats.totalQueues ?? 0, icon: Users, color: 'text-orange-500' },
              { label: 'Tables Seated Today', value: stats.totalSeated ?? 0, icon: Armchair, color: 'text-emerald-500' },
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

          {/* ────────────────────────── HOSPITALITY QUOTES & TESTIMONIALS ────────────────────────── */}
          <section className="space-y-8 pt-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1">
                <Quote className="w-3 h-3 text-amber-600" /> Hospitality Wisdom & Partner Testimonials
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-stone-900">
                What Culinary Leaders & Restaurateurs Say
              </h2>
              <p className="text-stone-600 text-sm">
                Real insights on modern waitlist management and table turnover optimization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: 'Good food is all the sweeter when shared with loved ones without standing in long queues.',
                  author: 'Auguste Escoffier',
                  title: 'Culinary Philosophy',
                  avatarBg: 'bg-amber-100 text-amber-800',
                },
                {
                  quote: 'Queue management isn’t just about wait times; it’s about turning anticipation into an unforgettable dining experience.',
                  author: 'Restaurant Operations Quarterly',
                  title: 'Hospitality Digest 2026',
                  avatarBg: 'bg-orange-100 text-orange-800',
                },
                {
                  quote: 'Smart Waitlist reduced our weekend walkaways by 40%. Guests love browsing and pre-ordering dishes on WhatsApp before seating!',
                  author: 'Chef Rajesh Kumar',
                  title: 'Executive Chef, Fine Dining Partner',
                  avatarBg: 'bg-emerald-100 text-emerald-800',
                },
              ].map((q, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-white via-stone-50 to-amber-50/30 rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm hover:shadow-xl transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <Quote className="w-8 h-8 text-amber-500/40 fill-amber-500/20" />
                    <p className="text-sm text-stone-700 italic leading-relaxed font-serif">
                      "{q.quote}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-stone-200/60">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${q.avatarBg}`}>
                      {q.author.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-stone-900">{q.author}</div>
                      <div className="text-[11px] text-stone-500">{q.title}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ────────────────────────── GLASSMORPHISM PRICING TABLE ────────────────────────── */}
          <section className="relative overflow-hidden bg-stone-950 text-white rounded-3xl p-8 sm:p-14 border border-stone-800 shadow-2xl space-y-12">
            {/* Ambient Glow Orbs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-amber-500/15 to-orange-500/0 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-tr from-brand-600/15 to-purple-600/0 rounded-full blur-3xl pointer-events-none" />

            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-4 relative z-10">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 px-4 py-1.5 rounded-full border border-amber-700/60 inline-flex items-center gap-1.5 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Transparent Subscription Plans
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight">
                Simple, Predictable Pricing for Every Dining Space
              </h2>
              <p className="text-stone-400 text-sm leading-relaxed">
                No hidden fees or per-transaction commissions. Upgrade or cancel anytime.
              </p>

              {/* Monthly / Annual Toggle */}
              <div className="pt-2 flex items-center justify-center gap-3">
                <span className={`text-xs font-bold ${!annualBilling ? 'text-white' : 'text-stone-400'}`}>Monthly</span>
                <button
                  onClick={() => setAnnualBilling(!annualBilling)}
                  className="w-14 h-7 rounded-full bg-stone-800 p-1 transition relative border border-stone-700"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition transform ${
                      annualBilling ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-bold flex items-center gap-1.5 ${annualBilling ? 'text-amber-400' : 'text-stone-400'}`}>
                  Annual <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">Save 20%</span>
                </span>
              </div>
            </div>

            {/* 3 Glassmorphism Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {/* Tier 1: Starter */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl p-8 space-y-6 flex flex-col justify-between transition duration-300 hover:-translate-y-1 shadow-xl">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-stone-300">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">Boutique Bistro</h3>
                    <p className="text-xs text-stone-400">Ideal for small cafes, bakeries & bistros</p>
                  </div>

                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-3xl sm:text-4xl font-black font-display text-white">
                      ₹{annualBilling ? '1,199' : '1,499'}
                    </span>
                    <span className="text-xs text-stone-400">/ month</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-stone-300 pt-2 border-t border-white/10">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Up to 10 Dining Tables</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>WhatsApp QR Waitlist</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Up to 200 Waiting Guests / mo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Digital Menu Browsing</span>
                    </li>
                    <li className="flex items-center gap-2 text-stone-500">
                      <X className="w-4 h-4 shrink-0" />
                      <span className="line-through">Pre-Seating Dish Orders</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/15 active:scale-95"
                >
                  Choose Boutique Plan
                </button>
              </div>

              {/* Tier 2: Pro Restaurant (POPULAR - Highlighted Glass) */}
              <div className="bg-gradient-to-b from-orange-500/15 via-amber-500/10 to-stone-900/90 backdrop-blur-2xl border-2 border-orange-500/60 rounded-3xl p-8 space-y-6 flex flex-col justify-between transition duration-300 hover:-translate-y-1.5 shadow-2xl shadow-orange-500/15 relative">
                {/* Popular Badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 font-black text-[10px] uppercase tracking-widest px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-stone-950" /> Most Popular Choice
                </div>

                <div className="space-y-4 pt-1">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-stone-950 shadow-md">
                    <Zap className="w-5 h-5 fill-stone-950" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                      Pro Restaurant
                    </h3>
                    <p className="text-xs text-amber-200/80">For high-volume restaurants & fine dining</p>
                  </div>

                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-3xl sm:text-4xl font-black font-display text-amber-400">
                      ₹{annualBilling ? '2,399' : '2,999'}
                    </span>
                    <span className="text-xs text-stone-400">/ month</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-stone-200 pt-2 border-t border-orange-500/20">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <strong className="text-white">Unlimited Dining Tables & Queues</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <strong className="text-white">Meta WhatsApp Cloud API</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Pre-Seating Cooking Pre-Orders</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Live Drag & Drop Kitchen KDS</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Online UPI & Razorpay Deposits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Printable Acrylic QR Standees</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-stone-950 font-black text-xs transition shadow-lg shadow-orange-500/25 active:scale-95"
                >
                  Inquire & Get Pro Plan
                </button>
              </div>

              {/* Tier 3: Enterprise & Chains */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl p-8 space-y-6 flex flex-col justify-between transition duration-300 hover:-translate-y-1 shadow-xl">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">Multi-Chain Enterprise</h3>
                    <p className="text-xs text-stone-400">For multi-location groups & franchises</p>
                  </div>

                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-3xl sm:text-4xl font-black font-display text-white">
                      ₹{annualBilling ? '4,799' : '5,999'}
                    </span>
                    <span className="text-xs text-stone-400">/ month</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-stone-300 pt-2 border-t border-white/10">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Multi-Branch SuperAdmin Access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Dedicated Account Manager</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Custom WhatsApp Template Approval</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>POS / ERP Custom Integration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>99.9% Server Uptime SLA</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/15 active:scale-95"
                >
                  Contact Enterprise Sales
                </button>
              </div>
            </div>
          </section>

          {/* ────────────────────────── RESTAURANTS DIRECTORY ────────────────────────── */}
          <section id="restaurants-section" className="space-y-6 pt-6">
            {/* Nearby Map Section */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-surface-900 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-brand-600" />
                    Nearby Restaurants Map
                  </h3>
                  <p className="text-xs text-stone-500">Allow location access to discover restaurants near you.</p>
                </div>
                {!userLocation && (
                  <button onClick={requestLocation} disabled={isLocating} className="btn-primary text-xs px-5 py-2.5 shadow-md">
                    {isLocating ? 'Locating...' : 'Find Near Me'}
                  </button>
                )}
              </div>
              {locationError && <div className="text-xs text-red-500 font-medium">{locationError}</div>}
              {userLocation && (
                <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-stone-200 relative z-0 shadow-inner">
                  <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors" />
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>You are here</Popup>
                    </Marker>
                    {processedRestaurants.map((r) => r.location ? (
                      <Marker key={r.id} position={[r.location.lat, r.location.lng]}>
                        <Popup className="rounded-xl min-w-[150px]">
                          <div className="font-bold text-sm">{r.name}</div>
                          <div className="text-[11px] text-stone-500 mb-1">{r.activeQueueCount === 0 ? 'No wait time' : `${r.activeQueueCount} waiting`}</div>
                          <Link to={`/join/${r.slug}`} className="text-brand-600 text-xs font-bold block bg-brand-50 rounded-lg px-2 py-1.5 text-center border border-brand-100 hover:bg-brand-100 transition mt-2">
                            Join Waitlist
                          </Link>
                        </Popup>
                      </Marker>
                    ) : null)}
                  </MapContainer>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-stone-200 pb-4 pt-4">
              <div>
                <h2 className="text-2xl font-bold font-display text-surface-900">
                  Partner Restaurants ({processedRestaurants.length})
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
            ) : processedRestaurants.length === 0 ? (
              <div className="card p-12 text-center text-stone-500">
                No restaurants found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedRestaurants.map((r) => (
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{r.address}</span>
                          </div>
                          {r.distanceKm !== undefined && (
                            <span className="font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100 shrink-0 text-[10px]">
                              {r.distanceKm.toFixed(1)} km
                            </span>
                          )}
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
      </div>

      {/* ────────────────────────── COMPREHENSIVE FOOTER ────────────────────────── */}
      <footer className="bg-stone-950 text-white border-t border-stone-800 pt-16 pb-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Main 4-Column Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Column 1: Brand & Bio (Spans 2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-stone-950 font-black shadow-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-display font-black text-2xl text-white tracking-tight">
                  Smart Waitlist
                </span>
              </div>

              <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
                Revolutionizing restaurant waitlists with WhatsApp-native queueing, pre-seating dish pre-orders, smart table assignments, and live drag & drop kitchen displays.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-300 bg-stone-900 px-3 py-1 rounded-full border border-stone-800">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Made for India
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Razorpay Verified
                </span>
              </div>
            </div>

            {/* Column 2: Platform Portals */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-2 text-xs text-stone-400">
                <li><a href="#" className="hover:text-amber-400 transition">Home</a></li>
                <li><a href="#restaurants-section" className="hover:text-amber-400 transition">Partner Restaurants</a></li>
                <li><button onClick={() => setShowInquiryModal(true)} className="hover:text-amber-400 transition text-left">Partner Inquiry</button></li>
                <li><Link to="/staff" className="hover:text-amber-400 transition">Staff Panel Portal</Link></li>
                <li><Link to="/kitchen" className="hover:text-amber-400 transition">Kitchen Display (KDS)</Link></li>
                <li><Link to="/admin" className="hover:text-amber-400 transition">Owner Admin</Link></li>
              </ul>
            </div>

            {/* Column 3: Contact Us */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Contact Us</h4>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>42 MG Road, Indiranagar, Bangalore, KA 560038</span>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
                  <a href="tel:+919876543210" className="hover:text-white transition">+91 98765 43210</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <a href="mailto:support@smartwaitlist.com" className="hover:text-white transition">support@smartwaitlist.com</a>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Mon - Sun: 9:00 AM - 11:00 PM IST</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Social Media & Connect */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Follow & Connect</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Connect with our team for live demos, updates, and product announcements.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-amber-500 hover:text-stone-950 text-stone-400 flex items-center justify-center transition border border-stone-800"
                  title="Twitter / X"
                >
                  <Twitter className="w-4 h-4" />
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-rose-500 hover:text-white text-stone-400 flex items-center justify-center transition border border-stone-800"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>

                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-blue-600 hover:text-white text-stone-400 flex items-center justify-center transition border border-stone-800"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>

                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-blue-500 hover:text-white text-stone-400 flex items-center justify-center transition border border-stone-800"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>

                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-emerald-500 hover:text-stone-950 text-stone-400 flex items-center justify-center transition border border-stone-800"
                  title="WhatsApp Direct"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom Bar */}
          <div className="pt-8 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <div>
              © 2026 Smart Waitlist Technologies Inc. All rights reserved.
            </div>

            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-stone-300 transition">Privacy Policy</a>
              <a href="#" className="hover:text-stone-300 transition">Terms of Service</a>
              <a href="#" className="hover:text-stone-300 transition">Security SLA</a>
            </div>
          </div>
        </div>
      </footer>

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
