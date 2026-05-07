import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR } from '../../utils/format';
import { Wallet, Clock4 } from 'lucide-react';

export default function ContractorDashboard() {
  const [data, setData] = useState<any>({ activeProjects: [], pendingAmount: 0, receivedAmount: 0 });
  useEffect(() => { api.get('/dashboard/me').then((r) => setData(r.data.data)); }, []);

  return (
    <div>
      <PageHeader title="Contractor Dashboard" subtitle="My active projects, bids and payments" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card-gov p-5 col-span-2">
          <h3 className="font-semibold text-slate-700 mb-3">My Active Projects</h3>
          <div className="space-y-3">
            {data.activeProjects?.length ? data.activeProjects.map((p: any) => (
              <Link key={p._id} to={`/projects/${p._id}`} className="block p-3 border border-slate-200 rounded-lg hover:border-govt-navy hover:shadow-sm transition">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-slate-800">{p.name}</div>
                  <span className="text-sm text-govt-navy">{formatINR(p.estimatedCost, { compact: true })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-govt-green h-full" style={{ width: `${p.overallProgress}%` }} />
                  </div>
                  <span className="text-xs text-slate-600">{p.overallProgress}% complete</span>
                </div>
              </Link>
            )) : <p className="text-sm text-slate-400">No active projects</p>}
          </div>
        </div>

        <div className="card-gov p-5">
          <h3 className="font-semibold text-slate-700 mb-3">My Payments</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Wallet className="w-5 h-5 text-green-700" />
              <div className="flex-1">
                <div className="text-xs text-slate-500">Received</div>
                <div className="font-bold text-green-700">{formatINR(data.receivedAmount, { compact: true })}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
              <Clock4 className="w-5 h-5 text-amber-700" />
              <div className="flex-1">
                <div className="text-xs text-slate-500">Pending</div>
                <div className="font-bold text-amber-700">{formatINR(data.pendingAmount, { compact: true })}</div>
              </div>
            </div>
          </div>
          <Link to="/payments" className="text-sm text-govt-navy hover:underline mt-3 inline-block">
            View payment history →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link to="/tenders/published" className="btn-gov">Browse Open Tenders</Link>
        <Link to="/bids" className="btn-gov-outline">My Bids</Link>
        <Link to="/bills/new" className="btn-gov-outline">Raise Bill</Link>
      </div>
    </div>
  );
}
