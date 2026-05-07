import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR } from '../../utils/format';
import { Plus, Ruler } from 'lucide-react';

export default function JEDashboard() {
  const [data, setData] = useState<any>({ myProjects: [], myMBs: 0 });
  useEffect(() => { api.get('/dashboard/me').then((r) => setData(r.data.data)); }, []);

  return (
    <div>
      <PageHeader
        title="Junior Engineer Dashboard"
        subtitle="Create proposals · Track field work · Record measurements"
        actions={
          <Link to="/proposals/new" className="btn-gov">
            <Plus className="w-4 h-4" /> New Proposal
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card-gov p-5">
          <div className="text-xs text-slate-500 uppercase">My Proposals</div>
          <div className="text-3xl font-bold text-govt-navy mt-1">{data.myProjects?.length || 0}</div>
        </div>
        <div className="card-gov p-5">
          <div className="text-xs text-slate-500 uppercase">MB Entries</div>
          <div className="text-3xl font-bold text-govt-navy mt-1 flex items-center gap-2">
            {data.myMBs || 0} <Ruler className="w-5 h-5" />
          </div>
        </div>
        <div className="card-gov p-5">
          <div className="text-xs text-slate-500 uppercase">Quick Action</div>
          <Link to="/mb/new" className="btn-gov-success mt-2">+ Record MB Entry</Link>
        </div>
      </div>

      <div className="card-gov">
        <div className="card-gov-header"><h3 className="font-semibold text-slate-700">My Proposals</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Project</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Estimated Cost</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Progress</th>
              </tr>
            </thead>
            <tbody>
              {data.myProjects?.map((p: any) => (
                <tr key={p._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/proposals/${p._id}`} className="font-medium text-govt-navy hover:underline">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3">{formatINR(p.estimatedCost, { compact: true })}</td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-3">{p.overallProgress || 0}%</td>
                </tr>
              ))}
              {!data.myProjects?.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400">No proposals yet — click "New Proposal" to start</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
