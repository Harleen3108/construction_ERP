import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import api from '../../api/client';
import { formatDate, formatINR } from '../../utils/format';
import {
  Ruler, Receipt, FileText, ClipboardCheck, Package, Calendar,
  Inbox, Briefcase, Users, ChevronRight, MapPin, AlertTriangle, Activity,
} from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function SDODashboard() {
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    api.get('/sdo/dashboard').then((r) => setD(r.data.data));
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
  const monthly = (d.monthlyVerifications || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Approved: m.approved, Rejected: m.rejected,
  }));
  const dailyTrend = (d.dailyTrend || []).map((m: any) => ({
    date: m._id.slice(5),
    Submitted: m.submitted,
    Verified: m.verified,
  }));

  const pendingBreakdown = [
    { type: 'PROJECT', label: 'Project Proposals', count: k.pendingProjects || 0, color: '#0B3D91' },
    { type: 'MB',      label: 'MB Entries',         count: k.pendingMBs || 0,     color: '#D4A017' },
    { type: 'BILL',    label: 'Running Bills',      count: k.pendingBills || 0,   color: '#138808' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            SDO / Assistant Engineer · Site Verification Authority
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Verification & Supervision Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify JE submissions · validate measurements · inspect site work · forward to EE
          </p>
        </div>
        <div className="flex items-center gap-2">
          {k.totalPendingSDO > 0 && (
            <Link to="/sdo/queue" className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-md font-medium border border-amber-300 hover:bg-amber-200 flex items-center gap-1">
              <Inbox className="w-3.5 h-3.5" /> {k.totalPendingSDO} awaiting verification
            </Link>
          )}
          <Link to="/sdo/mb-verify" className="btn-gov text-xs">
            <Ruler className="w-4 h-4" /> Verify MB
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 border border-slate-200 rounded-md bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <Kpi icon={Inbox} label="Pending Verifications" value={k.totalPendingSDO} sub={k.totalPendingSDO > 0 ? 'requires review' : 'all clear'} alert={k.totalPendingSDO > 0} />
        <Kpi icon={Activity} label="Daily Reports Pending" value={k.unverifiedDailyReports} sub="JE-submitted reports" />
        <Kpi icon={ClipboardCheck} label="My Inspections" value={k.scheduledInspections} sub="scheduled site visits" />
        <Kpi icon={Package} label="Material Requests" value={k.pendingMaterials} sub="contractor requests" />
        <Kpi icon={Briefcase} label="Active Projects" value={k.activeProjects} sub={`${k.jeCount} JE · ${k.contractorsCount} contractors`} />
      </div>

      {/* Pending breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Verification Queue" subtitle="Items at SDO stage by type" />
          <div className="p-5 space-y-2">
            {pendingBreakdown.map((b) => (
              <Link key={b.type} to={`/sdo/queue?type=${b.type}`}
                className="flex items-center justify-between p-3 border border-slate-100 rounded hover:border-govt-navy transition">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded" style={{ background: b.color }} />
                  <span className="text-sm font-medium">{b.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold tabular-nums ${b.count > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{b.count}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">Total queue</span>
              <span className="font-bold text-govt-navy">{k.totalPendingSDO}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md">
          <ChartHeader title="My Verification Activity · 6 Months" subtitle="Approve/reject actions over time" />
          <div className="px-2 pb-3" style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Bar dataKey="Approved" stackId="a" fill="#138808" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Rejected" stackId="a" fill="#C8102E" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily progress trend + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Daily Progress · Last 14 Days" subtitle="JE-submitted vs SDO-verified reports" />
          <div className="px-2 pb-3" style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="Submitted" stroke="#0B3D91" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Verified" stroke="#138808" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="MB Entries Awaiting Your Verification" subtitle="JE submissions ready for SDO review" />
          <div className="divide-y divide-slate-100">
            {(d.recentMBsToVerify || []).slice(0, 5).map((mb: any) => (
              <Link key={mb._id} to={`/mb/${mb._id}`} className="block p-3 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{mb.workItem}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{mb.project?.name}</span>
                      {mb.project?.location && <><MapPin className="w-2.5 h-2.5" /><span>{mb.project.location}</span></>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[12px] font-semibold tabular-nums">{formatINR(mb.totalAmount, { compact: true })}</div>
                    <div className="text-[10px] text-slate-500">by {mb.recordedBy?.name}</div>
                  </div>
                </div>
              </Link>
            ))}
            {!d.recentMBsToVerify?.length && (
              <div className="p-12 text-center text-xs text-slate-400">No MB entries pending verification</div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Reports awaiting verification */}
      <div className="bg-white border border-slate-200 rounded-md">
        <ChartHeader title="Daily Progress Reports Awaiting Your Verification" subtitle="JE field reports — manpower, materials, weather, photos" />
        {d.recentDailyReports?.length ? (
          <div className="divide-y divide-slate-100">
            {d.recentDailyReports.map((r: any) => (
              <Link key={r._id} to="/sdo/daily-progress" className="block p-4 hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[13px]">{r.project?.name}</span>
                      <span className="pill pill-pending text-[10px]">Awaiting verification</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">{r.workDescription}</p>
                    <div className="text-[10px] text-slate-500 mt-1">
                      By {r.recordedBy?.name} ({r.recordedBy?.role}) · {formatDate(r.reportDate)}
                      {r.manpower && ` · ${(r.manpower.skilled || 0) + (r.manpower.unskilled || 0)} workers`}
                      {r.issues && <span className="text-amber-600 ml-2">⚠ Issues reported</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">No daily reports pending verification</div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <QuickLink to="/sdo/queue" icon={Inbox} label="Approval Queue" badge={k.totalPendingSDO} />
        <QuickLink to="/sdo/mb-verify" icon={Ruler} label="MB Verification" badge={k.pendingMBs} />
        <QuickLink to="/sdo/daily-progress" icon={Activity} label="Daily Progress" badge={k.unverifiedDailyReports} />
        <QuickLink to="/ce/inspections" icon={ClipboardCheck} label="Inspections" badge={k.scheduledInspections} />
        <QuickLink to="/material-requests" icon={Package} label="Materials" badge={k.pendingMaterials} />
        <QuickLink to="/projects" icon={Briefcase} label="Projects" />
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

function ChartHeader({ title, subtitle }: any) {
  return (
    <div className="px-4 py-3 border-b border-slate-200">
      <div className="text-[13px] font-semibold text-slate-800">{title}</div>
      {subtitle && <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>}
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
