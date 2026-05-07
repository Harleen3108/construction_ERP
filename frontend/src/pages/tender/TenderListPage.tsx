import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatDate, formatINR } from '../../utils/format';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function TenderListPage() {
  const [items, setItems] = useState<any[]>([]);
  const { user } = useAuthStore();
  useEffect(() => {
    api.get('/tenders').then((r) => setItems(r.data.data));
  }, []);

  return (
    <div>
      <PageHeader
        title="Tender Management"
        subtitle="Stage 3 & 4 · Create, approve, and publish tenders"
        stage={3}
        actions={
          (user?.role === 'TENDER_OFFICER' || user?.role === 'EE' || user?.role === 'ADMIN') && (
            <Link to="/tenders/new" className="btn-gov"><Plus className="w-4 h-4" /> New Tender</Link>
          )
        }
      />
      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Tender ID</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Title</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Estimated Cost</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">EMD</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Last Date</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t._id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.tenderId}</td>
                <td className="px-4 py-3"><Link to={`/tenders/${t._id}`} className="text-govt-navy hover:underline font-medium">{t.title}</Link></td>
                <td className="px-4 py-3 font-medium">{formatINR(t.estimatedCost, { compact: true })}</td>
                <td className="px-4 py-3">{formatINR(t.emd, { compact: true })}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(t.bidSubmissionEndDate)}</td>
                <td className="px-4 py-3"><StatusPill status={t.status} /></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No tenders</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
