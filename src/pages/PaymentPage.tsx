import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '../components/Input';

const STUDENTS: Record<string, string> = {
  'VU-BAED-2903-0763-DAY': 'RUBANGAKENE JACOB ELVIS',
};

// Fallback to hardcoded values if Vercel env vars fail to load
const ENV_URL = import.meta.env.VITE_SUPABASE_URL;
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const SUPABASE_URL = (ENV_URL || 'https://vncgvzfbarcyvytgtdjh.supabase.co').replace(/\/$/, '');
const SUPABASE_ANON_KEY = ENV_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuY2d2emZiYXJjeXZ5dGd0ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NzE4MTMsImV4cCI6MjEwNzE0NzgxM30.CyJ4V2v6gM_8kwllMiqsJMXreJ507MzKndbnDiiz1kQ';

type SuccessState = {
  reference: string;
  amount: number;
  status: 'pending' | 'success';
  studentName: string;
  regNumber: string;
  reason: string;
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const [regNumber, setRegNumber] = useState('');
  const [studentName, setStudentName] = useState<string | null>(null);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Tuition Payment');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentName || !amount || !phone) {
      toast.error('Complete all fields');
      return;
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '256' + cleanPhone.slice(1);
    if (!cleanPhone.startsWith('256')) cleanPhone = '256' + cleanPhone;

    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/blue-tick-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: 'school',
          regNumber: regNumber.toUpperCase().trim(),
          amount: Number(amount),
          phone: cleanPhone,
          reason,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 120) || 'Server returned an invalid response');
      }
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      console.log('[payment] initiated', data.reference);

      setSuccess({
        reference: data.reference,
        amount: Number(amount),
        status: 'pending',
        studentName: data.studentName,
        regNumber: data.regNumber,
        reason: data.reason ?? reason,
      });
      toast.success('Check your phone to approve the payment');
    } catch (err: any) {
      console.error('[payment] error', err);
      toast.error(err.message || 'Could not initiate payment');
    } finally {
      setLoading(false);
    }
  }

  // ── Poll BOTH Database and Nylon for status change ──
  useEffect(() => {
    if (!success || success.status === 'success') return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 100; // 100 × 3s = 5 min

    const tick = async () => {
      if (cancelled) return;
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        toast.error('Payment status timeout. Please try again.');
        setSuccess(null);
        return;
      }
      
      try {
        // 1. Check our Database (Fastest - updated by Webhook)
        const dbRes = await fetch(
          `${SUPABASE_URL}/rest/v1/school_payments?reference=eq.${encodeURIComponent(success.reference)}&select=status`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        const dbRows = await dbRes.json();
        const dbStatus = String(dbRows?.[0]?.status || '').toLowerCase();

        // 2. Check Nylon API (Fallback if webhook is slow)
        const res = await fetch(`${SUPABASE_URL}/functions/v1/blue-tick-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ type: 'school_status', reference: success.reference }),
        });
        
        const data = await res.json();
        const nylonStatus = String(data.status || '').toLowerCase();
        
        console.log('[payment] poll', attempts, '| DB:', dbStatus, '| Nylon:', nylonStatus);

        const isSuccess = dbStatus === 'successful' || dbStatus === 'success' || 
                          nylonStatus.includes('success') || nylonStatus.includes('paid');
                          
        const isFailed = dbStatus === 'failed' || dbStatus === 'cancelled' || 
                         nylonStatus.includes('fail') || nylonStatus.includes('cancel');

        if (isSuccess) {
          clearInterval(interval);
          toast.success('Payment confirmed! Loading receipt...');
          navigate('/receipt', {
            state: {
              studentName: success.studentName,
              regNumber: success.regNumber,
              amount: success.amount,
              reference: success.reference,
              reason: success.reason,
            },
          });
        } else if (isFailed) {
          clearInterval(interval);
          toast.error('Payment failed or cancelled. Please try again.');
          setSuccess(null);
        }
      } catch (e) {
        console.error('[payment] poll error', e);
      }
    };

    const interval = setInterval(tick, 3000);
    tick(); 

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [success, navigate]);

  if (success) {
    return (
      <div className="min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden flex flex-col items-center justify-center p-4 py-8 bg-slate-50">
        <Toaster position="top-center" />
        <div className="card w-full max-w-md p-8 text-center border-t-4 border-t-brand-mid">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand-mid">
            <Loader2 size={44} className="animate-spin" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-extrabold text-brand-deep">
            Processing Payment
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Check your phone and enter your PIN to approve.
            <br />
            <span className="text-slate-400">This page will update automatically.</span>
          </p>
          <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5 text-left text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Student</span>
              <strong className="text-brand-deep">{success.studentName}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Amount</span>
              <strong className="text-brand-mid text-lg">
                UGX {success.amount.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Reference</span>
              <span className="font-mono text-[11px] text-slate-600">
                {success.reference}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSuccess(null);
              setRegNumber('');
              setStudentName(null);
              setAmount('');
              setPhone('');
            }}
            className="btn btn-primary mt-8 w-full"
          >
            Cancel / Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden flex flex-col items-center justify-center p-4 py-8 bg-slate-50">
      <Toaster position="top-center" />
      <div className="w-full max-w-md">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-slate-100 mb-2">
            <img
              src="https://dailystar.co.ug/wp-content/uploads/2025/03/Victoria-University.jpg"
              alt="Victoria University Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-brand-deep sm:text-2xl">
            VICTORIA UNIVERSITY
            <br />
            PAYMENT PORTAL
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Enter your details to pay securely via mobile money.
          </p>
        </div>

        <div className="card p-5 w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Registration Number</label>
              <Input
                value={regNumber}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setRegNumber(val);
                  const cleaned = val.trim();
                  if (cleaned.length > 5) {
                    const name = STUDENTS[cleaned];
                    if (name) {
                      setStudentName(name);
                      setLookupFailed(false);
                    } else {
                      setStudentName(null);
                      setLookupFailed(false);
                    }
                  } else {
                    setStudentName(null);
                    setLookupFailed(false);
                  }
                }}
                placeholder="Enter registration number"
                autoComplete="off"
                error={lookupFailed}
              />
              {lookupFailed && (
                <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-red-600">
                  <AlertCircle size={14} /> Registration number not found
                </p>
              )}
            </div>

            {studentName && (
              <div className="rounded-2xl bg-brand-soft border border-brand-mid/20 p-5 text-center animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="font-display text-xl font-extrabold text-brand-deep">
                  {studentName}
                </p>
              </div>
            )}

            <div>
              <label className="label">Amount (UGX)</label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 150000"
                disabled={!studentName}
                className="font-display text-base font-bold"
              />
            </div>

            <div>
              <label className="label">Mobile Money Number</label>
              <Input
                leftIcon={<Phone size={18} />}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+256 794 940 290"
                disabled={!studentName}
              />
              <p className="mt-2 text-[12px] text-slate-500">
                You'll receive a prompt to approve this payment.
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Payment Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] text-slate-800 focus:border-brand-mid focus:outline-none focus:ring-4 focus:ring-brand-mid/10 disabled:bg-slate-50 transition-all"
              >
                <option value="Tuition Payment">Tuition Payment</option>
                <option value="Graduation Fees">Graduation Fees</option>
                <option value="Hostel Fees">Hostel Fees</option>
                <option value="Registration Fees">Registration Fees</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!studentName || !amount || !phone || loading}
              className="btn btn-primary w-full !h-11 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Initiating…
                </>
              ) : (
                <>Pay UGX {amount ? Number(amount).toLocaleString() : '0'}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
