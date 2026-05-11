import { useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  Building2, BadgeCheck, AlertTriangle, FileText, Save, Phone, Mail, MapPin,
} from 'lucide-react';

const DOC_TYPES = [
  { key: 'gstCertificate', label: 'GST Certificate', desc: 'Latest GST registration document' },
  { key: 'panCard', label: 'PAN Card', desc: 'Company PAN card scan' },
  { key: 'registrationCert', label: 'Registration Certificate', desc: 'Company registration with state' },
  { key: 'experienceCert', label: 'Experience Certificates', desc: 'Past project completion certificates' },
  { key: 'machineryList', label: 'Machinery / Equipment List', desc: 'Owned construction equipment' },
  { key: 'bankDetails', label: 'Bank Account Details', desc: 'Cancelled cheque or bank letter' },
  { key: 'taxClearance', label: 'Tax Clearance Certificate', desc: 'IT clearance from CA' },
  { key: 'auditReports', label: 'Audited Financial Reports', desc: 'Last 3 years P&L + Balance Sheet' },
];

export default function ContractorProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    companyName: user?.companyName || '',
    gstNumber: user?.gstNumber || '',
    panNumber: user?.panNumber || '',
    registrationNumber: user?.registrationNumber || '',
    experienceYears: user?.experienceYears || 0,
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put('/contractors/profile/me', form);
      updateUser(r.data.data);
      toast.success('Profile updated');
    } finally { setSaving(false); }
  };

  // Compute compliance
  const fields = ['companyName', 'gstNumber', 'panNumber', 'registrationNumber', 'experienceYears'];
  const filled = fields.filter((f) => !!(form as any)[f]).length;
  const compliancePercent = Math.round((filled / fields.length) * 100);

  return (
    <div>
      <PageHeader
        title="Company Profile & Documents"
        subtitle="Manage your registration details and upload compliance documents"
      />

      {/* Verification status banner */}
      <div className={`card-gov p-4 mb-5 flex items-center gap-3 ${
        user?.contractorVerified ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'
      }`}>
        {user?.contractorVerified ? (
          <>
            <BadgeCheck className="w-6 h-6 text-govt-green flex-shrink-0" />
            <div>
              <div className="font-semibold text-green-900">✓ Verified Contractor</div>
              <div className="text-xs text-green-700">Your company is verified and eligible to bid on tenders.</div>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-amber-900">Pending Verification</div>
              <div className="text-xs text-amber-700">
                Complete your profile and submit required documents. A Department Admin must verify you before you can bid.
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-amber-700">Profile Completion</div>
              <div className="text-2xl font-bold text-amber-700 tabular-nums">{compliancePercent}%</div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile form */}
        <div className="lg:col-span-2">
          <form onSubmit={save} className="card-gov p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-govt-navy" />
              <h3 className="font-semibold">Company Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><label className="label-gov">Company Name *</label>
                <input required className="input-gov" value={form.companyName}
                  onChange={(e) => set('companyName', e.target.value)} /></div>
              <div><label className="label-gov">GST Number *</label>
                <input className="input-gov uppercase font-mono" value={form.gstNumber}
                  onChange={(e) => set('gstNumber', e.target.value.toUpperCase())}
                  placeholder="06AABCU9603R1ZJ" maxLength={15} /></div>
              <div><label className="label-gov">PAN Number *</label>
                <input className="input-gov uppercase font-mono" value={form.panNumber}
                  onChange={(e) => set('panNumber', e.target.value.toUpperCase())}
                  placeholder="AABCU9603R" maxLength={10} /></div>
              <div><label className="label-gov">Registration Number *</label>
                <input className="input-gov" value={form.registrationNumber}
                  onChange={(e) => set('registrationNumber', e.target.value)} /></div>
              <div><label className="label-gov">Years of Experience *</label>
                <input type="number" className="input-gov" value={form.experienceYears}
                  onChange={(e) => set('experienceYears', Number(e.target.value))} /></div>
              <div className="md:col-span-2"><label className="label-gov">Phone</label>
                <input className="input-gov" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            </div>
            <button disabled={saving} className="btn-gov mt-4">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Quick info side panel */}
        <div className="space-y-4">
          <div className="card-gov p-5">
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-govt-navy" /> Account Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3 h-3" /> {user?.email}
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3 h-3" /> {user.phone}
                </div>
              )}
            </div>
          </div>

          <div className="card-gov p-5">
            <h3 className="font-semibold mb-3 text-sm">Profile Completion</h3>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mb-2">
              <div className={`h-full ${compliancePercent === 100 ? 'bg-govt-green' : 'bg-amber-500'}`}
                style={{ width: `${compliancePercent}%` }} />
            </div>
            <div className="text-xs text-slate-600">{filled} of {fields.length} fields complete</div>
            <ul className="mt-3 space-y-1 text-[11px]">
              {fields.map((f) => (
                <li key={f} className={`flex items-center gap-1 ${(form as any)[f] ? 'text-govt-green' : 'text-slate-500'}`}>
                  {(form as any)[f] ? '✓' : '○'} {f.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Document uploads section */}
      <div className="card-gov mt-5">
        <div className="card-gov-header">
          <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Compliance Documents</h3>
          <p className="text-xs text-slate-500 mt-1">Upload these documents to complete your verification</p>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DOC_TYPES.map((d) => (
            <div key={d.key} className="border border-slate-200 rounded-md p-3 hover:border-govt-navy transition">
              <div className="flex items-start justify-between mb-2">
                <FileText className="w-5 h-5 text-slate-400" />
                <span className="pill pill-pending text-[9px]">Not uploaded</span>
              </div>
              <div className="font-medium text-sm">{d.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{d.desc}</div>
              <button className="btn-gov-outline text-[10px] w-full mt-3" onClick={() => toast('File upload UI — wire Cloudinary on /api/upload', { icon: '📁' })}>
                Upload Document
              </button>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4 text-[10px] text-slate-500">
          Document upload integrates with Cloudinary on <code className="bg-slate-100 px-1">/api/upload/single</code> endpoint.
          Files are stored securely and visible to Dept Admin during verification.
        </div>
      </div>
    </div>
  );
}
