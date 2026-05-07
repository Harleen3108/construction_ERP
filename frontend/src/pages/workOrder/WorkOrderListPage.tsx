import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate, formatINR } from '../../utils/format';
import toast from 'react-hot-toast';
import { Award } from 'lucide-react';

export default function WorkOrderListPage() {
  const location = useLocation();
  const [items, setItems] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [showAward, setShowAward] = useState(false);
  const [awardForm, setAwardForm] = useState({
    tenderId: '', startDate: '', endDate: '', durationDays: 270, remarks: '',
  });

  const load = () => api.get('/work-orders').then((r) => setItems(r.data.data));

  useEffect(() => {
    load();
    api.get('/tenders').then((r) => setTenders(r.data.data.filter((t: any) => t.status === 'EVALUATION')));
    if ((location.state as any)?.tenderId) {
      setShowAward(true);
      setAwardForm((s) => ({ ...s, tenderId: (location.state as any).tenderId }));
    }
  }, []);

  const award = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/work-orders/award/${awardForm.tenderId}`, {
        startDate: awardForm.startDate,
        endDate: awardForm.endDate,
        durationDays: Number(awardForm.durationDays),
        remarks: awardForm.remarks,
      });
      toast.success('Tender awarded · LOA & Work Order generated');
      setShowAward(false);
      load();
    } catch {/* toast in interceptor */}
  };

  return (
    <div>
      <PageHeader
        title="Work Orders & LOA"
        subtitle="Stage 7 · Generate Letter of Award and Work Order for L1 contractor"
        stage={7}
        actions={
          tenders.length > 0 && (
            <button className="btn-gov" onClick={() => setShowAward(true)}>
              <Award className="w-4 h-4" /> Award Tender
            </button>
          )
        }
      />

      {showAward && (
        <div className="card-gov p-6 mb-5 border-govt-gold border-2">
          <h3 className="font-semibold mb-4">Award Tender to L1</h3>
          <form onSubmit={award} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label-gov">Tender *</label>
              <select required className="input-gov" value={awardForm.tenderId}
                      onChange={(e) => setAwardForm({ ...awardForm, tenderId: e.target.value })}>
                <option value="">Select tender</option>
                {tenders.map((t) => <option key={t._id} value={t._id}>{t.tenderId} · {t.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label-gov">Start Date *</label>
              <input required type="date" className="input-gov" value={awardForm.startDate}
                     onChange={(e) => setAwardForm({ ...awardForm, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label-gov">End Date *</label>
              <input required type="date" className="input-gov" value={awardForm.endDate}
                     onChange={(e) => setAwardForm({ ...awardForm, endDate: e.target.value })} />
            </div>
            <div>
              <label className="label-gov">Duration (Days)</label>
              <input type="number" className="input-gov" value={awardForm.durationDays}
                     onChange={(e) => setAwardForm({ ...awardForm, durationDays: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <label className="label-gov">Remarks</label>
              <textarea className="input-gov h-16" value={awardForm.remarks}
                        onChange={(e) => setAwardForm({ ...awardForm, remarks: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button type="button" className="btn-gov-outline" onClick={() => setShowAward(false)}>Cancel</button>
              <button className="btn-gov-success">Generate LOA + Work Order</button>
            </div>
          </form>
        </div>
      )}

      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs uppercase">Work Order ID</th>
              <th className="px-4 py-2.5 text-xs uppercase">LOA</th>
              <th className="px-4 py-2.5 text-xs uppercase">Project</th>
              <th className="px-4 py-2.5 text-xs uppercase">Contractor</th>
              <th className="px-4 py-2.5 text-xs uppercase">Awarded Amount</th>
              <th className="px-4 py-2.5 text-xs uppercase">Issued</th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w._id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3"><Link to={`/work-orders/${w._id}`} className="font-mono text-xs text-govt-navy hover:underline">{w.workOrderId}</Link></td>
                <td className="px-4 py-3 font-mono text-xs">{w.loaId}</td>
                <td className="px-4 py-3">{w.project?.name}</td>
                <td className="px-4 py-3">{w.contractor?.companyName || w.contractor?.name}</td>
                <td className="px-4 py-3 font-medium">{formatINR(w.awardedAmount, { compact: true })}</td>
                <td className="px-4 py-3">{formatDate(w.issuedAt)}</td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No work orders yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
