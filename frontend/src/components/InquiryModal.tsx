import { useState } from 'react';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Users,
  CheckCircle2,
  X,
  Sparkles,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';

interface InquiryModalProps {
  onClose: () => void;
}

export default function InquiryModal({ onClose }: InquiryModalProps) {
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [dailyFootfall, setDailyFootfall] = useState('50-100 guests');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.submitInquiry({
        restaurantName,
        ownerName,
        phone,
        email,
        city,
        dailyFootfall,
        notes,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-stone-900 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-stone-900">Partner Inquiry Form</h3>
              <p className="text-xs text-stone-500">Join 50+ Modern Restaurants on Smart Waitlist</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 p-1.5 rounded-xl transition hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h4 className="text-2xl font-bold font-display text-stone-900">Inquiry Received! 🎉</h4>
              <p className="text-sm text-stone-600 max-w-sm mx-auto">
                Thank you <strong>{ownerName}</strong>! Our onboarding specialist will reach out to <strong>{restaurantName}</strong> on WhatsApp within 1 hour.
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <a
                href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hello Smart Waitlist team! I submitted an inquiry for ${restaurantName}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Directly on WhatsApp Now</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button onClick={onClose} className="btn-ghost text-stone-500 py-2.5 text-xs">
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Restaurant Name *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Spice Garden Bistro"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="input pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Owner / Manager Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="input pl-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">WhatsApp Mobile No. *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Business Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="owner@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">City / Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Connaught Place"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Avg Daily Footfall</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <select
                    value={dailyFootfall}
                    onChange={(e) => setDailyFootfall(e.target.value)}
                    className="input pl-9 text-xs"
                  >
                    <option value="Under 50 guests">Under 50 guests / day</option>
                    <option value="50-100 guests">50 - 100 guests / day</option>
                    <option value="100-250 guests">100 - 250 guests / day</option>
                    <option value="250+ guests">250+ guests / day</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">Additional Requirements / Notes</label>
              <textarea
                rows={3}
                placeholder="Tell us about your seating capacity, current wait times, or special features needed..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input text-xs"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-extrabold rounded-2xl shadow-lg shadow-brand-600/25 text-sm flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Submitting Inquiry...' : 'Submit Restaurant Partner Inquiry'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
