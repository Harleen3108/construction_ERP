import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../api/client';
import { formatINR, formatDate, formatDateTime } from '../../utils/format';
import {
  Briefcase, ClipboardList, Ruler, Receipt, Wallet, Inbox, AlertTriangle,
  Users, Activity, Calendar, ChevronRight, FileText, Package, CheckCircle2,
} from 'lucide-react';

const PALETTE = ['#0B3D91','#1E5BC7','#475569','#D4A017','#138808','#7C3AED','#C8102E'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function EEDashboard() {
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    api.get('/ee/dashboard').then((r) => setD(r.data.data));
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
  const monthlyApprovals = (d.monthlyApprovals || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Approved: m.approved, Rejected: m.rejected,
  }));
  const dailyTrend = (d.dailyProgressTrend || []).map((m: any) => ({
    date: m._id.slice(5), Reports: m.count,
  }));
  const statusData = (d.projectStatusDist || []).map((s: any) => ({
    name: s._id?.replace(/_/g, ' '), value: s.count,
  }));

  // Pending breakdown for stacked breakdown card
  const pendingBreakdown = [
    { type: 'Projects', count: k.pendingProjects || 0, color: '#0B3D91' },
    { type: 'Tenders', count: k.pendingTenders || 0, color: '#1E5BC7' },
    { type: 'MB Entries', count: k.pendingMBs || 0, color: '#D4A017' },
    { type: 'Bills', count: k.pendingBills || 0, color: '#138808' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Executive Engineer · Operational Authority
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Division Operations Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tenders, projects, MB approvals, billing verification, team supervision
          </p>
        </div>
        <div className="flex items-center gap-2">
          {k.totalPendingEE > 0 && (
            <Link to="/ee/queue" className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-md font-medium border border-amber-300 hover:bg-amber-200 flex items-center gap-1">
              <Inbox className="w-3.5 h-3.5" /> {k.totalPendingEE} awaiting your approval
            </Link>
          )}
          <Link to="/tenders/new" className="btn-gov text-xs">+ New Tender</Link>
        </div>
      </div>

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 border border-slate-200 rounded-md bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <Kpi icon={Inbox} label="My Approvals" value={k.totalPendingEE} sub={k.totalPendingEE > 0 ? 'requires action' : 'all clear'} alert={k.totalPendingEE > 0} />
        <Kpi icon={ClipboardList} label="Active Tenders" value={k.activeTenders} sub="published / bidding / eval" />
        <Kpi icon={Briefcase} label="Active Projects" value={k.activeProjects} sub="in progress" />
        <Kpi icon={Ruler} label="MBs to Verify" value={k.mbsToApprove} sub={k.billsToApprove > 0 ? `${k.billsToApprove} bills also pending` : 'next step in chain'} />
        <Kpi icon={Wallet} label="Budget Pipeline" value={formatINR(k.totalBudget, { compact: true })} sub={`${formatINR(k.totalPaid, { compact: true })} paid`} />
      </div>

      {/* Pending action breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Your Approval Queue" subtitle="Items waiting at EE stage by type" />
          <div className="p-5 space-y-2">
            {pendingBreakdown.map((b) => (
              <Link key={b.type} to={`/ee/queue?type=${b.type.toUpperCase().split(' ')[0]}`} className="flex items-center justify-between p-3 border border-slate-100 rounded hover:border-govt-navy transition">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded" style={{ background: b.color }} />
                  <span className="text-sm font-medium">{b.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold tabular-nums ${b.count > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{b.count}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">Total queue</span>
              <span className="font-bold text-govt-navy">{k.totalPendingEE}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Approvals Actioned · 6 Months" subtitle="Your approve/reject activity over time" />
          <div className="px-2 pb-3" style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyApprovals}>
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

      {/* Team strip + Material requests + Daily trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link to="/ee/team" className="bg-white border border-slate-200 rounded-md p-4 hover:border-govt-navy transition">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-govt-navy" />
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-[11px] text-slate-500 uppercase">My Team</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{(k.sdoCount || 0) + (k.jeCount || 0)}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {k.sdoCount} SDO · {k.jeCount} JE
          </div>
        </Link>
        <Link to="/material-requests" className="bg-white border border-slate-200 rounded-md p-4 hover:border-govt-navy transition">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-govt-navy" />
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-[11px] text-slate-500 uppercase">Material Requests</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{k.openMaterialReqs}</div>
          <div className="text-[11px] text-slate-500 mt-1">awaiting approval</div>
        </Link>
        <div className="bg-white border border-slate-200 rounded-md p-4 lg:col-span-1">
          <div className="text-[11px] text-slate-500 uppercase mb-2">Daily Progress · 14 days</div>
          <div style={{ height: 80 }}>
            <ResponsiveContainer>
              <LineChart data={dailyTrend}>
                <Line type="monotone" dataKey="Reports" stroke="#0B3D91" strokeWidth={2} dot={false} />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">JE-submitted site reports</div>
        </div>
      </div>

      {/* Project status + activity feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Project Status" subtitle="Lifecycle distribution" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {statusData.map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActivityFeed title="Recent Daily Progress" icon={Activity} items={d.recentDailyProgress} renderItem={(i: any) => (
            <>
              <div className="text-[12px] font-medium truncate">{i.project?.name}</div>
              <div className="text-[10px] text-slate-500">By {i.recordedBy?.name} · {formatDate(i.reportDate)}</div>
            </>
          )} />
          <ActivityFeed title="Recent MB Entries" icon={Ruler} items={d.recentMBs} renderItem={(i: any) => (
            <>
              <div className="text-[12px] font-medium truncate">{i.workItem}</div>
              <div className="text-[10px] text-slate-500">{i.project?.name} · {formatINR(i.totalAmount, { compact: true })}</div>
            </>
          )} />
          <ActivityFeed title="Recent Bills" icon={Receipt} items={d.recentBills} renderItem={(i: any) => (
            <>
              <div className="text-[12px] font-medium truncate">{i.billNumber}</div>
              <div className="text-[10px] text-slate-500">{i.contractor?.companyName || i.contractor?.name} · {formatINR(i.netPayable, { compact: true })}</div>
            </>
          )} />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <QuickLink to="/ee/queue" icon={Inbox} label="Approval Queue" badge={k.totalPendingEE} />
        <QuickLink to="/ee/team" icon={Users} label="My Team" />
        <QuickLink to="/tenders" icon={ClipboardList} label="Tenders" />
        <QuickLink to="/projects" icon={Briefcase} label="Projects" />
        <QuickLink to="/material-requests" icon={Package} label="Materials" />
        <QuickLink to="/ce/inspections" icon={CheckCircle2} label="Inspections" />
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

function ActivityFeed({ title, icon: Icon, items, renderItem }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-md">
      <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[11px] font-semibold text-slate-700">{title}</span>
      </div>
      <div className="p-1">
        {items?.length ? items.map((i: any, idx: number) => (
          <div key={idx} className="p-2 hover:bg-slate-50 rounded">
            {renderItem(i)}
          </div>
        )) : <div className="p-6 text-center text-[10px] text-slate-400">No recent activity</div>}
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
