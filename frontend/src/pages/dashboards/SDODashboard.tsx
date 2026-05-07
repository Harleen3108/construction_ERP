import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { ClipboardList, Receipt, Package, Briefcase, ArrowRight } from 'lucide-react';

export default function SDODashboard() {
  const [data, setData] = useState({ pendingMB: 0, pendingBills: 0, pendingMatReq: 0, activeProjects: 0 });
  useEffect(() => {
    api.get('/dashboard/me').then((r) => setData(r.data.data));
  }, []);

  const cards = [
    { label: 'MB Entries', value: data.pendingMB, icon: ClipboardList, color: 'bg-amber-50 text-amber-700' },
    { label: 'Bills', value: data.pendingBills, icon: Receipt, color: 'bg-blue-50 text-blue-700' },
    { label: 'Material Requests', value: data.pendingMatReq, icon: Package, color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div>
      <PageHeader
        title="SDO Dashboard"
        subtitle="Sub-Divisional Officer · Pending Approvals & Active Projects"
        badge="Multi-level Approver"
      />

      <div className="card-gov mb-6">
        <div className="card-gov-header">
          <h3 className="font-semibold text-slate-700">Pending Approvals</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
          {cards.map((c) => (
            <div key={c.label} className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:shadow-md transition">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${c.color}`}>
                <c.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-slate-800">{c.value}</div>
                <div className="text-xs text-slate-500">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-gov">
        <div className="card-gov-header flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">Active Projects</h3>
          <span className="text-2xl font-bold text-govt-navy">{data.activeProjects}</span>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Briefcase className="w-4 h-4" />
            <span>{data.activeProjects} project{data.activeProjects !== 1 ? 's' : ''} currently in progress</span>
          </div>
          <Link to="/projects" className="text-sm text-govt-navy font-medium hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <Link to="/approvals" className="btn-gov inline-flex">
          Open Approval Queue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
