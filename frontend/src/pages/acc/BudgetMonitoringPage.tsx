import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR } from '../../utils/format';
import { Wallet, AlertTriangle, TrendingUp, Search } from 'lucide-react';

export default function BudgetMonitoringPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'overBudget' | 'highUtil' | 'low'>('all');

  useEffect(() => {
    api.get('/acc/budget').then((r) => {
      setItems(r.data.data);
      setSummary(r.data.summary);
    });
  }, []);

  const filtered = items.filter((p) => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'overBudget') return p.finance?.isOverBudget;
    if (filter === 'highUtil') return p.finance?.utilizationPercent > 75 && !p.finance?.isOverBudget;
    if (filter === 'low') return p.finance?.utilizationPercent < 25;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Budget Monitoring"
        subtitle="Project-wise budget allocation vs utilization · over-budget alerts · financial discipline"
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <Stat label="Total Budget" value={formatINR(summary.totalBudget, { compact: true })} icon={Wallet} />
        <Stat label="Total Awarded" value={formatINR(summary.totalAwarded, { compact: true })} icon={Wallet} />
        <Stat label="Paid to Date" value={formatINR(summary.totalPaid, { compact: true })} icon={TrendingUp} color="text-govt-green" />
        <Stat label="Pending" value={formatINR(summary.totalPending, { compact: true })} icon={Wallet} color="text-amber-600" />
        <Stat label="Over Budget" value={summary.overBudgetCount || 0} icon={AlertTriangle} color={summary.overBudgetCount > 0 ? 'text-erp-danger' : 'text-slate-800'} />
      </div>

      <div className="card-gov p-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search projects..." className="input-gov pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {[
            { val: 'all', label: 'All' },
            { val: 'overBudget', label: 'Over Budget' },
            { val: 'highUtil', label: 'High Util (>75%)' },
            { val: 'low', label: 'Low Util (<25%)' },
          ].map((b: any) => (
            <button key={b.val} onClick={() => setFilter(b.val)}
              className={`px-3 py-1.5 text-xs rounded border ${filter === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-[10px] uppercase">Project</th>
              <th className="px-4 py-2.5 text-[10px] uppercase">Status</th>
              <th className="px-4 py-2.5 text-[10px] uppercase text-right">Budget</th>
              <th className="px-4 py-2.5 text-[10px] uppercase text-right">Awarded</th>
              <th className="px-4 py-2.5 text-[10px] uppercase text-right">Paid</th>
              <th className="px-4 py-2.5 text-[10px] uppercase text-right">Pending</th>
              <th className="px-4 py-2.5 text-[10px] uppercase text-right">Remaining</th>
              <th className="px-4 py-2.5 text-[10px] uppercase">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p._id} className={`border-t hover:bg-slate-50 ${p.finance?.isOverBudget ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-3">
                  <Link to={`/projects/${p._id}`} className="font-medium text-govt-navy hover:underline">{p.name}</Link>
                  <div className="text-[10px] text-slate-500">{p.awardedTo?.companyName || p.awardedTo?.name || '—'}</div>
                </td>
                <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                <td className="px-4 py-3 text-right tabular-nums">{formatINR(p.estimatedCost, { compact: true })}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatINR(p.awardedAmount, { compact: true })}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-govt-green">{formatINR(p.finance?.paid, { compact: true })}</td>
                <td className="px-4 py-3 text-right tabular-nums text-amber-600">{formatINR(p.finance?.pending, { compact: true })}</td>
                <td className={`px-4 py-3 text-right tabular-nums font-semibold ${p.finance?.isOverBudget ? 'text-erp-danger' : 'text-slate-600'}`}>
                  {p.finance?.isOverBudget ? `-${formatINR(Math.abs(p.estimatedCost - p.finance.paid - p.finance.pending), { compact: true })}` : formatINR(p.finance?.remaining, { compact: true })}
                </td>
                <td className="px-4 py-3 w-44">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${
                        p.finance?.isOverBudget ? 'bg-erp-danger' :
                        p.finance?.utilizationPercent > 75 ? 'bg-amber-500' :
                        'bg-govt-navy'
                      }`} style={{ width: `${Math.min(p.finance?.utilizationPercent || 0, 100)}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold tabular-nums w-10 text-right ${p.finance?.isOverBudget ? 'text-erp-danger' : ''}`}>
                      {p.finance?.utilizationPercent}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No projects match the filter</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, color = 'text-slate-800' }: any) {
  return (
    <div className="card-gov p-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-slate-500 uppercase">{label}</div>
        {Icon && <Icon className={`w-3.5 h-3.5 ${color}`} />}
      </div>
      <div className={`text-lg font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
