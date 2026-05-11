import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR, formatDate } from '../../utils/format';
import {
  MapPin, Calendar, Activity, AlertTriangle, Ruler, Plus,
  CheckCircle2, Clock4, Briefcase, ChevronRight, Eye,
} from 'lucide-react';

export default function SiteMonitoringPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'attention' | 'inProgress' | 'overdue'>('all');

  useEffect(() => {
    api.get('/je/site-monitoring').then((r) => setItems(r.data.data));
  }, []);

  const filtered = items.filter((p) => {
    if (filter === 'attention') return p.site?.needsAttention;
    if (filter === 'inProgress') return p.status === 'IN_PROGRESS';
    if (filter === 'overdue') return p.site?.isOverdue;
    return true;
  });

  const stats = {
    total: items.length,
    inProgress: items.filter((p) => p.status === 'IN_PROGRESS').length,
    needsAttention: items.filter((p) => p.site?.needsAttention).length,
    overdue: items.filter((p) => p.site?.isOverdue).length,
  };

  return (
    <div>
      <PageHeader
        title="Site Monitoring"
        subtitle="Real-time unified view of every project you're working on — progress, last activity, issues, attention flags"
        badge={`${stats.total} project${stats.total !== 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Total Projects" value={stats.total} />
        <Stat label="In Progress" value={stats.inProgress} color="text-blue-600" />
        <Stat label="Needs Attention" value={stats.needsAttention} color="text-amber-600" />
        <Stat label="Overdue" value={stats.overdue} color="text-erp-danger" />
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {[
          { val: 'all', label: 'All' },
          { val: 'inProgress', label: 'In Progress' },
          { val: 'attention', label: 'Needs Attention' },
          { val: 'overdue', label: 'Overdue' },
        ].map((b: any) => (
          <button key={b.val} onClick={() => setFilter(b.val)}
            className={`px-3 py-1.5 text-xs rounded border ${filter === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((p) => (
          <div key={p._id} className={`card-gov p-5 ${p.site?.isOverdue ? 'border-l-4 border-l-erp-danger' : p.site?.needsAttention ? 'border-l-4 border-l-amber-500' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-govt-navy/10 text-govt-navy flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link to={`/projects/${p._id}`} className="font-semibold text-slate-800 hover:underline">{p.name}</Link>
                  <StatusPill status={p.status} />
                  {p.site?.isOverdue && (
                    <span className="pill pill-rejected text-[10px]"><AlertTriangle className="w-3 h-3 inline" /> Overdue</span>
                  )}
                  {p.site?.needsAttention && !p.site?.isOverdue && (
                    <span className="pill pill-pending text-[10px]">⚠ Attention needed</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 mt-1">
                  {p.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location}</div>}
                  <div>Budget: <strong>{formatINR(p.estimatedCost, { compact: true })}</strong></div>
                  {p.awardedTo && <div>Contractor: {p.awardedTo.companyName || p.awardedTo.name}</div>}
                  {p.endDate && <div>Ends {formatDate(p.endDate)}</div>}
                </div>

                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${p.site?.isOverdue ? 'bg-erp-danger' : 'bg-govt-navy'}`}
                         style={{ width: `${p.overallProgress || 0}%` }} />
                  </div>
                  <span className="text-xs font-bold tabular-nums w-12 text-right">{p.overallProgress || 0}%</span>
                </div>

                {/* Activity panel */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100">
                  <Activity_Card label="Last Daily Report"
                    value={p.site?.lastDaily ? formatDate(p.site.lastDaily.reportDate) : 'Never'}
                    icon={Calendar}
                    alert={(p.site?.daysSinceReport ?? 999) > 3}
                    sub={p.site?.lastDaily ? `${p.site.daysSinceReport}d ago by ${p.site.lastDaily.recordedBy?.name}` : 'Submit one'}
                  />
                  <Activity_Card label="MBs This Week"
                    value={p.site?.mbsThisWeek || 0}
                    icon={Ruler}
                    sub={p.site?.lastMB ? `Last: ${formatDate(p.site.lastMB.createdAt)}` : 'None recorded'}
                  />
                  <Activity_Card label="Milestones"
                    value={`${p.site?.milestonesDone || 0}/${p.site?.milestonesTotal || 0}`}
                    icon={CheckCircle2}
                    sub="completed"
                  />
                  <Activity_Card label="Recent Issues"
                    value={p.site?.recentIssues?.length || 0}
                    icon={AlertTriangle}
                    alert={(p.site?.recentIssues?.length || 0) > 0}
                    sub="last 14 days"
                  />
                </div>

                {/* Recent issues callout */}
                {p.site?.recentIssues?.length > 0 && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                    <strong className="block mb-1">Recent issues reported:</strong>
                    {p.site.recentIssues.map((iss: any, i: number) => (
                      <div key={i} className="ml-2">• {iss.issues} <span className="text-amber-600">({formatDate(iss.reportDate)})</span></div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <Link to={`/je/project-timeline/${p._id}`} className="btn-gov-outline text-[10px] flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Timeline
                  </Link>
                  <Link to={`/daily-progress`} className="btn-gov text-[10px] flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Report
                  </Link>
                  <Link to={`/mb/new`} className="btn-gov-success text-[10px] flex items-center gap-1">
                    <Ruler className="w-3 h-3" /> New MB
                  </Link>
                  <Link to={`/projects/${p._id}`} className="text-[10px] text-govt-navy hover:underline ml-auto flex items-center gap-1">
                    Project detail <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div className="card-gov p-12 text-center text-slate-400">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No projects match the filter</p>
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

function Activity_Card({ label, value, icon: Icon, alert, sub }: any) {
  return (
    <div className={`p-2 rounded ${alert ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
      <div className="flex items-center gap-1 text-[9px] uppercase text-slate-500">
        <Icon className={`w-3 h-3 ${alert ? 'text-amber-600' : 'text-slate-400'}`} />
        {label}
      </div>
      <div className={`text-sm font-bold tabular-nums ${alert ? 'text-amber-700' : 'text-slate-800'}`}>{value}</div>
      {sub && <div className="text-[9px] text-slate-500">{sub}</div>}
    </div>
  );
}
