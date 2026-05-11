import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate, formatINR } from '../../utils/format';
import toast from 'react-hot-toast';
import { Search, BadgeCheck, Ban, X, TrendingUp, Briefcase, Award } from 'lucide-react';

export default function ContractorsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [verified, setVerified] = useState('');
  const [active, setActive] = useState<any>(null);
  const [perf, setPerf] = useState<any>(null);
  const [blacklistOpen, setBlacklistOpen] = useState<any>(null);
  const [reason, setReason] = useState('');

  const load = () => {
    const params: any = {};
    if (search) params.search = search;
    if (verified) params.verified = verified;
    api.get('/contractors', { params }).then((r) => setItems(r.data.data));
  };
  useEffect(() => { load(); }, [search, verified]);

  const verify = async (id: string) => {
    await api.put(`/contractors/${id}/verify`);
    toast.success('Contractor verified');
    load();
  };

  const blacklist = async () => {
    await api.put(`/contractors/${blacklistOpen._id}/blacklist`, { reason });
    toast.success('Contractor blacklisted');
    setBlacklistOpen(null);
    setReason('');
    load();
  };

  const openPerf = async (c: any) => {
    setActive(c);
    setPerf(null);
    const r = await api.get(`/contractors/${c._id}/performance`);
    setPerf(r.data.data);
  };

  return (
    <div>
      <PageHeader
        title="Contractor Management"
        subtitle="Verify, monitor, and manage contractor performance across all projects"
      />

      {/* Search + filter */}
      <div className="card-gov p-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search company, GST, name..." className="input-gov pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {[
            { label: 'All', val: '' },
            { label: 'Verified', val: 'true' },
            { label: 'Unverified', val: 'false' },
          ].map((b) => (
            <button key={b.label}
              onClick={() => setVerified(b.val)}
              className={`px-3 py-1.5 text-xs rounded border ${verified === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((c) => (
          <div key={c._id} className="card-gov p-5 hover:shadow-gov-lg transition">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{c.companyName || c.name}</h3>
                <div className="text-[11px] text-slate-500 truncate">{c.email}</div>
              </div>
              {c.contractorVerified ? (
                <span className="pill pill-approved text-[10px]"><BadgeCheck className="w-3 h-3 inline" /> Verified</span>
              ) : !c.active ? (
                <span className="pill pill-rejected text-[10px]">Blacklisted</span>
              ) : (
                <span className="pill pill-pending text-[10px]">Unverified</span>
              )}
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 mb-3">
              {c.gstNumber && <div>GST: <span className="font-mono">{c.gstNumber}</span></div>}
              {c.panNumber && <div>PAN: <span className="font-mono">{c.panNumber}</span></div>}
              {c.experienceYears && <div>{c.experienceYears} years experience</div>}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 mb-3">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase">Projects</div>
                <div className="font-bold text-govt-navy tabular-nums">{c.projectsAwarded || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase">Awarded</div>
                <div className="font-bold text-govt-green tabular-nums">{formatINR(c.totalAwardedValue, { compact: true })}</div>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openPerf(c)} className="btn-gov-outline text-[11px] flex-1">
                <TrendingUp className="w-3 h-3" /> Performance
              </button>
              {!c.contractorVerified && c.active && (
                <button onClick={() => verify(c._id)} className="btn-gov-success text-[11px]">
                  <BadgeCheck className="w-3 h-3" /> Verify
                </button>
              )}
              {c.active && (
                <button onClick={() => setBlacklistOpen(c)} className="btn-gov-danger text-[11px]">
                  <Ban className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="text-[9px] text-slate-400 mt-2">Joined {formatDate(c.createdAt)}</div>
          </div>
        ))}
        {!items.length && (
          <div className="col-span-full card-gov p-12 text-center text-slate-400">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No contractors registered</p>
          </div>
        )}
      </div>

      {/* Performance modal */}
      {active && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3 border-b bg-govt-navy text-white sticky top-0 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{active.companyName || active.name}</h3>
                <div className="text-[11px] opacity-80">Performance Report</div>
              </div>
              <button onClick={() => setActive(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              {!perf ? (
                <div className="py-12 text-center text-slate-400">Loading performance metrics...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <Metric label="Total Projects" value={perf.stats.totalProjects} />
                    <Metric label="Active" value={perf.stats.active} />
                    <Metric label="Completed" value={perf.stats.completed} />
                    <Metric label="Win Rate" value={`${perf.stats.winRate}%`} />
                    <Metric label="Total Bids" value={perf.stats.totalBids} />
                    <Metric label="Won Bids" value={perf.stats.wonBids} />
                    <Metric label="On-Time %" value={`${perf.stats.onTimePercent}%`} alert={perf.stats.onTimePercent < 70} />
                    <Metric label="Total Billed" value={formatINR(perf.stats.totalBilled, { compact: true })} />
                  </div>
                  <h4 className="font-semibold mb-2 text-sm">Awarded Projects</h4>
                  <div className="space-y-2">
                    {perf.projects.map((p: any) => (
                      <div key={p._id} className="border border-slate-200 rounded p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{p.name}</div>
                          <span className="pill pill-info text-[10px]">{p.status}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">📍 {p.location}</div>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                          <div><span className="text-slate-500">Awarded:</span> <strong>{formatINR(p.awardedAmount, { compact: true })}</strong></div>
                          <div><span className="text-slate-500">Progress:</span> <strong>{p.overallProgress || 0}%</strong></div>
                          <div><span className="text-slate-500">End:</span> <strong>{p.endDate ? new Date(p.endDate).toLocaleDateString('en-IN') : '—'}</strong></div>
                        </div>
                      </div>
                    ))}
                    {!perf.projects.length && <div className="text-center text-xs text-slate-400 py-4">No projects yet</div>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blacklist modal */}
      {blacklistOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md">
            <div className="px-5 py-3 border-b bg-erp-danger text-white">
              <h3 className="font-semibold flex items-center gap-2"><Ban className="w-4 h-4" /> Blacklist Contractor</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-3">
                You are about to blacklist <strong>{blacklistOpen.companyName || blacklistOpen.name}</strong>.
                They will be deactivated and unable to bid on any tenders.
              </p>
              <label className="label-gov">Reason (audit-logged)</label>
              <textarea className="input-gov h-24" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Repeated quality issues, GST fraud, project abandonment..." />
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button className="btn-gov-outline" onClick={() => { setBlacklistOpen(null); setReason(''); }}>Cancel</button>
              <button className="btn-gov-danger" onClick={blacklist}>Confirm Blacklist</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, alert }: any) {
  return (
    <div className="bg-slate-50 rounded p-2.5">
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${alert ? 'text-erp-danger' : 'text-slate-800'}`}>{value ?? '—'}</div>
    </div>
  );
}
