import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatINR, formatDate } from '../../utils/format';
import { Search, MapPin, Ruler, Receipt, AlertTriangle, Briefcase, ChevronRight } from 'lucide-react';

export default function ProjectMonitorPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    const params: any = {};
    if (search) params.search = search;
    if (status) params.status = status;
    setLoading(true);
    api.get('/ce/projects', { params })
      .then((r) => setItems(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status]);

  // Compute stats
  const totalBudget = items.reduce((s, p) => s + (p.estimatedCost || 0), 0);
  const totalPaid = items.reduce((s, p) => s + (p.metrics?.totalPaid || 0), 0);
  const delayedCount = items.filter((p) => p.metrics?.isDelayed).length;

  return (
    <div>
      <PageHeader
        title="Project Monitor"
        subtitle="Comprehensive lifecycle view of all department projects · EE assignments, progress, MB, billing"
        badge={`${items.length} project${items.length !== 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Total Projects" value={items.length} />
        <Stat label="Total Budget" value={formatINR(totalBudget, { compact: true })} />
        <Stat label="Paid to Date" value={formatINR(totalPaid, { compact: true })} color="text-govt-green" />
        <Stat label="Delayed" value={delayedCount} color={delayedCount > 0 ? 'text-erp-danger' : 'text-slate-800'} />
      </div>

      <div className="card-gov p-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search projects..." className="input-gov pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-gov w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['PROPOSED','UNDER_APPROVAL','SANCTIONED','TENDER_PUBLISHED','BIDDING_OPEN','AWARDED','IN_PROGRESS','COMPLETED'].map((s) =>
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          )}
        </select>
      </div>

      {loading ? (
        <div className="card-gov p-12 text-center text-slate-400">Loading projects...</div>
      ) : !items.length ? (
        <div className="card-gov p-12 text-center text-slate-400">
          <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
          No projects match the filter
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <Link key={p._id} to={`/projects/${p._id}`} className="block card-gov p-4 hover:shadow-gov-lg transition">
              <div className="flex items-start gap-4">
                <div className={`w-1 self-stretch rounded ${p.metrics?.isDelayed ? 'bg-erp-danger' : p.status === 'COMPLETED' ? 'bg-govt-green' : 'bg-govt-navy'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-slate-800">{p.name}</h3>
                    <span className="text-[10px] font-mono text-slate-500">{p.projectId}</span>
                    <StatusPill status={p.status} />
                    {p.metrics?.isDelayed && (
                      <span className="pill pill-rejected text-[10px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Delayed
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-slate-600">
                    {p.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location}</div>}
                    {p.proposedBy && <div>Proposed by {p.proposedBy.name}</div>}
                    {p.awardedTo && <div>Contractor: {p.awardedTo.companyName || p.awardedTo.name}</div>}
                    {p.endDate && <div>Ends {formatDate(p.endDate)} {p.metrics?.daysToEnd != null && p.metrics.daysToEnd > 0 && <span className="text-slate-400">· {p.metrics.daysToEnd}d left</span>}</div>}
                  </div>
                  {p.status === 'IN_PROGRESS' && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${p.metrics?.isDelayed ? 'bg-erp-danger' : 'bg-govt-navy'}`} style={{ width: `${p.overallProgress || 0}%` }} />
                      </div>
                      <span className="text-[10px] font-medium tabular-nums">{p.overallProgress || 0}%</span>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold text-govt-navy tabular-nums">{formatINR(p.estimatedCost, { compact: true })}</div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-0.5"><Ruler className="w-3 h-3" /> {p.metrics?.mbApproved || 0}/{p.metrics?.mbCount || 0}</span>
                    <span className="flex items-center gap-0.5"><Receipt className="w-3 h-3" /> {p.metrics?.billsPaid || 0}/{p.metrics?.billCount || 0}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color = 'text-slate-800' }: any) {
  return (
    <div className="card-gov p-3">
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
