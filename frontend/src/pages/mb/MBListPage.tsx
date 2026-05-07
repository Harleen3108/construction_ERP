import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatDate, formatINR } from '../../utils/format';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function MBListPage() {
  const [items, setItems] = useState<any[]>([]);
  const { user } = useAuthStore();
  useEffect(() => { api.get('/mb').then((r) => setItems(r.data.data)); }, []);

  return (
    <div>
      <PageHeader
        title="Measurement Book (MB)"
        subtitle="Stage 9 · JE records executed quantities · routes through SDO → EE"
        stage={9}
        actions={user?.role === 'JE' && <Link to="/mb/new" className="btn-gov"><Plus className="w-4 h-4" /> New MB Entry</Link>}
      />

      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs uppercase">MB ID</th>
              <th className="px-4 py-2.5 text-xs uppercase">Project</th>
              <th className="px-4 py-2.5 text-xs uppercase">Work Item</th>
              <th className="px-4 py-2.5 text-xs uppercase">Date</th>
              <th className="px-4 py-2.5 text-xs uppercase">Total Amount</th>
              <th className="px-4 py-2.5 text-xs uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m._id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs"><Link to={`/mb/${m._id}`} className="text-govt-navy hover:underline">{m.mbId}</Link></td>
                <td className="px-4 py-3">{m.project?.name}</td>
                <td className="px-4 py-3">{m.workItem}</td>
                <td className="px-4 py-3">{formatDate(m.entryDate)}</td>
                <td className="px-4 py-3 font-medium">{formatINR(m.totalAmount, { compact: true })}</td>
                <td className="px-4 py-3"><StatusPill status={m.status} /></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No MB entries yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
