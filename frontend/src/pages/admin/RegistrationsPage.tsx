import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate, formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  CheckCircle2, XCircle, Building2, Mail, Phone, MapPin, Calendar,
  User as UserIcon, FileText, X, AlertTriangle,
} from 'lucide-react';

const ALL_MODULES = [
  { key: 'etender', label: 'eTender' },
  { key: 'erp', label: 'ERP' },
  { key: 'finance', label: 'Finance' },
  { key: 'mb', label: 'Measurement Book' },
  { key: 'reports', label: 'Reports' },
  { key: 'inspections', label: 'Inspections' },
];

const PLAN_AMOUNTS: Record<string, number> = {
  TRIAL: 0, BASIC: 99000, PROFESSIONAL: 499000, ENTERPRISE: 999000,
};

export default function RegistrationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('PENDING');
  const [activeReg, setActiveReg] = useState<any>(null);
  const [approveForm, setApproveForm] = useState<any>({
    plan: 'PROFESSIONAL', billingCycle: 'YEARLY', amount: 499000,
    modules: ['etender','erp','finance','mb','reports'],
    maxUsers: 100, maxProjects: 500, validityDays: 365,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [mode, setMode] = useState<'view' | 'approve' | 'reject'>('view');

  const load = () => {
    const params: any = {};
    if (filter) params.status = filter;
    api.get('/registrations', { params }).then((r) => {
      setItems(r.data.data);
      setCounts(r.data.counts);
    });
  };

  useEffect(() => { load(); }, [filter]);

  const openModal = (reg: any, m: 'view' | 'approve' | 'reject' = 'view') => {
    setActiveReg(reg);
    setMode(m);
    setApproveForm((s: any) => ({
      ...s,
      modules: reg.requestedModules || s.modules,
      maxUsers: reg.expectedUsers || s.maxUsers,
      maxProjects: reg.expectedProjects || s.maxProjects,
      plan: reg.preferredPlan || 'PROFESSIONAL',
      amount: PLAN_AMOUNTS[reg.preferredPlan] ?? 499000,
    }));
    setRejectReason('');
  };

  const close = () => { setActiveReg(null); setMode('view'); };

  const approve = async () => {
    try {
      await api.put(`/registrations/${activeReg._id}/approve`, approveForm);
      toast.success(`${activeReg.orgName} approved · activation email sent`);
      close();
      load();
    } catch {/* toast in interceptor */}
  };

  const reject = async () => {
    try {
      await api.put(`/registrations/${activeReg._id}/reject`, { reason: rejectReason });
      toast.success('Registration rejected · email sent to applicant');
      close();
      load();
    } catch {/* toast */}
  };

  const toggleModule = (k: string) =>
    setApproveForm((s: any) => ({
      ...s,
      modules: s.modules.includes(k) ? s.modules.filter((x: string) => x !== k) : [...s.modules, k],
    }));

  return (
    <div>
      <PageHeader
        title="Organization Registrations"
        subtitle="Review and approve self-registered government departments and companies"
        badge={`${counts.pending} pending review`}
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
        {[
          { key: 'PENDING', label: 'Pending', count: counts.pending },
          { key: 'APPROVED', label: 'Approved', count: counts.approved },
          { key: 'REJECTED', label: 'Rejected', count: counts.rejected },
          { key: '', label: 'All', count: counts.total },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key as any)}
            className={`px-4 py-2 text-sm border-b-2 transition flex items-center gap-2 ${
              filter === t.key
                ? 'border-govt-navy text-govt-navy font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((reg) => (
          <div key={reg._id} className="card-gov p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-12 h-12 rounded-lg bg-govt-navy/10 text-govt-navy flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800">{reg.orgName}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">{reg.code}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700">{reg.type}</span>
                    {reg.status === 'PENDING' && <span className="pill pill-pending">Pending Review</span>}
                    {reg.status === 'APPROVED' && <span className="pill pill-approved">✓ Approved</span>}
                    {reg.status === 'REJECTED' && <span className="pill pill-rejected">Rejected</span>}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {reg.city}, {reg.state}</div>
                    <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {reg.adminEmail}</div>
                    <div className="flex items-center gap-1.5"><UserIcon className="w-3 h-3" /> {reg.adminName}</div>
                    <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {formatDate(reg.createdAt)}</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {reg.status === 'PENDING' ? (
                  <>
                    <button onClick={() => openModal(reg, 'approve')} className="btn-gov-success text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => openModal(reg, 'reject')} className="btn-gov-danger text-xs">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button onClick={() => openModal(reg, 'view')} className="text-[11px] text-govt-navy hover:underline">
                      View details
                    </button>
                  </>
                ) : (
                  <button onClick={() => openModal(reg, 'view')} className="btn-gov-outline text-xs">View Details</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="card-gov p-12 text-center text-slate-400">
            No {filter.toLowerCase() || ''} registrations
          </div>
        )}
      </div>

      {/* Modal */}
      {activeReg && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3 border-b bg-govt-navy text-white sticky top-0 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4" /> {activeReg.orgName}
              </h3>
              <button onClick={close}><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Org details */}
              <Section title="Organization Details">
                <Row label="Code" v={activeReg.code} />
                <Row label="Type" v={activeReg.type} />
                <Row label="Location" v={`${activeReg.city}, ${activeReg.state}`} />
                <Row label="Address" v={activeReg.address} />
                <Row label="Head of Department" v={activeReg.headOfDepartment} />
                <Row label="Website" v={activeReg.website} />
                <Row label="Contact Email" v={activeReg.contactEmail} />
                <Row label="Contact Phone" v={activeReg.contactPhone} />
              </Section>

              <Section title="Department Admin (will be created on approval)">
                <Row label="Name" v={activeReg.adminName} />
                <Row label="Designation" v={activeReg.adminDesignation} />
                <Row label="Email" v={activeReg.adminEmail} />
                <Row label="Phone" v={activeReg.adminPhone} />
              </Section>

              <Section title="Requested Configuration">
                <Row label="Preferred Plan" v={activeReg.preferredPlan} />
                <Row label="Expected Users" v={activeReg.expectedUsers} />
                <Row label="Expected Projects" v={activeReg.expectedProjects} />
                <Row label="Modules" v={(activeReg.requestedModules || []).join(', ')} />
                {activeReg.notes && <Row label="Notes" v={activeReg.notes} fullWidth />}
              </Section>

              {activeReg.status !== 'PENDING' && (
                <Section title="Review">
                  <Row label="Reviewed By" v={activeReg.reviewedBy?.name} />
                  <Row label="Reviewed On" v={formatDateTime(activeReg.reviewedAt)} />
                  {activeReg.rejectionReason && <Row label="Rejection Reason" v={activeReg.rejectionReason} fullWidth />}
                  {activeReg.department && (
                    <Row label="Linked Department" v={`${activeReg.department.name} (${activeReg.department.code})`} fullWidth />
                  )}
                </Section>
              )}

              {/* Approve form */}
              {mode === 'approve' && (
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Approval Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label-gov text-xs">Plan</label>
                      <select className="input-gov" value={approveForm.plan} onChange={(e) => {
                        const p = e.target.value;
                        setApproveForm((s: any) => ({ ...s, plan: p, amount: PLAN_AMOUNTS[p] ?? s.amount }));
                      }}>
                        <option>TRIAL</option><option>BASIC</option><option>PROFESSIONAL</option><option>ENTERPRISE</option>
                      </select></div>
                    <div><label className="label-gov text-xs">Amount (₹)</label>
                      <input type="number" className="input-gov" value={approveForm.amount}
                        onChange={(e) => setApproveForm({...approveForm, amount: Number(e.target.value)})} /></div>
                    <div><label className="label-gov text-xs">Billing Cycle</label>
                      <select className="input-gov" value={approveForm.billingCycle}
                        onChange={(e) => setApproveForm({...approveForm, billingCycle: e.target.value})}>
                        <option>YEARLY</option><option>MONTHLY</option>
                      </select></div>
                    <div><label className="label-gov text-xs">Validity (days)</label>
                      <input type="number" className="input-gov" value={approveForm.validityDays}
                        onChange={(e) => setApproveForm({...approveForm, validityDays: Number(e.target.value)})} /></div>
                    <div><label className="label-gov text-xs">Max Users</label>
                      <input type="number" className="input-gov" value={approveForm.maxUsers}
                        onChange={(e) => setApproveForm({...approveForm, maxUsers: Number(e.target.value)})} /></div>
                    <div><label className="label-gov text-xs">Max Projects</label>
                      <input type="number" className="input-gov" value={approveForm.maxProjects}
                        onChange={(e) => setApproveForm({...approveForm, maxProjects: Number(e.target.value)})} /></div>
                    <div className="col-span-2">
                      <label className="label-gov text-xs">Enable Modules</label>
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        {ALL_MODULES.map((m) => (
                          <label key={m.key} className={`flex items-center gap-1 p-1.5 border rounded text-[11px] cursor-pointer ${
                            approveForm.modules.includes(m.key) ? 'border-govt-green bg-green-100' : 'border-slate-200'
                          }`}>
                            <input type="checkbox" checked={approveForm.modules.includes(m.key)} onChange={() => toggleModule(m.key)} />
                            {m.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded p-3 mt-3 text-xs">
                    <AlertTriangle className="w-3 h-3 text-amber-500 inline mr-1" />
                    On approval, the system will: create the department workspace, create a DEPT_ADMIN user with email <strong>{activeReg.adminEmail}</strong>, generate a secure password-set link valid for 48 hours, and send the activation email.
                  </div>
                </div>
              )}

              {mode === 'reject' && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Reject Registration
                  </h4>
                  <label className="label-gov text-xs">Reason (will be sent to applicant)</label>
                  <textarea className="input-gov h-24" value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide a clear, professional reason for rejection..." />
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t flex justify-end gap-2 bg-slate-50 sticky bottom-0">
              <button onClick={close} className="btn-gov-outline">Close</button>
              {activeReg.status === 'PENDING' && mode === 'view' && (
                <>
                  <button onClick={() => setMode('reject')} className="btn-gov-danger">Reject</button>
                  <button onClick={() => setMode('approve')} className="btn-gov-success">Approve</button>
                </>
              )}
              {mode === 'approve' && <button onClick={approve} className="btn-gov-success">Approve & Send Email</button>}
              {mode === 'reject' && <button onClick={reject} className="btn-gov-danger" disabled={!rejectReason}>Reject & Send Email</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded p-3 border border-slate-200">{children}</div>
    </div>
  );
}

function Row({ label, v, fullWidth }: any) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-sm text-slate-800">{v ?? '—'}</div>
    </div>
  );
}
