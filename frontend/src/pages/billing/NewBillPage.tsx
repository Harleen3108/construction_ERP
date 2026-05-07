import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR } from '../../utils/format';
import toast from 'react-hot-toast';
import { Save, ArrowLeft } from 'lucide-react';

export default function NewBillPage() {
  const nav = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [mbs, setMbs] = useState<any[]>([]);
  const [selectedMbs, setSelectedMbs] = useState<string[]>([]);
  const [form, setForm] = useState({
    project: '', workOrder: '',
    gstPercent: 18, tdsPercent: 1, securityPercent: 5, retentionPercent: 0, otherDeductions: 0,
    remarks: '',
  });
  const [grossAmount, setGrossAmount] = useState(0);
  const [calc, setCalc] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/projects', { params: { mine: 'true' } }).then((r) => setProjects(r.data.data));
  }, []);

  useEffect(() => {
    if (form.project) {
      api.get('/mb', { params: { projectId: form.project, status: 'EE_APPROVED' } })
        .then((r) => setMbs(r.data.data));
    }
  }, [form.project]);

  useEffect(() => {
    const total = mbs.filter((m) => selectedMbs.includes(m._id)).reduce((s, m) => s + (m.totalAmount || 0), 0);
    setGrossAmount(total);

    if (total > 0) {
      api.post('/bills/calculate', {
        currentBillAmount: total,
        gstPercent: form.gstPercent,
        tdsPercent: form.tdsPercent,
        securityPercent: form.securityPercent,
        retentionPercent: form.retentionPercent,
        otherDeductions: form.otherDeductions,
      }).then((r) => setCalc(r.data.data));
    } else {
      setCalc({});
    }
  }, [selectedMbs, form.gstPercent, form.tdsPercent, form.securityPercent, form.retentionPercent, form.otherDeductions, mbs]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMbs.length) return toast.error('Select at least one approved MB');
    setLoading(true);
    try {
      const proj = projects.find((p) => p._id === form.project);
      const res = await api.post('/bills', {
        ...form,
        workOrder: proj?.workOrder?._id || proj?.workOrder,
        measurementBooks: selectedMbs,
      });
      toast.success('Bill submitted for approval');
      nav(`/bills/${res.data.data._id}`);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader
        title="Raise New Bill"
        subtitle="Stage 10 · Select approved MBs · Auto-calculated deductions"
        stage={10}
        actions={<Link to="/bills" className="btn-gov-outline"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card-gov p-5">
            <label className="label-gov">Project *</label>
            <select required className="input-gov" value={form.project} onChange={(e) => { setForm({ ...form, project: e.target.value }); setSelectedMbs([]); }}>
              <option value="">Select project</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>

          <div className="card-gov">
            <div className="card-gov-header"><h3 className="font-semibold">Approved Measurement Books</h3></div>
            <div className="p-3">
              {mbs.length ? mbs.map((m) => (
                <label key={m._id} className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-slate-50">
                  <input type="checkbox" checked={selectedMbs.includes(m._id)}
                         onChange={(e) => setSelectedMbs((cur) => e.target.checked ? [...cur, m._id] : cur.filter((x) => x !== m._id))} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{m.workItem}</div>
                    <div className="text-xs text-slate-500">{m.mbId} · {m.location}</div>
                  </div>
                  <div className="font-medium text-sm">{formatINR(m.totalAmount, { compact: true })}</div>
                </label>
              )) : <p className="text-sm text-slate-400 p-5 text-center">{form.project ? 'No EE-approved MBs available' : 'Select a project first'}</p>}
            </div>
          </div>

          <div className="card-gov p-5">
            <h3 className="font-semibold mb-3">Deductions Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="label-gov text-xs">GST %</label>
                <input type="number" className="input-gov" value={form.gstPercent} onChange={(e) => setForm({...form, gstPercent: Number(e.target.value)})} />
              </div>
              <div>
                <label className="label-gov text-xs">TDS %</label>
                <input type="number" className="input-gov" value={form.tdsPercent} onChange={(e) => setForm({...form, tdsPercent: Number(e.target.value)})} />
              </div>
              <div>
                <label className="label-gov text-xs">Security %</label>
                <input type="number" className="input-gov" value={form.securityPercent} onChange={(e) => setForm({...form, securityPercent: Number(e.target.value)})} />
              </div>
              <div>
                <label className="label-gov text-xs">Retention %</label>
                <input type="number" className="input-gov" value={form.retentionPercent} onChange={(e) => setForm({...form, retentionPercent: Number(e.target.value)})} />
              </div>
            </div>
          </div>
        </div>

        {/* Live calc preview */}
        <div className="card-gov p-5 h-fit sticky top-20">
          <h3 className="font-semibold mb-3">Bill Calculation</h3>
          <div className="space-y-2 text-sm">
            <Row label="Gross / Bill Amount" value={formatINR(grossAmount)} bold />
            <hr />
            <Row label={`GST (${form.gstPercent}%)`} value={`- ${formatINR(calc.gstAmount || 0)}`} className="text-erp-danger" />
            <Row label={`TDS (${form.tdsPercent}%)`} value={`- ${formatINR(calc.tdsAmount || 0)}`} className="text-erp-danger" />
            <Row label={`Security (${form.securityPercent}%)`} value={`- ${formatINR(calc.securityAmount || 0)}`} className="text-erp-danger" />
            <Row label={`Retention (${form.retentionPercent}%)`} value={`- ${formatINR(calc.retentionAmount || 0)}`} className="text-erp-danger" />
            <Row label="Other Deductions" value={`- ${formatINR(form.otherDeductions || 0)}`} className="text-erp-danger" />
            <hr />
            <Row label="Total Deductions" value={`- ${formatINR(calc.totalDeductions || 0)}`} className="text-erp-danger font-medium" />
            <hr className="border-2" />
            <div className="flex items-center justify-between bg-green-50 -mx-5 px-5 py-3">
              <span className="font-bold">Net Payable:</span>
              <span className="text-xl font-bold text-govt-green">{formatINR(calc.netPayable || 0)}</span>
            </div>
          </div>
          <button disabled={loading} className="btn-gov w-full mt-5">
            <Save className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
}

const Row = ({ label, value, bold, className = '' }: any) => (
  <div className={`flex items-center justify-between ${className} ${bold ? 'font-semibold' : ''}`}>
    <span className="text-slate-600">{label}</span>
    <span>{value}</span>
  </div>
);
