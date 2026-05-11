import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR, formatDate } from '../../utils/format';
import {
  AlertCircle, AlertTriangle, Activity, TrendingUp, Briefcase, MapPin,
  Calendar, User as UserIcon,
} from 'lucide-react';

export default function RiskDashboardPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'delayed';
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/ce/risk').then((r) => setData(r.data.data));
  }, []);

  const setTab = (t: string) => setParams({ tab: t });

  if (!data) return <div className="p-12 text-center text-slate-400">Loading risk analysis...</div>;

  const tabs = [
    { key: 'delayed', label: 'Delayed', count: data.delayed.length, icon: AlertCircle, color: 'text-erp-danger' },
    { key: 'due', label: 'Due Soon', count: data.dueSoon.length, icon: Calendar, color: 'text-amber-600' },
    { key: 'stalled', label: 'Stalled', count: data.stalled.length, icon: Activity, color: 'text-orange-600' },
    { key: 'overrun', label: 'Cost Overrun', count: data.overrun.length, icon: TrendingUp, color: 'text-purple-600' },
  ];
  const totalRisk = tabs.reduce((s, t) => s + t.count, 0);

  return (
    <div>
      <PageHeader
        title="Risk Dashboard"
        subtitle="Identify delayed, stalled, and over-budget projects requiring CE intervention"
        badge={`${totalRisk} project${totalRisk !== 1 ? 's' : ''} flagged`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`bg-white border rounded-md p-4 text-left transition ${
                tab === t.key ? 'border-govt-navy shadow-md' : 'border-slate-200 hover:border-slate-400'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${t.color}`} />
                <span className={`text-xl font-bold tabular-nums ${t.color}`}>{t.count}</span>
              </div>
              <div className="text-[12px] font-semibold">{t.label}</div>
            </button>
          );
        })}
      </div>

      {tab === 'delayed' && (
        <RiskList
          title="Delayed Projects (past planned end date)"
          empty="No delayed projects"
          items={data.delayed.map((p: any) => ({
            ...p,
            badge: { text: `${p.daysOverdue}d overdue`, color: 'red' },
          }))}
        />
      )}
      {tab === 'due' && (
        <RiskList
          title="Projects Due in Next 30 Days · &lt;80% Progress"
          empty="No projects due in the next 30 days"
          items={data.dueSoon.map((p: any) => ({
            ...p,
            badge: { text: `${p.daysRemaining}d left · ${p.overallProgress}%`, color: 'amber' },
          }))}
        />
      )}
      {tab === 'stalled' && (
        <RiskList
          title="Stalled Projects (no MB entry in 30+ days)"
          empty="All projects have recent MB activity"
          items={data.stalled.map((p: any) => ({
            ...p,
            badge: { text: 'No MB updates', color: 'orange' },
          }))}
        />
      )}
      {tab === 'overrun' && (
        <div className="card-gov overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs uppercase">Project</th>
                <th className="px-4 py-2.5 text-xs uppercase">Contractor</th>
                <th className="px-4 py-2.5 text-xs uppercase text-right">Estimated</th>
                <th className="px-4 py-2.5 text-xs uppercase text-right">Final Cost</th>
                <th className="px-4 py-2.5 text-xs uppercase text-right">Overrun</th>
              </tr>
            </thead>
            <tbody>
              {data.overrun.map((p: any) => (
                <tr key={p._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/projects/${p._id}`} className="text-govt-navy hover:underline font-medium">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3">{p.awardedTo?.companyName || p.awardedTo?.name || '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINR(p.estimatedCost, { compact: true })}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINR(p.finalCost, { compact: true })}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-erp-danger font-bold">+{p.overrunPercent}%</span>
                  </td>
                </tr>
              ))}
              {!data.overrun.length && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No cost overruns detected</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RiskList({ title, items, empty }: any) {
  return (
    <div className="card-gov">
      <div className="card-gov-header"><h3 className="font-semibold">{title}</h3></div>
      {!items.length ? (
        <div className="p-12 text-center text-slate-400">{empty}</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((p: any) => (
            <Link key={p._id} to={`/projects/${p._id}`} className="block p-4 hover:bg-slate-50 transition">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">{p.name}</div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    {p.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location}</span>}
                    {p.awardedTo && <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {p.awardedTo.companyName || p.awardedTo.name}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Ends {formatDate(p.endDate)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-medium">{formatINR(p.estimatedCost, { compact: true })}</div>
                  <span className={`pill text-[10px] mt-1 ${
                    p.badge?.color === 'red' ? 'pill-rejected' :
                    p.badge?.color === 'amber' ? 'pill-pending' :
                    'pill-progress'
                  }`}>{p.badge?.text}</span>
                </div>
              </div>
              {p.overallProgress != null && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${p.badge?.color === 'red' ? 'bg-erp-danger' : 'bg-amber-500'}`} style={{ width: `${p.overallProgress || 0}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500">{p.overallProgress || 0}%</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
