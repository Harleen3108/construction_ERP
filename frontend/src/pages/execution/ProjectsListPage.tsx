import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatDate, formatINR } from '../../utils/format';

export default function ProjectsListPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api.get('/projects', { params: { status: 'IN_PROGRESS' } }).then((r) => setItems(r.data.data));
  }, []);

  return (
    <div>
      <PageHeader title="Project Execution" subtitle="Stage 8 · Active projects with progress tracking" stage={8} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <Link key={p._id} to={`/projects/${p._id}`} className="card-gov p-5 hover:shadow-gov-lg transition">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-[10px] font-mono text-slate-500">{p.projectId}</div>
                <h3 className="font-semibold text-slate-800">{p.name}</h3>
                <div className="text-xs text-slate-500">📍 {p.location}</div>
              </div>
              <StatusPill status={p.status} />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-govt-navy h-full transition-all" style={{ width: `${p.overallProgress || 0}%` }} />
              </div>
              <span className="text-xs font-medium">{p.overallProgress || 0}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div><div className="text-slate-500">Budget</div><div className="font-medium">{formatINR(p.estimatedCost, { compact: true })}</div></div>
              <div><div className="text-slate-500">End Date</div><div className="font-medium">{formatDate(p.endDate)}</div></div>
            </div>
          </Link>
        ))}
        {!items.length && <div className="col-span-full text-center py-10 text-slate-400">No active projects</div>}
      </div>
    </div>
  );
}
