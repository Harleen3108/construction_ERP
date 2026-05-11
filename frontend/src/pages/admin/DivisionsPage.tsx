import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import { Plus, Layers, Power, X, MapPin, User as UserIcon } from 'lucide-react';

export default function DivisionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', code: '', city: '', state: '',
    inCharge: '', contactEmail: '', contactPhone: '',
  });

  const load = () => api.get('/divisions').then((r) => setItems(r.data.data));
  useEffect(() => {
    load();
    api.get('/users', { params: { role: 'EE' } }).then((r) => setUsers(r.data.data));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/divisions/${editing._id}`, form);
        toast.success('Division updated');
      } else {
        await api.post('/divisions', form);
        toast.success('Division created');
      }
      close();
      load();
    } catch {/* toast */}
  };

  const close = () => {
    setShow(false); setEditing(null);
    setForm({ name: '', code: '', city: '', state: '', inCharge: '', contactEmail: '', contactPhone: '' });
  };

  const openEdit = (d: any) => {
    setEditing(d);
    setForm({
      name: d.name, code: d.code, city: d.city || '', state: d.state || '',
      inCharge: d.inCharge?._id || '', contactEmail: d.contactEmail || '', contactPhone: d.contactPhone || '',
    });
    setShow(true);
  };

  const toggle = async (id: string) => {
    await api.put(`/divisions/${id}/toggle`);
    toast.success('Status updated');
    load();
  };

  return (
    <div>
      <PageHeader
        title="Divisions"
        subtitle="Sub-units under your department · Karnal Division, Panipat Division, etc."
        actions={
          <button onClick={() => setShow(true)} className="btn-gov">
            <Plus className="w-4 h-4" /> New Division
          </button>
        }
      />

      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-md shadow-2xl w-full max-w-lg">
            <div className="px-5 py-3 border-b bg-govt-navy text-white flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4" /> {editing ? 'Edit Division' : 'New Division'}
              </h3>
              <button type="button" onClick={close}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label-gov">Name *</label>
                <input required className="input-gov" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Karnal Division" /></div>
              <div><label className="label-gov">Code *</label>
                <input required className="input-gov uppercase" value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="KRL-DIV" /></div>
              <div><label className="label-gov">In-Charge (EE)</label>
                <select className="input-gov" value={form.inCharge} onChange={(e) => setForm({...form, inCharge: e.target.value})}>
                  <option value="">— Select EE —</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select></div>
              <div><label className="label-gov">City</label>
                <input className="input-gov" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} /></div>
              <div><label className="label-gov">State</label>
                <input className="input-gov" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} /></div>
              <div><label className="label-gov">Contact Email</label>
                <input type="email" className="input-gov" value={form.contactEmail} onChange={(e) => setForm({...form, contactEmail: e.target.value})} /></div>
              <div><label className="label-gov">Contact Phone</label>
                <input className="input-gov" value={form.contactPhone} onChange={(e) => setForm({...form, contactPhone: e.target.value})} /></div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button type="button" className="btn-gov-outline" onClick={close}>Cancel</button>
              <button className="btn-gov">{editing ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((d) => (
          <div key={d._id} className="card-gov p-5 hover:shadow-gov-lg transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-md bg-govt-navy/10 text-govt-navy flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{d.name}</h3>
                  <div className="text-[10px] font-mono text-slate-500">{d.code}</div>
                </div>
              </div>
              <span className={`pill ${d.active ? 'pill-approved' : 'pill-rejected'}`}>{d.active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 mb-3">
              {d.city && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {d.city}, {d.state}</div>}
              {d.inCharge && <div className="flex items-center gap-1.5"><UserIcon className="w-3 h-3" /> {d.inCharge.name} (EE)</div>}
              {d.contactEmail && <div className="text-[11px] text-slate-500">{d.contactEmail}</div>}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400">Created {formatDate(d.createdAt)}</span>
              <div className="flex gap-2">
                <button onClick={() => openEdit(d)} className="text-[11px] text-govt-navy hover:underline">Edit</button>
                <button onClick={() => toggle(d._id)} className="text-slate-500 hover:text-erp-danger" title="Toggle">
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="col-span-full card-gov p-12 text-center text-slate-400">
            <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No divisions yet — create one to organize your department geographically</p>
          </div>
        )}
      </div>
    </div>
  );
}
