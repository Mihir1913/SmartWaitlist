import { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Receipt,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react';
import type { Order, QueueEntry } from '../types';

interface BillReceiptModalProps {
  restaurantName: string;
  restaurantAddress?: string;
  entry?: QueueEntry;
  order: Order;
  onClose: () => void;
}

export default function BillReceiptModal({
  restaurantName,
  restaurantAddress = '42 MG Road, Indiranagar, Bangalore',
  entry,
  order,
  onClose,
}: BillReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const subtotal = order.subtotal || order.items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const gst = order.gst || Math.round(subtotal * 0.05);
  const totalAmount = order.totalAmount || order.total || subtotal + gst;
  const invoiceNo = `INV-${(order.orderNumber || order._id.slice(-6)).toUpperCase()}`;
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const tableNo = entry?.assignedTableId ? (typeof entry.assignedTableId === 'object' ? entry.assignedTableId.number : entry.assignedTableId) : 'Dining Table';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-stone-900 max-h-[92vh] flex flex-col">
        {/* Printable CSS overrides */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #printable-receipt, #printable-receipt * { visibility: visible; }
            #printable-receipt { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          }
        `}</style>

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-stone-900">Official Bill & Tax Invoice</h3>
              <p className="text-xs text-stone-500">GST Invoice #{invoiceNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print / Download PDF</span>
            </button>

            <button onClick={onClose} className="text-stone-400 hover:text-stone-900 p-1.5 rounded-xl hover:bg-stone-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Container */}
        <div
          ref={receiptRef}
          id="printable-receipt"
          className="flex-1 overflow-y-auto bg-stone-50 border border-stone-200 rounded-2xl p-6 space-y-5 text-stone-900 font-sans"
        >
          {/* Restaurant Header */}
          <div className="text-center border-b border-dashed border-stone-300 pb-4 space-y-1">
            <h2 className="font-display font-extrabold text-2xl text-stone-900">{restaurantName}</h2>
            <p className="text-xs text-stone-500">{restaurantAddress}</p>
            <p className="text-[11px] font-mono text-stone-400">GSTIN: 29AAAAA0000A1Z5 • FSSAI Lic: 11223344556677</p>
          </div>

          {/* Invoice Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs border-b border-dashed border-stone-300 pb-3">
            <div>
              <p className="text-stone-500">Invoice No: <strong className="text-stone-900 font-mono">{invoiceNo}</strong></p>
              <p className="text-stone-500">Guest Name: <strong className="text-stone-900">{entry?.customer?.name || 'Walk-in Guest'}</strong></p>
            </div>
            <div className="text-right">
              <p className="text-stone-500">Date: <strong className="text-stone-900">{dateStr}</strong></p>
              <p className="text-stone-500">Table: <strong className="text-orange-600 font-bold">{tableNo}</strong></p>
            </div>
          </div>

          {/* Itemized Order Table */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 text-[11px] font-bold text-stone-500 border-b border-stone-300 pb-1 uppercase tracking-wider">
              <div className="col-span-6">Item Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            <div className="space-y-2 text-xs">
              {order.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center py-1 border-b border-stone-200/80">
                  <div className="col-span-6">
                    <span className="font-semibold text-stone-900">{item.name}</span>
                    {item.notes && <span className="block text-[10px] text-amber-600 font-italic">Note: {item.notes}</span>}
                  </div>
                  <div className="col-span-2 text-center font-mono font-bold">{item.qty}</div>
                  <div className="col-span-2 text-right font-mono text-stone-600">₹{item.price}</div>
                  <div className="col-span-2 text-right font-mono font-bold text-stone-900">₹{item.price * item.qty}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Calculation Summary */}
          <div className="border-t border-stone-300 pt-3 space-y-1.5 text-xs text-stone-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%):</span>
              <span className="font-mono">₹{gst}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-stone-900 border-t border-stone-300 pt-2">
              <span>Net Amount Payable:</span>
              <span className="font-mono text-orange-600">₹{totalAmount}</span>
            </div>
          </div>

          {/* Payment Status Stamp */}
          <div className="pt-2 text-center">
            {order.paymentStatus === 'paid' ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                PAID ONLINE VIA UPI / RAZORPAY
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold uppercase tracking-wider">
                PAYABLE AT RESTAURANT TABLE
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-stone-400 pt-2 border-t border-dashed border-stone-300 space-y-0.5">
            <p>Thank you for dining at {restaurantName}! Have a delightful day.</p>
            <p className="font-mono">Powered by Smart Waitlist Engine</p>
          </div>
        </div>
      </div>
    </div>
  );
}
