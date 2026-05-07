import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR, formatDate } from '../../utils/format';
import { Plus, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function ProjectProposalsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    api.get('/projects', { params: { mine: user?.role === 'JE' ? 'true' : undefined } })
      .then((r) => setItems(r.data.data))
      .finally(() => setLoading(false));
  }, [user?.role]);

  return (
    <div>
      <PageHeader
        title="Project Proposals"
        subtitle="Stage 1 · JE creates a project proposal with details, estimated cost, drawings, and documents"
        stage={1}
        actions={
          (user?.role === 'JE' || user?.role === 'ADMIN') && (
            <Link to="/proposals/new" className="btn-gov"><Plus className="w-4 h-4" /> New Proposal</Link>
          )
        }
      />

      <div className="card-gov">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Project ID</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Name</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Location</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Cost</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Type</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Proposed</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
              ) : items.length ? items.map((p) => (
                <tr key={p._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.projectId}</td>
                  <td className="px-4 py-3">
                    <Link to={`/proposals/${p._id}`} className="font-medium text-govt-navy hover:underline flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.location}</td>
                  <td className="px-4 py-3 font-medium">{formatINR(p.estimatedCost, { compact: true })}</td>
                  <td className="px-4 py-3 text-slate-600">{p.projectType}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(p.proposedAt || p.createdAt)}</td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No proposals yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
