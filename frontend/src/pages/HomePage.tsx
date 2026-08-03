import { Link } from 'react-router-dom';
import {
  QrCode,
  MessageCircle,
  ChefHat,
  LayoutDashboard,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-amber-50">
      <header className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-surface-900">Smart Waitlist</span>
        </div>
        <Link to="/login" className="btn-secondary text-sm py-2 px-4">
          Staff Login
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-20">
        <section className="text-center pt-12 pb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <MessageCircle className="w-4 h-4" />
            WhatsApp-Native · No App Download
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-surface-900 leading-tight mb-6">
            Turn Waiting Customers
            <br />
            <span className="text-brand-600">Into Paying Customers</span>
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-10">
            Smart queue management with real-time WhatsApp updates, pre-ordering while waiting,
            and a kitchen display that syncs perfectly with your floor team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/join/spice-garden" className="btn-primary text-lg px-8">
              <QrCode className="w-5 h-5" />
              Join Demo Waitlist
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8">
              Restaurant Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: QrCode,
              title: 'Scan & Join',
              desc: 'Customers scan a QR code and join via WhatsApp instantly. No app, no friction.',
            },
            {
              icon: MessageCircle,
              title: 'Live Updates',
              desc: 'Automated queue position and wait time updates keep guests informed and engaged.',
            },
            {
              icon: ChefHat,
              title: 'Smart Kitchen',
              desc: 'Cooking starts only when table is ready AND customer taps On My Way.',
            },
          ].map((item) => (
            <div key={item.title} className="card p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="card p-8 md:p-12 bg-surface-900 text-white">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: '+5', label: 'Extra covers/hour' },
              { value: '-14 min', label: 'Reduced wait time' },
              { value: '-27%', label: 'Fewer walkaways' },
              { value: 'Rs 6,000', label: 'Extra revenue/weekend' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-3xl md:text-4xl font-bold text-brand-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-stone-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid md:grid-cols-3 gap-4">
          <Link
            to="/staff"
            className="card p-6 flex items-center gap-4 hover:border-brand-300 hover:shadow-md transition-all group"
          >
            <Users className="w-8 h-8 text-brand-600" />
            <div>
              <div className="font-semibold group-hover:text-brand-600 transition">Staff Panel</div>
              <div className="text-sm text-stone-500">3-button table management</div>
            </div>
          </Link>
          <Link
            to="/kitchen"
            className="card p-6 flex items-center gap-4 hover:border-brand-300 hover:shadow-md transition-all group"
          >
            <ChefHat className="w-8 h-8 text-brand-600" />
            <div>
              <div className="font-semibold group-hover:text-brand-600 transition">Kitchen Display</div>
              <div className="text-sm text-stone-500">Live order queue</div>
            </div>
          </Link>
          <Link
            to="/admin"
            className="card p-6 flex items-center gap-4 hover:border-brand-300 hover:shadow-md transition-all group"
          >
            <LayoutDashboard className="w-8 h-8 text-brand-600" />
            <div>
              <div className="font-semibold group-hover:text-brand-600 transition">Admin Dashboard</div>
              <div className="text-sm text-stone-500">Analytics & insights</div>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
