import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { roleLabel } from '../../utils/format';
import {
  Users, FileText, Ruler, CheckCircle2, Inbox, Calendar, Mail, Phone,
} from 'lucide-react';

export default function TeamPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/ee/team').then((r) => setItems(r.data.data));
  }, []);

  const filtered = filter ? items.filter((i) => i.role === filter) : items;
  const sdoCount = items.filter((i) => i.role === 'SDO').length;
  const jeCount = items.filter((i) => i.role === 'JE').length;

  return (
    <div>
      <PageHeader
        title="My Team"
        subtitle="SDO and JE under your division · supervision, productivity, workload"
        badge={`${items.length} engineers`}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <Stat label="Total Engineers" value={items.length} icon={Users} />
        <Stat label="SDO / Assistant Engineers" value={sdoCount} icon={CheckCircle2} />
        <Stat label="Junior Engineers" value={jeCount} icon={FileText} />
      </div>

      <div className="flex gap-1 mb-4">
        {[
          { val: '', label: 'All' },
          { val: 'SDO', label: 'SDO' },
          { val: 'JE', label: 'JE' },
        ].map((b) => (
          <button key={b.val} onClick={() => setFilter(b.val)}
            className={`px-3 py-1.5 text-xs rounded border ${filter === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
            {b.label}
          </button>
        ))}
      </div>

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
                <span className={`pill ${u.role === 'SDO' ? 'pill-progress' : 'pill-info'} text-[9px] mt-1`}>{roleLabel(u.role)}</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 space-y-0.5 mb-3">
              <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {u.email}</div>
              {u.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {u.phone}</div>}
              {u.metrics?.lastActiveDays != null && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  Last active: {u.metrics.lastActiveDays === 0 ? 'today' : `${u.metrics.lastActiveDays} day${u.metrics.lastActiveDays !== 1 ? 's' : ''} ago`}
                  {u.metrics.lastActiveDays > 7 && <span className="text-amber-600">⚠</span>}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <Metric icon={FileText} label="Proposals" value={u.metrics.proposals} />
              <Metric icon={Ruler} label="MB Entries" value={u.metrics.mbs} />
              <Metric icon={CheckCircle2} label="Approvals" value={u.metrics.approvalsDone} />
              <Metric icon={Inbox} label="Pending" value={u.metrics.pending} alert={u.metrics.pending > 5} />
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div className="col-span-full card-gov p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No engineers under your supervision</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: any) {
  return (
    <div className="card-gov p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 uppercase">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
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
