import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR, formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  Ruler, CheckCircle2, XCircle, MapPin, User as UserIcon, Calendar, ChevronRight,
} from 'lucide-react';

export default function MBVerificationPage() {
  const [items, setItems] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [acting, setActing] = useState(false);

  const load = () => {
    api.get('/mb', { params: { status: 'SUBMITTED' } }).then((r) => setItems(r.data.data));
  };
  useEffect(() => { load(); }, []);

  const verify = async (action: 'APPROVE' | 'REJECT') => {
    const remarks = action === 'REJECT'
      ? prompt('Reason for rejection (visible to JE):')
      : prompt('Verification remarks (optional):') || '';
    if (action === 'REJECT' && !remarks) return;
    setActing(true);
    try {
      // Find SDO approval for this MB
      const approvals = active.approvals || [];
      const sdoApproval = approvals.find((a: any) => a.stage === 'SDO' && a.status === 'PENDING');
      if (!sdoApproval) {
        toast.error('No SDO-stage approval found for this MB');
        return;
      }
      await api.put(`/approvals/${sdoApproval._id}/action`, { action, remarks: remarks || '' });
      toast.success(`${action === 'APPROVE' ? 'Verified & forwarded to EE' : 'Rejected'}`);
      setActive(null);
      load();
    } finally { setActing(false); }
  };

  const openDetail = async (mb: any) => {
    const r = await api.get(`/mb/${mb._id}`);
    setActive(r.data.data);
  };

  return (
    <div>
      <PageHeader
        title="MB Verification"
        subtitle="Validate JE measurements (L × W × H), check against BOQ, verify site work, approve quantities"
        badge={`${items.length} pending`}
      />

      <div className="card-gov p-3 mb-4 bg-amber-50 border-amber-200 text-xs text-slate-700 flex items-start gap-2">
        <Ruler className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Verification checklist:</strong> Dimensions match BOQ · Quantities are reasonable for the work item ·
          Site work matches recorded values · Rate × Quantity calculation is correct · Photos support claims.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((mb) => (
          <button key={mb._id} onClick={() => openDetail(mb)} className="card-gov p-4 text-left hover:shadow-gov-lg transition">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Ruler className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{mb.workItem}</div>
                <div className="text-[10px] text-slate-500 font-mono">{mb.mbId}</div>
              </div>
              <span className="pill pill-pending text-[10px]">SUBMITTED</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1 mb-3">
              <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {mb.project?.name}</div>
              {mb.location && <div className="text-[10px] text-slate-500">📍 {mb.location}</div>}
              <div className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {mb.recordedBy?.name}</div>
              <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(mb.entryDate)}</div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-[10px] text-slate-500">{mb.entries?.length || 0} entries</div>
              <div className="text-base font-bold tabular-nums text-govt-navy">{formatINR(mb.totalAmount, { compact: true })}</div>
            </div>
            <div className="text-[10px] text-govt-navy mt-2 flex items-center gap-1">
              Review & verify <ChevronRight className="w-3 h-3" />
            </div>
          </button>
        ))}
        {!items.length && (
          <div className="col-span-full card-gov p-12 text-center text-slate-400">
            <Ruler className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No MB entries pending verification</p>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {active && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3 border-b bg-govt-navy text-white sticky top-0 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{active.workItem}</h3>
                <p className="text-[11px] opacity-80">{active.mbId} · {active.project?.name}</p>
              </div>
              <button onClick={() => setActive(null)} className="text-white"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Project" v={active.project?.name} />
                <Info label="Location" v={active.location} />
                <Info label="Recorded By" v={active.recordedBy?.name} />
                <Info label="Entry Date" v={formatDate(active.entryDate)} />
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-semibold mb-2">Measurement Entries</div>
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-2 py-1.5 text-left text-[10px] uppercase">Description</th>
                        <th className="px-2 py-1.5 text-right text-[10px] uppercase">L</th>
                        <th className="px-2 py-1.5 text-right text-[10px] uppercase">W</th>
                        <th className="px-2 py-1.5 text-right text-[10px] uppercase">H</th>
                        <th className="px-2 py-1.5 text-right text-[10px] uppercase">Qty</th>
                        <th className="px-2 py-1.5 text-left text-[10px] uppercase">Unit</th>
                        <th className="px-2 py-1.5 text-right text-[10px] uppercase">Rate</th>
                        <th className="px-2 py-1.5 text-right text-[10px] uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {active.entries?.map((e: any, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-1.5">{e.description}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{e.length || '—'}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{e.width || '—'}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{e.height || '—'}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums font-medium">{e.quantity}</td>
                          <td className="px-2 py-1.5">{e.unit}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{formatINR(e.rate)}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums font-medium">{formatINR(e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t-2">
                        <td colSpan={7} className="px-2 py-2 text-right">Total:</td>
                        <td className="px-2 py-2 text-right text-govt-navy">{formatINR(active.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              {active.remarks && (
                <div className="bg-slate-50 p-3 rounded text-xs text-slate-700">
                  <strong>JE Remarks:</strong> {active.remarks}
                </div>
              )}
              <Link to={`/mb/${active._id}`} className="text-xs text-govt-navy hover:underline">
                Open full MB record →
              </Link>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2 sticky bottom-0 bg-white">
              <button onClick={() => setActive(null)} className="btn-gov-outline">Close</button>
              <button disabled={acting} onClick={() => verify('REJECT')} className="btn-gov-danger">
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button disabled={acting} onClick={() => verify('APPROVE')} className="btn-gov-success">
                <CheckCircle2 className="w-4 h-4" /> Verify & Forward to EE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, v }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase text-slate-500">{label}</div>
      <div className="font-medium">{v ?? '—'}</div>
    </div>
  );
}
