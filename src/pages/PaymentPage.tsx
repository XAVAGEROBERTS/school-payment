import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '../components/Input';

const STUDENTS: Record<string, string> = {
  'VU-BAED-2903-0763-DAY': 'RUBANGAKENE JACOB ELVIS',
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function PaymentPage() {
  const [regNumber, setRegNumber] = useState('');
  const [studentName, setStudentName] = useState<string | null>(null);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ reference: string; amount: number; status: 'pending' | 'success' } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentName || !amount || !phone) {
      toast.error('Complete all fields');
      return;
    }

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
          type: 'school',
          regNumber: regNumber.toUpperCase().trim(),
          amount: Number(amount),
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      setSuccess({ reference: data.reference, amount: Number(amount), status: 'pending' });
      toast.success('Check your phone to approve payment');
    } catch (err: any) {
      toast.error(err.message || 'Could not initiate payment');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!success || success.status === 'success') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/blue-tick-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ type: 'school_status', reference: success.reference }),
        });
        const data = await res.json();
        
        // If Nylon says 'successful' or 'paid', stop polling
        if (data.status === 'successful' || data.status === 'paid' || data.status === 'success') {
          setSuccess((prev) => prev ? { ...prev, status: 'success' } : null);
          clearInterval(interval);
        }
      } catch (e) {
        // Ignore network errors while polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [success]);


  useEffect(() => {
    if (!success || success.status === 'success') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/school_payments?reference=eq.${success.reference}&select=status`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        const data = await res.json();
        
        if (data && data[0] && data[0].status === 'success') {
          setSuccess((prev) => prev ? { ...prev, status: 'success' } : null);
          clearInterval(interval);
        }
      } catch (e) {
        // Ignore network errors while polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [success]);

  if (success) {
    return (
      <div className="min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden flex flex-col items-center justify-center p-4 py-8 bg-slate-50">
        <Toaster position="top-center" />
        <div className="card w-full max-w-md p-8 text-center border-t-4 border-t-brand-mid">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand-mid">
            <CheckCircle2 size={44} />
          </div>
          <h1 className="mt-6 font-display text-2xl font-extrabold text-brand-deep">
            Payment Initiated
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Approve the prompt on your phone to complete the payment.
          </p>
          <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5 text-left text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Student</span>
              <strong className="text-brand-deep">{studentName}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Amount</span>
              <strong className="text-brand-mid text-lg">
                UGX {success.amount.toLocaleString()}
              </strong>
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
            Pay another student
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
            VICTORIAI UNIVERSITY
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
                  // Live lookup as they type
                  const cleaned = val.trim();
                  if (cleaned.length > 5) {
                    const name = STUDENTS[cleaned];
                    if (name) {
                      setStudentName(name);
                      setLookupFailed(false);
                    } else {
                      setStudentName(null);
                      setLookupFailed(false); // Don't show error while typing
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
                <p className="font-display text-xl font-extrabold text-brand-deep">{studentName}</p>
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
