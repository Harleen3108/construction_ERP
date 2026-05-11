import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { roleLabel } from '../../utils/format';
import {
  Users, FileText, Ruler, CheckCircle2, Inbox, Mail, Phone, Award,
} from 'lucide-react';

export default function EngineerPerformancePage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    api.get('/ce/engineer-performance').then((r) => setItems(r.data.data));
  }, []);

  const filtered = filter ? items.filter((i) => i.role === filter) : items;

  // Compute role-aggregate stats
  const aggBy = (role: string) => {
    const list = items.filter((i) => i.role === role);
    return {
      count: list.length,
      proposals: list.reduce((s, i) => s + (i.metrics.proposalsCreated || 0), 0),
      mbs: list.reduce((s, i) => s + (i.metrics.mbsRecorded || 0), 0),
      approvals: list.reduce((s, i) => s + (i.metrics.approvalsActioned || 0), 0),
    };
  };

  return (
    <div>
      <PageHeader
        title="Engineer Performance"
        subtitle="Monitor productivity of EE, SDO, and JE across the department"
      />

      {/* Role aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {(['EE','SDO','JE'] as const).map((r) => {
          const a = aggBy(r);
          return (
            <div key={r} className="card-gov p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-[11px] text-slate-500 uppercase">{roleLabel(r)}</div>
                  <div className="text-2xl font-bold tabular-nums">{a.count}</div>
                </div>
                <Users className="w-5 h-5 text-govt-navy" />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                <Stat icon={FileText} label="Proposals" value={a.proposals} />
                <Stat icon={Ruler} label="MBs" value={a.mbs} />
                <Stat icon={CheckCircle2} label="Approvals" value={a.approvals} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-3">
        {[
          { val: '', label: 'All' },
          { val: 'EE', label: 'Executive Engineers' },
          { val: 'SDO', label: 'SDO / Asst. Engineers' },
          { val: 'JE', label: 'Junior Engineers' },
        ].map((b) => (
          <button key={b.val}
            onClick={() => setFilter(b.val)}
            className={`px-3 py-1.5 text-xs rounded border ${filter === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Engineer cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((u) => (
          <div key={u._id} className="card-gov p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-govt-navy text-white flex items-center justify-center font-bold text-lg">
                {u.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{u.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{u.designation}</div>
                <span className="pill pill-info text-[9px] mt-1">{roleLabel(u.role)}</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 space-y-0.5 mb-3">
              <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {u.email}</div>
              {u.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {u.phone}</div>}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <Metric icon={FileText} label="Proposals" value={u.metrics.proposalsCreated} />
              <Metric icon={Ruler} label="MB Entries" value={u.metrics.mbsRecorded} />
              <Metric icon={CheckCircle2} label="Approvals Done" value={u.metrics.approvalsActioned} />
              <Metric icon={Inbox} label="Pending" value={u.metrics.pendingApprovals} alert={u.metrics.pendingApprovals > 5} />
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div className="col-span-full card-gov p-12 text-center text-slate-400">
            <Award className="w-10 h-10 mx-auto mb-2 opacity-40" />
            No engineers match the filter
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="text-center">
      <Icon className="w-3 h-3 text-slate-400 mx-auto" />
      <div className="text-sm font-bold tabular-nums">{value || 0}</div>
      <div className="text-[9px] text-slate-500">{label}</div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, alert }: any) {
  return (
    <div className="bg-slate-50 rounded p-2 text-center">
      <Icon className={`w-3 h-3 mx-auto ${alert ? 'text-erp-danger' : 'text-slate-400'}`} />
      <div className={`text-base font-bold tabular-nums ${alert ? 'text-erp-danger' : 'text-slate-800'}`}>{value || 0}</div>
      <div className="text-[9px] text-slate-500">{label}</div>
    </div>
  );
}
