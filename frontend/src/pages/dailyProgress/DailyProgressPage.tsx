import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate } from '../../utils/format';
import { Plus, Calendar, CloudRain, Sun, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function DailyProgressPage() {
  const [items, setItems] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({
    project: '', reportDate: new Date().toISOString().slice(0, 10),
    workDescription: '', workCompletedToday: '',
    manpower: { skilled: 0, unskilled: 0, supervisors: 0 },
    weather: 'CLEAR', issues: '',
  });
  const { user } = useAuthStore();
  const canCreate = ['JE','CONTRACTOR','DEPT_ADMIN'].includes(user?.role || '');
  const canVerify = ['SDO','EE','DEPT_ADMIN'].includes(user?.role || '');

  const load = () => api.get('/daily-progress').then((r) => setItems(r.data.data));
  useEffect(() => {
    load();
    api.get('/projects', { params: { status: 'IN_PROGRESS' } }).then((r) => setProjects(r.data.data));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/daily-progress', form);
    toast.success('Daily progress recorded');
    setShow(false);
    load();
  };

  const verify = async (id: string) => {
    await api.put(`/daily-progress/${id}/verify`);
    toast.success('Verified');
    load();
  };

  return (
    <div>
      <PageHeader
        title="Daily Progress Reports"
        subtitle="JE / Contractor records on-site work, manpower, materials, weather"
        stage={8}
        actions={canCreate && (
          <button onClick={() => setShow(true)} className="btn-gov">
            <Plus className="w-4 h-4" /> New Report
          </button>
        )}
      />

      {show && (
        <div className="card-gov p-6 mb-5 border-2 border-govt-navy">
          <h3 className="font-semibold mb-4">Daily Progress Report</h3>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-gov">Project *</label>
              <select required className="input-gov" value={form.project} onChange={(e) => setForm({...form, project: e.target.value})}>
                <option value="">Select project</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-gov">Report Date</label>
              <input type="date" className="input-gov" value={form.reportDate} onChange={(e) => setForm({...form, reportDate: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="label-gov">Work Description *</label>
              <textarea required className="input-gov h-20" value={form.workDescription} onChange={(e) => setForm({...form, workDescription: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="label-gov">Work Completed Today</label>
              <textarea className="input-gov h-16" value={form.workCompletedToday} onChange={(e) => setForm({...form, workCompletedToday: e.target.value})} />
            </div>
            <div>
              <label className="label-gov">Skilled Workers</label>
              <input type="number" className="input-gov" value={form.manpower.skilled}
                onChange={(e) => setForm({...form, manpower: {...form.manpower, skilled: Number(e.target.value)}})} />
            </div>
            <div>
              <label className="label-gov">Unskilled Workers</label>
              <input type="number" className="input-gov" value={form.manpower.unskilled}
                onChange={(e) => setForm({...form, manpower: {...form.manpower, unskilled: Number(e.target.value)}})} />
            </div>
            <div>
              <label className="label-gov">Supervisors</label>
              <input type="number" className="input-gov" value={form.manpower.supervisors}
                onChange={(e) => setForm({...form, manpower: {...form.manpower, supervisors: Number(e.target.value)}})} />
            </div>
            <div>
              <label className="label-gov">Weather</label>
              <select className="input-gov" value={form.weather} onChange={(e) => setForm({...form, weather: e.target.value})}>
                <option>CLEAR</option><option>CLOUDY</option><option>RAIN</option><option>EXTREME</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label-gov">Issues / Notes</label>
              <textarea className="input-gov h-14" value={form.issues} onChange={(e) => setForm({...form, issues: e.target.value})} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" className="btn-gov-outline" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn-gov">Submit</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {items.map((dp) => (
          <div key={dp._id} className="card-gov p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-govt-navy" />
                  <span className="font-semibold">{formatDate(dp.reportDate)}</span>
                  {dp.weather === 'RAIN' && <CloudRain className="w-4 h-4 text-blue-500" />}
                  {dp.weather === 'CLEAR' && <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <Link to={`/projects/${dp.project?._id}`} className="text-xs text-slate-500 hover:underline">
                  {dp.project?.name}
                </Link>
              </div>
              <div className="text-right text-xs">
                {dp.verifiedBy ? (
                  <span className="pill pill-approved"><CheckCircle2 className="w-3 h-3 inline mr-1" />Verified</span>
                ) : <span className="pill pill-pending">Pending</span>}
                <div className="text-[10px] text-slate-500 mt-1">By {dp.recordedBy?.name}</div>
              </div>
            </div>
            <p className="text-sm text-slate-700">{dp.workDescription}</p>
            {dp.workCompletedToday && <p className="text-sm text-slate-500 mt-1 italic">"{dp.workCompletedToday}"</p>}
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              <span className="bg-slate-100 px-2 py-0.5 rounded">Skilled: {dp.manpower?.skilled || 0}</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded">Unskilled: {dp.manpower?.unskilled || 0}</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded">Supervisors: {dp.manpower?.supervisors || 0}</span>
              {dp.issues && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">⚠ {dp.issues}</span>}
            </div>
            {canVerify && !dp.verifiedBy && (
              <button onClick={() => verify(dp._id)} className="btn-gov-success text-xs mt-3">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verify Report
              </button>
            )}
          </div>
        ))}
        {!items.length && <div className="card-gov p-12 text-center text-slate-400">No daily progress reports yet</div>}
      </div>
    </div>
  );
}
