import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR } from '../../utils/format';

export default function AccountantDashboard() {
  const [data, setData] = useState<any>({});
  useEffect(() => { api.get('/dashboard/me').then((r) => setData(r.data.data)); }, []);

  const items = [
    { label: 'Pending Bills', value: data.pendingBills, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Bills Approved', value: data.billsApproved, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Payments Released', value: data.paymentsReleased, color: 'bg-green-50 text-green-700 border-green-200' },
    { label: 'Total Deductions', value: data.totalDeductions, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ];

  return (
    <div>
      <PageHeader title="Accountant / Treasury Dashboard" subtitle="Financial overview · Bills · Payments · Deductions" />
      <div className="card-gov">
        <div className="card-gov-header"><h3 className="font-semibold text-slate-700">Financial Overview</h3></div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((it) => (
            <div key={it.label} className={`p-4 rounded-lg border ${it.color} flex items-center justify-between`}>
              <div className="font-medium">{it.label}</div>
              <div className="text-xl font-bold">{formatINR(it.value, { compact: true })}</div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <Link to="/bills" className="btn-gov inline-flex">View All Bills →</Link>
          <Link to="/payments" className="btn-gov-outline ml-2 inline-flex">Payments</Link>
        </div>
      </div>
    </div>
  );
}
