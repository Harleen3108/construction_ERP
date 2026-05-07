import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatDate, formatINR } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, CheckCircle2 } from 'lucide-react';

export default function ProjectExecutionPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', plannedStartDate: '', plannedEndDate: '', progress: 0, status: 'NOT_STARTED' });
  const { user } = useAuthStore();

  const load = async () => {
    const p = await api.get(`/projects/${id}`);
    setProject(p.data.data);
    const m = await api.get(`/milestones/project/${id}`);
    setMilestones(m.data.data);
  };

  useEffect(() => { load(); }, [id]);

  const addMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/milestones', { ...form, project: id });
    toast.success('Milestone added');
    setAdding(false);
    setForm({ name: '', plannedStartDate: '', plannedEndDate: '', progress: 0, status: 'NOT_STARTED' });
    load();
  };

  const updateMilestone = async (mid: string, patch: any) => {
    await api.put(`/milestones/${mid}`, patch);
    toast.success('Updated');
    load();
  };

  const completeProject = async () => {
    await api.put(`/projects/${id}/complete`, { closureReport: 'Project completed successfully', actualEndDate: new Date() });
    toast.success('Project completed');
    load();
  };

  if (!project) return <div className="p-10 text-center text-slate-400">Loading...</div>;
  const canManage = ['JE','EE','CE','ADMIN'].includes(user?.role || '');

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={`Stage 8 · Project Execution · ${project.projectId}`}
        stage={8}
        actions={<Link to="/projects" className="btn-gov-outline"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />

      <div className="card-gov p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-800">Project Dashboard</h3>
            <div className="text-xs text-slate-500">📍 {project.location} · {formatINR(project.estimatedCost, { compact: true })}</div>
          </div>
          <StatusPill status={project.status} />
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-slate-500">Overall Progress</span>
          <div className="flex-1 bg-slate-200 h-3 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-govt-navy to-govt-navy-light h-full transition-all" style={{ width: `${project.overallProgress || 0}%` }} />
          </div>
          <span className="font-semibold text-govt-navy">{project.overallProgress || 0}%</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div><div className="text-xs text-slate-500">Start Date</div><div className="font-medium">{formatDate(project.startDate)}</div></div>
          <div><div className="text-xs text-slate-500">End Date</div><div className="font-medium">{formatDate(project.endDate)}</div></div>
          <div><div className="text-xs text-slate-500">Awarded To</div><div className="font-medium">{project.awardedTo?.companyName || project.awardedTo?.name || '—'}</div></div>
          <div><div className="text-xs text-slate-500">Awarded Amount</div><div className="font-medium">{formatINR(project.awardedAmount, { compact: true })}</div></div>
        </div>
      </div>

      {/* Milestones */}
      <div className="card-gov mb-5">
        <div className="card-gov-header flex items-center justify-between">
          <h3 className="font-semibold">Milestones</h3>
          {canManage && (
            <button className="btn-gov-outline text-xs" onClick={() => setAdding(true)}>
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>

        {adding && (
          <form onSubmit={addMilestone} className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3 border-b">
            <input required className="input-gov" placeholder="Milestone name (e.g., Foundation)" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            <input required type="date" className="input-gov" value={form.plannedStartDate} onChange={(e) => setForm({...form, plannedStartDate: e.target.value})} />
            <input required type="date" className="input-gov" value={form.plannedEndDate} onChange={(e) => setForm({...form, plannedEndDate: e.target.value})} />
            <div className="flex gap-2">
              <button className="btn-gov flex-1">Save</button>
              <button type="button" className="btn-gov-outline" onClick={() => setAdding(false)}>×</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2 text-xs uppercase">Milestone</th>
                <th className="px-4 py-2 text-xs uppercase">Planned</th>
                <th className="px-4 py-2 text-xs uppercase">Actual</th>
                <th className="px-4 py-2 text-xs uppercase">Progress</th>
                <th className="px-4 py-2 text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m._id} className="border-t">
                  <td className="px-4 py-2 font-medium">{m.name}</td>
                  <td className="px-4 py-2 text-xs">{formatDate(m.plannedStartDate)} → {formatDate(m.plannedEndDate)}</td>
                  <td className="px-4 py-2 text-xs">{formatDate(m.actualStartDate)} → {formatDate(m.actualEndDate)}</td>
                  <td className="px-4 py-2 w-40">
                    {canManage ? (
                      <input type="number" min={0} max={100} value={m.progress} onChange={(e) => updateMilestone(m._id, { progress: Number(e.target.value), status: Number(e.target.value) === 100 ? 'COMPLETED' : 'IN_PROGRESS' })}
                             className="input-gov w-20 text-center" />
                    ) : `${m.progress}%`}
                  </td>
                  <td className="px-4 py-2"><StatusPill status={m.status} /></td>
                </tr>
              ))}
              {!milestones.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No milestones yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {(user?.role === 'EE' || user?.role === 'CE' || user?.role === 'ADMIN') && project.status === 'IN_PROGRESS' && project.overallProgress === 100 && (
        <button onClick={completeProject} className="btn-gov-success">
          <CheckCircle2 className="w-4 h-4" /> Mark as Completed (Stage 12)
        </button>
      )}
    </div>
  );
}
