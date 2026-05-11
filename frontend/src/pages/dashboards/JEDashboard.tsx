import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import api from '../../api/client';
import { formatDate, formatINR } from '../../utils/format';
import StatusPill from '../../components/shared/StatusPill';
import {
  Plus, Ruler, FileText, Calendar, Package, ClipboardList,
  CheckCircle2, XCircle, Clock4, ChevronRight, MapPin, Activity,
  Briefcase, Camera, AlertTriangle,
} from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function JEDashboard() {
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    api.get('/je/dashboard').then((r) => setD(r.data.data));
  }, []);

  if (!d) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-slate-100 animate-pulse rounded-md" />
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-md" />)}
        </div>
      </div>
    );
  }

  const k = d.kpi || {};
  const monthly = (d.monthlyActivity || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    'MB Entries': m.count, Amount: m.amount,
  }));
  const dailyTrend = (d.dailyTrend || []).map((m: any) => ({
    date: m._id.slice(5), Reports: m.count,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Junior Engineer · Field Execution Authority
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Field Operations Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily reports · Measurement entries · Site photos · Material requests · Submission tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/daily-progress" className="btn-gov text-xs">
            <Plus className="w-4 h-4" /> Daily Report
          </Link>
          <Link to="/mb/new" className="btn-gov-success text-xs">
            <Ruler className="w-4 h-4" /> New MB
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 border border-slate-200 rounded-md bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <Kpi icon={Briefcase} label="Active Projects" value={k.assignedActiveCount} sub="assigned to me" />
        <Kpi icon={FileText} label="My Proposals" value={k.myProposals} sub={`${k.proposalsApproved} sanctioned`} />
        <Kpi icon={Ruler} label="MB Entries" value={k.myMBs} sub={`${k.mbsApproved} approved${k.mbsRejected > 0 ? ' · ' + k.mbsRejected + ' rejected' : ''}`} />
        <Kpi icon={Activity} label="Today's Reports" value={k.todayReports} sub={k.todayReports === 0 ? 'submit today\'s report' : 'submitted'} alert={k.todayReports === 0} />
        <Kpi icon={Clock4} label="Pending from Me" value={k.pendingFromMe} sub="awaiting approval" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ActionCard to="/proposals/new" icon={FileText} label="New Proposal" desc="Create project proposal" color="blue" />
        <ActionCard to="/mb/new" icon={Ruler} label="Record MB Entry" desc="Log measurements" color="green" />
        <ActionCard to="/daily-progress" icon={Calendar} label="Daily Progress" desc="Submit today's report" color="amber" />
        <ActionCard to="/material-requests" icon={Package} label="Request Materials" desc="Order site materials" color="purple" />
      </div>

      {/* Activity charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="My MB Activity · 6 Months" subtitle="Measurement entries recorded over time" />
          <div className="px-2 pb-3" style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="MB Entries" fill="#0B3D91" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="My Daily Reports · 14 Days" subtitle="Field reports submitted per day" />
          <div className="px-2 pb-3" style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="Reports" stroke="#138808" strokeWidth={2.5} dot={{ r: 3, fill: '#138808' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Assigned active projects */}
      <div className="bg-white border border-slate-200 rounded-md">
        <ChartHeader title="My Active Projects" subtitle="Projects you proposed that are now in execution" />
        {d.assignedActiveProjects?.length ? (
          <div className="divide-y divide-slate-100">
            {d.assignedActiveProjects.map((p: any) => (
              <Link key={p._id} to={`/projects/${p._id}`} className="block p-4 hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-govt-navy/10 text-govt-navy flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      {p.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location}</span>}
                      {p.awardedTo && <span>{p.awardedTo.companyName || p.awardedTo.name}</span>}
                      {p.endDate && <span>Ends {formatDate(p.endDate)}</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="bg-govt-navy h-full" style={{ width: `${p.overallProgress || 0}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums">{p.overallProgress || 0}%</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No active projects assigned yet</p>
            <Link to="/proposals/new" className="text-xs text-govt-navy hover:underline mt-1 inline-block">Create a new proposal →</Link>
          </div>
        )}
      </div>

      {/* Recent submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SubmissionFeed
          title="Recent Proposals"
          icon={FileText}
          items={d.recentProposals}
          renderItem={(p: any) => (
            <Link to={`/proposals/${p._id}`} className="block p-3 hover:bg-slate-50 rounded">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium truncate flex-1">{p.name}</span>
                <StatusPill status={p.status} />
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{formatINR(p.estimatedCost, { compact: true })} · {formatDate(p.createdAt)}</div>
            </Link>
          )}
        />
        <SubmissionFeed
          title="Recent MB Entries"
          icon={Ruler}
          items={d.recentMBs}
          renderItem={(m: any) => (
            <Link to={`/mb/${m._id}`} className="block p-3 hover:bg-slate-50 rounded">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium truncate flex-1">{m.workItem}</span>
                <StatusPill status={m.status} />
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{m.project?.name} · {formatINR(m.totalAmount, { compact: true })}</div>
            </Link>
          )}
        />
        <SubmissionFeed
          title="Recent Daily Reports"
          icon={Calendar}
          items={d.recentReports}
          renderItem={(r: any) => (
            <div className="p-3 rounded">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium truncate flex-1">{r.project?.name}</span>
                {r.verifiedBy ? (
                  <CheckCircle2 className="w-3 h-3 text-govt-green" />
                ) : (
                  <Clock4 className="w-3 h-3 text-amber-500" />
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{r.workDescription}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(r.reportDate)}</div>
            </div>
          )}
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <QuickLink to="/je/submissions" icon={ClipboardList} label="My Submissions" badge={k.pendingFromMe} />
        <QuickLink to="/je/tasks" icon={CheckCircle2} label="My Tasks" />
        <QuickLink to="/je/site-diary" icon={Camera} label="Site Diary" />
        <QuickLink to="/mb" icon={Ruler} label="MB Records" />
        <QuickLink to="/daily-progress" icon={Calendar} label="Daily Reports" />
        <QuickLink to="/material-requests" icon={Package} label="Materials" />
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, alert }: any) {
  return (
    <div className="px-4 py-3 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</span>
      </div>
      <div className="text-xl font-semibold text-slate-800 tabular-nums">{value ?? '—'}</div>
      {sub && <div className={`text-[10px] mt-0.5 ${alert ? 'text-erp-danger' : 'text-slate-500'}`}>{sub}</div>}
    </div>
  );
}

function ActionCard({ to, icon: Icon, label, desc, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-govt-green border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <Link to={to} className={`bg-white border-2 rounded-md p-4 hover:shadow-gov-lg transition`}>
      <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center mb-2 border`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="font-semibold text-sm">{label}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
    </Link>
  );
}

function ChartHeader({ title, subtitle }: any) {
  return (
    <div className="px-4 py-3 border-b border-slate-200">
      <div className="text-[13px] font-semibold text-slate-800">{title}</div>
      {subtitle && <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
  );
}

function SubmissionFeed({ title, icon: Icon, items, renderItem }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-md">
      <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[11px] font-semibold text-slate-700">{title}</span>
      </div>
      <div className="p-1">
        {items?.length ? items.map((i: any, idx: number) => <div key={idx}>{renderItem(i)}</div>)
          : <div className="p-6 text-center text-[10px] text-slate-400">No submissions yet</div>}
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, badge }: any) {
  return (
    <Link to={to} className="bg-white border border-slate-200 rounded-md p-3 hover:border-govt-navy transition text-center relative">
      <Icon className="w-5 h-5 text-govt-navy mx-auto mb-2" />
      <div className="text-[12px] font-semibold">{label}</div>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 rounded-full bg-amber-100 text-amber-700">{badge}</span>
      )}
    </Link>
  );
}
