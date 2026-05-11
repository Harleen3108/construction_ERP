import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/shared/PageHeader';
import { formatDate } from '../utils/format';
import toast from 'react-hot-toast';
import {
  Plus, X, Package, CheckCircle2, XCircle, Truck,
  Calendar, User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function MaterialRequestsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({});
  const [status, setStatus] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({
    project: '',
    items: [{ name: '', quantity: 0, unit: 'tonnes', remarks: '' }],
    remarks: '',
  });
  const { user } = useAuthStore();
  const canApprove = ['EE','SDO','DEPT_ADMIN'].includes(user?.role || '');
  const canCreate = ['CONTRACTOR','JE','SDO'].includes(user?.role || '');

  const load = () => {
    const p: any = {};
    if (status) p.status = status;
    api.get('/material-requests', { params: p }).then((r) => { setItems(r.data.data); setCounts(r.data.counts); });
  };

  useEffect(() => {
    load();
    api.get('/projects', { params: { status: 'IN_PROGRESS' } }).then((r) => setProjects(r.data.data));
  }, [status]);

  const addItem = () => setForm({ ...form, items: [...form.items, { name: '', quantity: 0, unit: 'tonnes', remarks: '' }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_: any, idx: number) => idx !== i) });
  const updateItem = (i: number, k: string, v: any) =>
    setForm({ ...form, items: form.items.map((x: any, idx: number) => idx === i ? { ...x, [k]: v } : x) });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/material-requests', form);
    toast.success('Material request submitted');
    setShow(false);
    setForm({ project: '', items: [{ name: '', quantity: 0, unit: 'tonnes', remarks: '' }], remarks: '' });
    load();
  };

  const approve = async (id: string) => {
    await api.put(`/material-requests/${id}/approve`);
    toast.success('Approved');
    load();
  };

  const reject = async (id: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    await api.put(`/material-requests/${id}/reject`, { remarks: reason });
    toast.success('Rejected');
    load();
  };

  const markDelivered = async (id: string) => {
    await api.put(`/material-requests/${id}/delivered`);
    toast.success('Marked as delivered');
    load();
  };

  return (
    <div>
      <PageHeader
        title="Material Requests"
        subtitle="Contractor material requests · approval, delivery tracking"
        actions={canCreate && (
          <button onClick={() => setShow(true)} className="btn-gov">
            <Plus className="w-4 h-4" /> New Request
          </button>
        )}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Pending" value={counts.pending || 0} color="text-amber-600" />
        <Stat label="Approved" value={counts.approved || 0} color="text-govt-green" />
        <Stat label="Rejected" value={counts.rejected || 0} color="text-erp-danger" />
        <Stat label="Delivered" value={counts.delivered || 0} color="text-blue-600" />
      </div>

      <div className="flex gap-1 mb-3 flex-wrap">
        {[
          { val: '', label: 'All' },
          { val: 'PENDING', label: 'Pending' },
          { val: 'APPROVED', label: 'Approved' },
          { val: 'REJECTED', label: 'Rejected' },
          { val: 'DELIVERED', label: 'Delivered' },
        ].map((b) => (
          <button key={b.val} onClick={() => setStatus(b.val)}
            className={`px-3 py-1.5 text-xs rounded border ${status === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
            {b.label}
          </button>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={create} className="bg-white rounded-md shadow-2xl w-full max-w-2xl">
            <div className="px-5 py-3 border-b bg-govt-navy text-white flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4" /> New Material Request</h3>
              <button type="button" onClick={() => setShow(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="label-gov">Project *</label>
                <select required className="input-gov" value={form.project} onChange={(e) => setForm({...form, project: e.target.value})}>
                  <option value="">Select project</option>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select></div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-gov mb-0">Materials</label>
                  <button type="button" onClick={addItem} className="text-xs text-govt-navy hover:underline">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((it: any, i: number) => (
                    <div key={i} className="grid grid-cols-12 gap-2">
                      <input required className="input-gov col-span-5" placeholder="Item name (e.g., Cement)" value={it.name} onChange={(e) => updateItem(i, 'name', e.target.value)} />
                      <input required type="number" className="input-gov col-span-2" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} />
                      <input className="input-gov col-span-2" placeholder="Unit" value={it.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} />
                      <input className="input-gov col-span-2" placeholder="Remarks" value={it.remarks} onChange={(e) => updateItem(i, 'remarks', e.target.value)} />
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-erp-danger col-span-1"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div><label className="label-gov">Overall Remarks</label>
                <textarea className="input-gov h-16" value={form.remarks} onChange={(e) => setForm({...form, remarks: e.target.value})} /></div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button type="button" className="btn-gov-outline" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn-gov">Submit</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {items.map((r) => (
          <div key={r._id} className="card-gov p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-govt-navy/10 text-govt-navy flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold">{r.project?.name}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {r.requestedBy?.name}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(r.createdAt)}</span>
                  </div>
                </div>
              </div>
              <span className={`pill text-[10px] ${
                r.status === 'APPROVED' ? 'pill-approved' :
                r.status === 'REJECTED' ? 'pill-rejected' :
                r.status === 'DELIVERED' ? 'pill-info' : 'pill-pending'
              }`}>{r.status}</span>
            </div>
            <div className="bg-slate-50 rounded p-3 text-sm mb-3">
              <table className="w-full">
                <thead className="text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="text-left py-1">Material</th>
                    <th className="text-right py-1">Qty</th>
                    <th className="text-left py-1 pl-3">Unit</th>
                    <th className="text-left py-1 pl-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {r.items.map((it: any, i: number) => (
                    <tr key={i} className="border-t border-slate-200">
                      <td className="py-1.5 font-medium text-[12px]">{it.name}</td>
                      <td className="py-1.5 text-right tabular-nums">{it.quantity}</td>
                      <td className="py-1.5 pl-3 text-[11px]">{it.unit}</td>
                      <td className="py-1.5 pl-3 text-[11px] text-slate-500">{it.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {r.remarks && <p className="text-xs text-slate-500 italic mb-2">"{r.remarks}"</p>}
            {r.approvedBy && (
              <div className="text-[10px] text-slate-500 mb-2">
                {r.status === 'APPROVED' ? 'Approved' : 'Reviewed'} by {r.approvedBy.name} on {formatDate(r.approvedAt)}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              {r.status === 'PENDING' && canApprove && (
                <>
                  <button onClick={() => reject(r._id)} className="btn-gov-danger text-xs"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                  <button onClick={() => approve(r._id)} className="btn-gov-success text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>
                </>
              )}
              {r.status === 'APPROVED' && (
                <button onClick={() => markDelivered(r._id)} className="btn-gov text-xs"><Truck className="w-3.5 h-3.5" /> Mark Delivered</button>
              )}
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="card-gov p-12 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No material requests yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'text-slate-800' }: any) {
  return (
    <div className="card-gov p-3">
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
