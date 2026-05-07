import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewProposalPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: '',
    location: '',
    district: '',
    state: 'Haryana',
    estimatedCost: '',
    projectType: 'Building Construction',
    fundingSource: 'State Government',
    department: 'PWD',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/projects', { ...form, estimatedCost: Number(form.estimatedCost) });
      toast.success('Proposal created and sent for approval');
      nav(`/proposals/${res.data.data._id}`);
    } catch {/* toast in interceptor */}
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader
        title="New Project Proposal"
        subtitle="Stage 1 · Fill in project details — proposal will route through SDO → EE → CE for sanction"
        stage={1}
        actions={<Link to="/proposals" className="btn-gov-outline"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />

      <form onSubmit={submit} className="card-gov p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        <div className="md:col-span-2">
          <label className="label-gov">Project Name *</label>
          <input required className="input-gov" value={form.name} onChange={(e) => set('name', e.target.value)}
                 placeholder="e.g., Construction of Government School Building" />
        </div>
        <div>
          <label className="label-gov">Location *</label>
          <input required className="input-gov" value={form.location} onChange={(e) => set('location', e.target.value)}
                 placeholder="Karnal" />
        </div>
        <div>
          <label className="label-gov">District</label>
          <input className="input-gov" value={form.district} onChange={(e) => set('district', e.target.value)} />
        </div>
        <div>
          <label className="label-gov">State</label>
          <input className="input-gov" value={form.state} onChange={(e) => set('state', e.target.value)} />
        </div>
        <div>
          <label className="label-gov">Estimated Cost (₹) *</label>
          <input required type="number" className="input-gov" value={form.estimatedCost}
                 onChange={(e) => set('estimatedCost', e.target.value)} placeholder="50000000" />
          {form.estimatedCost && (
            <p className="text-xs text-slate-500 mt-1">
              ≈ {(Number(form.estimatedCost) / 1e7).toFixed(2)} Crore
            </p>
          )}
        </div>
        <div>
          <label className="label-gov">Project Type *</label>
          <select className="input-gov" value={form.projectType} onChange={(e) => set('projectType', e.target.value)}>
            {['Building Construction','Road Construction','Drainage','Bridge','Water Supply','Renovation','Other'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-gov">Funding Source *</label>
          <select className="input-gov" value={form.fundingSource} onChange={(e) => set('fundingSource', e.target.value)}>
            {['State Government','Central Government','World Bank','CSR','Other'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-gov">Department</label>
          <input className="input-gov" value={form.department} onChange={(e) => set('department', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label-gov">Description / Scope of Work</label>
          <textarea className="input-gov h-24" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="md:col-span-2 flex items-center justify-end gap-3 pt-3 border-t">
          <button type="button" className="btn-gov-outline" onClick={() => nav(-1)}>Cancel</button>
          <button disabled={loading} className="btn-gov">
            <Save className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
}
