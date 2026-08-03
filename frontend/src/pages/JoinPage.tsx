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

  const handlePreOrder = async () => {
    const items = Object.entries(cart).map(([menuItemId, qty]) => ({ menuItemId, qty }));
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-stone-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <header className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
        <Link to="/" className="p-2 rounded-lg hover:bg-white/80 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-lg">{restaurant?.name}</h1>
          <p className="text-sm text-stone-500">{restaurant?.address}</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {step === 'form' && (
          <div className="animate-slide-up">
            <div className="card p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold">Join the Waitlist</h2>
                  <p className="text-sm text-stone-500">Get updates on WhatsApp</p>
                </div>
              </div>

              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="label">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      className="input pl-11"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
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

            {restaurant?.whatsappJoinUrl && (
              <a
                href={restaurant.whatsappJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 flex items-center gap-3 hover:border-green-300 transition"
              >
                <MessageCircle className="w-6 h-6 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Or join via WhatsApp</div>
                  <div className="text-xs text-stone-500">Tap to open WhatsApp directly</div>
                </div>
              </a>
            )}
          </div>
        )}

        {step === 'menu' && (
          <div className="animate-slide-up">
            <div className="card p-4 mb-4 bg-brand-50 border-brand-200">
              <p className="text-sm text-brand-800">
                <ShoppingBag className="w-4 h-4 inline mr-1" />
                Pre-order while you wait — food ready when you're seated!
              </p>
            </div>

            {menu.map((category) => (
              <div key={category._id} className="mb-6">
                <h3 className="font-display font-semibold text-lg mb-3">{category.name}</h3>
                <div className="space-y-2">
                  {category.items.map((item: MenuItem) => (
                    <div
                      key={item._id}
                      className={`card p-4 flex items-center gap-3 cursor-pointer transition ${
                        cart[item._id] ? 'border-brand-400 bg-brand-50/50' : 'hover:border-stone-300'
                      }`}
                      onClick={() => toggleCart(item)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-stone-500">{item.description}</div>
                        <div className="text-brand-600 font-semibold mt-1">₹{item.price}</div>
                      </div>
                      {cart[item._id] ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="w-8 h-8 rounded-lg bg-white border border-stone-200 font-bold"
                            onClick={() => updateQty(item._id, -1)}
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-bold">{cart[item._id]}</span>
                          <button
                            className="w-8 h-8 rounded-lg bg-brand-600 text-white font-bold"
                            onClick={() => updateQty(item._id, 1)}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button className="btn-secondary text-sm py-2 px-3">Add</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="sticky bottom-4 space-y-2">
              {cartTotal > 0 && (
                <div className="card p-3 text-center font-semibold">
                  Pre-order total: ₹{cartTotal.toFixed(0)}
                </div>
              )}
              <button onClick={handlePreOrder} className="btn-primary w-full">
                {Object.keys(cart).length > 0 ? 'Confirm Pre-Order' : 'Skip — Join Queue Only'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="card p-8 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">You're in the queue!</h2>
            <p className="text-stone-600 mb-6">
              We'll send WhatsApp updates with your position and estimated wait time.
            </p>
            <button
              onClick={() => navigate(`/status/${entryId}`)}
              className="btn-primary w-full mb-3"
            >
              Track My Status
            </button>
            <button onClick={() => navigate('/')} className="btn-secondary w-full">
              Back to Home
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
