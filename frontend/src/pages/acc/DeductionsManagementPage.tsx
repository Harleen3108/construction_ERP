import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR } from '../../utils/format';
import { Download, BarChart3, FileText, IndianRupee } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DeductionsManagementPage() {
  const [d, setD] = useState<any>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => {
    const params: any = {};
    if (from) params.fromDate = from;
    if (to) params.toDate = to;
    api.get('/acc/deductions', { params }).then((r) => setD(r.data.data));
  };

  useEffect(() => { load(); }, []);

  if (!d) return <div className="p-12 text-center text-slate-400">Loading...</div>;

  const totals = d.totals || {};
  const byMonth = (d.byMonth || []).map((m: any) => ({
    label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
    GST: m.gst, TDS: m.tds, Security: m.security, Retention: m.retention, Total: m.total,
  }));

  return (
    <div>
      <PageHeader
        title="GST / TDS Deductions Management"
        subtitle="Complete deductions report — by month, by tax type, by contractor — for tax filing & audit"
        actions={
          <button className="btn-gov-outline text-xs">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        }
      />

      {/* Date range filter */}
      <div className="card-gov p-3 mb-4 flex items-end gap-3 flex-wrap">
        <div>
          <label className="text-[10px] uppercase text-slate-500">From</label>
          <input type="date" className="input-gov w-44" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] uppercase text-slate-500">To</label>
          <input type="date" className="input-gov w-44" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button onClick={load} className="btn-gov text-xs">Apply Filter</button>
        <button onClick={() => { setFrom(''); setTo(''); setTimeout(load, 0); }} className="btn-gov-outline text-xs">Reset</button>
        <div className="ml-auto text-[11px] text-slate-500">
          Showing data from {totals.billCount || 0} paid bill{totals.billCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        <SumCard label="GST" value={totals.gst} color="bg-blue-50 text-blue-700 border-blue-200" />
        <SumCard label="TDS" value={totals.tds} color="bg-purple-50 text-purple-700 border-purple-200" />
        <SumCard label="Security" value={totals.security} color="bg-amber-50 text-amber-700 border-amber-200" />
        <SumCard label="Retention" value={totals.retention} color="bg-pink-50 text-pink-700 border-pink-200" />
        <SumCard label="Other" value={totals.other} color="bg-slate-50 text-slate-700 border-slate-200" />
        <SumCard label="TOTAL" value={totals.total} color="bg-govt-navy text-white border-govt-navy" bold />
      </div>

      {/* Monthly trend chart */}
      <div className="card-gov mb-5">
        <div className="card-gov-header">
          <h3 className="font-semibold text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Monthly Deductions Breakdown</h3>
        </div>
        <div className="px-2 pb-3" style={{ height: 320 }}>
          {byMonth.length ? (
            <ResponsiveContainer>
              <BarChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1e5).toFixed(0)}L`} />
                <Tooltip formatter={(v: any) => formatINR(v, { compact: true })} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Bar dataKey="GST" stackId="a" fill="#1E5BC7" />
                <Bar dataKey="TDS" stackId="a" fill="#7C3AED" />
                <Bar dataKey="Security" stackId="a" fill="#D4A017" />
                <Bar dataKey="Retention" stackId="a" fill="#EC4899" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-full flex items-center justify-center text-xs text-slate-400">No deduction data in selected range</div>}
        </div>
      </div>

      {/* By contractor */}
      <div className="card-gov">
        <div className="card-gov-header">
          <h3 className="font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Deductions by Contractor</h3>
          <div className="text-[10px] text-slate-500 mt-0.5">Top 10 contractors · use for TDS filing</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2.5 text-[10px] uppercase">Contractor</th>
                <th className="px-4 py-2.5 text-[10px] uppercase">GST No.</th>
                <th className="px-4 py-2.5 text-[10px] uppercase">PAN</th>
                <th className="px-4 py-2.5 text-[10px] uppercase text-right">Bills</th>
                <th className="px-4 py-2.5 text-[10px] uppercase text-right">GST</th>
                <th className="px-4 py-2.5 text-[10px] uppercase text-right">TDS</th>
                <th className="px-4 py-2.5 text-[10px] uppercase text-right">Total Deductions</th>
              </tr>
            </thead>
            <tbody>
              {(d.byContractor || []).map((c: any) => (
                <tr key={c._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-[13px]">{c.name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-[10px]">{c.gstNumber || '—'}</td>
                  <td className="px-4 py-3 font-mono text-[10px]">{c.panNumber || '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.billCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINR(c.gst, { compact: true })}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINR(c.tds, { compact: true })}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-govt-navy">{formatINR(c.total, { compact: true })}</td>
                </tr>
              ))}
              {!d.byContractor?.length && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No contractor data in selected range</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SumCard({ label, value, color, bold }: any) {
  return (
    <div className={`border rounded-md p-3 ${color}`}>
      <div className={`text-[10px] uppercase ${bold ? 'opacity-90' : 'opacity-80'}`}>{label}</div>
      <div className={`text-lg ${bold ? 'font-bold' : 'font-semibold'} tabular-nums`}>{formatINR(value, { compact: true })}</div>
    </div>
  );
}
