import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR, formatDate } from '../../utils/format';
import { Download, Wallet, Receipt, Clock4 } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function EarningsPage() {
  const [d, setD] = useState<any>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => {
    const params: any = {};
    if (from) params.fromDate = from;
    if (to) params.toDate = to;
    api.get('/cont/earnings', { params }).then((r) => setD(r.data.data));
  };
  useEffect(() => { load(); }, []);

  if (!d) return <div className="p-12 text-center text-slate-400">Loading earnings...</div>;

  const byMonth = (d.byMonth || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    Amount: m.amount,
  }));

  const totalPending = (d.pendingBills || []).reduce((s: number, b: any) => s + (b.netPayable || 0), 0);

  return (
    <div>
      <PageHeader
        title="My Earnings"
        subtitle="Track every payment received, pending bills, deductions, and project-wise earnings"
        actions={<button className="btn-gov-outline text-xs"><Download className="w-3.5 h-3.5" /> Export</button>}
      />

      <div className="card-gov p-3 mb-4 flex items-end gap-3 flex-wrap">
        <div>
          <label className="text-[10px] uppercase text-slate-500">From</label>
          <input type="date" className="input-gov w-44" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] uppercase text-slate-500">To</label>
          <input type="date" className="input-gov w-44" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button onClick={load} className="btn-gov text-xs">Apply</button>
        <button onClick={() => { setFrom(''); setTo(''); setTimeout(load, 0); }} className="btn-gov-outline text-xs">Reset</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <Stat label="Total Received" value={formatINR(d.summary?.total, { compact: true })} icon={Wallet} color="text-govt-green" />
        <Stat label="Payments Received" value={d.summary?.count || 0} icon={Receipt} />
        <Stat label="Pending Payout" value={formatINR(totalPending, { compact: true })} icon={Clock4} color="text-amber-600" />
      </div>

      {/* Monthly earnings */}
      <div className="card-gov mb-5">
        <div className="card-gov-header">
          <h3 className="font-semibold text-sm">Monthly Earnings</h3>
        </div>
        <div className="px-2 pb-3" style={{ height: 260 }}>
          {byMonth.length ? (
            <ResponsiveContainer>
              <BarChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1e5).toFixed(0)}L`} />
                <Tooltip formatter={(v: any) => formatINR(v, { compact: true })} />
                <Bar dataKey="Amount" fill="#138808" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-full flex items-center justify-center text-xs text-slate-400">No earnings data</div>}
        </div>
      </div>

      {/* By Project + Recent payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="card-gov">
          <div className="card-gov-header"><h3 className="font-semibold text-sm">Earnings by Project</h3></div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2 text-[10px] uppercase">Project</th>
                <th className="px-3 py-2 text-[10px] uppercase text-right">Payments</th>
                <th className="px-3 py-2 text-[10px] uppercase text-right">Received</th>
              </tr>
            </thead>
            <tbody>
              {(d.byProject || []).map((p: any) => (
                <tr key={p._id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2.5 text-[13px]">
                    <div className="font-medium">{p.projectName || '—'}</div>
                    <div className="text-[10px] text-slate-500">Awarded: {formatINR(p.awardedAmount, { compact: true })}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{p.count}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-govt-green">{formatINR(p.total, { compact: true })}</td>
                </tr>
              ))}
              {!d.byProject?.length && <tr><td colSpan={3} className="px-3 py-8 text-center text-slate-400">No project earnings yet</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card-gov">
          <div className="card-gov-header"><h3 className="font-semibold text-sm">Recent Payment Receipts</h3></div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2 text-[10px] uppercase">UTR / Date</th>
                <th className="px-3 py-2 text-[10px] uppercase">Bill</th>
                <th className="px-3 py-2 text-[10px] uppercase text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {(d.recentPayments || []).map((p: any) => (
                <tr key={p._id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <div className="text-[11px] font-mono">{p.utrNumber}</div>
                    <div className="text-[10px] text-slate-500">{formatDate(p.paymentDate)}</div>
                  </td>
                  <td className="px-3 py-2.5 text-[12px]">{p.bill?.billNumber}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-govt-green">{formatINR(p.amount, { compact: true })}</td>
                </tr>
              ))}
              {!d.recentPayments?.length && <tr><td colSpan={3} className="px-3 py-8 text-center text-slate-400">No payments yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending bills */}
      <div className="card-gov">
        <div className="card-gov-header">
          <h3 className="font-semibold text-sm">Pending Bills (Awaiting Payment)</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-[10px] uppercase">Bill</th>
              <th className="px-4 py-2.5 text-[10px] uppercase">Project</th>
              <th className="px-4 py-2.5 text-[10px] uppercase">Submitted</th>
              <th className="px-4 py-2.5 text-[10px] uppercase text-right">Gross</th>
              <th className="px-4 py-2.5 text-[10px] uppercase text-right">Deductions</th>
              <th className="px-4 py-2.5 text-[10px] uppercase text-right">Net</th>
              <th className="px-4 py-2.5 text-[10px] uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {(d.pendingBills || []).map((b: any) => (
              <tr key={b._id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3"><Link to={`/bills/${b._id}`} className="font-mono text-xs text-govt-navy hover:underline">{b.billNumber}</Link></td>
                <td className="px-4 py-3">{b.project?.name}</td>
                <td className="px-4 py-3 text-xs">{formatDate(b.submittedAt || b.createdAt)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatINR(b.currentBillAmount, { compact: true })}</td>
                <td className="px-4 py-3 text-right tabular-nums text-erp-danger">- {formatINR(b.totalDeductions, { compact: true })}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-govt-green">{formatINR(b.netPayable, { compact: true })}</td>
                <td className="px-4 py-3"><StatusPill status={b.status} /></td>
              </tr>
            ))}
            {!d.pendingBills?.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No pending bills</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, color = 'text-slate-800' }: any) {
  return (
    <div className="card-gov p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-slate-500 uppercase">{label}</div>
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
      </div>
      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
