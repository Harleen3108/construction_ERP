import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { Briefcase, IndianRupee, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatINR } from '../../utils/format';
import { Link } from 'react-router-dom';

export default function CEDashboard() {
  const [data, setData] = useState<any>({});
  useEffect(() => {
    api.get('/dashboard/me').then((r) => setData(r.data.data));
  }, []);

  const cards = [
    { label: 'Total Projects', value: data.totalProjects ?? 0, icon: Briefcase, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Budget', value: formatINR(data.totalBudget, { compact: true }), icon: IndianRupee, color: 'from-amber-500 to-amber-600' },
    { label: 'Utilization', value: `${data.utilizationPercent ?? 0}%`, icon: TrendingUp, color: 'from-green-500 to-green-600' },
    { label: 'Delayed', value: data.delayed ?? 0, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
  ];

  return (
    <div>
      <PageHeader title="Chief Engineer Dashboard" subtitle="Department-wide oversight and analytics" badge="Final Approver" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="card-gov p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 uppercase font-medium">{c.label}</span>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center text-white`}>
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card-gov p-6">
        <h3 className="font-semibold text-slate-700 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/projects" className="btn-gov-outline">View All Projects</Link>
          <Link to="/approvals" className="btn-gov-outline">Pending Approvals</Link>
          <Link to="/audit" className="btn-gov-outline">Audit Reports</Link>
          <Link to="/tenders" className="btn-gov-outline">Manage Tenders</Link>
        </div>
      </div>
    </div>
  );
}
