import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR } from '../../utils/format';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Award, Scale } from 'lucide-react';

export default function BidEvaluationPage() {
  const { tenderId } = useParams();
  const [tenders, setTenders] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [activeTender, setActiveTender] = useState<any>(null);

  useEffect(() => {
    api.get('/tenders').then((r) =>
      setTenders(r.data.data.filter((t: any) => ['BIDDING_CLOSED','EVALUATION','BIDDING_OPEN'].includes(t.status)))
    );
  }, []);

  useEffect(() => {
    if (tenderId) {
      api.get(`/tenders/${tenderId}`).then((r) => setActiveTender(r.data.data));
      api.get(`/bids/tender/${tenderId}`).then((r) => setBids(r.data.data));
    }
  }, [tenderId]);

  const evaluate = async (bidId: string, qualified: boolean) => {
    await api.put(`/bids/${bidId}/technical-evaluation`, { qualified });
    toast.success(qualified ? 'Technically qualified' : 'Disqualified');
    api.get(`/bids/tender/${tenderId}`).then((r) => setBids(r.data.data));
  };

  const finalizeFinancial = async () => {
    const r = await api.post(`/bids/financial-evaluation/${tenderId}`);
    toast.success(`L1 identified: ${r.data.data.l1?.contractorName}`);
    api.get(`/bids/tender/${tenderId}`).then((rr) => setBids(rr.data.data));
    api.get(`/tenders/${tenderId}`).then((rr) => setActiveTender(rr.data.data));
  };

  if (!tenderId) {
    return (
      <div>
        <PageHeader title="Bid Evaluation" subtitle="Stage 6 · Select a tender to evaluate" stage={6} />
        <div className="card-gov overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs uppercase font-semibold">Tender ID</th>
                <th className="px-4 py-2.5 text-xs uppercase font-semibold">Title</th>
                <th className="px-4 py-2.5 text-xs uppercase font-semibold">Bids</th>
                <th className="px-4 py-2.5 text-xs uppercase font-semibold">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tenders.map((t) => (
                <tr key={t._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{t.tenderId}</td>
                  <td className="px-4 py-3">{t.title}</td>
                  <td className="px-4 py-3">{t.bids?.length || 0}</td>
                  <td className="px-4 py-3"><StatusPill status={t.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/bids/evaluate/${t._id}`} className="btn-gov text-xs"><Scale className="w-3.5 h-3.5" /> Evaluate</Link>
                  </td>
                </tr>
              ))}
              {!tenders.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No tenders to evaluate</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Bid Evaluation"
        subtitle={`Stage 6 · ${activeTender?.title || ''}`}
        stage={6}
        actions={<Link to="/bids/evaluate" className="btn-gov-outline">All Tenders</Link>}
      />

      {/* Technical evaluation */}
      <div className="card-gov mb-5">
        <div className="card-gov-header"><h3 className="font-semibold">Technical Evaluation</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs uppercase">Contractor</th>
                <th className="px-4 py-2.5 text-xs uppercase">Submitted</th>
                <th className="px-4 py-2.5 text-xs uppercase">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bids.map((b) => (
                <tr key={b._id} className="border-t">
                  <td className="px-4 py-3 font-medium">{b.contractor?.companyName || b.contractor?.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{b.submittedAt ? new Date(b.submittedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {b.status === 'TECHNICAL_SUBMITTED' || b.status === 'FINANCIAL_SUBMITTED' ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => evaluate(b._id, false)} className="btn-gov-danger text-xs"><XCircle className="w-3.5 h-3.5" /></button>
                        <button onClick={() => evaluate(b._id, true)} className="btn-gov-success text-xs"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      b.technicallyQualified ? <span className="text-xs text-govt-green font-semibold">Qualified</span>
                                             : <span className="text-xs text-erp-danger font-semibold">{b.technicallyQualified === false ? 'Disqualified' : '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
              {!bids.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400">No bids</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial evaluation */}
      <div className="card-gov">
        <div className="card-gov-header flex items-center justify-between">
          <h3 className="font-semibold">Financial Evaluation</h3>
          <button onClick={finalizeFinancial} className="btn-gov text-xs"><Award className="w-3.5 h-3.5" /> Identify L1</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs uppercase">Rank</th>
                <th className="px-4 py-2.5 text-xs uppercase">Contractor</th>
                <th className="px-4 py-2.5 text-xs uppercase">Quoted Amount</th>
                <th className="px-4 py-2.5 text-xs uppercase">vs Estimated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bids.filter((b) => b.technicallyQualified && b.quotedAmount).sort((a, b) => (a.rank || 99) - (b.rank || 99)).map((b) => {
                const diff = activeTender?.estimatedCost ? ((b.quotedAmount - activeTender.estimatedCost) / activeTender.estimatedCost) * 100 : 0;
                return (
                  <tr key={b._id} className={`border-t ${b.isL1 ? 'bg-green-50' : ''}`}>
                    <td className="px-4 py-3 font-bold">{b.rank ? `L${b.rank}` : '—'} {b.isL1 && <span className="pill-l1">L1</span>}</td>
                    <td className="px-4 py-3 font-medium">{b.contractor?.companyName || b.contractor?.name}</td>
                    <td className="px-4 py-3 font-medium">{formatINR(b.quotedAmount)}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={diff < 0 ? 'text-govt-green' : 'text-erp-danger'}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {b.isL1 && activeTender?.status === 'EVALUATION' && (
                        <Link to={`/work-orders`} state={{ tenderId, bidId: b._id }} className="btn-gov-success text-xs">
                          <Award className="w-3.5 h-3.5" /> Award
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
