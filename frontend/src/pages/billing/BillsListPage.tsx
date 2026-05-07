import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatDate, formatINR } from '../../utils/format';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function BillsListPage() {
  const [items, setItems] = useState<any[]>([]);
  const { user } = useAuthStore();
  useEffect(() => { api.get('/bills').then((r) => setItems(r.data.data)); }, []);

  return (
    <div>
      <PageHeader
        title="Billing & Approvals"
        subtitle="Stage 10 · RA Bills with auto deductions (GST 18%, TDS 1%, Security 5%) routed through approval chain"
        stage={10}
        actions={user?.role === 'CONTRACTOR' && <Link to="/bills/new" className="btn-gov"><Plus className="w-4 h-4" /> Raise New Bill</Link>}
      />
      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs uppercase">Bill #</th>
              <th className="px-4 py-2.5 text-xs uppercase">Project</th>
              <th className="px-4 py-2.5 text-xs uppercase">Contractor</th>
              <th className="px-4 py-2.5 text-xs uppercase">Gross</th>
              <th className="px-4 py-2.5 text-xs uppercase">Deductions</th>
              <th className="px-4 py-2.5 text-xs uppercase">Net Payable</th>
              <th className="px-4 py-2.5 text-xs uppercase">Date</th>
              <th className="px-4 py-2.5 text-xs uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b._id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs"><Link to={`/bills/${b._id}`} className="text-govt-navy hover:underline">{b.billNumber}</Link></td>
                <td className="px-4 py-3">{b.project?.name}</td>
                <td className="px-4 py-3">{b.contractor?.companyName || b.contractor?.name}</td>
                <td className="px-4 py-3">{formatINR(b.currentBillAmount, { compact: true })}</td>
                <td className="px-4 py-3 text-erp-danger">- {formatINR(b.totalDeductions, { compact: true })}</td>
                <td className="px-4 py-3 font-bold text-govt-green">{formatINR(b.netPayable, { compact: true })}</td>
                <td className="px-4 py-3">{formatDate(b.submittedAt || b.createdAt)}</td>
                <td className="px-4 py-3"><StatusPill status={b.status} /></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No bills yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
