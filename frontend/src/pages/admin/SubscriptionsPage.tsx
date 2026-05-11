import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatDate, formatINR } from '../../utils/format';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';

const PLANS = [
  { key: 'TRIAL', label: 'Trial (30d Free)', amount: 0 },
  { key: 'BASIC', label: 'Basic', amount: 99000 },
  { key: 'PROFESSIONAL', label: 'Professional', amount: 499000 },
  { key: 'ENTERPRISE', label: 'Enterprise', amount: 999000 },
];

export default function SubscriptionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({
    department: '', plan: 'PROFESSIONAL', billingCycle: 'YEARLY',
    amount: 499000, modules: ['etender','erp','finance','mb','reports'],
    maxUsers: 100, maxProjects: 500,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: '',
  });

  const load = () => api.get('/subscriptions').then((r) => setItems(r.data.data));
  useEffect(() => {
    load();
    api.get('/departments').then((r) => setDepartments(r.data.data));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/subscriptions', form);
    toast.success('Subscription created');
    setShow(false);
    load();
  };

  const cancel = async (id: string) => {
    if (!confirm('Cancel this subscription?')) return;
    await api.put(`/subscriptions/${id}/cancel`);
    toast.success('Cancelled');
    load();
  };

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle="Manage SaaS plans, billing cycles, modules, and limits per department"
        actions={
          <button className="btn-gov" onClick={() => setShow(true)}>
            <Plus className="w-4 h-4" /> New Subscription
          </button>
        }
      />

      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-md shadow-2xl w-full max-w-2xl">
            <div className="px-5 py-3 border-b bg-govt-navy text-white rounded-t-md flex items-center justify-between">
              <h3 className="font-semibold">New Subscription</h3>
              <button type="button" onClick={() => setShow(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label-gov">Department *</label>
                <select required className="input-gov" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                </select>
              </div>
              <div>
                <label className="label-gov">Plan</label>
                <select className="input-gov" value={form.plan} onChange={(e) => {
                  const p = PLANS.find((x) => x.key === e.target.value);
                  setForm({...form, plan: e.target.value, amount: p?.amount || 0});
                }}>
                  {PLANS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
              <div><label className="label-gov">Billing Cycle</label>
                <select className="input-gov" value={form.billingCycle} onChange={(e) => setForm({...form, billingCycle: e.target.value})}>
                  <option>YEARLY</option><option>MONTHLY</option>
                </select></div>
              <div><label className="label-gov">Amount (₹)</label>
                <input type="number" className="input-gov" value={form.amount} onChange={(e) => setForm({...form, amount: Number(e.target.value)})} /></div>
              <div><label className="label-gov">Max Users</label>
                <input type="number" className="input-gov" value={form.maxUsers} onChange={(e) => setForm({...form, maxUsers: Number(e.target.value)})} /></div>
              <div><label className="label-gov">Start Date</label>
                <input type="date" className="input-gov" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} /></div>
              <div><label className="label-gov">End Date</label>
                <input type="date" className="input-gov" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} /></div>
              <div className="col-span-2">
                <label className="label-gov">Notes</label>
                <textarea className="input-gov h-16" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button type="button" className="btn-gov-outline" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn-gov">Create</button>
            </div>
          </form>
        </div>
      )}

      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs uppercase">Department</th>
              <th className="px-4 py-2.5 text-xs uppercase">Plan</th>
              <th className="px-4 py-2.5 text-xs uppercase">Cycle</th>
              <th className="px-4 py-2.5 text-xs uppercase">Amount</th>
              <th className="px-4 py-2.5 text-xs uppercase">Validity</th>
              <th className="px-4 py-2.5 text-xs uppercase">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s._id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{s.department?.name || '—'}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{s.department?.code}</div>
                </td>
                <td className="px-4 py-3"><span className="pill pill-info">{s.plan}</span></td>
                <td className="px-4 py-3 text-xs">{s.billingCycle}</td>
                <td className="px-4 py-3 font-medium tabular-nums">{formatINR(s.amount, { compact: true })}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {formatDate(s.startDate)} → {formatDate(s.endDate)}
                </td>
                <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                <td className="px-4 py-3 text-right">
                  {s.status === 'ACTIVE' && (
                    <button onClick={() => cancel(s._id)} className="text-xs text-red-600 hover:underline">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No subscriptions yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
