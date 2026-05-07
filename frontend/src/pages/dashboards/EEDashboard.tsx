import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR } from '../../utils/format';

export default function EEDashboard() {
  const [data, setData] = useState<any>({ myProjects: [] });
  useEffect(() => { api.get('/dashboard/me').then((r) => setData(r.data.data)); }, []);

  return (
    <div>
      <PageHeader title="Executive Engineer Dashboard" subtitle="My Projects · Approvals · Field Operations" badge="Approver Level 2" />
      <div className="card-gov">
        <div className="card-gov-header">
          <h3 className="font-semibold text-slate-700">My Projects</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Project</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Budget</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Progress</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.myProjects?.map((p: any) => (
                <tr key={p._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/projects/${p._id}`} className="font-medium text-govt-navy hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-xs text-slate-500">{p.location}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatINR(p.estimatedCost, { compact: true })}</td>
                  <td className="px-4 py-3 w-44">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-govt-navy h-full" style={{ width: `${p.overallProgress || 0}%` }} />
                      </div>
                      <span className="text-xs">{p.overallProgress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                </tr>
              ))}
              {!data.myProjects?.length && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400">No projects yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
