import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Users,
  Phone,
  User,
  MessageCircle,
  ShoppingBag,
  CheckCircle2,
  Clock,
  MapPin,
  Utensils,
  Copy,
  Check,
  ExternalLink,
  Leaf,
} from 'lucide-react';
import { api } from '../lib/api';
import type { MenuItem } from '../types';

export default function JoinPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'menu' | 'success'>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [entryId, setEntryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'nonveg' | 'vegan'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const { data } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn: () => api.getRestaurant(slug!),
    enabled: !!slug,
  });

  const restaurant = data?.restaurant;
  const menu = data?.menu ?? [];

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.joinQueue(slug!, { name, phone, partySize });
      setEntryId(result.entry._id);
      localStorage.setItem('customer_queue_id', result.entry._id);
      if (restaurant?.settings.preOrderEnabled) {
        setStep('menu');
      } else {
        setStep('success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setLoading(false);
    }
  };

  const toggleCart = (item: MenuItem) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[item._id]) delete next[item._id];
      else next[item._id] = 1;
      return next;
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const qty = (prev[id] || 0) + delta;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: qty };
    });
  };

  const handleNoteChange = (id: string, note: string) => {
    setItemNotes((prev) => ({ ...prev, [id]: note }));
  };

  const handlePreOrder = async () => {
    const items = Object.entries(cart).map(([menuItemId, qty]) => ({
      menuItemId,
      qty,
      notes: itemNotes[menuItemId] || '',
    }));
    if (items.length > 0) {
      await api.preOrder(entryId, items);
    }
    setStep('success');
  };

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menu.flatMap((c) => c.items).find((i) => i._id === id);
    return sum + (item?.price ?? 0) * qty;
  }, 0);

  if (!restaurant && data === undefined) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm">
          <h2 className="text-xl font-bold font-display text-surface-900 mb-2">
            Restaurant Not Found
          </h2>
          <p className="text-stone-500 text-sm mb-4">
            The queue you're looking for doesn't exist or is currently unavailable.
          </p>
          <Link to="/" className="btn-primary inline-block text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const directTrackUrl = `${window.location.origin}${window.location.pathname.includes('/SmartWaitlist') ? '/SmartWaitlist' : ''}/status/${entryId}`;
  const shortTrackingCode = entryId ? `#${entryId.slice(-6).toUpperCase()}` : '';

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top Banner */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-surface-900 leading-snug">
              {restaurant.name}
            </h1>
            <p className="text-xs text-stone-500">{restaurant.address}</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {step === 'form' && (
          <div className="space-y-4 animate-fade-in">
            {/* Queue Info Card */}
            <div className="card p-6 text-center bg-gradient-to-br from-brand-600 to-brand-700 text-white border-none shadow-md">
              <h2 className="font-display text-xl font-bold">Join the Waiting List</h2>
              <p className="text-brand-100 text-xs mt-1">Get real-time updates directly on your phone</p>
            </div>

            {/* Form */}
            <div className="card p-6">
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="label">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      className="input pl-11"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      className="input pl-11"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      pattern="[0-9]{10}"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Party Size</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPartySize(Math.max(1, partySize - 1))}
                      className="w-12 h-12 rounded-xl border border-stone-200 text-xl font-bold hover:bg-stone-50"
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <Users className="w-5 h-5 inline mr-2 text-brand-600" />
                      <span className="text-2xl font-bold">{partySize}</span>
                      <span className="text-stone-500 ml-1">guests</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPartySize(Math.min(20, partySize + 1))}
                      className="w-12 h-12 rounded-xl border border-stone-200 text-xl font-bold hover:bg-stone-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full text-lg">
                  {loading ? 'Joining...' : 'Join Waitlist'}
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 'menu' && (
          <div className="animate-slide-up space-y-4">
            <div className="card p-4 bg-brand-50 border-brand-200">
              <p className="text-sm text-brand-800 flex items-center gap-2 font-medium">
                <ShoppingBag className="w-4 h-4 text-brand-600" />
                Pre-order while you wait — food ready when you're seated!
              </p>
            </div>

            {/* Dietary Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'veg', label: '🟢 Veg Only' },
                { id: 'nonveg', label: '🔴 Non-Veg' },
                { id: 'vegan', label: '🌱 Vegan' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDietaryFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
                    dietaryFilter === f.id
                      ? 'bg-stone-900 text-white border-stone-900 shadow'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {menu.map((category) => {
              const filteredItems = category.items.filter((item: MenuItem) => {
                if (dietaryFilter === 'all') return true;
                if (dietaryFilter === 'veg') return item.isVeg || item.isVegan;
                if (dietaryFilter === 'nonveg') return !item.isVeg && !item.isVegan;
                if (dietaryFilter === 'vegan') return item.isVegan;
                return true;
              });

              if (filteredItems.length === 0) return null;

              return (
                <div key={category._id} className="mb-6">
                  <h3 className="font-display font-semibold text-lg mb-3 text-stone-900">{category.name}</h3>
                  <div className="space-y-3">
                    {filteredItems.map((item: MenuItem) => (
                      <div
                        key={item._id}
                        className={`card p-4 space-y-2 cursor-pointer transition ${
                          cart[item._id] ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500' : 'hover:border-stone-300'
                        }`}
                        onClick={() => toggleCart(item)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              {item.isVeg ? (
                                <span className="w-3.5 h-3.5 rounded border border-emerald-600 flex items-center justify-center p-0.5" title="Vegetarian">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                </span>
                              ) : item.isVegan ? (
                                <span title="Vegan">
                                  <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                                </span>
                              ) : (
                                <span className="w-3.5 h-3.5 rounded border border-red-600 flex items-center justify-center p-0.5" title="Non-Vegetarian">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                </span>
                              )}
                              <span className="font-semibold text-stone-900">{item.name}</span>
                            </div>
                            {item.description && <p className="text-xs text-stone-500 mt-0.5">{item.description}</p>}
                            <p className="text-brand-600 font-bold text-sm mt-1">₹{item.price}</p>
                          </div>

                          {cart[item._id] ? (
                            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="w-8 h-8 rounded-lg bg-white border border-stone-200 font-bold hover:bg-stone-100"
                                onClick={() => updateQty(item._id, -1)}
                              >
                                −
                              </button>
                              <span className="w-6 text-center font-bold text-stone-900">{cart[item._id]}</span>
                              <button
                                className="w-8 h-8 rounded-lg bg-white border border-stone-200 font-bold hover:bg-stone-100"
                                onClick={() => updateQty(item._id, 1)}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs shrink-0">
                              + Add
                            </button>
                          )}
                        </div>

                        {/* Special Instructions Note per item */}
                        {cart[item._id] && (
                          <div className="pt-2 border-t border-brand-100" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              placeholder="Special request (e.g. Less spicy, Extra cheese)..."
                              value={itemNotes[item._id] || ''}
                              onChange={(e) => handleNoteChange(item._id, e.target.value)}
                              className="w-full text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500 text-stone-800"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Fixed Cart Footer */}
            {Object.keys(cart).length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-xl z-20">
                <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-stone-500 font-medium">
                      {Object.values(cart).reduce((a, b) => a + b, 0)} items selected
                    </p>
                    <p className="text-lg font-bold text-surface-900">₹{cartTotal}</p>
                  </div>
                  <button onClick={handlePreOrder} className="btn-primary flex-1 text-base">
                    Confirm Pre-Order →
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 text-center">
              <button
                onClick={() => setStep('success')}
                className="text-xs font-semibold text-stone-500 hover:underline"
              >
                Skip Pre-Order for Now
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="animate-fade-in text-center space-y-6 py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-surface-900">You're in Line!</h2>
              <p className="text-stone-500 text-sm mt-1">We'll alert you on WhatsApp when your table is ready.</p>
            </div>

            {/* Direct Order Tracking ID Box */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-2xl p-5 border border-stone-800 space-y-3 shadow-xl">
              <div className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Your Live Order Tracking Code</div>
              <div className="font-mono text-3xl font-extrabold text-amber-400 tracking-wider">
                {shortTrackingCode}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(directTrackUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-xs font-bold rounded-xl text-stone-200 transition flex items-center justify-center gap-2 border border-stone-700"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Direct Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>Copy Direct Tracking Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate(`/status/${entryId}`)}
                className="btn-primary w-full text-base flex items-center justify-center gap-2"
              >
                <span>Track My Live Order & Status</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <p className="text-xs text-stone-400">
                Bookmark or save your tracking link to check your cooking status anytime!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
