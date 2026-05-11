import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR, formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  CheckCircle2, XCircle, FileText, Ruler, Receipt, IndianRupee,
  MapPin, User as UserIcon, Calendar, ExternalLink,
} from 'lucide-react';

const ENTITY_ICON: Record<string, any> = {
  PROJECT: FileText, MB: Ruler, BILL: Receipt,
};

export default function SDOApprovalQueuePage() {
  const [params, setParams] = useSearchParams();
  const filter = params.get('type') || '';
  const [items, setItems] = useState<any[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    const p: any = {};
    if (filter) p.type = filter;
    const r = await api.get('/sdo/approval-queue', { params: p });
    setItems(r.data.data);
  };
  useEffect(() => { load(); }, [filter]);

  const act = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const remarks = action === 'REJECT'
      ? prompt('Reason for rejection (visible to JE and EE):')
      : prompt('Verification remarks (optional):') || '';
    if (action === 'REJECT' && !remarks) return;
    setActing(id);
    try {
      await api.put(`/approvals/${id}/action`, { action, remarks: remarks || '' });
      toast.success(`${action === 'APPROVE' ? 'Verified & forwarded to EE' : 'Rejected'}`);
      load();
    } finally { setActing(null); }
  };

  const tabs = [
    { val: '', label: 'All' },
    { val: 'PROJECT', label: 'Projects' },
    { val: 'MB', label: 'MB Entries' },
    { val: 'BILL', label: 'Bills' },
  ];

  return (
    <div>
      <PageHeader
        title="Verification Queue"
        subtitle="JE submissions awaiting your technical verification before forwarding to EE"
        badge={`${items.length} pending`}
      />

      <div className="card-gov p-3 mb-4 bg-blue-50 border-blue-200 text-xs text-slate-700 flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-govt-navy flex-shrink-0 mt-0.5" />
        <div>
          <strong>Your role in workflow:</strong> Verify measurements against BOQ, validate site work matches submissions,
          check material usage. After your approval, items move to EE for operational approval. Use rejection only
          when remediation is needed by the JE.
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-slate-200 flex-wrap">
        {tabs.map((t) => (
          <button key={t.val}
            onClick={() => setParams(t.val ? { type: t.val } : {})}
            className={`px-4 py-2 text-sm border-b-2 transition ${
              filter === t.val ? 'border-govt-navy text-govt-navy font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {!items.length && (
          <div className="card-gov p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-govt-green mx-auto mb-3" />
            <h3 className="font-semibold">All clear</h3>
            <p className="text-xs text-slate-500 mt-1">No verifications pending at your stage</p>
          </div>
        )}
        {items.map((ap) => {
          const Icon = ENTITY_ICON[ap.entityType] || FileText;
          const e = ap.entity || {};
          const value = e.estimatedCost || e.netPayable || e.totalAmount || 0;
          const detailUrl = ap.entityType === 'PROJECT' ? `/proposals/${e._id}` :
                            ap.entityType === 'MB' ? `/mb/${e._id}` :
                            ap.entityType === 'BILL' ? `/bills/${e._id}` : '#';
          return (
            <div key={ap._id} className="card-gov p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-govt-navy/10 text-govt-navy flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">{ap.entityType}</span>
                    <span className="text-[10px] text-slate-500">SDO stage</span>
                    <Link to={detailUrl} className="text-[10px] text-govt-navy hover:underline flex items-center gap-1">
                      Open detail <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                  <h3 className="font-semibold text-slate-800">
                    {e.name || e.workItem || e.billNumber || e.mbId || ap.entityType}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-slate-600">
                    {value > 0 && <div className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> <strong>{formatINR(value, { compact: true })}</strong></div>}
                    {e.project?.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.project.location}</div>}
                    {(e.proposedBy?.name || e.recordedBy?.name) && (
                      <div className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> Submitted by {e.proposedBy?.name || e.recordedBy?.name}</div>
                    )}
                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(ap.createdAt)}</div>
                  </div>
                  {ap.entityType === 'MB' && e.entries?.length && (
                    <div className="mt-2 text-[10px] text-slate-500">
                      {e.entries.length} measurement entries · {e.location}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end flex-shrink-0">
                  <button disabled={acting === ap._id} onClick={() => act(ap._id, 'REJECT')} className="btn-gov-danger text-xs">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button disabled={acting === ap._id} onClick={() => act(ap._id, 'APPROVE')} className="btn-gov-success text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verify & Forward
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
