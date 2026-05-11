import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import api from '../../api/client';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR, formatDate } from '../../utils/format';
import {
  Megaphone, Send, Award, Briefcase, Wallet, Receipt, Clock4,
  Activity, BadgeCheck, AlertTriangle, ChevronRight, FileText,
  TrendingUp, Hammer, Inbox,
} from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ContractorDashboard() {
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    api.get('/cont/dashboard').then((r) => setD(r.data.data));
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
  const monthly = (d.monthlyEarnings || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Earnings: m.amount,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Contractor Workspace
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Execution & Earnings Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bid on tenders · execute projects · raise bills · track payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {k.pendingWOAcceptance > 0 && (
            <Link to="/work-orders" className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-md font-medium border border-amber-300 hover:bg-amber-200 flex items-center gap-1">
              <Inbox className="w-3.5 h-3.5" /> {k.pendingWOAcceptance} Work Order to accept
            </Link>
          )}
          <Link to="/tenders/published" className="btn-gov text-xs">
            <Megaphone className="w-4 h-4" /> Browse Tenders
          </Link>
        </div>
      </div>

      {/* Verification status banner */}
      {!k.contractorVerified && (
        <div className="bg-amber-50 border border-amber-300 rounded-md p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <strong className="text-amber-900">Your account is not yet verified.</strong>
            <span className="text-amber-700 ml-2 text-xs">
              Complete your profile and upload required documents. A Department Admin must verify your company before you can bid.
            </span>
          </div>
          <Link to="/contractor/profile" className="text-xs text-amber-900 font-semibold hover:underline whitespace-nowrap">Complete Profile →</Link>
        </div>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 border border-slate-200 rounded-md bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <Kpi icon={Megaphone} label="Open Tenders" value={k.availableTenders} sub="available to bid" />
        <Kpi icon={Send} label="My Bids" value={k.myBids} sub={`${k.wonBids} won · ${k.winRate}% win rate`} />
        <Kpi icon={Briefcase} label="Active Projects" value={k.activeProjects} sub={`${k.awardedProjects} total awarded`} />
        <Kpi icon={Wallet} label="Total Earned" value={formatINR(k.totalEarned, { compact: true })} sub={`+${formatINR(k.thisMonthEarned, { compact: true })} this month`} />
        <Kpi icon={Clock4} label="Pending Payout" value={formatINR(k.pendingPayout, { compact: true })} sub={`${k.billsPending} bills in process`} />
      </div>

      {/* Deductions strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DedCard label="GST Paid (Withheld)" value={k.gstPaid} icon="GST" color="bg-blue-50 text-blue-700 border-blue-200" />
        <DedCard label="TDS Deducted" value={k.tdsPaid} icon="TDS" color="bg-purple-50 text-purple-700 border-purple-200" />
        <DedCard label="Security Held" value={k.securityHeld} icon="SEC" color="bg-amber-50 text-amber-700 border-amber-200" />
        <DedCard label="Total Deductions" value={k.totalDeductions} icon="ALL" color="bg-slate-100 text-slate-800 border-slate-300" bold />
      </div>

      {/* Earnings trend chart */}
      <div className="bg-white border border-slate-200 rounded-md">
        <ChartHeader title="Earnings · Last 6 Months" subtitle="Net payments received" />
        <div className="px-2 pb-3" style={{ height: 240 }}>
          <ResponsiveContainer>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="earnG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#138808" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#138808" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1e5).toFixed(0)}L`} />
              <Tooltip formatter={(v: any) => formatINR(v, { compact: true })} />
              <Area type="monotone" dataKey="Earnings" stroke="#138808" strokeWidth={2.5} fill="url(#earnG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active projects */}
      <div className="bg-white border border-slate-200 rounded-md">
        <ChartHeader title="My Active Projects" subtitle="Currently in execution" />
        {d.activeProjectsList?.length ? (
          <div className="divide-y divide-slate-100">
            {d.activeProjectsList.map((p: any) => (
              <Link key={p._id} to={`/projects/${p._id}`} className="block p-4 hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-govt-navy/10 text-govt-navy flex items-center justify-center flex-shrink-0">
                    <Hammer className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      📍 {p.location} · Awarded {formatINR(p.awardedAmount, { compact: true })}
                      {p.endDate && <> · Ends {formatDate(p.endDate)}</>}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="bg-govt-green h-full" style={{ width: `${p.overallProgress || 0}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums">{p.overallProgress || 0}%</span>
                    </div>
                  </div>
                  {p.workOrder && !p.workOrder.acceptedByContractor && (
                    <span className="pill pill-pending text-[10px]">Accept WO</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No active projects yet</p>
            <Link to="/tenders/published" className="text-xs text-govt-navy hover:underline mt-1 inline-block">
              Browse open tenders →
            </Link>
          </div>
        )}
      </div>

      {/* Recent activity feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Feed title="Recent Bids" icon={Send} items={d.recentBids} renderItem={(b: any) => (
          <Link to={`/tenders/${b.tender?._id}`} className="block p-3 hover:bg-slate-50 rounded">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium truncate flex-1">{b.tender?.title}</span>
              {b.isL1 && <span className="pill pill-l1 text-[9px]">L1</span>}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {formatINR(b.quotedAmount, { compact: true })} · {b.status}
            </div>
          </Link>
        )} />

        <Feed title="Recent Bills" icon={Receipt} items={d.recentBills} renderItem={(b: any) => (
          <Link to={`/bills/${b._id}`} className="block p-3 hover:bg-slate-50 rounded">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium truncate flex-1">{b.billNumber}</span>
              <StatusPill status={b.status} />
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {b.project?.name} · {formatINR(b.netPayable, { compact: true })}
            </div>
          </Link>
        )} />

        <Feed title="Recent Payments" icon={Wallet} items={d.recentPayments} renderItem={(p: any) => (
          <div className="p-3 hover:bg-slate-50 rounded">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium truncate flex-1">{p.bill?.billNumber}</span>
              <span className="text-[12px] font-bold tabular-nums text-govt-green">{formatINR(p.amount, { compact: true })}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {formatDate(p.paymentDate)} · <span className="font-mono">{p.utrNumber}</span>
            </div>
          </div>
        )} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <QuickLink to="/tenders/published" icon={Megaphone} label="Open Tenders" />
        <QuickLink to="/bids" icon={Send} label="My Bids" />
        <QuickLink to="/contractor/projects" icon={Briefcase} label="My Projects" />
        <QuickLink to="/contractor/earnings" icon={TrendingUp} label="Earnings" />
        <QuickLink to="/bills/new" icon={Receipt} label="Raise Bill" />
        <QuickLink to="/contractor/profile" icon={BadgeCheck} label="Profile" alert={k.docCompliance < 100} />
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
      {sub && <div className="text-[10px] mt-0.5 text-slate-500">{sub}</div>}
    </div>
  );
}

function DedCard({ label, value, icon, color, bold }: any) {
  return (
    <div className={`border rounded-md p-3 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase font-semibold">{label}</span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/70">{icon}</span>
      </div>
      <div className={`text-base tabular-nums ${bold ? 'font-bold' : 'font-semibold'}`}>{formatINR(value, { compact: true })}</div>
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

function Feed({ title, icon: Icon, items, renderItem }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-md">
      <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[11px] font-semibold text-slate-700">{title}</span>
      </div>
      <div className="p-1">
        {items?.length ? items.map((i: any, idx: number) => <div key={idx}>{renderItem(i)}</div>)
          : <div className="p-6 text-center text-[10px] text-slate-400">Nothing yet</div>}
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, alert }: any) {
  return (
    <Link to={to} className="bg-white border border-slate-200 rounded-md p-3 hover:border-govt-navy transition text-center relative">
      <Icon className="w-5 h-5 text-govt-navy mx-auto mb-2" />
      <div className="text-[12px] font-semibold">{label}</div>
      {alert && <span className="absolute top-2 right-2 w-2 h-2 bg-erp-danger rounded-full" />}
    </Link>
  );
}
