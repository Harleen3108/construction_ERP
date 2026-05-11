import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR } from '../../utils/format';
import {
  Wallet, TrendingUp, TrendingDown, Receipt, IndianRupee, ArrowDownRight, ArrowUpRight,
} from 'lucide-react';

const PALETTE = ['#0B3D91','#138808','#D4A017','#7C3AED','#1E5BC7','#C8102E'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function FinancialMonitoringPage() {
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    api.get('/ce/financial').then((r) => setD(r.data.data));
  }, []);

  if (!d) return <div className="p-12 text-center text-slate-400">Loading financial data...</div>;

  const s = d.summary || {};
  const ded = d.deductions || {};
  const monthly = (d.monthlyDeductions || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Gross: m.gross, Deductions: m.deductions, NetPaid: m.netPaid,
  }));
  const deductionsPie = [
    { name: 'GST', value: ded.gst || 0 },
    { name: 'TDS', value: ded.tds || 0 },
    { name: 'Security', value: ded.security || 0 },
    { name: 'Retention', value: ded.retention || 0 },
    { name: 'Other', value: ded.other || 0 },
  ].filter((x) => x.value > 0);
  const billsByStatus = (d.billsByStatus || []).map((b: any) => ({
    name: b._id?.replace(/_/g, ' '), count: b.count, total: b.total,
  }));

  return (
    <div>
      <PageHeader
        title="Financial Monitoring"
        subtitle="Department-wide budget, awarded amounts, billing pipeline, and deductions analysis"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Card label="Total Budget" value={formatINR(s.totalBudget, { compact: true })} icon={Wallet} color="text-slate-800" />
        <Card label="Total Awarded" value={formatINR(s.totalAwarded, { compact: true })} icon={Receipt} color="text-govt-navy" />
        <Card label="Total Billed" value={formatINR(s.totalBilled, { compact: true })} icon={IndianRupee} color="text-amber-600" />
        <Card label="Total Paid" value={formatINR(s.totalPaid, { compact: true })} icon={TrendingUp} color="text-govt-green" />
        <Card label="Tender Savings" value={formatINR(s.savings, { compact: true })} icon={ArrowDownRight} color={s.savings >= 0 ? 'text-govt-green' : 'text-erp-danger'} sub={s.totalBudget ? `${Math.round(((s.savings || 0) / s.totalBudget) * 100)}%` : ''} />
      </div>

      {/* Deductions overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="card-gov">
          <div className="card-gov-header"><h3 className="font-semibold text-sm">Deductions Breakdown</h3></div>
          <div className="p-3" style={{ height: 220 }}>
            {deductionsPie.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={deductionsPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                    {deductionsPie.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatINR(v, { compact: true })} />
                  <Legend verticalAlign="bottom" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-xs text-slate-400">No deductions data yet</div>}
          </div>
          <div className="p-3 border-t border-slate-100 grid grid-cols-2 gap-1 text-[11px]">
            <div className="flex justify-between"><span className="text-slate-500">GST</span><span className="font-medium tabular-nums">{formatINR(ded.gst, { compact: true })}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">TDS</span><span className="font-medium tabular-nums">{formatINR(ded.tds, { compact: true })}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Security</span><span className="font-medium tabular-nums">{formatINR(ded.security, { compact: true })}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Retention</span><span className="font-medium tabular-nums">{formatINR(ded.retention, { compact: true })}</span></div>
            <div className="col-span-2 flex justify-between pt-1 border-t font-semibold"><span>Total Deducted</span><span className="text-govt-navy tabular-nums">{formatINR(ded.total, { compact: true })}</span></div>
          </div>
        </div>

        <div className="card-gov lg:col-span-2">
          <div className="card-gov-header"><h3 className="font-semibold text-sm">Cash Flow · Last 6 Months</h3></div>
          <div className="px-2 pb-3" style={{ height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1e7).toFixed(1)}Cr`} />
                <Tooltip formatter={(v: any) => formatINR(v, { compact: true })} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="Gross" stroke="#0B3D91" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Deductions" stroke="#C8102E" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="NetPaid" stroke="#138808" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bills by status + Top projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="card-gov">
          <div className="card-gov-header"><h3 className="font-semibold text-sm">Bills Pipeline</h3></div>
          <div className="px-2 pb-3" style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={billsByStatus} layout="vertical" margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#64748B" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#1E5BC7" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-gov">
          <div className="card-gov-header"><h3 className="font-semibold text-sm">Top Projects by Budget</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-3 py-2 text-[10px] uppercase">Project</th>
                  <th className="px-3 py-2 text-[10px] uppercase text-right">Budget</th>
                  <th className="px-3 py-2 text-[10px] uppercase text-right">Awarded</th>
                  <th className="px-3 py-2 text-[10px] uppercase text-right">Final</th>
                </tr>
              </thead>
              <tbody>
                {(d.topProjectsByBudget || []).slice(0, 8).map((p: any) => {
                  const overrun = p.finalCost && p.estimatedCost ? ((p.finalCost - p.estimatedCost) / p.estimatedCost) * 100 : 0;
                  return (
                    <tr key={p._id} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2.5 text-[12px]">
                        <Link to={`/projects/${p._id}`} className="font-medium text-govt-navy hover:underline">{p.name}</Link>
                        <div className="text-[10px] text-slate-500">{p.status}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatINR(p.estimatedCost, { compact: true })}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatINR(p.awardedAmount, { compact: true })}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {p.finalCost ? (
                          <>
                            {formatINR(p.finalCost, { compact: true })}
                            {overrun > 5 && <div className="text-[10px] text-erp-danger">+{overrun.toFixed(1)}%</div>}
                          </>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
                {!d.topProjectsByBudget?.length && <tr><td colSpan={4} className="px-3 py-12 text-center text-slate-400">No projects yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, icon: Icon, color, sub }: any) {
  return (
    <div className="card-gov p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase text-slate-500">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
