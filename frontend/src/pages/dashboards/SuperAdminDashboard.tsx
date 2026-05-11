import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import api from '../../api/client';
import { formatINR } from '../../utils/format';
import {
  Building2, Users, Briefcase, CreditCard, Activity, AlertTriangle,
  ClipboardList, Headphones, Inbox, ChevronRight, Plus,
} from 'lucide-react';

const PALETTE = ['#0B3D91', '#1E5BC7', '#475569', '#D4A017', '#138808', '#7C3AED', '#C8102E'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function SuperAdminDashboard() {
  const [d, setD] = useState<any>(null);
  const [pendingRegs, setPendingRegs] = useState<any[]>([]);

  useEffect(() => {
    api.get('/system/stats').then((r) => setD(r.data.data));
    api.get('/registrations', { params: { status: 'PENDING' } }).then((r) => setPendingRegs(r.data.data?.slice(0, 5) || []));
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
  const monthlyRegs = (d.monthlyRegistrations || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Total: m.count,
    Approved: m.approved,
    Rejected: m.rejected,
  }));
  const subPieData = (d.subsByPlan || []).map((s: any) => ({ name: s._id, value: s.count, revenue: s.revenue }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Platform Administration · SaaS Console</div>
          <h1 className="text-xl font-semibold text-slate-800 font-gov">Super Admin Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Centralized monitoring of all organizations, subscriptions, finance, and platform health</p>
        </div>
        <div className="flex items-center gap-2">
          {k.pendingRegistrations > 0 && (
            <Link to="/admin/registrations" className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-md font-medium border border-amber-300 hover:bg-amber-200 flex items-center gap-1">
              <Inbox className="w-3.5 h-3.5" /> {k.pendingRegistrations} pending review
            </Link>
          )}
          <Link to="/admin/departments" className="btn-gov text-xs"><Plus className="w-4 h-4" /> Onboard</Link>
        </div>
      </div>

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 border border-slate-200 rounded-md bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <Kpi icon={Building2} label="Departments" value={k.totalDepts} sub={`${k.activeDepts} active · ${k.trialDepts} trial`} />
        <Kpi icon={Users} label="Total Users" value={k.totalUsers} sub={`${k.activeUsers} active`} />
        <Kpi icon={Briefcase} label="Projects" value={k.totalProjects} sub={`${k.activeProjects} in progress`} />
        <Kpi icon={ClipboardList} label="Open Tenders" value={k.openTenders} sub={`${k.totalTenders} total`} />
        <Kpi icon={CreditCard} label="Annual Revenue" value={formatINR(k.annualRevenue, { compact: true })} sub={`+${formatINR(k.monthlyRevenue, { compact: true })} this month`} />
      </div>

      {/* Action items strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link to="/admin/registrations" className="bg-white border border-amber-200 rounded-md p-4 hover:shadow-md transition flex items-center gap-3">
          <Inbox className="w-5 h-5 text-amber-600" />
          <div className="flex-1">
            <div className="text-[12px] text-slate-600">Pending Registrations</div>
            <div className="text-xl font-bold text-amber-600">{k.pendingRegistrations || 0}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
        <Link to="/admin/support" className="bg-white border border-blue-200 rounded-md p-4 hover:shadow-md transition flex items-center gap-3">
          <Headphones className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <div className="text-[12px] text-slate-600">Open Support Tickets</div>
            <div className="text-xl font-bold text-blue-600">{k.openSupportTickets || 0}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
        <Link to="/audit" className="bg-white border border-purple-200 rounded-md p-4 hover:shadow-md transition flex items-center gap-3">
          <Activity className="w-5 h-5 text-purple-600" />
          <div className="flex-1">
            <div className="text-[12px] text-slate-600">Actions (last 24 hrs)</div>
            <div className="text-xl font-bold text-purple-600">{k.last24hActions || 0}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Pending registrations preview */}
      {pendingRegs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-md">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-slate-800 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-600" /> Awaiting Your Review
              </div>
              <div className="text-[10px] text-slate-500">Self-registered organizations awaiting approval</div>
            </div>
            <Link to="/admin/registrations" className="text-[11px] text-govt-navy hover:underline">View all <ChevronRight className="w-3 h-3 inline" /></Link>
          </div>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-slate-500 border-b bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Organization</th>
                <th className="px-4 py-2 text-left font-semibold">Type</th>
                <th className="px-4 py-2 text-left font-semibold">Admin</th>
                <th className="px-4 py-2 text-left font-semibold">Plan</th>
                <th className="px-4 py-2 text-left font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {pendingRegs.map((r) => (
                <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-800 text-[13px]">{r.orgName}</div>
                    <div className="text-[10px] text-slate-500">{r.code} · {r.city}, {r.state}</div>
                  </td>
                  <td className="px-4 py-2.5 text-[11px]">{r.type}</td>
                  <td className="px-4 py-2.5 text-[12px]">{r.adminName}<div className="text-[10px] text-slate-500">{r.adminEmail}</div></td>
                  <td className="px-4 py-2.5"><span className="pill pill-info text-[10px]">{r.preferredPlan}</span></td>
                  <td className="px-4 py-2.5 text-[11px] text-slate-500">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Registration Trend" subtitle="Last 6 months · approved vs rejected" />
          <div className="px-2 pb-3" style={{ height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={monthlyRegs}>
                <defs>
                  <linearGradient id="totalG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B3D91" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0B3D91" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="Total" stroke="#0B3D91" strokeWidth={2} fill="url(#totalG)" />
                <Area type="monotone" dataKey="Approved" stroke="#138808" strokeWidth={2} fill="transparent" />
                <Area type="monotone" dataKey="Rejected" stroke="#C8102E" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Subscription Mix" subtitle="By plan · active subscriptions" />
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={subPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {subPieData.map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top departments + dept by type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Top Departments by Project Value" subtitle="Cumulative project budget" />
          {d.topDepartments?.length ? (
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase text-slate-500 border-y bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Department</th>
                  <th className="px-4 py-2 text-right font-semibold">Projects</th>
                  <th className="px-4 py-2 text-right font-semibold">Total Budget</th>
                </tr>
              </thead>
              <tbody>
                {d.topDepartments.map((t: any) => (
                  <tr key={t._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-[13px]">
                      <div className="font-medium">{t.name || '—'}</div>
                      <div className="text-[10px] text-slate-500">{t.type}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{t.projectCount}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-govt-navy">
                      {formatINR(t.totalBudget, { compact: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="p-12 text-center text-xs text-slate-400">No projects yet</div>}
        </div>

        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Departments by Type" subtitle="PWD, Irrigation, Public Health, etc." />
          <div className="px-2 pb-3" style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={d.deptByType?.map((x: any) => ({ type: x._id, count: x.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="type" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0B3D91" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink to="/admin/departments" icon={Building2} label="Departments" desc="All organizations" />
        <QuickLink to="/admin/subscriptions" icon={CreditCard} label="Subscriptions" desc="Plans & billing" />
        <QuickLink to="/admin/invoices" icon={CreditCard} label="Invoices" desc="Billing records" />
        <QuickLink to="/admin/support" icon={Headphones} label="Support" desc="Tickets & helpdesk" />
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="px-4 py-3 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</span>
      </div>
      <div className="text-xl font-semibold text-slate-800 tabular-nums">{value ?? '—'}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
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

function QuickLink({ to, icon: Icon, label, desc }: any) {
  return (
    <Link to={to} className="bg-white border border-slate-200 rounded-md p-4 hover:border-govt-navy transition">
      <Icon className="w-4 h-4 text-govt-navy mb-2" />
      <div className="text-[13px] font-semibold">{label}</div>
      <div className="text-[10px] text-slate-500">{desc}</div>
    </Link>
  );
}
