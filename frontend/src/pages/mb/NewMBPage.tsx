import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR } from '../../utils/format';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

export default function NewMBPage() {
  const nav = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [form, setForm] = useState({ project: '', workOrder: '', workItem: '', location: '', entryDate: new Date().toISOString().slice(0, 10), remarks: '' });
  const [entries, setEntries] = useState([{ description: '', length: 0, width: 0, height: 0, quantity: 0, unit: 'Cum', rate: 0, amount: 0 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/projects', { params: { status: 'IN_PROGRESS' } }).then((r) => setProjects(r.data.data));
    api.get('/work-orders').then((r) => setWorkOrders(r.data.data));
  }, []);

  const addEntry = () => setEntries([...entries, { description: '', length: 0, width: 0, height: 0, quantity: 0, unit: 'Cum', rate: 0, amount: 0 }]);
  const removeEntry = (i: number) => setEntries(entries.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, k: string, v: any) => {
    setEntries((cur) => cur.map((row: any, idx) => {
      if (idx !== i) return row;
      const updated: any = { ...row, [k]: v };
      if (['length','width','height'].includes(k) && updated.length && updated.width) {
        updated.quantity = updated.height ? Number(updated.length) * Number(updated.width) * Number(updated.height) : Number(updated.length) * Number(updated.width);
      }
      updated.amount = Number(updated.quantity || 0) * Number(updated.rate || 0);
      return updated;
    }));
  };

  const total = entries.reduce((s, e: any) => s + (e.amount || 0), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const project = projects.find((p) => p._id === form.project);
      const wo = workOrders.find((w) => w.project?._id === form.project) || workOrders[0];
      const res = await api.post('/mb', {
        ...form,
        workOrder: form.workOrder || wo?._id,
        contractor: project?.awardedTo?._id || project?.awardedTo,
        entries,
      });
      toast.success('MB submitted for approval');
      nav(`/mb/${res.data.data._id}`);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader
        title="New MB Entry"
        subtitle="Stage 9 · Record measurements (L × W × H) and quantities"
        stage={9}
        actions={<Link to="/mb" className="btn-gov-outline"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />

      <form onSubmit={submit} className="space-y-5">
        <div className="card-gov p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label-gov">Project *</label>
            <select required className="input-gov" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
              <option value="">Select project</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-gov">Work Item *</label>
            <input required className="input-gov" placeholder="e.g., Excavation, Brickwork"
                   value={form.workItem} onChange={(e) => setForm({ ...form, workItem: e.target.value })} />
          </div>
          <div>
            <label className="label-gov">Date</label>
            <input type="date" className="input-gov" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label-gov">Location</label>
            <input className="input-gov" placeholder="School Site - Block A" value={form.location}
                   onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </div>

        <div className="card-gov p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Measurement Entries</h3>
            <button type="button" onClick={addEntry} className="btn-gov-outline text-sm"><Plus className="w-3.5 h-3.5" /> Add Row</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-2 py-2 text-xs">Description</th>
                  <th className="px-2 py-2 text-xs">L</th>
                  <th className="px-2 py-2 text-xs">W</th>
                  <th className="px-2 py-2 text-xs">H</th>
                  <th className="px-2 py-2 text-xs">Qty</th>
                  <th className="px-2 py-2 text-xs">Unit</th>
                  <th className="px-2 py-2 text-xs">Rate</th>
                  <th className="px-2 py-2 text-xs">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((r: any, i) => (
                  <tr key={i} className="border-t">
                    <td><input className="input-gov" value={r.description} onChange={(e) => updateEntry(i, 'description', e.target.value)} /></td>
                    <td><input type="number" className="input-gov w-16" value={r.length} onChange={(e) => updateEntry(i, 'length', e.target.value)} /></td>
                    <td><input type="number" className="input-gov w-16" value={r.width} onChange={(e) => updateEntry(i, 'width', e.target.value)} /></td>
                    <td><input type="number" className="input-gov w-16" value={r.height} onChange={(e) => updateEntry(i, 'height', e.target.value)} /></td>
                    <td><input type="number" className="input-gov w-20 font-medium" value={r.quantity} onChange={(e) => updateEntry(i, 'quantity', e.target.value)} /></td>
                    <td><input className="input-gov w-20" value={r.unit} onChange={(e) => updateEntry(i, 'unit', e.target.value)} /></td>
                    <td><input type="number" className="input-gov w-24" value={r.rate} onChange={(e) => updateEntry(i, 'rate', e.target.value)} /></td>
                    <td className="px-2 font-medium">{formatINR(r.amount)}</td>
                    <td><button type="button" onClick={() => removeEntry(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 font-bold">
                  <td colSpan={7} className="px-2 py-2 text-right">Total:</td>
                  <td className="px-2 py-2 text-govt-navy">{formatINR(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-gov-outline" onClick={() => nav(-1)}>Cancel</button>
          <button disabled={loading} className="btn-gov"><Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save & Submit'}</button>
        </div>
      </form>
    </div>
  );
}
