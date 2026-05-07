import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Building2, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, ...user } = res.data.data;
      login(user as any, token);
      toast.success(`Welcome, ${user.name}`);
      nav('/dashboard');
    } catch {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    const map: Record<string, [string, string]> = {
      JE: ['je@erp.gov.in', 'pass@123'],
      SDO: ['sdo@erp.gov.in', 'pass@123'],
      EE: ['ee@erp.gov.in', 'pass@123'],
      CE: ['ce@erp.gov.in', 'pass@123'],
      TENDER_OFFICER: ['tender@erp.gov.in', 'pass@123'],
      CONTRACTOR: ['contractor@abc.com', 'pass@123'],
      ACCOUNTANT: ['accounts@erp.gov.in', 'pass@123'],
      TREASURY: ['treasury@erp.gov.in', 'pass@123'],
      ADMIN: ['admin@erp.gov.in', 'admin@123'],
    };
    const [e, p] = map[role] || ['', ''];
    setEmail(e); setPassword(p);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-1 tricolor-strip" />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* Left side — branding */}
        <div className="hidden lg:flex flex-col justify-center p-12 gov-header-bg text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 30% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 40%)',
          }} />
          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider opacity-80">Government of India</div>
                <div className="text-xl font-bold font-gov">Constructor ERP</div>
              </div>
            </div>

            <h1 className="text-4xl font-bold leading-tight font-gov mb-4">
              Internal eTender + <br /> Construction ERP System
            </h1>
            <p className="text-base opacity-90 mb-8">
              End-to-end project lifecycle management — from proposal to audit.
              Transparent. Compliant. Audit-ready.
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                'Multi-level Approvals',
                'Transparent eTender',
                'L1 Auto-identification',
                'Digital Measurement Books',
                'Auto Bill Calculations',
                'Complete Audit Trail',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-govt-saffron rounded-full" />
                  <span className="opacity-90">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side — login form */}
        <div className="flex items-center justify-center p-6 sm:p-12 bg-white">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-govt-navy text-white flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Government of India</div>
                <div className="font-bold text-govt-navy">Constructor ERP</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-1">Sign In</h2>
            <p className="text-sm text-slate-500 mb-6">Use your government credentials</p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label-gov">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-gov pl-9"
                    placeholder="user@erp.gov.in"
                  />
                </div>
              </div>
              <div>
                <label className="label-gov">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-gov pl-9"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-gov w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In Securely'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="text-xs text-slate-500 mb-2">Quick demo login (run <code>npm run seed</code> in backend):</div>
              <div className="flex flex-wrap gap-1.5">
                {['JE','SDO','EE','CE','TENDER_OFFICER','CONTRACTOR','ACCOUNTANT','TREASURY','ADMIN'].map((r) => (
                  <button
                    key={r}
                    onClick={() => fillDemo(r)}
                    type="button"
                    className="text-[10px] px-2 py-1 border border-slate-300 rounded hover:bg-govt-navy hover:text-white hover:border-govt-navy transition"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              New contractor? <Link to="/register" className="text-govt-navy font-semibold hover:underline">Register here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
