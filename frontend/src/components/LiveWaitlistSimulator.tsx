import { useState } from 'react';
import { Users, CheckCircle2, MessageCircle, Utensils, Sparkles, Send, Sparkle, Clock, ShieldCheck } from 'lucide-react';

interface Props {
  onSimulateJoin?: (partySize: number, zone: string, dishes: string[]) => void;
}

const MENU_ITEMS = [
  { id: 'item1', name: 'Truffle Woodfired Pizza', price: '₹650', time: '10m prep' },
  { id: 'item2', name: 'Charcoal Grilled Tikka Platter', price: '₹520', time: '8m prep' },
  { id: 'item3', name: 'Artisanal Smoked Mocktail', price: '₹280', time: '3m prep' },
];

export default function LiveWaitlistSimulator({ onSimulateJoin }: Props) {
  const [partySize, setPartySize] = useState<number>(4);
  const [selectedZone, setSelectedZone] = useState<string>('indoor');
  const [selectedDishes, setSelectedDishes] = useState<string[]>(['item1']);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    queuePosition: number;
    estimatedWaitMins: number;
    whatsappMessage: string;
  } | null>(null);

  const toggleDish = (id: string) => {
    if (selectedDishes.includes(id)) {
      setSelectedDishes(selectedDishes.filter((d) => d !== id));
    } else {
      setSelectedDishes([...selectedDishes, id]);
    }
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationResult(null);

    setTimeout(() => {
      const pos = Math.floor(Math.random() * 3) + 1;
      const waitMins = Math.max(5, pos * 6 + partySize * 2 - (selectedZone === 'terrace' ? 2 : 0));

      setSimulationResult({
        queuePosition: pos,
        estimatedWaitMins: waitMins,
        whatsappMessage: `🎉 Smart Waitlist Alert: Your Table for ${partySize} guests (${selectedZone.toUpperCase()}) is READY at Bella Vista Bistro! Please head to the front desk. Your pre-ordered dishes are cooking now! 🍕🔥`,
      });
      setIsSimulating(false);
      if (onSimulateJoin) {
        onSimulateJoin(partySize, selectedZone, selectedDishes);
      }
    }, 1200);
  };

  return (
    <div className="bg-stone-900/90 backdrop-blur-2xl rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-2xl space-y-6 text-white relative overflow-hidden">
      {/* Decorative ambient light */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-stone-950 font-black shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Interactive Demo</span>
            <h3 className="font-display font-black text-xl text-white">Live Waitlist Simulator</h3>
          </div>
        </div>

        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/80 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Instant Preview
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Inputs */}
        <div className="space-y-4">
          {/* Party Size Selector */}
          <div>
            <label className="text-xs font-bold text-stone-300 block mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" /> 1. Select Party Size
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 4, 6, 8].map((size) => (
                <button
                  key={size}
                  onClick={() => setPartySize(size)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition border ${
                    partySize === size
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 border-amber-300 shadow-md scale-105'
                      : 'bg-white/5 hover:bg-white/10 text-stone-300 border-white/10'
                  }`}
                >
                  {size} {size === 1 ? 'Guest' : 'Guests'}
                </button>
              ))}
            </div>
          </div>

          {/* Seating Preference */}
          <div>
            <label className="text-xs font-bold text-stone-300 block mb-2 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-400" /> 2. Dining Zone Preference
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'indoor', label: 'Indoor AC' },
                { id: 'vip', label: 'VIP Booth' },
                { id: 'terrace', label: 'Rooftop' },
              ].map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    selectedZone === zone.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-white/5 text-stone-400 border-white/10 hover:text-white'
                  }`}
                >
                  {zone.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pre-Order Dish Selector */}
          <div>
            <label className="text-xs font-bold text-stone-300 block mb-2 flex items-center gap-1.5">
              <Sparkle className="w-3.5 h-3.5 text-amber-400" /> 3. Optional Pre-Seating Dishes
            </label>
            <div className="space-y-1.5">
              {MENU_ITEMS.map((dish) => {
                const checked = selectedDishes.includes(dish.id);
                return (
                  <button
                    key={dish.id}
                    onClick={() => toggleDish(dish.id)}
                    className={`w-full p-2.5 rounded-xl border text-xs flex items-center justify-between transition text-left ${
                      checked
                        ? 'bg-amber-950/40 border-amber-500/50 text-white'
                        : 'bg-white/5 border-white/10 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                          checked ? 'bg-amber-500 text-stone-950 font-black' : 'border border-stone-600'
                        }`}
                      >
                        {checked && '✓'}
                      </div>
                      <span className="font-medium">{dish.name}</span>
                    </div>
                    <span className="font-bold text-amber-300">{dish.price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulate Action Button */}
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition active:scale-95 border border-amber-300/40"
          >
            {isSimulating ? (
              <>
                <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                <span>Simulating Live Queue...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Test Live Queue Join</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output Screen / Simulated Phone */}
        <div className="bg-stone-950 rounded-2xl border border-white/10 p-5 flex flex-col justify-between space-y-4 relative shadow-inner">
          <div className="text-xs font-bold text-stone-400 flex items-center justify-between border-b border-white/10 pb-2">
            <span>Simulated WhatsApp Guest Phone</span>
            <MessageCircle className="w-4 h-4 text-emerald-400" />
          </div>

          {!simulationResult && !isSimulating && (
            <div className="py-12 text-center text-stone-500 text-xs space-y-2">
              <Clock className="w-8 h-8 text-stone-600 mx-auto" />
              <p>Click "Test Live Queue Join" to trigger an instant simulation of your queue position & WhatsApp alert!</p>
            </div>
          )}

          {isSimulating && (
            <div className="py-12 text-center text-amber-400 text-xs space-y-3">
              <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-bold">Contacting Smart Waitlist Engine & Assigning Table...</p>
            </div>
          )}

          {simulationResult && !isSimulating && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              {/* Queue Status Box */}
              <div className="bg-stone-900 border border-amber-500/40 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Position in Line:</span>
                  <span className="font-black text-amber-400 text-sm">#{simulationResult.queuePosition} in Queue</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Estimated Wait:</span>
                  <span className="font-bold text-emerald-400">~{simulationResult.estimatedWaitMins} Mins</span>
                </div>
              </div>

              {/* Simulated WhatsApp Notification Bubble */}
              <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 space-y-2 text-xs relative shadow-lg">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Push Notification</span>
                  <span className="text-[9px] text-emerald-500 ml-auto">Just Now</span>
                </div>
                <p className="text-stone-200 leading-relaxed font-sans text-xs">
                  {simulationResult.whatsappMessage}
                </p>
                <div className="pt-2 flex items-center justify-between text-[10px] text-emerald-400/80">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live Sync Active
                  </span>
                  <span>Tap to view live position</span>
                </div>
              </div>
            </div>
          )}

          <div className="text-[10px] text-stone-500 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Zero App Download Required for Guests</span>
          </div>
        </div>
      </div>
    </div>
  );
}
