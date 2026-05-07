import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from 'recharts';
import api from '../../api/client';
import { formatINR, formatDateTime, humanStatus, roleLabel } from '../../utils/format';
import {
  Briefcase, Users, FileText, ClipboardList,
  Activity, TrendingUp, AlertTriangle, IndianRupee,
  CheckCircle2, Clock,
} from 'lucide-react';

const PALETTE = ['#0B3D91', '#1E5BC7', '#475569', '#64748B', '#94A3B8', '#D4A017', '#138808', '#C8102E', '#7C3AED'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDashboard() {
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    api.get('/dashboard/me').then((r) => setD(r.data.data));
  }, []);

  if (!d) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-slate-100 animate-pulse rounded-md" />
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-md" />)}
        </div>
        <div className="h-72 bg-slate-100 animate-pulse rounded-md" />
      </div>
    );
  }

  const kpi = d.kpi || {};
  const monthlyProjectsData = (d.monthlyProjects || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Projects: m.count,
    Budget: m.budget,
  }));
  const monthlyPaymentsData = (d.monthlyPayments || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Amount: m.amount,
    Count: m.count,
  }));
  const statusData = (d.statusDistribution || []).map((s: any) => ({
    name: humanStatus(s._id), value: s.count, budget: s.totalBudget,
  }));
  const typeData = (d.typeDistribution || []).map((s: any) => ({
    name: s._id, count: s.count, budget: s.totalBudget,
  }));
  const approvalsData = (d.approvalsByStage || []).map((s: any) => ({
    stage: roleLabel(s._id), count: s.count,
  }));

  return (
    <div className="space-y-5">
      {/* Page header strip — government style */}
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">System Administration</div>
          <h1 className="text-xl font-semibold text-slate-800 font-gov">Department Analytics & Oversight</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time view across projects, tenders, finance and compliance</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="w-1.5 h-1.5 bg-govt-green rounded-full animate-pulse" />
          Live · Last updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* KPI strip — flat, dense, no colored backgrounds */}
      <div className="grid grid-cols-2 md:grid-cols-5 border border-slate-200 rounded-md bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <Kpi icon={Briefcase} label="Total Projects" value={kpi.totalProjects} sub={`${kpi.activeProjects || 0} active`} />
        <Kpi icon={ClipboardList} label="Tenders" value={kpi.totalTenders} sub={`${kpi.totalContractors} contractors`} />
        <Kpi icon={IndianRupee} label="Total Budget" value={formatINR(kpi.totalBudget, { compact: true })} sub={`${kpi.utilizationPercent || 0}% utilized`} />
        <Kpi icon={CheckCircle2} label="Payments Released" value={formatINR(kpi.totalPayments, { compact: true })} sub={`${kpi.billsPaidCount || 0} bills paid`} />
        <Kpi icon={Clock} label="Pending Approvals" value={kpi.pendingApprovalsCount} sub={kpi.delayedProjects > 0 ? `${kpi.delayedProjects} delayed` : 'On track'} alert={kpi.delayedProjects > 0} />
      </div>

      {/* Row 1 — Monthly Projects + Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md">
          <ChartHeader
            title="Project Pipeline · Last 6 Months"
            subtitle="New project proposals and their cumulative budget"
            icon={TrendingUp}
          />
          <div className="px-2 pb-3" style={{ height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={monthlyProjectsData}>
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B3D91" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0B3D91" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip content={<TT />} />
                <Area type="monotone" dataKey="Projects" stroke="#0B3D91" strokeWidth={2} fill="url(#projGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Project Status" subtitle="Distribution by lifecycle stage" icon={Activity} />
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {statusData.map((_: any, i: number) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<TT />} />
                <Legend
                  verticalAlign="bottom"
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 10, color: '#64748B' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 — Payments line + Project Type bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Payments Released · 6 Months" subtitle="Treasury disbursement trend" icon={IndianRupee} />
          <div className="px-2 pb-3" style={{ height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={monthlyPaymentsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1e7).toFixed(1)}Cr`} />
                <Tooltip content={<TT />} />
                <Line type="monotone" dataKey="Amount" stroke="#138808" strokeWidth={2.5} dot={{ r: 3, fill: '#138808' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Project Mix by Type" subtitle="Volume across construction categories" icon={Briefcase} />
          <div className="px-2 pb-3" style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={typeData} layout="vertical" margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} width={130} />
                <Tooltip content={<TT />} />
                <Bar dataKey="count" fill="#1E5BC7" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3 — Approvals by stage + Top contractors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Pending Approvals by Role" subtitle="Bottleneck analysis across hierarchy" icon={Users} />
          <div className="px-2 pb-3" style={{ height: 240 }}>
            {approvalsData.length ? (
              <ResponsiveContainer>
                <BarChart data={approvalsData} margin={{ left: 0, right: 16, top: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="stage" stroke="#64748B" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="count" fill="#D4A017" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty label="No pending approvals" />}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Top Contractors by Award Value" subtitle="Cumulative awarded amount across projects" icon={Briefcase} />
          {d.topContractors?.length ? (
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase text-slate-500 border-y border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Contractor</th>
                  <th className="px-4 py-2 text-right font-semibold">Projects</th>
                  <th className="px-4 py-2 text-right font-semibold">Total Awarded</th>
                </tr>
              </thead>
              <tbody>
                {d.topContractors.map((c: any) => (
                  <tr key={c._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800 text-[13px]">{c.name || '—'}</div>
                      <div className="text-[10px] text-slate-500">{c.email}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{c.count}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-govt-navy">
                      {formatINR(c.totalAwarded, { compact: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty label="No awarded projects yet" />}
        </div>
      </div>

      {/* Row 4 — Audit log + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md">
          <ChartHeader
            title="Recent System Activity"
            subtitle="Last 10 audited actions across the platform"
            icon={Activity}
            action={<Link to="/audit" className="text-[11px] text-govt-navy hover:underline">View all logs →</Link>}
          />
          {d.recentAudits?.length ? (
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase text-slate-500 border-y border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Time</th>
                  <th className="px-4 py-2 text-left font-semibold">User</th>
                  <th className="px-4 py-2 text-left font-semibold">Role</th>
                  <th className="px-4 py-2 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {d.recentAudits.map((a: any) => (
                  <tr key={a._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2 text-[11px] text-slate-500 whitespace-nowrap">{formatDateTime(a.timestamp)}</td>
                    <td className="px-4 py-2 text-[12px]">{a.userName || '—'}</td>
                    <td className="px-4 py-2 text-[10px] text-slate-500">{a.userRole}</td>
                    <td className="px-4 py-2 font-mono text-[10px] text-slate-700">{a.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty label="No audit logs yet" />}
        </div>

        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="System Snapshot" subtitle="Department metrics" icon={AlertTriangle} />
          <div className="p-4 space-y-3 text-sm">
            <SnapshotRow label="Total Users" value={kpi.totalUsers} />
            <SnapshotRow label="Active Projects" value={kpi.activeProjects} />
            <SnapshotRow label="Completed Projects" value={kpi.completedProjects} />
            <SnapshotRow label="Delayed Projects" value={kpi.delayedProjects} alert />
            <SnapshotRow label="Bills Paid" value={kpi.billsPaidCount} />
            <SnapshotRow label="Budget Utilization" value={`${kpi.utilizationPercent || 0}%`} />

            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Link to="/users" className="text-[11px] text-center py-2 border border-slate-300 rounded hover:border-govt-navy hover:text-govt-navy transition">Manage Users</Link>
              <Link to="/audit" className="text-[11px] text-center py-2 border border-slate-300 rounded hover:border-govt-navy hover:text-govt-navy transition">Audit Logs</Link>
              <Link to="/projects" className="text-[11px] text-center py-2 border border-slate-300 rounded hover:border-govt-navy hover:text-govt-navy transition">All Projects</Link>
              <Link to="/approvals" className="text-[11px] text-center py-2 border border-slate-300 rounded hover:border-govt-navy hover:text-govt-navy transition">Approvals</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Kpi({ icon: Icon, label, value, sub, alert }: any) {
  return (
    <div className="px-4 py-3 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</span>
      </div>
      <div className="text-xl font-semibold text-slate-800 tabular-nums">{value ?? '—'}</div>
      {sub && (
        <div className={`text-[10px] mt-0.5 ${alert ? 'text-erp-danger' : 'text-slate-500'}`}>
          {sub}
        </div>
      )}
    </div>
  );
}

function ChartHeader({ title, subtitle, icon: Icon, action }: any) {
  return (
    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
        <div>
          <div className="text-[13px] font-semibold text-slate-800">{title}</div>
          {subtitle && <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

function SnapshotRow({ label, value, alert }: any) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[12px] text-slate-600">{label}</span>
      <span className={`text-[13px] font-semibold tabular-nums ${alert && Number(value) > 0 ? 'text-erp-danger' : 'text-slate-800'}`}>{value ?? 0}</span>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="text-center py-12 text-xs text-slate-400">{label}</div>
  );
}

/* Minimal custom tooltip — no shadow card, just subtle */
function TT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded shadow-sm px-2.5 py-1.5 text-[11px]">
      {label && <div className="font-medium text-slate-700 mb-0.5">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 tabular-nums">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-800">
            {typeof p.value === 'number' && p.value > 1e5 ? formatINR(p.value, { compact: true }) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
