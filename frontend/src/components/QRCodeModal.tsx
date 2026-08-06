import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Copy,
  Download,
  Printer,
  Check,
  X,
  Sparkles,
  ExternalLink,
  Frame,
} from 'lucide-react';

interface QRCodeModalProps {
  restaurantName: string;
  slug: string;
  address?: string;
  whatsappPhone?: string;
  onClose: () => void;
}

type StandeeTemplate = 'acrylic' | 'table_card' | 'poster';

export default function QRCodeModal({
  restaurantName,
  slug,
  address,
  onClose,
}: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<StandeeTemplate>('acrylic');
  const [slogan, setSlogan] = useState('Scan to Skip the Line & Track Live Status');

  const baseUrl = window.location.origin;
  const pathPrefix = window.location.pathname.includes('/SmartWaitlist')
    ? '/SmartWaitlist'
    : '';
  const joinUrl = `${baseUrl}${pathPrefix}/join/${slug}`;

  useEffect(() => {
    QRCode.toDataURL(
      joinUrl,
      {
        width: 450,
        margin: 2,
        color: {
          dark: '#1c1917',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
        setLoading(false);
      }
    );
  }, [joinUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${slug}-qr-standee.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const accentColor = template === 'acrylic' ? '#ea580c' : template === 'table_card' ? '#059669' : '#2563eb';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${restaurantName} - Official QR Standee</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background-color: #f5f5f4;
            }
            .standee {
              width: ${template === 'poster' ? '450px' : '380px'};
              background: #ffffff;
              border: 3px solid #1c1917;
              border-radius: 28px;
              padding: 40px 32px;
              text-align: center;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
            .badge {
              display: inline-block;
              background: ${accentColor};
              color: white;
              font-family: 'Outfit', sans-serif;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              padding: 6px 14px;
              border-radius: 20px;
              margin-bottom: 20px;
            }
            h1 {
              font-family: 'Outfit', sans-serif;
              font-size: 28px;
              font-weight: 800;
              color: #0c0a09;
              margin: 0 0 8px 0;
              line-height: 1.2;
            }
            p.sub {
              font-size: 13px;
              color: #78716c;
              margin: 0 0 24px 0;
            }
            .qr-container {
              background: #ffffff;
              padding: 16px;
              border: 2px solid ${accentColor};
              border-radius: 20px;
              display: inline-block;
              margin-bottom: 24px;
            }
            .qr-container img {
              width: 240px;
              height: 240px;
              display: block;
            }
            .instructions {
              background: #fafaf9;
              border: 1px solid #e7e5e4;
              border-radius: 16px;
              padding: 16px;
              margin-bottom: 20px;
            }
            .instructions h3 {
              font-family: 'Outfit', sans-serif;
              font-size: 15px;
              font-weight: 700;
              color: #1c1917;
              margin: 0 0 4px 0;
            }
            .instructions p {
              font-size: 12px;
              color: #57534e;
              margin: 0;
            }
            .footer {
              font-size: 11px;
              color: #a8a29e;
              font-weight: 500;
            }
            @media print {
              body { background: white; }
              .standee { border-color: #000; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="standee">
            <div class="badge">Official Waitlist & Pre-Order Standee</div>
            <h1>${restaurantName}</h1>
            <p class="sub">${address || 'Fine Dining & Quick Service'}</p>

            <div class="qr-container">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>

            <div class="instructions">
              <h3>${slogan}</h3>
              <p>Scan with phone camera for WhatsApp updates & live cooking progress</p>
            </div>

            <div class="footer">
              SmartWaitlist • ${joinUrl}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-stone-100 animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                Printable QR Standee Generator
              </h3>
              <p className="text-xs text-stone-400">{restaurantName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <Frame className="w-3.5 h-3.5 text-orange-400" /> Choose Standee Template:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'acrylic', label: 'Acrylic Frame', color: 'border-orange-500 text-orange-400' },
              { id: 'table_card', label: 'Table Card', color: 'border-emerald-500 text-emerald-400' },
              { id: 'poster', label: 'Entrance Poster', color: 'border-blue-500 text-blue-400' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id as StandeeTemplate)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                  template === t.id
                    ? `${t.color} bg-stone-800 shadow`
                    : 'border-stone-800 text-stone-400 hover:bg-stone-800/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Slogan Input */}
        <div>
          <label className="text-xs font-semibold text-stone-400 mb-1 block">
            Standee Slogan:
          </label>
          <input
            type="text"
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:border-orange-500 outline-none"
          />
        </div>

        {/* QR Code Canvas Preview */}
        <div className="bg-white p-5 rounded-2xl text-center space-y-3 border border-stone-200 shadow-inner">
          {loading ? (
            <div className="h-52 flex items-center justify-center text-stone-400">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="inline-block p-2 bg-stone-50 rounded-xl border border-stone-200">
              <img src={qrDataUrl} alt="Restaurant QR Code" className="w-48 h-48 mx-auto" />
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs font-bold text-stone-900 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" /> {slogan}
            </p>
            <p className="text-[11px] text-stone-500 font-mono break-all px-2">
              {joinUrl}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition text-xs font-medium"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-stone-300" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition text-xs font-medium"
          >
            <Download className="w-4 h-4 text-orange-400" />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-stone-950 font-bold transition text-xs shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>Print Standee</span>
          </button>
        </div>

        {/* Footer Link Preview */}
        <div className="pt-2 border-t border-stone-800 text-center">
          <a
            href={joinUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-orange-400 hover:underline font-semibold"
          >
            Open Customer Join Page <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
