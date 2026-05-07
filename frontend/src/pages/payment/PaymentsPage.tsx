import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatDateTime, formatINR } from '../../utils/format';
import toast from 'react-hot-toast';
import { Wallet, Download } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [pendingBills, setPendingBills] = useState<any[]>([]);
  const [showRelease, setShowRelease] = useState<any>(null);
  const [form, setForm] = useState({ paymentMode: 'RTGS', utrNumber: '', bankName: '', ifsc: '', remarks: '' });
  const { user } = useAuthStore();
  const canRelease = ['TREASURY','ACCOUNTANT','ADMIN'].includes(user?.role || '');

  const load = () => {
    api.get('/payments').then((r) => setPayments(r.data.data));
    if (canRelease) {
      api.get('/bills', { params: { status: 'TREASURY_PENDING' } })
        .then((r) => setPendingBills(r.data.data.filter((b: any) => b.status === 'TREASURY_PENDING' || b.status === 'ACCOUNTS_VERIFIED')));
    }
  };

  useEffect(() => { load(); }, []);

  const release = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/payments/release', { billId: showRelease._id, ...form });
      toast.success('Payment released successfully');
      setShowRelease(null);
      load();
    } catch {/* toast in interceptor */}
  };

  return (
    <div>
      <PageHeader title="Payment Release" subtitle="Stage 11 · Treasury releases payment to contractor with UTR" stage={11} />

      {canRelease && pendingBills.length > 0 && (
        <div className="card-gov mb-5">
          <div className="card-gov-header"><h3 className="font-semibold">Bills Pending Payment Release ({pendingBills.length})</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-2.5 text-xs uppercase">Bill</th>
                  <th className="px-4 py-2.5 text-xs uppercase">Contractor</th>
                  <th className="px-4 py-2.5 text-xs uppercase">Net Payable</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pendingBills.map((b) => (
                  <tr key={b._id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">{b.billNumber}</td>
                    <td className="px-4 py-3">{b.contractor?.companyName || b.contractor?.name}</td>
                    <td className="px-4 py-3 font-bold text-govt-green">{formatINR(b.netPayable)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setShowRelease(b)} className="btn-gov-success text-xs">
                        <Wallet className="w-3.5 h-3.5" /> Release Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRelease && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={release} className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="card-gov-header bg-govt-navy text-white">
              <h3 className="font-semibold">Release Payment · {showRelease.billNumber}</h3>
              <p className="text-xs opacity-80">Net Payable: {formatINR(showRelease.netPayable)}</p>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <div>
                <label className="label-gov">Payment Mode</label>
                <select className="input-gov" value={form.paymentMode} onChange={(e) => setForm({...form, paymentMode: e.target.value})}>
                  <option>RTGS</option><option>NEFT</option><option>IMPS</option><option>CHEQUE</option><option>DD</option>
                </select>
              </div>
              <div>
                <label className="label-gov">UTR Number *</label>
                <input required className="input-gov" value={form.utrNumber} onChange={(e) => setForm({...form, utrNumber: e.target.value})} placeholder="HDFCS20250612345" />
              </div>
              <div>
                <label className="label-gov">Bank Name</label>
                <input className="input-gov" value={form.bankName} onChange={(e) => setForm({...form, bankName: e.target.value})} />
              </div>
              <div>
                <label className="label-gov">IFSC</label>
                <input className="input-gov" value={form.ifsc} onChange={(e) => setForm({...form, ifsc: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="label-gov">Remarks</label>
                <textarea className="input-gov h-16" value={form.remarks} onChange={(e) => setForm({...form, remarks: e.target.value})} />
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button type="button" className="btn-gov-outline" onClick={() => setShowRelease(null)}>Cancel</button>
              <button className="btn-gov-success">Release Payment</button>
            </div>
          </form>
        </div>
      )}

      <div className="card-gov">
        <div className="card-gov-header"><h3 className="font-semibold">Payment History</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs uppercase">Payment ID</th>
                <th className="px-4 py-2.5 text-xs uppercase">Bill</th>
                <th className="px-4 py-2.5 text-xs uppercase">Contractor</th>
                <th className="px-4 py-2.5 text-xs uppercase">Mode</th>
                <th className="px-4 py-2.5 text-xs uppercase">UTR</th>
                <th className="px-4 py-2.5 text-xs uppercase">Amount</th>
                <th className="px-4 py-2.5 text-xs uppercase">Date</th>
                <th className="px-4 py-2.5 text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.paymentId}</td>
                  <td className="px-4 py-3">{p.bill?.billNumber}</td>
                  <td className="px-4 py-3">{p.contractor?.companyName || p.contractor?.name}</td>
                  <td className="px-4 py-3"><span className="pill pill-info">{p.paymentMode}</span></td>
                  <td className="px-4 py-3 font-mono text-xs">{p.utrNumber}</td>
                  <td className="px-4 py-3 font-bold text-govt-green">{formatINR(p.amount, { compact: true })}</td>
                  <td className="px-4 py-3 text-xs">{formatDateTime(p.paymentDate)}</td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                </tr>
              ))}
              {!payments.length && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No payments released yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
