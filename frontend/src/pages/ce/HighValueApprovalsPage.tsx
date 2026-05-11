import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR, formatDate, humanStatus } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  CheckCircle2, XCircle, FileText, ClipboardList, Receipt, Ruler,
  AlertTriangle, IndianRupee, Calendar, User as UserIcon,
} from 'lucide-react';

const ENTITY_ICON: Record<string, any> = {
  PROJECT: FileText, TENDER: ClipboardList, MB: Ruler, BILL: Receipt,
};

export default function HighValueApprovalsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [threshold, setThreshold] = useState(50000000); // ₹5 Cr
  const [highValueCount, setHighValueCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'highValue'>('all');
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    const r = await api.get('/ce/high-value-approvals', { params: { threshold } });
    setItems(r.data.data);
    setHighValueCount(r.data.highValueCount);
  };

  useEffect(() => { load(); }, [threshold]);

  const act = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const remarks = action === 'REJECT' ? prompt('Reason for rejection:') : '';
    if (action === 'REJECT' && !remarks) return;
    setActing(id);
    try {
      await api.put(`/approvals/${id}/action`, { action, remarks: remarks || '' });
      toast.success(`${action === 'APPROVE' ? 'Approved' : 'Rejected'}`);
      load();
    } finally { setActing(null); }
  };

  const filtered = filter === 'highValue' ? items.filter((i) => i.isHighValue) : items;

  return (
    <div>
      <PageHeader
        title="High-Value Approvals"
        subtitle="Critical approvals at the Chief Engineer stage — projects, tenders, MBs, bills above threshold"
        badge={`${highValueCount} high-value · ${items.length} total`}
      />

      <div className="card-gov p-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">High-value threshold:</span>
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="input-gov w-32"
          >
            <option value={10000000}>₹1 Cr</option>
            <option value={25000000}>₹2.5 Cr</option>
            <option value={50000000}>₹5 Cr</option>
            <option value={100000000}>₹10 Cr</option>
            <option value={250000000}>₹25 Cr</option>
          </select>
        </div>
        <div className="flex gap-1">
          {[
            { val: 'all', label: `All (${items.length})` },
            { val: 'highValue', label: `High-value only (${highValueCount})` },
          ].map((b: any) => (
            <button key={b.val}
              onClick={() => setFilter(b.val)}
              className={`px-3 py-1.5 text-xs rounded border ${filter === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card-gov p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-govt-green mx-auto mb-3" />
            <h3 className="font-semibold">All clear</h3>
            <p className="text-xs text-slate-500 mt-1">No CE-level approvals pending right now</p>
          </div>
        )}
        {filtered.map((ap) => {
          const Icon = ENTITY_ICON[ap.entityType] || FileText;
          const e = ap.entity || {};
          return (
            <div key={ap._id} className={`card-gov p-5 ${ap.isHighValue ? 'border-l-4 border-l-amber-500' : ''}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${ap.isHighValue ? 'bg-amber-100 text-amber-700' : 'bg-govt-navy/10 text-govt-navy'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {ap.isHighValue && (
                      <span className="pill bg-amber-100 text-amber-800 text-[10px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> HIGH VALUE
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">{ap.entityType}</span>
                    <span className="text-[10px] text-slate-500">Order {ap.order} · CE Stage</span>
                  </div>
                  <h3 className="font-semibold text-slate-800">
                    {e.name || e.title || e.billNumber || e.mbId || ap.entityType}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-3 h-3" />
                      <strong className={ap.isHighValue ? 'text-amber-700' : ''}>{formatINR(ap.value, { compact: true })}</strong>
                    </div>
                    {e.location && <div className="flex items-center gap-1.5">📍 {e.location}</div>}
                    {(e.contractor?.companyName || e.contractor?.name) && (
                      <div className="flex items-center gap-1.5"><UserIcon className="w-3 h-3" /> {e.contractor.companyName || e.contractor.name}</div>
                    )}
                    <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {formatDate(ap.createdAt)}</div>
                  </div>
                  {e.status && (
                    <div className="text-[10px] text-slate-500 mt-1">
                      Current status: <strong>{humanStatus(e.status)}</strong>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end flex-shrink-0">
                  <button disabled={acting === ap._id} onClick={() => act(ap._id, 'REJECT')} className="btn-gov-danger text-xs">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button disabled={acting === ap._id} onClick={() => act(ap._id, 'APPROVE')} className="btn-gov-success text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
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
