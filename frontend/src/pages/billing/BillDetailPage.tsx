import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import ApprovalTimeline from '../../components/shared/ApprovalTimeline';
import { formatDate, formatINR } from '../../utils/format';
import { ArrowLeft } from 'lucide-react';

export default function BillDetailPage() {
  const { id } = useParams();
  const [bill, setBill] = useState<any>(null);
  useEffect(() => { api.get(`/bills/${id}`).then((r) => setBill(r.data.data)); }, [id]);
  if (!bill) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title={bill.billNumber}
        subtitle={`Stage 10 · Bill ID: ${bill.billId}`}
        stage={10}
        actions={<Link to="/bills" className="btn-gov-outline"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-gov">
            <div className="card-gov-header flex items-center justify-between">
              <h3 className="font-semibold">Bill Summary</h3>
              <StatusPill status={bill.status} />
            </div>
            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              <D label="Project" v={bill.project?.name} />
              <D label="Contractor" v={bill.contractor?.companyName || bill.contractor?.name} />
              <D label="Bill Type" v={bill.billType?.replace('_', ' ')} />
              <D label="Submitted" v={formatDate(bill.submittedAt || bill.createdAt)} />
              <D label="Based on MB up to" v={formatDate(bill.createdAt)} />
              <D label="Bill Amount" v={formatINR(bill.currentBillAmount)} />
            </div>
          </div>

          <div className="card-gov">
            <div className="card-gov-header"><h3 className="font-semibold">Calculation</h3></div>
            <div className="p-5 space-y-2 text-sm">
              <Row label="Gross Amount (from MBs)" value={formatINR(bill.grossAmount)} />
              <Row label="Previous Bills Total" value={`- ${formatINR(bill.previousBillsTotal)}`} className="text-slate-500" />
              <hr />
              <Row label="Current Bill Amount" value={formatINR(bill.currentBillAmount)} bold />
              <hr />
              <Row label={`GST (${bill.gstPercent}%)`} value={`- ${formatINR(bill.gstAmount)}`} className="text-erp-danger" />
              <Row label={`TDS (${bill.tdsPercent}%)`} value={`- ${formatINR(bill.tdsAmount)}`} className="text-erp-danger" />
              <Row label={`Security (${bill.securityPercent}%)`} value={`- ${formatINR(bill.securityAmount)}`} className="text-erp-danger" />
              {bill.retentionAmount > 0 && (
                <Row label={`Retention (${bill.retentionPercent}%)`} value={`- ${formatINR(bill.retentionAmount)}`} className="text-erp-danger" />
              )}
              <hr />
              <Row label="Total Deductions" value={`- ${formatINR(bill.totalDeductions)}`} bold className="text-erp-danger" />
              <hr className="border-2" />
              <div className="flex items-center justify-between bg-green-50 -mx-5 px-5 py-4">
                <span className="font-bold">Net Payable:</span>
                <span className="text-2xl font-bold text-govt-green">{formatINR(bill.netPayable)}</span>
              </div>
            </div>
          </div>

          {bill.payment && (
            <div className="card-gov p-5 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-2">Payment Released</h3>
              <div className="text-sm text-slate-600">UTR: <span className="font-mono">{bill.payment?.utrNumber}</span></div>
              <div className="text-sm text-slate-600">Amount: <span className="font-medium">{formatINR(bill.payment?.amount)}</span></div>
              <Link to="/payments" className="text-sm text-govt-navy hover:underline mt-2 inline-block">View payment receipt →</Link>
            </div>
          )}
        </div>

        <div className="card-gov">
          <div className="card-gov-header"><h3 className="font-semibold">Approval Workflow</h3></div>
          <div className="p-5"><ApprovalTimeline approvals={bill.approvals || []} /></div>
        </div>
      </div>
    </div>
  );
}

const D = ({ label, v }: any) => <div><div className="text-xs text-slate-500 uppercase">{label}</div><div className="font-medium mt-0.5">{v ?? '—'}</div></div>;
const Row = ({ label, value, bold, className = '' }: any) => (
  <div className={`flex items-center justify-between ${className} ${bold ? 'font-semibold' : ''}`}>
    <span className="text-slate-600">{label}</span><span>{value}</span>
  </div>
);
