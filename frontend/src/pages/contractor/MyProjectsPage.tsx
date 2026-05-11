import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR, formatDate } from '../../utils/format';
import {
  Hammer, MapPin, Calendar, Ruler, Receipt, AlertTriangle, ChevronRight,
  Briefcase, Plus,
} from 'lucide-react';

export default function MyProjectsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all');

  useEffect(() => {
    api.get('/cont/my-projects').then((r) => setItems(r.data.data));
  }, []);

  const filtered = items.filter((p) => {
    if (filter === 'active') return p.status === 'IN_PROGRESS';
    if (filter === 'completed') return p.status === 'COMPLETED';
    if (filter === 'pending') return p.workOrder && !p.workOrder.acceptedByContractor;
    return true;
  });

  const stats = {
    total: items.length,
    active: items.filter((p) => p.status === 'IN_PROGRESS').length,
    completed: items.filter((p) => p.status === 'COMPLETED').length,
    woToAccept: items.filter((p) => p.workOrder && !p.workOrder.acceptedByContractor).length,
  };

  return (
    <div>
      <PageHeader
        title="My Active Projects"
        subtitle="All awarded projects · view BOQ · raise bills · upload progress · track milestones"
        badge={`${items.length} total`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Active" value={stats.active} color="text-blue-600" />
        <Stat label="Completed" value={stats.completed} color="text-govt-green" />
        <Stat label="Work Orders to Accept" value={stats.woToAccept} color={stats.woToAccept > 0 ? 'text-amber-600' : 'text-slate-800'} />
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {[
          { val: 'all', label: 'All' },
          { val: 'active', label: 'Active' },
          { val: 'completed', label: 'Completed' },
          { val: 'pending', label: 'Pending WO Acceptance' },
        ].map((b: any) => (
          <button key={b.val} onClick={() => setFilter(b.val)}
            className={`px-3 py-1.5 text-xs rounded border ${filter === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((p) => (
          <div key={p._id} className={`card-gov p-5 ${p.execution?.isOverdue ? 'border-l-4 border-l-erp-danger' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-govt-navy/10 text-govt-navy flex items-center justify-center flex-shrink-0">
                <Hammer className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link to={`/projects/${p._id}`} className="font-semibold text-slate-800 hover:underline">{p.name}</Link>
                  <span className="text-[10px] font-mono text-slate-500">{p.projectId}</span>
                  <StatusPill status={p.status} />
                  {p.execution?.isOverdue && (
                    <span className="pill pill-rejected text-[10px]">
                      <AlertTriangle className="w-3 h-3 inline" /> Overdue
                    </span>
                  )}
                  {p.workOrder && !p.workOrder.acceptedByContractor && (
                    <span className="pill pill-pending text-[10px]">⚠ Accept WO</span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 mt-1">
                  {p.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location}</div>}
                  <div>Awarded: <strong>{formatINR(p.awardedAmount, { compact: true })}</strong></div>
                  {p.startDate && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Start: {formatDate(p.startDate)}</div>}
                  {p.endDate && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> End: {formatDate(p.endDate)}</div>}
                </div>

                {/* Progress bar */}
                {p.status === 'IN_PROGRESS' && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${p.execution?.isOverdue ? 'bg-erp-danger' : 'bg-govt-green'}`}
                           style={{ width: `${p.overallProgress || 0}%` }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums w-12 text-right">{p.overallProgress || 0}%</span>
                  </div>
                )}

                {/* Execution stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <ExecStat icon={Ruler} label="MB Entries" value={p.execution?.mbCount || 0} />
                  <ExecStat icon={Receipt} label="Bills Submitted" value={p.execution?.billCount || 0} sub={`${p.execution?.billsPaid || 0} paid`} />
                  <ExecStat label="Earnings" value={formatINR(p.execution?.totalPaid, { compact: true })} color="text-govt-green" />
                  <ExecStat label="Remaining" value={formatINR(p.execution?.remainingValue, { compact: true })} color="text-amber-600" />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                  <Link to={`/projects/${p._id}`} className="btn-gov-outline text-[10px]">View Project</Link>
                  {p.workOrder && (
                    <Link to={`/work-orders/${p.workOrder._id || p.workOrder}`} className="btn-gov-outline text-[10px]">Work Order</Link>
                  )}
                  <Link to="/daily-progress" className="btn-gov-outline text-[10px]">Daily Progress</Link>
                  <Link to="/bills/new" className="btn-gov-success text-[10px]"><Plus className="w-3 h-3" /> Raise Bill</Link>
                  <Link to={`/projects/${p._id}`} className="ml-auto text-[10px] text-govt-navy hover:underline flex items-center gap-1">
                    Details <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div className="card-gov p-12 text-center text-slate-400">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No projects match the filter</p>
            <Link to="/tenders/published" className="text-xs text-govt-navy hover:underline mt-2 inline-block">
              Browse open tenders →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'text-slate-800' }: any) {
  return (
    <div className="card-gov p-3">
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function ExecStat({ icon: Icon, label, value, sub, color = 'text-slate-800' }: any) {
  return (
    <div className="bg-slate-50 rounded p-2">
      <div className="flex items-center gap-1 text-[9px] uppercase text-slate-500">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <div className={`text-sm font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[9px] text-slate-500">{sub}</div>}
    </div>
  );
}
