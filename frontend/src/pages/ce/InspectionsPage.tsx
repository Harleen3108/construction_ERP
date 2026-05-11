import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate, formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  Plus, X, Calendar, CheckCircle2, AlertTriangle, MapPin, Star,
  ClipboardCheck, User as UserIcon,
} from 'lucide-react';

const TYPE_COLOR: Record<string, string> = {
  ROUTINE: 'pill-info', QUALITY: 'pill-progress',
  SURPRISE: 'pill-pending', PRE_BILL: 'pill-approved', COMPLETION: 'pill-approved',
};

export default function InspectionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({});
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [form, setForm] = useState<any>({
    project: '', type: 'ROUTINE', scheduledDate: new Date().toISOString().slice(0, 10),
  });
  const [completeForm, setCompleteForm] = useState({ findings: '', rating: 5, recommendations: '', followUpRequired: false });

  const load = () => {
    const params: any = {};
    if (status) params.status = status;
    if (type) params.type = type;
    api.get('/inspections', { params }).then((r) => { setItems(r.data.data); setCounts(r.data.counts); });
  };
  useEffect(() => {
    load();
    api.get('/projects').then((r) => setProjects(r.data.data || []));
  }, [status, type]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/inspections', form);
    toast.success('Inspection scheduled');
    setShow(false);
    setForm({ project: '', type: 'ROUTINE', scheduledDate: new Date().toISOString().slice(0, 10) });
    load();
  };

  const complete = async () => {
    await api.put(`/inspections/${active._id}/complete`, completeForm);
    toast.success('Inspection completed');
    setActive(null);
    setCompleteForm({ findings: '', rating: 5, recommendations: '', followUpRequired: false });
    load();
  };

  return (
    <div>
      <PageHeader
        title="Site Inspections"
        subtitle="Routine, quality, surprise inspections — findings, ratings, follow-ups"
        actions={<button className="btn-gov" onClick={() => setShow(true)}><Plus className="w-4 h-4" /> Schedule Inspection</button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Scheduled" value={counts.scheduled || 0} color="text-amber-600" />
        <Stat label="Completed" value={counts.completed || 0} color="text-govt-green" />
        <Stat label="Postponed" value={counts.postponed || 0} color="text-slate-600" />
        <Stat label="Follow-up Required" value={counts.followUp || 0} color="text-erp-danger" />
      </div>

      <div className="card-gov p-3 mb-4 flex items-center gap-3 flex-wrap">
        <select className="input-gov w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option>SCHEDULED</option><option>COMPLETED</option><option>POSTPONED</option><option>CANCELLED</option>
        </select>
        <select className="input-gov w-40" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option>ROUTINE</option><option>QUALITY</option><option>SURPRISE</option><option>PRE_BILL</option><option>COMPLETION</option>
        </select>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={create} className="bg-white rounded-md shadow-2xl w-full max-w-lg">
            <div className="px-5 py-3 border-b bg-govt-navy text-white flex items-center justify-between">
              <h3 className="font-semibold">Schedule Inspection</h3>
              <button type="button" onClick={() => setShow(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label-gov">Project *</label>
                <select required className="input-gov" value={form.project} onChange={(e) => setForm({...form, project: e.target.value})}>
                  <option value="">Select project</option>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select></div>
              <div><label className="label-gov">Type</label>
                <select className="input-gov" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                  <option>ROUTINE</option><option>QUALITY</option><option>SURPRISE</option><option>PRE_BILL</option><option>COMPLETION</option>
                </select></div>
              <div><label className="label-gov">Scheduled Date</label>
                <input required type="date" className="input-gov" value={form.scheduledDate} onChange={(e) => setForm({...form, scheduledDate: e.target.value})} /></div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button type="button" className="btn-gov-outline" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn-gov">Schedule</button>
            </div>
          </form>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-lg">
            <div className="px-5 py-3 border-b bg-govt-green text-white">
              <h3 className="font-semibold flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> Complete Inspection</h3>
              <p className="text-[11px] opacity-80">{active.project?.name} · {active.type}</p>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="label-gov">Findings *</label>
                <textarea required className="input-gov h-20" value={completeForm.findings} onChange={(e) => setCompleteForm({...completeForm, findings: e.target.value})} placeholder="What was observed on site?" /></div>
              <div><label className="label-gov">Rating (1–5)</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} type="button" onClick={() => setCompleteForm({...completeForm, rating: n})}
                      className={`p-2 rounded ${completeForm.rating >= n ? 'text-amber-500' : 'text-slate-300'}`}>
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div></div>
              <div><label className="label-gov">Recommendations</label>
                <textarea className="input-gov h-16" value={completeForm.recommendations} onChange={(e) => setCompleteForm({...completeForm, recommendations: e.target.value})} /></div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={completeForm.followUpRequired} onChange={(e) => setCompleteForm({...completeForm, followUpRequired: e.target.checked})} />
                Follow-up inspection required
              </label>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button className="btn-gov-outline" onClick={() => setActive(null)}>Cancel</button>
              <button onClick={complete} className="btn-gov-success">Mark Completed</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((i) => (
          <div key={i._id} className="card-gov p-4">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                i.status === 'COMPLETED' ? 'bg-green-100 text-govt-green' : 'bg-amber-100 text-amber-700'
              }`}>
                {i.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{i.project?.name}</h3>
                  <span className={`pill ${TYPE_COLOR[i.type]} text-[10px]`}>{i.type}</span>
                  <span className={`pill text-[10px] ${
                    i.status === 'COMPLETED' ? 'pill-approved' :
                    i.status === 'POSTPONED' ? 'pill-info' :
                    i.status === 'CANCELLED' ? 'pill-rejected' : 'pill-pending'
                  }`}>{i.status}</span>
                  {i.followUpRequired && <span className="pill pill-rejected text-[10px] flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Follow-up</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  {i.project?.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {i.project.location}</span>}
                  <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {i.inspector?.name}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(i.scheduledDate)}</span>
                  {i.conductedDate && <span>· Conducted {formatDate(i.conductedDate)}</span>}
                </div>
                {i.findings && (
                  <div className="mt-2 text-xs text-slate-700 bg-slate-50 rounded p-2">
                    <strong>Findings:</strong> {i.findings}
                    {i.recommendations && <div className="mt-1"><strong>Recommendations:</strong> {i.recommendations}</div>}
                  </div>
                )}
                {i.rating && (
                  <div className="mt-2 flex items-center gap-1">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={`w-3 h-3 ${i.rating >= n ? 'text-amber-500 fill-current' : 'text-slate-200'}`} />
                    ))}
                    <span className="text-[10px] text-slate-500 ml-1">{i.rating}/5</span>
                  </div>
                )}
              </div>
              {i.status === 'SCHEDULED' && (
                <button onClick={() => setActive(i)} className="btn-gov-success text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                </button>
              )}
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="card-gov p-12 text-center text-slate-400">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No inspections recorded yet</p>
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
