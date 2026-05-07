import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import ApprovalTimeline from '../../components/shared/ApprovalTimeline';
import { formatDate, formatINR } from '../../utils/format';
import { ArrowLeft, Calendar, Megaphone, Lock, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function TenderDetailPage() {
  const { id } = useParams();
  const [tender, setTender] = useState<any>(null);
  const { user } = useAuthStore();

  const load = () => api.get(`/tenders/${id}`).then((r) => setTender(r.data.data));
  useEffect(() => { load(); }, [id]);

  const openBidding = async () => { await api.put(`/tenders/${id}/open-bidding`); toast.success('Bidding opened'); load(); };
  const closeBidding = async () => { await api.put(`/tenders/${id}/close-bidding`); toast.success('Bidding closed'); load(); };

  if (!tender) return <div className="p-10 text-center text-slate-400">Loading...</div>;
  const canManage = ['TENDER_OFFICER','EE','CE','ADMIN'].includes(user?.role || '');

  return (
    <div>
      <PageHeader
        title={tender.title}
        subtitle={`Tender ID: ${tender.tenderId}`}
        stage={3}
        actions={<Link to="/tenders" className="btn-gov-outline"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-gov">
            <div className="card-gov-header flex items-center justify-between">
              <h3 className="font-semibold">Tender Details</h3>
              <StatusPill status={tender.status} />
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <D label="Estimated Cost" v={formatINR(tender.estimatedCost)} />
              <D label="EMD" v={formatINR(tender.emd)} />
              <D label="Tender Fee" v={formatINR(tender.tenderFee)} />
              <D label="Submission Start" v={formatDate(tender.bidSubmissionStartDate)} />
              <D label="Submission End" v={formatDate(tender.bidSubmissionEndDate)} />
              <D label="Opening Date" v={formatDate(tender.bidOpeningDate)} />
              <D label="Project" v={tender.project?.name || '—'} />
              <D label="Bids Received" v={tender.bids?.length || 0} />
              <D label="Awarded To" v={tender.awardedTo?.companyName || tender.awardedTo?.name || '—'} />
            </div>
          </div>

          {tender.boq?.length > 0 && (
            <div className="card-gov">
              <div className="card-gov-header"><h3 className="font-semibold">BOQ</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-3 py-2 text-xs">#</th>
                      <th className="px-3 py-2 text-xs">Description</th>
                      <th className="px-3 py-2 text-xs">Unit</th>
                      <th className="px-3 py-2 text-xs">Qty</th>
                      <th className="px-3 py-2 text-xs">Rate</th>
                      <th className="px-3 py-2 text-xs">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tender.boq.map((b: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2">{b.description}</td>
                        <td className="px-3 py-2">{b.unit}</td>
                        <td className="px-3 py-2">{b.quantity}</td>
                        <td className="px-3 py-2">{formatINR(b.rate)}</td>
                        <td className="px-3 py-2 font-medium">{formatINR(b.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card-gov">
            <div className="card-gov-header"><h3 className="font-semibold">Bids Received ({tender.bids?.length || 0})</h3></div>
            <div className="p-5 space-y-2">
              {tender.bids?.length ? tender.bids.map((b: any) => (
                <div key={b._id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{b.contractor?.companyName || b.contractor?.name || '—'}</div>
                    <div className="text-xs text-slate-500">Bid: {formatINR(b.quotedAmount)} {b.isL1 && <span className="pill-l1 ml-2">L1</span>}</div>
                  </div>
                  <StatusPill status={b.status} />
                </div>
              )) : <p className="text-sm text-slate-400">No bids yet</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-gov">
            <div className="card-gov-header"><h3 className="font-semibold">Approval Workflow</h3></div>
            <div className="p-5"><ApprovalTimeline approvals={tender.approvals || []} /></div>
          </div>

          {canManage && (
            <div className="card-gov p-5 space-y-2">
              <h3 className="font-semibold mb-2">Tender Actions</h3>
              {tender.status === 'PUBLISHED' && (
                <button onClick={openBidding} className="btn-gov w-full"><Megaphone className="w-4 h-4" /> Open Bidding</button>
              )}
              {tender.status === 'BIDDING_OPEN' && (
                <button onClick={closeBidding} className="btn-gov-danger w-full"><Lock className="w-4 h-4" /> Close Bidding</button>
              )}
              {(tender.status === 'BIDDING_CLOSED' || tender.status === 'EVALUATION') && (
                <Link to={`/bids/evaluate/${tender._id}`} className="btn-gov w-full">
                  <Award className="w-4 h-4" /> Evaluate Bids
                </Link>
              )}
              {tender.status === 'AWARDED' && (
                <Link to={`/work-orders`} className="btn-gov-success w-full">
                  <Award className="w-4 h-4" /> View Work Order
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const D = ({ label, v }: any) => (
  <div>
    <div className="text-xs text-slate-500 uppercase">{label}</div>
    <div className="font-medium mt-0.5">{v ?? '—'}</div>
  </div>
);
