import { useLocation, useNavigate } from 'react-router-dom';

export default function ReceiptPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">No receipt data found.</p>
      </div>
    );
  }

  const { studentName, regNumber, amount, reference, reason } = state;
  const dateStr = new Date().toLocaleString('en-GB', { 
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center print:bg-white print:py-0">
      
      {/* Receipt Container */}
      <div className="w-full max-w-2xl bg-white shadow-xl border border-slate-200 relative overflow-hidden print:shadow-none print:border-none">
        
        {/* Watermark / Logo Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <img 
            src="https://dailystar.co.ug/wp-content/uploads/2025/03/Victoria-University.jpg" 
            alt="Watermark" 
            className="w-96 h-96 object-contain"
          />
        </div>

        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Fees Receipt</h1>
            <p className="text-sm text-slate-500 mt-1">Your payment was successfully received</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-700">V- {reference.slice(0, 5).toUpperCase()}</p>
          </div>
        </div>

        {/* Details Body */}
        <div className="p-8 pt-6 space-y-4 text-sm relative z-10">
          <div className="grid grid-cols-[150px_1fr] gap-2">
            <span className="text-slate-500">Date</span>
            <span className="font-semibold text-slate-800">{dateStr} EAT</span>
          </div>
          <div className="grid grid-cols-[150px_1fr] gap-2">
            <span className="text-slate-500">Student Name:</span>
            <span className="font-semibold text-slate-800 uppercase">{studentName}</span>
          </div>
          <div className="grid grid-cols-[150px_1fr] gap-2">
            <span className="text-slate-500">Registration No:</span>
            <span className="font-semibold text-slate-800 uppercase">{regNumber}</span>
          </div>
          <div className="grid grid-cols-[150px_1fr] gap-2">
            <span className="text-slate-500">Student No:</span>
            <span className="font-semibold text-slate-800">{regNumber.split('-')[2] || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-[150px_1fr] gap-2">
            <span className="text-slate-500">Amount</span>
            <span className="font-bold text-lg text-brand-deep">UGX {Number(amount).toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-[150px_1fr] gap-2">
            <span className="text-slate-500">Intake</span>
            <span className="font-semibold text-slate-800">JUL/2025</span>
          </div>
          <div className="grid grid-cols-[150px_1fr] gap-2">
            <span className="text-slate-500">Reason</span>
            <span className="font-semibold text-slate-800">{reason}</span>
          </div>
          <div className="grid grid-cols-[150px_1fr] gap-2">
            <span className="text-slate-500">Payment Method</span>
            <span className="font-semibold text-slate-800">Mobile Money</span>
          </div>
          <div className="grid grid-cols-[150px_1fr] gap-2">
            <span className="text-slate-500">Transaction ID</span>
            <span className="font-mono text-xs text-slate-600 break-all">{reference}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 border-t border-slate-100 bg-slate-50 text-center relative z-10">
          <p className="text-lg font-bold text-slate-400 tracking-widest uppercase mb-2">Thank You</p>
          <h2 className="font-bold text-slate-800 text-lg">Victoria University</h2>
          <p className="text-xs text-slate-500 mt-1">
            Victoria towers Plot 1- 13 Jinja Road, Kampala- Uganda<br/>
            Website: http://vu.ac.ug
          </p>
          <p className="text-xs text-slate-500 mt-3">
            For help or enquires Please send an email to <strong>bursar@vu.ac.ug</strong>
          </p>
        </div>
      </div>

      {/* Buttons (Hidden when printing) */}
      <div className="mt-8 flex gap-4 print:hidden">
        <button 
          onClick={() => window.print()} 
          className="px-6 py-3 bg-brand-mid text-white font-bold rounded-xl hover:bg-brand-deep transition shadow-lg"
        >
          Print / Save as PDF
        </button>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-300 hover:bg-slate-50 transition"
        >
          Make another payment
        </button>
      </div>

    </div>
  );
}
