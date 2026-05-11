import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Building2, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

const ALL_MODULES = [
  { key: 'etender', label: 'eTender Management' },
  { key: 'erp', label: 'Construction ERP' },
  { key: 'finance', label: 'Finance & Billing' },
  { key: 'mb', label: 'Measurement Book' },
  { key: 'reports', label: 'Reports & Analytics' },
  { key: 'inspections', label: 'Inspections' },
];

export default function RegisterOrgPage() {
  const [form, setForm] = useState<any>({
    orgName: '', code: '', type: 'PWD',
    state: '', city: '', address: '',
    contactEmail: '', contactPhone: '', headOfDepartment: '', website: '',
    adminName: '', adminEmail: '', adminPhone: '', adminDesignation: '',
    requestedModules: ['etender','erp','finance','mb','reports'],
    expectedUsers: 50, expectedProjects: 20,
    preferredPlan: 'PROFESSIONAL', notes: '',
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  const toggleModule = (k: string) => {
    setForm((s: any) => ({
      ...s,
      requestedModules: s.requestedModules.includes(k)
        ? s.requestedModules.filter((x: string) => x !== k)
        : [...s.requestedModules, k],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/registrations/apply', form);
      setSubmitted(true);
      toast.success('Registration submitted!');
    } catch {/* toast in interceptor */}
    finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="h-1 tricolor-strip" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-md border border-slate-200 p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-govt-green mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 font-gov mb-2">Registration Submitted</h2>
            <p className="text-sm text-slate-600 mb-1">
              We've received your application for <strong>{form.orgName}</strong>.
            </p>
            <p className="text-sm text-slate-500 mb-5">
              Our Super Admin team will review it within 1–2 business days.
              You'll receive an email at <strong className="text-govt-navy">{form.adminEmail}</strong> once approved
              with instructions to set your password and access your dashboard.
            </p>
            <div className="bg-amber-50 border-l-3 border-amber-400 px-4 py-3 text-left rounded mb-5">
              <div className="text-xs font-semibold text-amber-800">What happens next?</div>
              <ol className="text-xs text-amber-700 mt-1 list-decimal pl-4 space-y-0.5">
                <li>Super Admin reviews your application</li>
                <li>If approved, your workspace is auto-provisioned</li>
                <li>You receive a "Set Password" email</li>
                <li>You log in and onboard your team</li>
              </ol>
            </div>
            <Link to="/login" className="btn-gov w-full">Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="h-1 tricolor-strip" />

      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <Link to="/login" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-govt-navy text-white flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Government of India</div>
            <div className="text-sm font-bold text-govt-navy font-gov">Constructor ERP — Onboarding</div>
          </div>
        </Link>
        <Link to="/login" className="text-xs text-slate-600 hover:text-govt-navy flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to Login
        </Link>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 font-gov">Register Your Organization</h1>
          <p className="text-sm text-slate-500 mt-1">
            Government departments, public works organizations, and construction companies
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-6 max-w-md mx-auto">
          {[1,2,3].map((n) => (
            <div key={n} className="flex-1 flex items-center">
              <div className={`flex-1 h-1 ${step >= n ? 'bg-govt-navy' : 'bg-slate-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mx-1 ${
                step >= n ? 'bg-govt-navy text-white' : 'bg-slate-200 text-slate-500'
              }`}>{n}</div>
              <div className={`flex-1 h-1 ${step > n ? 'bg-govt-navy' : 'bg-slate-200'}`} />
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="bg-white rounded-md border border-slate-200 p-6 md:p-8">
          {step === 1 && (
            <>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-govt-navy text-white text-xs flex items-center justify-center">1</span>
                Organization Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="label-gov">Organization Name *</label>
                  <input required className="input-gov" value={form.orgName} onChange={(e) => set('orgName', e.target.value)} placeholder="e.g., Punjab Public Works Department" /></div>
                <div><label className="label-gov">Department Code *</label>
                  <input required className="input-gov uppercase" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="PB-PWD-001" /></div>
                <div><label className="label-gov">Type *</label>
                  <select className="input-gov" value={form.type} onChange={(e) => set('type', e.target.value)}>
                    <option>PWD</option><option>IRRIGATION</option><option>PUBLIC_HEALTH</option>
                    <option>B&R</option><option>RAILWAYS</option><option>PRIVATE_COMPANY</option><option>OTHER</option>
                  </select></div>
                <div><label className="label-gov">State *</label>
                  <input required className="input-gov" value={form.state} onChange={(e) => set('state', e.target.value)} /></div>
                <div><label className="label-gov">City *</label>
                  <input required className="input-gov" value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
                <div className="md:col-span-2"><label className="label-gov">Address</label>
                  <textarea className="input-gov h-16" value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
                <div><label className="label-gov">Head of Department</label>
                  <input className="input-gov" value={form.headOfDepartment} onChange={(e) => set('headOfDepartment', e.target.value)} /></div>
                <div><label className="label-gov">Website</label>
                  <input className="input-gov" value={form.website} onChange={(e) => set('website', e.target.value)} /></div>
                <div><label className="label-gov">Official Contact Email *</label>
                  <input type="email" required className="input-gov" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></div>
                <div><label className="label-gov">Contact Phone</label>
                  <input className="input-gov" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} /></div>
              </div>
              <div className="mt-6 flex justify-end">
                <button type="button" onClick={() => setStep(2)} className="btn-gov">Next →</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-govt-navy text-white text-xs flex items-center justify-center">2</span>
                Department Admin Details
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                This person will be the primary administrator for your organization's workspace and will receive the activation email after approval.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label-gov">Full Name *</label>
                  <input required className="input-gov" value={form.adminName} onChange={(e) => set('adminName', e.target.value)} /></div>
                <div><label className="label-gov">Designation</label>
                  <input className="input-gov" value={form.adminDesignation} onChange={(e) => set('adminDesignation', e.target.value)} placeholder="e.g., IT Director" /></div>
                <div><label className="label-gov">Email Address *</label>
                  <input type="email" required className="input-gov" value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} placeholder="admin@yourorg.gov.in" />
                  <p className="text-[10px] text-slate-500 mt-1">Approval email will be sent here</p></div>
                <div><label className="label-gov">Phone</label>
                  <input className="input-gov" value={form.adminPhone} onChange={(e) => set('adminPhone', e.target.value)} /></div>
              </div>
              <div className="mt-6 flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="btn-gov-outline">← Back</button>
                <button type="button" onClick={() => setStep(3)} className="btn-gov">Next →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-govt-navy text-white text-xs flex items-center justify-center">3</span>
                Modules & Plan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label-gov">Requested Modules</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                    {ALL_MODULES.map((m) => (
                      <label key={m.key} className={`flex items-center gap-2 p-2 border rounded text-xs cursor-pointer transition ${
                        form.requestedModules.includes(m.key) ? 'border-govt-navy bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                      }`}>
                        <input type="checkbox" checked={form.requestedModules.includes(m.key)} onChange={() => toggleModule(m.key)} />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div><label className="label-gov">Preferred Plan</label>
                  <select className="input-gov" value={form.preferredPlan} onChange={(e) => set('preferredPlan', e.target.value)}>
                    <option value="TRIAL">Trial (30 days free)</option>
                    <option value="BASIC">Basic</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select></div>
                <div><label className="label-gov">Expected Users</label>
                  <input type="number" className="input-gov" value={form.expectedUsers} onChange={(e) => set('expectedUsers', Number(e.target.value))} /></div>
                <div className="md:col-span-2"><label className="label-gov">Expected Projects / Year</label>
                  <input type="number" className="input-gov" value={form.expectedProjects} onChange={(e) => set('expectedProjects', Number(e.target.value))} /></div>
                <div className="md:col-span-2"><label className="label-gov">Additional Notes</label>
                  <textarea className="input-gov h-20" value={form.notes} onChange={(e) => set('notes', e.target.value)}
                    placeholder="Any special requirements, integrations, etc." /></div>
              </div>
              <div className="mt-6 flex justify-between">
                <button type="button" onClick={() => setStep(2)} className="btn-gov-outline">← Back</button>
                <button type="submit" disabled={loading} className="btn-gov">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
