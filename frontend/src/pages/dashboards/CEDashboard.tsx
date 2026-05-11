import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../api/client';
import { formatINR } from '../../utils/format';
import {
  Briefcase, ClipboardList, AlertTriangle, TrendingUp, Wallet,
  ShieldCheck, Inbox, ChevronRight, MapPin, Building2, Activity,
  AlertCircle, BarChart3,
} from 'lucide-react';

const PALETTE = ['#0B3D91','#1E5BC7','#475569','#D4A017','#138808','#7C3AED','#C8102E'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function CEDashboard() {
  const [d, setD] = useState<any>(null);
  const [risk, setRisk] = useState<any>(null);

  useEffect(() => {
    api.get('/ce/dashboard').then((r) => setD(r.data.data));
    api.get('/ce/risk').then((r) => setRisk(r.data.data));
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
  const monthlyProj = (d.monthlyProjects || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Projects: m.count, Budget: m.budget,
  }));
  const monthlyPay = (d.monthlyPayments || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Amount: m.amount, Count: m.count,
  }));
  const statusData = (d.statusDist || []).map((s: any) => ({
    name: s._id?.replace(/_/g, ' '), value: s.count, budget: s.totalBudget,
  }));
  const districtData = (d.districtStats || []).map((x: any) => ({
    name: x._id?.district || 'Unspecified',
    state: x._id?.state,
    count: x.count, budget: x.budget,
    inProgress: x.inProgress, delayed: x.delayed,
  }));

  const totalRisk = (risk?.delayed?.length || 0) + (risk?.dueSoon?.length || 0)
    + (risk?.stalled?.length || 0) + (risk?.overrun?.length || 0);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Chief Engineer · Governance & Oversight
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Department Command Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Top-level monitoring of projects, tenders, finance, contractors, and engineering operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {k.pendingMyApprovals > 0 && (
            <Link to="/ce/approvals" className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-md font-medium border border-amber-300 hover:bg-amber-200 flex items-center gap-1">
              <Inbox className="w-3.5 h-3.5" /> {k.pendingMyApprovals} awaiting your approval
            </Link>
          )}
          <Link to="/ce/risk" className={`text-xs px-3 py-1.5 rounded-md font-medium border flex items-center gap-1 ${
            totalRisk > 0 ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100' : 'bg-green-50 text-green-700 border-green-300'
          }`}>
            <AlertTriangle className="w-3.5 h-3.5" /> {totalRisk} risk{totalRisk !== 1 ? 's' : ''}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 border border-slate-200 rounded-md bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <Kpi icon={Briefcase} label="Total Projects" value={k.totalProjects} sub={`${k.inProgress} active · ${k.completed} done`} />
        <Kpi icon={ClipboardList} label="Tenders" value={k.totalTenders} sub={`${k.openTenders} open · ${k.evaluationTenders} in evaluation`} />
        <Kpi icon={Wallet} label="Total Budget" value={formatINR(k.totalBudget, { compact: true })} sub={`${k.utilizationPercent}% utilized`} />
        <Kpi icon={AlertTriangle} label="Delayed" value={k.delayed} sub={`${k.delayPercent}% of active`} alert={k.delayed > 0} />
        <Kpi icon={Inbox} label="My Approvals" value={k.pendingMyApprovals} sub={k.pendingMyApprovals > 0 ? 'requires action' : 'all clear'} alert={k.pendingMyApprovals > 0} />
      </div>

      {totalRisk > 0 && risk && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <RiskTile to="/ce/risk?tab=delayed" icon={AlertCircle} label="Delayed Projects" value={risk.delayed.length} color="red" />
          <RiskTile to="/ce/risk?tab=due" icon={ChevronRight} label="Due in 30 days" value={risk.dueSoon.length} color="amber" />
          <RiskTile to="/ce/risk?tab=stalled" icon={Activity} label="Stalled (no MB 30d)" value={risk.stalled.length} color="orange" />
          <RiskTile to="/ce/risk?tab=overrun" icon={TrendingUp} label="Cost Overruns" value={risk.overrun.length} color="purple" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Project Pipeline" subtitle="6-month rolling — new proposals & sanctions" />
          <div className="px-2 pb-3" style={{ height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={monthlyProj}>
                <defs>
                  <linearGradient id="ceProjG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B3D91" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0B3D91" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="Projects" stroke="#0B3D91" strokeWidth={2} fill="url(#ceProjG)" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="District-wise Project Budget" subtitle="Top 10 districts by allocated budget" />
          <div className="px-2 pb-3" style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={districtData} layout="vertical" margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" stroke="#64748B" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1e7).toFixed(0)}Cr`} />
                <YAxis type="category" dataKey="name" stroke="#64748B" tick={{ fontSize: 10 }} width={110} />
                <Tooltip formatter={(v: any) => formatINR(v, { compact: true })} />
                <Bar dataKey="budget" fill="#0B3D91" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Treasury Disbursement" subtitle="Monthly payments released" />
          <div className="px-2 pb-3" style={{ height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={monthlyPay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1e7).toFixed(1)}Cr`} />
                <Tooltip formatter={(v: any) => formatINR(v, { compact: true })} />
                <Line type="monotone" dataKey="Amount" stroke="#138808" strokeWidth={2.5} dot={{ r: 3, fill: '#138808' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="District / Division Analytics" subtitle="Project distribution and risk per district" />
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-slate-500 border-y bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">District</th>
                <th className="px-4 py-2 text-right font-semibold">Projects</th>
                <th className="px-4 py-2 text-right font-semibold">Active</th>
                <th className="px-4 py-2 text-right font-semibold">Delayed</th>
                <th className="px-4 py-2 text-right font-semibold">Budget</th>
              </tr>
            </thead>
            <tbody>
              {districtData.map((dt: any, i: number) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 text-[13px]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <strong>{dt.name}</strong>
                    </div>
                    <div className="text-[10px] text-slate-500">{dt.state}</div>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{dt.count}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{dt.inProgress}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {dt.delayed > 0 ? <span className="text-erp-danger font-semibold">{dt.delayed}</span> : '—'}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-govt-navy">
                    {formatINR(dt.budget, { compact: true })}
                  </td>
                </tr>
              ))}
              {!districtData.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No district data yet</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Top Contractors" subtitle="By cumulative awarded value" />
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-slate-500 border-y bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Contractor</th>
                <th className="px-4 py-2 text-right font-semibold">Projects</th>
                <th className="px-4 py-2 text-right font-semibold">On-time</th>
                <th className="px-4 py-2 text-right font-semibold">Awarded</th>
              </tr>
            </thead>
            <tbody>
              {(d.contractorStats || []).map((c: any) => (
                <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 text-[13px] font-medium">{c.name || '—'}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{c.projectCount}</td>
                  <td className="px-4 py-2 text-right">
                    {c.delayed > 0 ? <span className="text-erp-danger text-xs">{c.delayed} delayed</span> : <span className="text-govt-green text-xs">✓ On track</span>}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-govt-navy">{formatINR(c.totalAwarded, { compact: true })}</td>
                </tr>
              ))}
              {!d.contractorStats?.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400">No contractor data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <QuickLink to="/ce/approvals" icon={Inbox} label="High-Value Approvals" badge={k.pendingMyApprovals} />
        <QuickLink to="/ce/risk" icon={AlertTriangle} label="Risk Dashboard" badge={totalRisk} alert />
        <QuickLink to="/ce/financial" icon={Wallet} label="Financial Monitor" />
        <QuickLink to="/ce/engineers" icon={Building2} label="Engineer Performance" />
        <QuickLink to="/audit" icon={ShieldCheck} label="Audit Logs" />
        <QuickLink to="/reports" icon={BarChart3} label="Reports" />
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

function RiskTile({ to, icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    red: 'border-red-200 hover:border-red-400 text-erp-danger',
    amber: 'border-amber-200 hover:border-amber-400 text-amber-600',
    orange: 'border-orange-200 hover:border-orange-400 text-orange-600',
    purple: 'border-purple-200 hover:border-purple-400 text-purple-600',
  };
  return (
    <Link to={to} className={`bg-white border rounded-md p-3 transition flex items-center gap-3 ${colors[color]}`}>
      <Icon className="w-4 h-4" />
      <div className="flex-1">
        <div className="text-[11px] text-slate-600">{label}</div>
        <div className="text-lg font-bold tabular-nums">{value || 0}</div>
      </div>
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

function QuickLink({ to, icon: Icon, label, badge, alert }: any) {
  return (
    <Link to={to} className="bg-white border border-slate-200 rounded-md p-3 hover:border-govt-navy transition text-center relative">
      <Icon className="w-5 h-5 text-govt-navy mx-auto mb-2" />
      <div className="text-[12px] font-semibold">{label}</div>
      {badge !== undefined && badge > 0 && (
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 rounded-full ${alert ? 'bg-erp-danger text-white' : 'bg-amber-100 text-amber-700'}`}>
          {badge}
        </span>
      )}
    </Link>
  );
}
