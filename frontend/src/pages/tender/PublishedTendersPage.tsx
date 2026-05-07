import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatDate, formatINR } from '../../utils/format';
import { Send } from 'lucide-react';

export default function PublishedTendersPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api.get('/tenders').then((r) => setItems(r.data.data.filter((t: any) => ['PUBLISHED','BIDDING_OPEN'].includes(t.status))));
  }, []);

  return (
    <div>
      <PageHeader
        title="Published Tenders"
        subtitle="Stage 4 · Tenders open for bidding — submit your bid before the deadline"
        stage={4}
      />
      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Tender ID</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Title</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Last Date</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">EMD</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t._id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{t.tenderId}</td>
                <td className="px-4 py-3"><Link to={`/tenders/${t._id}`} className="text-govt-navy hover:underline font-medium">{t.title}</Link></td>
                <td className="px-4 py-3">{formatDate(t.bidSubmissionEndDate)}</td>
                <td className="px-4 py-3">{formatINR(t.emd, { compact: true })}</td>
                <td className="px-4 py-3"><StatusPill status={t.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/bids/submit/${t._id}`} className="btn-gov-success text-xs"><Send className="w-3.5 h-3.5" /> Bid Now</Link>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No tenders open for bidding right now</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
