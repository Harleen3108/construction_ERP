import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Building2, Mail, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="h-1 tricolor-strip" />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-md border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-full bg-govt-navy text-white flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Government of India</div>
              <div className="font-bold text-govt-navy">Constructor ERP</div>
            </div>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-govt-green mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-2">Check Your Email</h2>
              <p className="text-sm text-slate-500 mb-5">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <Link to="/login" className="btn-gov w-full">Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-800 font-gov mb-1">Reset Password</h2>
              <p className="text-sm text-slate-500 mb-5">
                Enter your email and we'll send you a link to reset your password.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label-gov">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className="input-gov pl-9" placeholder="you@org.gov.in" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-gov w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Send Reset Link
                </button>
              </form>
              <div className="mt-5 text-center text-xs">
                <Link to="/login" className="text-govt-navy hover:underline">← Back to Login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
