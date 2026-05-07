import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { formatINR } from '../../utils/format';

export default function NewTenderPage() {
  const nav = useNavigate();
  const [search] = useSearchParams();
  const projectIdQuery = search.get('projectId') || '';
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({
    project: projectIdQuery,
    title: '',
    estimatedCost: '',
    emd: '',
    tenderFee: '5000',
    bidSubmissionStartDate: '',
    bidSubmissionEndDate: '',
    bidOpeningDate: '',
    technicalSpecs: '',
    eligibilityCriteria: '',
  });
  const [boq, setBoq] = useState([{ serialNo: 1, description: '', unit: 'Cum', quantity: 0, rate: 0, amount: 0 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/projects', { params: { status: 'SANCTIONED' } }).then((r) => setProjects(r.data.data));
  }, []);

  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const addBOQ = () => setBoq([...boq, { serialNo: boq.length + 1, description: '', unit: 'Cum', quantity: 0, rate: 0, amount: 0 }]);
  const removeBOQ = (i: number) => setBoq(boq.filter((_, idx) => idx !== i));
  const updateBOQ = (i: number, k: string, v: any) => {
    setBoq((cur) => cur.map((row, idx) => {
      if (idx !== i) return row;
      const updated: any = { ...row, [k]: v };
      updated.amount = Number(updated.quantity || 0) * Number(updated.rate || 0);
      return updated;
    }));
  };
  const totalBOQ = boq.reduce((s, r) => s + (r.amount || 0), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/tenders', {
        ...form,
        estimatedCost: Number(form.estimatedCost),
        emd: Number(form.emd),
        tenderFee: Number(form.tenderFee),
        boq,
      });
      toast.success('Tender created and sent for approval');
      nav(`/tenders/${res.data.data._id}`);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader
        title="Create Tender"
        subtitle="Stage 3 · Add BOQ, EMD, deadlines and send for approval (EE → CE)"
        stage={3}
        actions={<Link to="/tenders" className="btn-gov-outline"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />

      <form onSubmit={submit} className="space-y-5">
        <div className="card-gov p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label-gov">Sanctioned Project *</label>
            <select required className="input-gov" value={form.project} onChange={(e) => set('project', e.target.value)}>
              <option value="">— Select sanctioned project —</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.projectId} · {p.name} · {formatINR(p.estimatedCost, { compact: true })}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label-gov">Tender Title *</label>
            <input required className="input-gov" value={form.title} onChange={(e) => set('title', e.target.value)}
                   placeholder="Construction of Govt School Building" />
          </div>
          <div>
            <label className="label-gov">Estimated Cost (₹) *</label>
            <input required type="number" className="input-gov" value={form.estimatedCost} onChange={(e) => set('estimatedCost', e.target.value)} />
          </div>
          <div>
            <label className="label-gov">EMD (₹) *</label>
            <input required type="number" className="input-gov" value={form.emd} onChange={(e) => set('emd', e.target.value)} />
          </div>
          <div>
            <label className="label-gov">Tender Fee (₹)</label>
            <input type="number" className="input-gov" value={form.tenderFee} onChange={(e) => set('tenderFee', e.target.value)} />
          </div>
          <div></div>
          <div>
            <label className="label-gov">Bid Submission Start *</label>
            <input required type="date" className="input-gov" value={form.bidSubmissionStartDate} onChange={(e) => set('bidSubmissionStartDate', e.target.value)} />
          </div>
          <div>
            <label className="label-gov">Bid Submission End *</label>
            <input required type="date" className="input-gov" value={form.bidSubmissionEndDate} onChange={(e) => set('bidSubmissionEndDate', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label-gov">Bid Opening Date</label>
            <input type="date" className="input-gov" value={form.bidOpeningDate} onChange={(e) => set('bidOpeningDate', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label-gov">Eligibility Criteria</label>
            <textarea className="input-gov h-20" value={form.eligibilityCriteria} onChange={(e) => set('eligibilityCriteria', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label-gov">Technical Specifications</label>
            <textarea className="input-gov h-20" value={form.technicalSpecs} onChange={(e) => set('technicalSpecs', e.target.value)} />
          </div>
        </div>

        <div className="card-gov p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Bill of Quantities (BOQ)</h3>
            <button type="button" onClick={addBOQ} className="btn-gov-outline text-sm">
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-2 py-2 text-xs font-semibold">#</th>
                  <th className="px-2 py-2 text-xs font-semibold">Description</th>
                  <th className="px-2 py-2 text-xs font-semibold">Unit</th>
                  <th className="px-2 py-2 text-xs font-semibold">Qty</th>
                  <th className="px-2 py-2 text-xs font-semibold">Rate (₹)</th>
                  <th className="px-2 py-2 text-xs font-semibold">Amount (₹)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {boq.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-2">{i + 1}</td>
                    <td><input className="input-gov" value={r.description} onChange={(e) => updateBOQ(i, 'description', e.target.value)} /></td>
                    <td><input className="input-gov w-20" value={r.unit} onChange={(e) => updateBOQ(i, 'unit', e.target.value)} /></td>
                    <td><input type="number" className="input-gov w-24" value={r.quantity} onChange={(e) => updateBOQ(i, 'quantity', e.target.value)} /></td>
                    <td><input type="number" className="input-gov w-28" value={r.rate} onChange={(e) => updateBOQ(i, 'rate', e.target.value)} /></td>
                    <td className="font-medium px-2">{formatINR(r.amount)}</td>
                    <td>
                      <button type="button" onClick={() => removeBOQ(i)} className="text-red-500 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-300 font-semibold">
                  <td colSpan={5} className="px-2 py-2 text-right">BOQ Total:</td>
                  <td className="px-2 py-2 text-govt-navy">{formatINR(totalBOQ)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-gov-outline" onClick={() => nav(-1)}>Cancel</button>
          <button disabled={loading} className="btn-gov">
            <Save className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
}
