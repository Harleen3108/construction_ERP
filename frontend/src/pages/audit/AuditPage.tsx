import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDateTime } from '../../utils/format';
import { Download, ShieldCheck, Activity, Users } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [filter, setFilter] = useState({ entity: '', user: '' });

  const load = () => {
    api.get('/audit', { params: filter }).then((r) => setLogs(r.data.data));
  };

  useEffect(() => {
    api.get('/audit/summary').then((r) => setSummary(r.data.data));
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Audit & Compliance"
        subtitle="Stage 12 · Complete trail of every action — approvals, edits, and timestamps"
        stage={12}
        actions={<button className="btn-gov-outline"><Download className="w-4 h-4" /> Export CSV</button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Stat icon={Activity} label="Total Actions Logged" value={summary.total ?? 0} />
        <Stat icon={ShieldCheck} label="Last 24 hours" value={summary.last24h ?? 0} />
        <Stat icon={Users} label="Active Roles" value={summary.byRole?.length || 0} />
      </div>

      <div className="card-gov">
        <div className="card-gov-header flex items-center gap-2">
          <h3 className="font-semibold">Audit Logs</h3>
          <select className="input-gov ml-auto w-40" value={filter.entity} onChange={(e) => setFilter({ ...filter, entity: e.target.value })}>
            <option value="">All entities</option>
            {['projects','tenders','bids','mb','bills','payments','approvals','users'].map((x) => <option key={x}>{x}</option>)}
          </select>
          <button onClick={load} className="btn-gov text-xs">Filter</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs uppercase">Timestamp</th>
                <th className="px-4 py-2.5 text-xs uppercase">User</th>
                <th className="px-4 py-2.5 text-xs uppercase">Role</th>
                <th className="px-4 py-2.5 text-xs uppercase">Action</th>
                <th className="px-4 py-2.5 text-xs uppercase">Entity</th>
                <th className="px-4 py-2.5 text-xs uppercase">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDateTime(l.timestamp)}</td>
                  <td className="px-4 py-3 text-xs">{l.userName || '—'}</td>
                  <td className="px-4 py-3"><span className="pill pill-info text-[10px]">{l.userRole}</span></td>
                  <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                  <td className="px-4 py-3 text-xs">{l.entity}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{l.ipAddress}</td>
                </tr>
              ))}
              {!logs.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No logs match the filter</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
const Stat = ({ icon: Icon, label, value }: any) => (
  <div className="card-gov p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-slate-500 uppercase">{label}</span>
      <Icon className="w-4 h-4 text-govt-navy" />
    </div>
    <div className="text-2xl font-bold text-slate-800">{value}</div>
  </div>
);
