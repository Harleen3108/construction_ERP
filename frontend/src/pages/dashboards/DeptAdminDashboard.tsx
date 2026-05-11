import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../api/client';
import { formatINR, formatDateTime, roleLabel } from '../../utils/format';
import {
  Users, Briefcase, ClipboardList, Receipt, Wallet, AlertTriangle,
  Plus, ChevronRight, Building2, Activity, CheckCircle2, Layers,
  CreditCard, FileText, Inbox,
} from 'lucide-react';

const PALETTE = ['#0B3D91', '#1E5BC7', '#475569', '#D4A017', '#138808', '#7C3AED', '#C8102E'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DeptAdminDashboard() {
  const [d, setD] = useState<any>(null);
  const [dept, setDept] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    api.get('/dept/stats').then((r) => setD(r.data.data));
    api.get('/departments/me').then((r) => setDept(r.data.data));
    api.get('/dept/activity').then((r) => setActivity(r.data.data || []));
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
  const monthlyProjects = (d.monthlyProjects || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Projects: m.count, Budget: m.budget,
  }));
  const monthlyPayments = (d.monthlyPayments || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Amount: m.amount, Count: m.count,
  }));
  const statusData = (d.statusDistribution || []).map((s: any) => ({
    name: s._id?.replace(/_/g, ' '), value: s.count,
  }));
  const typeData = (d.typeDistribution || []).map((t: any) => ({
    name: t._id, count: t.count,
  }));
  const usersByRole: Record<string, number> = {};
  (d.usersByRole || []).forEach((u: any) => { usersByRole[u._id] = u.count; });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-2">
            <Building2 className="w-3 h-3" /> {dept?.name || 'My Department'} · {dept?.code}
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Department Operational Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage divisions, users, contractors, projects, and approvals across your department
          </p>
        </div>
        <div className="flex items-center gap-2">
          {k.pendingApprovals > 0 && (
            <Link to="/approvals" className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-md font-medium border border-amber-300 hover:bg-amber-200 flex items-center gap-1">
              <Inbox className="w-3.5 h-3.5" /> {k.pendingApprovals} pending
            </Link>
          )}
          <Link to="/users" className="btn-gov text-xs"><Plus className="w-4 h-4" /> Onboard User</Link>
        </div>
      </div>

      {/* Subscription banner */}
      {dept?.subscription && (
        <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-md px-4 py-3 flex items-center justify-between">
          <div className="text-sm flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-govt-navy" />
            <span className="font-semibold text-govt-navy">{dept.subscription.plan} Plan</span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-xs text-slate-600">
              Valid till {new Date(dept.subscription.endDate).toLocaleDateString('en-IN')}
            </span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-xs text-slate-600">{dept.enabledModules?.length || 0} modules enabled</span>
          </div>
          <span className="pill pill-approved">{dept.subscription.status}</span>
        </div>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 border border-slate-200 rounded-md bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <Kpi icon={Briefcase} label="Total Projects" value={k.totalProjects} sub={`${k.activeProjects} active${k.delayedProjects > 0 ? ` · ${k.delayedProjects} delayed` : ''}`} alert={k.delayedProjects > 0} />
        <Kpi icon={ClipboardList} label="Tenders" value={k.totalTenders} sub={`${k.openTenders} open · ${k.awardedTenders} awarded`} />
        <Kpi icon={Wallet} label="Total Budget" value={formatINR(k.totalBudget, { compact: true })} sub={`${k.utilizationPercent}% utilized`} />
        <Kpi icon={Users} label="Department Users" value={k.totalUsers} sub={`${k.activeUsers} active · ${k.totalDivisions} divisions`} />
        <Kpi icon={Receipt} label="Pending Payouts" value={formatINR(k.pendingPayout, { compact: true })} sub={`${k.pendingBillsCount} bills pending`} />
      </div>

      {/* Action items strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <ActionTile to="/approvals" icon={Inbox} label="Pending Approvals" value={k.pendingApprovals} color="amber" />
        <ActionTile to="/contractors" icon={Briefcase} label="Verified Contractors" value={`${k.verifiedContractors}/${k.contractors}`} color="blue" />
        <ActionTile to="/projects" icon={Activity} label="Active Projects" value={k.activeProjects} color="green" />
        <ActionTile to="/admin/support" icon={AlertTriangle} label="Delayed Projects" value={k.delayedProjects} color="red" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Project Pipeline" subtitle="New project proposals · last 6 months" />
          <div className="px-2 pb-3" style={{ height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={monthlyProjects}>
                <defs>
                  <linearGradient id="projG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B3D91" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0B3D91" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="Projects" stroke="#0B3D91" strokeWidth={2} fill="url(#projG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

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
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Payments Released" subtitle="Treasury disbursement trend (6 months)" />
          <div className="px-2 pb-3" style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={monthlyPayments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1e7).toFixed(1)}Cr`} />
                <Tooltip />
                <Line type="monotone" dataKey="Amount" stroke="#138808" strokeWidth={2.5} dot={{ r: 3, fill: '#138808' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Project Mix by Type" subtitle="Across construction categories" />
          <div className="px-2 pb-3" style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={typeData} layout="vertical" margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#64748B" tick={{ fontSize: 10 }} width={140} />
                <Tooltip />
                <Bar dataKey="count" fill="#1E5BC7" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Team composition + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Team Composition" subtitle="Users by role" />
          <div className="p-4 space-y-2">
            {['CE','EE','SDO','JE','ACCOUNTANT'].map((r) => (
              <div key={r} className="flex items-center justify-between text-[13px]">
                <span className="text-slate-600">{roleLabel(r)}</span>
                <span className="font-semibold text-govt-navy tabular-nums">{usersByRole[r] || 0}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-[13px] pt-2 border-t">
              <span className="text-slate-600 font-semibold">Total Department Users</span>
              <span className="font-bold text-slate-800 tabular-nums">{k.totalUsers}</span>
            </div>
            <Link to="/users" className="text-[11px] text-govt-navy hover:underline mt-2 inline-block">
              Manage users <ChevronRight className="w-3 h-3 inline" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Recent Department Activity" subtitle="Last 20 audited actions" />
          {activity.length ? (
            <div className="max-h-[320px] overflow-y-auto">
              {activity.slice(0, 12).map((a) => (
                <div key={a._id} className="px-4 py-2 border-b border-slate-100 last:border-0 flex items-start gap-3 text-sm">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-600 flex-shrink-0">
                    {a.userName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px]">
                      <strong className="text-slate-800">{a.userName || '—'}</strong>
                      <span className="text-[10px] text-slate-500 ml-1">{a.userRole}</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 truncate">{a.action}</div>
                  </div>
                  <div className="text-[10px] text-slate-400 flex-shrink-0">{formatDateTime(a.timestamp)}</div>
                </div>
              ))}
            </div>
          ) : <div className="p-12 text-center text-xs text-slate-400">No activity yet</div>}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <QuickLink to="/users" icon={Users} label="Users" />
        <QuickLink to="/divisions" icon={Layers} label="Divisions" />
        <QuickLink to="/contractors" icon={Briefcase} label="Contractors" />
        <QuickLink to="/workflows" icon={Activity} label="Workflows" />
        <QuickLink to="/documents" icon={FileText} label="Documents" />
        <QuickLink to="/audit" icon={CheckCircle2} label="Audit Logs" />
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

function ActionTile({ to, icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    amber: 'border-amber-200 hover:border-amber-400 text-amber-600',
    blue: 'border-blue-200 hover:border-blue-400 text-blue-600',
    green: 'border-green-200 hover:border-green-400 text-govt-green',
    red: 'border-red-200 hover:border-red-400 text-erp-danger',
  };
  return (
    <Link to={to} className={`bg-white border rounded-md p-4 transition flex items-center gap-3 ${colors[color]}`}>
      <Icon className="w-5 h-5" />
      <div className="flex-1">
        <div className="text-[12px] text-slate-600">{label}</div>
        <div className="text-xl font-bold tabular-nums">{value ?? 0}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300" />
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

function QuickLink({ to, icon: Icon, label }: any) {
  return (
    <Link to={to} className="bg-white border border-slate-200 rounded-md p-3 hover:border-govt-navy transition text-center">
      <Icon className="w-5 h-5 text-govt-navy mx-auto mb-2" />
      <div className="text-[12px] font-semibold">{label}</div>
    </Link>
  );
}
