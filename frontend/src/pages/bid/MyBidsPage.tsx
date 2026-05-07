import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatDate, formatINR } from '../../utils/format';

export default function MyBidsPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { api.get('/bids/my').then((r) => setItems(r.data.data)); }, []);

  return (
    <div>
      <PageHeader title="My Bids" subtitle="Stage 5 · Submitted technical & financial bids" stage={5} />
      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Tender</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Tender ID</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">My Quote</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Submitted</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Rank</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b._id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3"><Link to={`/tenders/${b.tender?._id}`} className="text-govt-navy hover:underline font-medium">{b.tender?.title}</Link></td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{b.tender?.tenderId}</td>
                <td className="px-4 py-3 font-medium">{formatINR(b.quotedAmount)}</td>
                <td className="px-4 py-3">{formatDate(b.submittedAt)}</td>
                <td className="px-4 py-3">{b.rank ? `L${b.rank}` : '—'}{b.isL1 && <span className="pill-l1 ml-1">WINNER</span>}</td>
                <td className="px-4 py-3"><StatusPill status={b.status} /></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">You haven't submitted any bids yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
