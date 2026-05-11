import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR, formatDateTime } from '../../utils/format';
import {
  CheckCircle2, XCircle, RotateCcw, FileText, ClipboardList, Receipt, Ruler, Search,
} from 'lucide-react';

const ENTITY_ICON: Record<string, any> = {
  PROJECT: FileText, TENDER: ClipboardList, BILL: Receipt, MB: Ruler,
};

export default function ApprovalHistoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/ce/approval-history').then((r) => {
      setItems(r.data.data);
      setSummary(r.data.summary);
    });
  }, []);

  const filtered = items.filter((i) => {
    if (filter && i.status !== filter) return false;
    if (search) {
      const t = search.toLowerCase();
      const name = i.entity?.name || i.entity?.title || i.entity?.billNumber || i.entity?.mbId || '';
      return name.toLowerCase().includes(t);
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="My Approval History"
        subtitle="Audit trail of every approval, rejection, and return-for-revision you've actioned"
        badge={`${summary.total || 0} actions`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Total Actions" value={summary.total || 0} />
        <Stat label="Approved" value={summary.approved || 0} icon={CheckCircle2} color="text-govt-green" />
        <Stat label="Rejected" value={summary.rejected || 0} icon={XCircle} color="text-erp-danger" />
        <Stat label="Returned" value={summary.returned || 0} icon={RotateCcw} color="text-amber-600" />
      </div>

      <div className="card-gov p-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search by entity name..." className="input-gov pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {[
            { val: '', label: 'All' },
            { val: 'APPROVED', label: 'Approved' },
            { val: 'REJECTED', label: 'Rejected' },
            { val: 'RETURNED', label: 'Returned' },
          ].map((b) => (
            <button key={b.val} onClick={() => setFilter(b.val)}
              className={`px-3 py-1.5 text-xs rounded border ${filter === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-[10px] uppercase font-semibold">When</th>
              <th className="px-4 py-2.5 text-[10px] uppercase font-semibold">Entity</th>
              <th className="px-4 py-2.5 text-[10px] uppercase font-semibold">Name</th>
              <th className="px-4 py-2.5 text-[10px] uppercase font-semibold text-right">Value</th>
              <th className="px-4 py-2.5 text-[10px] uppercase font-semibold">Action</th>
              <th className="px-4 py-2.5 text-[10px] uppercase font-semibold">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => {
              const Icon = ENTITY_ICON[h.entityType] || FileText;
              const name = h.entity?.name || h.entity?.title || h.entity?.billNumber || h.entity?.mbId || '—';
              const value = h.entity?.estimatedCost || h.entity?.netPayable || h.entity?.totalAmount || 0;
              return (
                <tr key={h._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{formatDateTime(h.approvedAt || h.rejectedAt || h.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Icon className="w-3 h-3 text-slate-400" />
                      <span className="font-mono">{h.entityType}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px]">{name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{value ? formatINR(value, { compact: true }) : '—'}</td>
                  <td className="px-4 py-3">
                    {h.status === 'APPROVED' && <span className="pill pill-approved text-[10px]"><CheckCircle2 className="w-3 h-3 inline" /> Approved</span>}
                    {h.status === 'REJECTED' && <span className="pill pill-rejected text-[10px]"><XCircle className="w-3 h-3 inline" /> Rejected</span>}
                    {h.status === 'RETURNED' && <span className="pill pill-pending text-[10px]"><RotateCcw className="w-3 h-3 inline" /> Returned</span>}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-600 italic max-w-xs truncate">{h.remarks || '—'}</td>
                </tr>
              );
            })}
            {!filtered.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No approval history</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, color = 'text-slate-800' }: any) {
  return (
    <div className="card-gov p-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-slate-500 uppercase">{label}</div>
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
      </div>
      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
