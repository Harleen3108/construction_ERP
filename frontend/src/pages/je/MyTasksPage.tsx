import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  CheckCircle2, AlertTriangle, Calendar, ChevronRight, Briefcase,
} from 'lucide-react';

export default function MyTasksPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');

  const load = () => api.get('/je/my-tasks').then((r) => setItems(r.data.data));
  useEffect(() => { load(); }, []);

  const updateProgress = async (id: string, progress: number) => {
    const status = progress === 100 ? 'COMPLETED' : 'IN_PROGRESS';
    await api.put(`/milestones/${id}`, { progress, status });
    toast.success('Progress updated');
    load();
  };

  const filtered = items.filter((m) => {
    if (filter === 'active') return m.status !== 'COMPLETED';
    if (filter === 'overdue') return m.isOverdue;
    if (filter === 'completed') return m.status === 'COMPLETED';
    return true;
  });

  // Group by project
  const grouped: Record<string, any[]> = {};
  filtered.forEach((m) => {
    const k = m.project?.name || 'Unassigned';
    (grouped[k] = grouped[k] || []).push(m);
  });

  return (
    <div>
      <PageHeader
        title="My Tasks & Milestones"
        subtitle="Milestones across your assigned projects · update progress, mark completed"
        badge={`${items.length} milestone${items.length !== 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Total" value={items.length} />
        <Stat label="Active" value={items.filter((m) => m.status !== 'COMPLETED').length} color="text-blue-600" />
        <Stat label="Overdue" value={items.filter((m) => m.isOverdue).length} color="text-erp-danger" />
        <Stat label="Completed" value={items.filter((m) => m.status === 'COMPLETED').length} color="text-govt-green" />
      </div>

      <div className="flex gap-1 mb-4">
        {[
          { val: 'all', label: 'All' },
          { val: 'active', label: 'Active' },
          { val: 'overdue', label: 'Overdue' },
          { val: 'completed', label: 'Completed' },
        ].map((b: any) => (
          <button key={b.val} onClick={() => setFilter(b.val)}
            className={`px-3 py-1.5 text-xs rounded border ${filter === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([projectName, tasks]) => (
          <div key={projectName} className="card-gov">
            <div className="card-gov-header flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-govt-navy" />
              <h3 className="font-semibold text-sm">{projectName}</h3>
              <span className="text-[10px] text-slate-500">· {tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <div key={t._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      t.status === 'COMPLETED' ? 'bg-green-100 text-govt-green' :
                      t.isOverdue ? 'bg-red-100 text-erp-danger' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{t.name}</h4>
                        <StatusPill status={t.status} />
                        {t.isOverdue && t.status !== 'COMPLETED' && (
                          <span className="pill pill-rejected text-[10px]">
                            <AlertTriangle className="w-3 h-3 inline" /> Overdue
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Planned: {formatDate(t.plannedStartDate)} → {formatDate(t.plannedEndDate)}</span>
                        {t.daysToEnd != null && t.status !== 'COMPLETED' && (
                          <span className={t.daysToEnd < 0 ? 'text-erp-danger' : t.daysToEnd <= 7 ? 'text-amber-600' : ''}>
                            {t.daysToEnd < 0 ? `${Math.abs(t.daysToEnd)}d overdue` : `${t.daysToEnd}d left`}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={t.progress}
                          onChange={(e) => updateProgress(t._id, Number(e.target.value))}
                          className="flex-1"
                          disabled={t.status === 'COMPLETED'}
                        />
                        <span className="text-sm font-bold tabular-nums w-12 text-right">{t.progress}%</span>
                      </div>
                      {t.remarks && <p className="text-[11px] text-slate-500 italic mt-1">{t.remarks}</p>}
                    </div>
                    <Link to={`/projects/${t.project?._id}`} className="text-[10px] text-govt-navy hover:underline flex-shrink-0">
                      Project →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div className="card-gov p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No tasks match the filter</p>
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
