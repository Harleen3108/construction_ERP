import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate, formatINR, humanStatus } from '../../utils/format';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, FileText, Receipt, Ruler } from 'lucide-react';

const ENTITY_ICON: any = { PROJECT: FileText, TENDER: FileText, MB: Ruler, BILL: Receipt };

export default function ApprovalsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/approvals/pending');
      setItems(r.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'APPROVE' | 'REJECT', remarks?: string) => {
    setActing(id);
    try {
      await api.put(`/approvals/${id}/action`, { action, remarks: remarks || '' });
      toast.success(`${humanStatus(action)}d successfully`);
      load();
    } finally { setActing(null); }
  };

  return (
    <div>
      <PageHeader
        title="Sanction & Approvals"
        subtitle="Stage 2 · Multi-level approvals routed by hierarchy (JE → SDO → EE → CE)"
        stage={2}
        badge={`${items.length} Pending`}
      />

      {loading ? (
        <div className="text-center text-slate-400 py-10">Loading approvals...</div>
      ) : !items.length ? (
        <div className="card-gov p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-govt-green mx-auto mb-3" />
          <h3 className="text-lg font-semibold">No pending approvals</h3>
          <p className="text-sm text-slate-500 mt-1">All clear — nothing requires your attention right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((ap) => {
            const Icon = ENTITY_ICON[ap.entityType] || FileText;
            const e = ap.entity || {};
            return (
              <div key={ap._id} className="card-gov p-5 flex flex-col md:flex-row gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-govt-navy/10 text-govt-navy flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {ap.entityType}
                      </span>
                      <span className="text-xs text-slate-500">Stage {ap.stage} · Order {ap.order}</span>
                    </div>
                    <div className="font-semibold text-slate-800 mt-1">
                      {e.name || e.title || e.billNumber || e.mbId || ap.entityType}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {e.location && <span>📍 {e.location} · </span>}
                      {e.estimatedCost && <span>{formatINR(e.estimatedCost, { compact: true })} · </span>}
                      {e.netPayable && <span>Net: {formatINR(e.netPayable, { compact: true })} · </span>}
                      {e.totalAmount && <span>Total: {formatINR(e.totalAmount, { compact: true })} · </span>}
                      Submitted {formatDate(ap.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={acting === ap._id}
                    onClick={() => {
                      const r = prompt('Reject reason (optional):');
                      act(ap._id, 'REJECT', r || '');
                    }}
                    className="btn-gov-danger"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button
                    disabled={acting === ap._id}
                    onClick={() => act(ap._id, 'APPROVE')}
                    className="btn-gov-success"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
