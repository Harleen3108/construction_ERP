import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR, formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  Receipt, CheckCircle2, XCircle, Calendar, User as UserIcon,
  MapPin, AlertTriangle, ExternalLink, FileText,
} from 'lucide-react';

export default function BillVerificationQueuePage() {
  const [items, setItems] = useState<any[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  const load = () => {
    api.get('/acc/bill-queue').then((r) => setItems(r.data.data));
  };
  useEffect(() => { load(); }, []);

  const act = async (bill: any, action: 'APPROVE' | 'REJECT') => {
    const remarks = action === 'REJECT'
      ? prompt('Reason for rejection (visible to contractor and EE):')
      : prompt('Verification remarks (optional):') || '';
    if (action === 'REJECT' && !remarks) return;

    // Find ACCOUNTANT-stage approval
    const billDetail = await api.get(`/bills/${bill._id}`);
    const approvals = billDetail.data.data.approvals || [];
    const accApproval = approvals.find((a: any) => a.stage === 'ACCOUNTANT' && a.status === 'PENDING');
    if (!accApproval) {
      toast.error('No ACCOUNTANT-stage approval found for this bill');
      return;
    }
    setActing(bill._id);
    try {
      await api.put(`/approvals/${accApproval._id}/action`, { action, remarks: remarks || '' });
      toast.success(action === 'APPROVE' ? 'Verified & forwarded to Treasury' : 'Rejected');
      load();
    } finally { setActing(null); }
  };

  return (
    <div>
      <PageHeader
        title="Bill Verification Queue"
        subtitle="Bills approved by EE awaiting your deduction verification before treasury release"
        badge={`${items.length} pending`}
      />

      <div className="card-gov p-3 mb-4 bg-blue-50 border-blue-200 text-xs text-slate-700 flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-govt-navy flex-shrink-0 mt-0.5" />
        <div>
          <strong>Verification checklist:</strong> GST, TDS, Security, Retention deductions are correctly calculated ·
          MB-based gross amount matches BOQ rates · Previous bills are accounted for ·
          Net payable is accurate. Approve to forward to Treasury for payment release.
        </div>
      </div>

      <div className="space-y-3">
        {items.map((bill) => (
          <div key={bill._id} className="card-gov p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-govt-navy/10 text-govt-navy flex items-center justify-center flex-shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link to={`/bills/${bill._id}`} className="font-semibold text-slate-800 hover:underline">{bill.billNumber}</Link>
                  <span className="text-[10px] font-mono text-slate-500">{bill.billId}</span>
                  <StatusPill status={bill.status} />
                  {bill.daysSinceSubmit > 7 && (
                    <span className="pill pill-rejected text-[10px]">
                      <AlertTriangle className="w-3 h-3 inline" /> {bill.daysSinceSubmit}d old
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 mt-1">
                  {bill.project?.name && <div><FileText className="w-3 h-3 inline" /> {bill.project.name}</div>}
                  {bill.project?.location && <div><MapPin className="w-3 h-3 inline" /> {bill.project.location}</div>}
                  {bill.contractor && <div><UserIcon className="w-3 h-3 inline" /> {bill.contractor.companyName || bill.contractor.name}</div>}
                  <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Submitted {formatDate(bill.submittedAt)}</div>
                </div>

                {bill.contractor?.gstNumber && (
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    GST: {bill.contractor.gstNumber} · PAN: {bill.contractor.panNumber}
                  </div>
                )}

                {/* Financial breakdown */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-6 gap-2 text-[11px]">
                  <Stat label="Gross Bill" value={formatINR(bill.currentBillAmount, { compact: true })} bold />
                  <Stat label={`GST ${bill.gstPercent}%`} value={`-${formatINR(bill.gstAmount, { compact: true })}`} color="text-erp-danger" />
                  <Stat label={`TDS ${bill.tdsPercent}%`} value={`-${formatINR(bill.tdsAmount, { compact: true })}`} color="text-erp-danger" />
                  <Stat label={`Security ${bill.securityPercent}%`} value={`-${formatINR(bill.securityAmount, { compact: true })}`} color="text-erp-danger" />
                  <Stat label="Total Deductions" value={`-${formatINR(bill.totalDeductions, { compact: true })}`} color="text-erp-danger" bold />
                  <Stat label="Net Payable" value={formatINR(bill.netPayable, { compact: true })} color="text-govt-green" bold />
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end flex-shrink-0">
                <Link to={`/bills/${bill._id}`} className="text-[10px] text-govt-navy hover:underline flex items-center gap-1">
                  Open full detail <ExternalLink className="w-3 h-3" />
                </Link>
                <button disabled={acting === bill._id} onClick={() => act(bill, 'REJECT')} className="btn-gov-danger text-xs">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button disabled={acting === bill._id} onClick={() => act(bill, 'APPROVE')} className="btn-gov-success text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verify & Forward
                </button>
              </div>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="card-gov p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-govt-green mx-auto mb-3" />
            <h3 className="font-semibold">All clear</h3>
            <p className="text-xs text-slate-500 mt-1">No bills pending verification at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'text-slate-800', bold }: any) {
  return (
    <div className="bg-slate-50 rounded p-1.5">
      <div className="text-[9px] uppercase text-slate-500">{label}</div>
      <div className={`tabular-nums ${color} ${bold ? 'font-bold' : ''}`}>{value}</div>
    </div>
  );
}
