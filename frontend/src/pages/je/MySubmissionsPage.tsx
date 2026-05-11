import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR, formatDate } from '../../utils/format';
import {
  FileText, Ruler, Calendar, Package, CheckCircle2, Clock4, XCircle,
  ChevronRight, ArrowRight,
} from 'lucide-react';

const KIND_INFO: Record<string, { label: string; icon: any; color: string }> = {
  PROPOSAL: { label: 'Proposals', icon: FileText, color: 'bg-blue-50 text-blue-700' },
  MB:       { label: 'MB Entries', icon: Ruler, color: 'bg-amber-50 text-amber-700' },
  DAILY:    { label: 'Daily Reports', icon: Calendar, color: 'bg-green-50 text-govt-green' },
  MATERIAL: { label: 'Material Requests', icon: Package, color: 'bg-purple-50 text-purple-700' },
};

export default function MySubmissionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [filter, setFilter] = useState('');

  const load = () => {
    const params: any = {};
    if (filter) params.type = filter;
    api.get('/je/my-submissions', { params }).then((r) => {
      setItems(r.data.data);
      setSummary(r.data.summary);
    });
  };
  useEffect(() => { load(); }, [filter]);

  return (
    <div>
      <PageHeader
        title="My Submissions"
        subtitle="Every proposal, MB entry, daily report, and material request you've submitted — with live approval status"
        badge={`${summary.total || 0} items`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Total" value={summary.total || 0} />
        <Stat label="Pending" value={summary.pending || 0} icon={Clock4} color="text-amber-600" />
        <Stat label="Approved" value={summary.approved || 0} icon={CheckCircle2} color="text-govt-green" />
        <Stat label="Rejected" value={summary.rejected || 0} icon={XCircle} color="text-erp-danger" />
      </div>

      <div className="flex gap-1 mb-3 flex-wrap">
        {[
          { val: '', label: 'All' },
          { val: 'PROPOSAL', label: 'Proposals' },
          { val: 'MB', label: 'MB Entries' },
          { val: 'DAILY', label: 'Daily Reports' },
          { val: 'MATERIAL', label: 'Material Requests' },
        ].map((b) => (
          <button key={b.val} onClick={() => setFilter(b.val)}
            className={`px-3 py-1.5 text-xs rounded border ${filter === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {items.map((s) => {
          const info = KIND_INFO[s.kind] || KIND_INFO.PROPOSAL;
          const Icon = info.icon;
          // Compute progress through approval chain
          const approvals = s.approvals || [];
          const total = approvals.length || (s.kind === 'DAILY' ? 1 : 0);
          const done = approvals.filter((a: any) => a.status === 'APPROVED').length;
          return (
            <Link key={`${s.kind}-${s._id}`} to={s.link} className="block card-gov p-4 hover:shadow-gov-lg transition">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${info.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-mono text-slate-500">{info.label}</span>
                    {s.projectId && <span className="text-[10px] text-slate-400">{s.projectId}</span>}
                    <StatusPill status={s.status} />
                  </div>
                  <div className="font-medium text-slate-800">{s.name || s._id}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {s.projectName && <span>{s.projectName} · </span>}
                    {s.amount > 0 && <span>{formatINR(s.amount, { compact: true })} · </span>}
                    Submitted {formatDate(s.createdAt)}
                  </div>

                  {/* Approval progress bar */}
                  {approvals.length > 0 && (
                    <div className="mt-2 flex items-center gap-1">
                      {approvals.map((a: any, i: number) => (
                        <div key={i} className="flex items-center gap-1 flex-1">
                          <div className={`flex-1 h-1 rounded-full ${
                            a.status === 'APPROVED' ? 'bg-govt-green' :
                            a.status === 'REJECTED' ? 'bg-erp-danger' :
                            'bg-slate-200'
                          }`} />
                          <span className={`text-[9px] font-semibold ${
                            a.status === 'APPROVED' ? 'text-govt-green' :
                            a.status === 'REJECTED' ? 'text-erp-danger' :
                            'text-slate-400'
                          }`}>{a.stage}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {s.nextStage && (
                    <div className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                      <Clock4 className="w-3 h-3" /> Awaiting <strong>{s.nextStage}</strong> approval
                    </div>
                  )}
                  {!s.nextStage && approvals.length === total && total > 0 && (
                    <div className="text-[10px] text-govt-green mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Fully approved
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </div>
            </Link>
          );
        })}
        {!items.length && (
          <div className="card-gov p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No submissions yet</p>
            <Link to="/proposals/new" className="text-xs text-govt-navy hover:underline mt-1 inline-flex items-center gap-1">
              Create your first proposal <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
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
