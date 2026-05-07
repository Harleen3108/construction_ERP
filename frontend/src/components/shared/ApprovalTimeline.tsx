import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Approval } from '../../types';
import { formatDate, roleLabel } from '../../utils/format';

export default function ApprovalTimeline({ approvals }: { approvals: Approval[] }) {
  if (!approvals?.length) return <p className="text-sm text-slate-400">No approvals configured.</p>;
  const ordered = [...approvals].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3">
      {ordered.map((ap) => {
        const isApproved = ap.status === 'APPROVED';
        const isRejected = ap.status === 'REJECTED';
        const isPending = ap.status === 'PENDING';
        const Icon = isApproved ? CheckCircle2 : isRejected ? XCircle : Clock;
        const iconColor = isApproved ? 'text-govt-green' : isRejected ? 'text-erp-danger' : 'text-amber-500';
        return (
          <div key={ap._id} className="flex items-start gap-3">
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 border-l-2 border-slate-100 pl-3 -mt-0.5 pb-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">
                  {roleLabel(ap.stage)}
                  {ap.approverName && (
                    <span className="text-slate-500 font-normal"> · {ap.approverName}</span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold ${
                  isApproved ? 'text-govt-green' : isRejected ? 'text-erp-danger' : 'text-amber-600'
                }`}>
                  {ap.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {ap.approvedAt && `Approved on ${formatDate(ap.approvedAt)}`}
                {ap.rejectedAt && `Rejected on ${formatDate(ap.rejectedAt)}`}
                {isPending && 'Awaiting approval'}
              </div>
              {ap.remarks && (
                <p className="text-xs text-slate-600 italic mt-1">"{ap.remarks}"</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
