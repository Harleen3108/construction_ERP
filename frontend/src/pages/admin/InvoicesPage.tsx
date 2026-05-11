import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatDate, formatINR } from '../../utils/format';
import toast from 'react-hot-toast';
import { Plus, Receipt, X, CheckCircle2 } from 'lucide-react';

export default function InvoicesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [paying, setPaying] = useState<any>(null);
  const [payForm, setPayForm] = useState({ utrNumber: '', paymentMethod: 'BANK_TRANSFER' });
  const [form, setForm] = useState<any>({
    department: '', description: 'Annual subscription',
    subtotal: 499000, taxPercent: 18,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const load = () => api.get('/invoices').then((r) => { setItems(r.data.data); setSummary(r.data.summary); });
  useEffect(() => {
    load();
    api.get('/departments').then((r) => setDepartments(r.data.data));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/invoices', form);
    toast.success('Invoice created');
    setShow(false);
    load();
  };

  const markPaid = async () => {
    await api.put(`/invoices/${paying._id}/paid`, payForm);
    toast.success('Invoice marked as paid');
    setPaying(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Invoices & Billing"
        subtitle="Generate, track, and manage SaaS invoices for all departments"
        actions={<button onClick={() => setShow(true)} className="btn-gov"><Plus className="w-4 h-4" /> New Invoice</button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Total Billed" value={formatINR(summary.total, { compact: true })} color="text-slate-800" />
        <Stat label="Paid" value={formatINR(summary.paid, { compact: true })} color="text-govt-green" />
        <Stat label="Pending" value={formatINR(summary.pending, { compact: true })} color="text-amber-600" />
        <Stat label="Overdue" value={formatINR(summary.overdue, { compact: true })} color="text-erp-danger" />
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-md shadow-2xl w-full max-w-lg">
            <div className="px-5 py-3 border-b bg-govt-navy text-white flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Receipt className="w-4 h-4" /> New Invoice</h3>
              <button type="button" onClick={() => setShow(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="label-gov">Department *</label>
                <select required className="input-gov" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})}>
                  <option value="">Select</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select></div>
              <div><label className="label-gov">Description *</label>
                <input required className="input-gov" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-gov">Subtotal (₹)</label>
                  <input type="number" className="input-gov" value={form.subtotal} onChange={(e) => setForm({...form, subtotal: Number(e.target.value)})} /></div>
                <div><label className="label-gov">Tax %</label>
                  <input type="number" className="input-gov" value={form.taxPercent} onChange={(e) => setForm({...form, taxPercent: Number(e.target.value)})} /></div>
                <div><label className="label-gov">Issue Date</label>
                  <input type="date" className="input-gov" value={form.issueDate} onChange={(e) => setForm({...form, issueDate: e.target.value})} /></div>
                <div><label className="label-gov">Due Date</label>
                  <input type="date" className="input-gov" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} /></div>
              </div>
              <div className="bg-slate-50 p-3 rounded text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(form.subtotal)}</span></div>
                <div className="flex justify-between"><span>Tax ({form.taxPercent}%)</span><span>{formatINR((form.subtotal * form.taxPercent) / 100)}</span></div>
                <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>Total</span><span>{formatINR(form.subtotal + (form.subtotal * form.taxPercent) / 100)}</span></div>
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button type="button" className="btn-gov-outline" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn-gov">Create Invoice</button>
            </div>
          </form>
        </div>
      )}

      {paying && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md">
            <div className="px-5 py-3 border-b bg-govt-green text-white">
              <h3 className="font-semibold">Mark {paying.invoiceNumber} as Paid</h3>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="label-gov">UTR / Transaction ID</label>
                <input className="input-gov" value={payForm.utrNumber} onChange={(e) => setPayForm({...payForm, utrNumber: e.target.value})} /></div>
              <div><label className="label-gov">Payment Method</label>
                <select className="input-gov" value={payForm.paymentMethod} onChange={(e) => setPayForm({...payForm, paymentMethod: e.target.value})}>
                  <option>BANK_TRANSFER</option><option>CHEQUE</option><option>UPI</option><option>OTHER</option>
                </select></div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button className="btn-gov-outline" onClick={() => setPaying(null)}>Cancel</button>
              <button onClick={markPaid} className="btn-gov-success"><CheckCircle2 className="w-4 h-4" /> Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs uppercase">Invoice #</th>
              <th className="px-4 py-2.5 text-xs uppercase">Department</th>
              <th className="px-4 py-2.5 text-xs uppercase">Description</th>
              <th className="px-4 py-2.5 text-xs uppercase">Total</th>
              <th className="px-4 py-2.5 text-xs uppercase">Issue</th>
              <th className="px-4 py-2.5 text-xs uppercase">Due</th>
              <th className="px-4 py-2.5 text-xs uppercase">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i._id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{i.invoiceNumber}</td>
                <td className="px-4 py-3">{i.department?.name}</td>
                <td className="px-4 py-3 text-xs">{i.description}</td>
                <td className="px-4 py-3 font-medium tabular-nums">{formatINR(i.total)}</td>
                <td className="px-4 py-3 text-xs">{formatDate(i.issueDate)}</td>
                <td className="px-4 py-3 text-xs">{formatDate(i.dueDate)}</td>
                <td className="px-4 py-3"><StatusPill status={i.status} /></td>
                <td className="px-4 py-3 text-right">
                  {i.status === 'SENT' && (
                    <button onClick={() => setPaying(i)} className="text-xs text-govt-green hover:underline">Mark Paid</button>
                  )}
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No invoices yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: any) {
  return (
    <div className="card-gov p-4">
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
      <div className={`text-xl font-bold tabular-nums mt-1 ${color}`}>{value}</div>
    </div>
  );
}
