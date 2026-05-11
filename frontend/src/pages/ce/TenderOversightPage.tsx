import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR, formatDate } from '../../utils/format';
import { ClipboardList, Award, Users, TrendingDown, Calendar } from 'lucide-react';

export default function TenderOversightPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params: any = {};
    if (status) params.status = status;
    api.get('/ce/tenders', { params }).then((r) => setItems(r.data.data));
  }, [status]);

  const stats = {
    underApproval: items.filter((t) => t.status === 'UNDER_APPROVAL').length,
    published: items.filter((t) => t.status === 'PUBLISHED' || t.status === 'BIDDING_OPEN').length,
    evaluation: items.filter((t) => t.status === 'EVALUATION').length,
    awarded: items.filter((t) => t.status === 'AWARDED').length,
  };

  return (
    <div>
      <PageHeader
        title="Tender Oversight"
        subtitle="Review tenders before publication and monitor bid evaluation transparency"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Under Approval" value={stats.underApproval} color="text-amber-600" />
        <Stat label="Published / Bidding" value={stats.published} color="text-blue-600" />
        <Stat label="Evaluation" value={stats.evaluation} color="text-purple-600" />
        <Stat label="Awarded" value={stats.awarded} color="text-govt-green" />
      </div>

      <div className="flex gap-1 mb-3 flex-wrap">
        {[
          { val: '', label: 'All' },
          { val: 'UNDER_APPROVAL', label: 'Under Approval' },
          { val: 'PUBLISHED', label: 'Published' },
          { val: 'BIDDING_OPEN', label: 'Bidding Open' },
          { val: 'EVALUATION', label: 'Evaluation' },
          { val: 'AWARDED', label: 'Awarded' },
        ].map((b) => (
          <button key={b.label} onClick={() => setStatus(b.val)}
            className={`px-3 py-1.5 text-xs rounded border ${status === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((t) => (
          <div key={t._id} className="card-gov p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-govt-navy/10 text-govt-navy flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/tenders/${t._id}`} className="font-semibold text-slate-800 hover:underline">{t.title}</Link>
                  <span className="text-[10px] font-mono text-slate-500">{t.tenderId}</span>
                  <StatusPill status={t.status} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-slate-600">
                  <div><span className="text-slate-400">Est. Cost:</span> <strong>{formatINR(t.estimatedCost, { compact: true })}</strong></div>
                  <div><span className="text-slate-400">EMD:</span> {formatINR(t.emd, { compact: true })}</div>
                  <div><span className="text-slate-400">Bids:</span> <strong>{t.bidSummary?.totalBids || 0}</strong></div>
                  {t.bidSubmissionEndDate && (
                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Closes {formatDate(t.bidSubmissionEndDate)}</div>
                  )}
                </div>

                {/* Bid evaluation summary */}
                {t.bidSummary?.l1 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-green-50 rounded p-2.5 border border-green-200">
                      <div className="flex items-center gap-1 text-[10px] text-green-700 font-semibold mb-1">
                        <Award className="w-3 h-3" /> L1 BIDDER
                      </div>
                      <div className="font-medium">{t.bidSummary.l1.name}</div>
                      <div className="text-govt-green font-bold tabular-nums">{formatINR(t.bidSummary.l1.amount, { compact: true })}</div>
                    </div>
                    {t.bidSummary.l2 && (
                      <div className="bg-slate-50 rounded p-2.5 border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-semibold mb-1">L2 BIDDER</div>
                        <div className="font-medium">{t.bidSummary.l2.name}</div>
                        <div className="text-slate-700 font-bold tabular-nums">{formatINR(t.bidSummary.l2.amount, { compact: true })}</div>
                      </div>
                    )}
                    {t.bidSummary.savingsVsEstimate != null && (
                      <div className={`rounded p-2.5 border ${t.bidSummary.savingsVsEstimate > 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="text-[10px] text-slate-500 font-semibold mb-1 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" /> SAVINGS VS ESTIMATE
                        </div>
                        <div className={`font-bold tabular-nums ${t.bidSummary.savingsVsEstimate > 0 ? 'text-blue-700' : 'text-erp-danger'}`}>
                          {t.bidSummary.savingsVsEstimate > 0 ? '+' : ''}{t.bidSummary.savingsVsEstimate}%
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {t.awardedTo && (
                  <div className="mt-2 text-xs text-slate-600">
                    <Users className="w-3 h-3 inline mr-1" /> Awarded to <strong>{t.awardedTo.companyName || t.awardedTo.name}</strong> for {formatINR(t.awardedAmount, { compact: true })} on {formatDate(t.awardedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="card-gov p-12 text-center text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
            No tenders match the filter
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
