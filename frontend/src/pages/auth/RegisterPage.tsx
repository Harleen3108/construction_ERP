import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Building2 } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', companyName: '',
    gstNumber: '', panNumber: '', registrationNumber: '',
    phone: '', experienceYears: '',
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const nav = useNavigate();

  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { ...form, role: 'CONTRACTOR', experienceYears: Number(form.experienceYears) || 0 });
      const { token, ...user } = res.data.data;
      login(user as any, token);
      toast.success('Registered successfully — pending admin verification');
      nav('/dashboard');
    } catch {/* toast in interceptor */}
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-1 tricolor-strip" />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-govt-navy text-white mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 font-gov">Contractor Registration</h1>
          <p className="text-sm text-slate-500">Register your company to participate in government tenders</p>
        </div>

        <div className="card-gov p-6">
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-gov">Authorized Person *</label>
              <input required className="input-gov" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label-gov">Company Name *</label>
              <input required className="input-gov" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="ABC Infra Pvt Ltd" />
            </div>
            <div>
              <label className="label-gov">Email *</label>
              <input type="email" required className="input-gov" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <label className="label-gov">Password *</label>
              <input type="password" required minLength={6} className="input-gov" value={form.password} onChange={(e) => set('password', e.target.value)} />
            </div>
            <div>
              <label className="label-gov">Phone</label>
              <input className="input-gov" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="label-gov">GST Number</label>
              <input className="input-gov" value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value)} placeholder="06AABCU9603R1ZJ" />
            </div>
            <div>
              <label className="label-gov">PAN Number</label>
              <input className="input-gov" value={form.panNumber} onChange={(e) => set('panNumber', e.target.value)} placeholder="AABCU9603R" />
            </div>
            <div>
              <label className="label-gov">Registration Number</label>
              <input className="input-gov" value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} />
            </div>
            <div>
              <label className="label-gov">Experience (Years)</label>
              <input type="number" className="input-gov" value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} />
            </div>
            <div className="md:col-span-2 flex items-center justify-between mt-2">
              <Link to="/login" className="text-sm text-govt-navy hover:underline">← Back to Login</Link>
              <button disabled={loading} className="btn-gov">
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
