import { useEffect, useState, useRef } from 'react';
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
} from 'lucide-react';

interface QRCodeModalProps {
  restaurantName: string;
  slug: string;
  address?: string;
  whatsappPhone?: string;
  onClose: () => void;
}

export default function QRCodeModal({
  restaurantName,
  slug,
  address,
  whatsappPhone,
  onClose,
}: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine full target URL (handles local & GitHub Pages base path)
  const baseUrl = window.location.origin;
  // If hosted on GitHub Pages with subpath like /SmartWaitlist
  const pathPrefix = window.location.pathname.includes('/SmartWaitlist')
    ? '/SmartWaitlist'
    : '';
  const joinUrl = `${baseUrl}${pathPrefix}/join/${slug}`;

  useEffect(() => {
    QRCode.toDataURL(
      joinUrl,
      {
        width: 400,
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
    a.download = `${slug}-qr-code.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${restaurantName} - QR Code Standee</title>
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
              width: 380px;
              background: #ffffff;
              border: 3px solid #1c1917;
              border-radius: 28px;
              padding: 40px 32px;
              text-align: center;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
            .badge {
              display: inline-block;
              background: #ea580c;
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
              font-size: 26px;
              font-weight: 800;
              color: #0c0a09;
              margin: 0 0 8px 0;
              line-height: 1.2;
            }
            p.sub {
              font-size: 13px;
              color: #78716c;
              margin: 0 0 28px 0;
            }
            .qr-container {
              background: #ffffff;
              padding: 16px;
              border: 2px border #e7e5e4;
              border-radius: 20px;
              display: inline-block;
              margin-bottom: 24px;
            }
            .qr-container img {
              width: 220px;
              height: 220px;
              display: block;
            }
            .instructions {
              background: #fff7ed;
              border: 1px solid #ffedd5;
              border-radius: 16px;
              padding: 16px;
              margin-bottom: 20px;
            }
            .instructions h3 {
              font-family: 'Outfit', sans-serif;
              font-size: 15px;
              font-weight: 700;
              color: #9a3412;
              margin: 0 0 6px 0;
            }
            .instructions p {
              font-size: 12px;
              color: #c2410c;
              margin: 0;
              line-height: 1.4;
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
            <div class="badge">Smart Waitlist</div>
            <h1>${restaurantName}</h1>
            <p class="sub">${address || 'Scan to Join Waitlist & Pre-Order Dishes'}</p>

            <div class="qr-container">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>

            <div class="instructions">
              <h3>Scan with Camera to Join</h3>
              <p>Skip the line, check live waiting time & pre-order your food!</p>
            </div>

            <div class="footer">
              Powered by SmartWaitlist • ${joinUrl}
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
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-stone-100 animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                Restaurant QR Code
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

        {/* QR Code Canvas Card */}
        <div className="bg-white p-6 rounded-2xl text-center space-y-3 border border-stone-200">
          {loading ? (
            <div className="h-56 flex items-center justify-center text-stone-400">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="inline-block p-2 bg-stone-50 rounded-xl border border-stone-200">
              <img src={qrDataUrl} alt="Restaurant QR Code" className="w-56 h-56 mx-auto" />
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs font-semibold text-stone-900 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Scan to Join Waitlist
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
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-stone-950 font-bold transition text-xs"
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
            className="inline-flex items-center gap-1 text-xs text-orange-400 hover:underline"
          >
            Open Customer Join Page <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
