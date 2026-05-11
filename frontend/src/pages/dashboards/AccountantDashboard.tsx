import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../api/client';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR, formatDate } from '../../utils/format';
import {
  Wallet, Receipt, IndianRupee, TrendingUp, Inbox, ChevronRight,
  CheckCircle2, AlertTriangle, FileText, Activity, Users, BarChart3,
} from 'lucide-react';

const PALETTE = ['#0B3D91','#1E5BC7','#D4A017','#7C3AED','#138808','#C8102E'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AccountantDashboard() {
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    api.get('/acc/dashboard').then((r) => setD(r.data.data));
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
  const ded = d.deductions || {};
  const monthlyPay = (d.monthlyPayments || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Amount: m.amount, Count: m.count,
  }));
  const monthlyDed = (d.monthlyDeductions || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    GST: m.gst, TDS: m.tds, Security: m.security, Total: m.total,
  }));
  const dedPie = [
    { name: 'GST', value: ded.gst || 0 },
    { name: 'TDS', value: ded.tds || 0 },
    { name: 'Security', value: ded.security || 0 },
    { name: 'Retention', value: ded.retention || 0 },
    { name: 'Other', value: ded.other || 0 },
  ].filter((x) => x.value > 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Accountant / Finance · Bill Verification & Treasury
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Finance Operations Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bill verification · GST/TDS deductions · Payment release · Budget monitoring · Compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {k.billsPendingMyApproval > 0 && (
            <Link to="/acc/bill-queue" className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-md font-medium border border-amber-300 hover:bg-amber-200 flex items-center gap-1">
              <Inbox className="w-3.5 h-3.5" /> {k.billsPendingMyApproval} bills awaiting verification
            </Link>
          )}
          <Link to="/payments" className="btn-gov text-xs">
            <Wallet className="w-4 h-4" /> Release Payment
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 border border-slate-200 rounded-md bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <Kpi icon={Inbox} label="My Bill Queue" value={k.billsPendingMyApproval} sub={k.billsPendingMyApproval > 0 ? 'requires verification' : 'all clear'} alert={k.billsPendingMyApproval > 0} />
        <Kpi icon={Receipt} label="Pending Payout" value={formatINR(k.pendingPayout, { compact: true })} sub={`${k.billsTreasuryPending} at treasury`} />
        <Kpi icon={Wallet} label="Total Paid" value={formatINR(k.totalPaid, { compact: true })} sub={`${k.billsPaid} bills paid`} />
        <Kpi icon={TrendingUp} label="This Month" value={formatINR(k.thisMonthPaid, { compact: true })} sub={`${k.thisMonthBillsPaid} bills`} />
        <Kpi icon={IndianRupee} label="Total Deductions" value={formatINR(k.totalDeductions, { compact: true })} sub={`+${formatINR(k.thisMonthDeductions, { compact: true })} this month`} />
      </div>

      {/* Tax deductions strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <DedCard label="GST Collected" value={ded.gst} subtotal={k.thisMonthGST} icon="GST" color="text-blue-700 bg-blue-50 border-blue-200" />
        <DedCard label="TDS Withheld" value={ded.tds} subtotal={k.thisMonthTDS} icon="TDS" color="text-purple-700 bg-purple-50 border-purple-200" />
        <DedCard label="Security Deposits" value={ded.security} icon="SEC" color="text-amber-700 bg-amber-50 border-amber-200" />
        <DedCard label="Retention" value={ded.retention} icon="RET" color="text-pink-700 bg-pink-50 border-pink-200" />
        <DedCard label="Other Deductions" value={ded.other} icon="OTH" color="text-slate-700 bg-slate-50 border-slate-200" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Payments Released · Last 6 Months" subtitle="Treasury disbursement trend" />
          <div className="px-2 pb-3" style={{ height: 260 }}>
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
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Deductions Mix" subtitle="By tax type" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dedPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {dedPie.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatINR(v, { compact: true })} />
                <Legend verticalAlign="bottom" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 — monthly deductions stacked */}
      <div className="bg-white border border-slate-200 rounded-md">
        <ChartHeader title="Monthly Deductions Breakdown" subtitle="GST / TDS / Security trends" />
        <div className="px-2 pb-3" style={{ height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={monthlyDed}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1e5).toFixed(0)}L`} />
              <Tooltip formatter={(v: any) => formatINR(v, { compact: true })} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              <Bar dataKey="GST" stackId="a" fill="#1E5BC7" />
              <Bar dataKey="TDS" stackId="a" fill="#7C3AED" />
              <Bar dataKey="Security" stackId="a" fill="#D4A017" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bills + Payments + Top Contractors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Recent Bills" subtitle="Latest submissions across statuses" />
          {d.recentBills?.length ? (
            <div className="divide-y divide-slate-100">
              {d.recentBills.map((b: any) => (
                <Link key={b._id} to={`/bills/${b._id}`} className="block p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium truncate flex-1">{b.billNumber}</span>
                    <StatusPill status={b.status} />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {b.contractor?.companyName || b.contractor?.name} · {formatINR(b.netPayable, { compact: true })}
                  </div>
                </Link>
              ))}
            </div>
          ) : <div className="p-8 text-center text-xs text-slate-400">No bills yet</div>}
        </div>

        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Recent Payments" subtitle="Last 5 payments released" />
          {d.recentPayments?.length ? (
            <div className="divide-y divide-slate-100">
              {d.recentPayments.map((p: any) => (
                <Link key={p._id} to="/payments" className="block p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium truncate flex-1">{p.bill?.billNumber}</span>
                    <span className="pill pill-approved text-[10px]">{p.paymentMode}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {p.contractor?.companyName || p.contractor?.name} · {formatINR(p.amount, { compact: true })}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">{p.utrNumber}</div>
                </Link>
              ))}
            </div>
          ) : <div className="p-8 text-center text-xs text-slate-400">No payments yet</div>}
        </div>

        <div className="bg-white border border-slate-200 rounded-md">
          <ChartHeader title="Top Contractors Paid" subtitle="By cumulative payments" />
          {d.topContractorsByPaid?.length ? (
            <div className="divide-y divide-slate-100">
              {d.topContractorsByPaid.map((c: any) => (
                <div key={c._id} className="p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium truncate flex-1">{c.name || '—'}</span>
                    <span className="text-[12px] font-bold tabular-nums text-govt-green">{formatINR(c.totalPaid, { compact: true })}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{c.paymentCount} payment{c.paymentCount !== 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          ) : <div className="p-8 text-center text-xs text-slate-400">No payment data</div>}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <QuickLink to="/acc/bill-queue" icon={Inbox} label="Bill Queue" badge={k.billsPendingMyApproval} />
        <QuickLink to="/acc/deductions" icon={BarChart3} label="GST/TDS" />
        <QuickLink to="/acc/budget" icon={Wallet} label="Budget Monitor" />
        <QuickLink to="/acc/contractor-payments" icon={Users} label="Contractor Payments" />
        <QuickLink to="/payments" icon={Receipt} label="Payments" />
        <QuickLink to="/audit" icon={Activity} label="Audit Logs" />
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

function DedCard({ label, value, subtotal, icon, color }: any) {
  return (
    <div className={`border rounded-md p-3 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase font-semibold">{label}</span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white">{icon}</span>
      </div>
      <div className="text-base font-bold tabular-nums">{formatINR(value, { compact: true })}</div>
      {subtotal != null && <div className="text-[9px] mt-0.5 opacity-75">+{formatINR(subtotal, { compact: true })} this month</div>}
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
