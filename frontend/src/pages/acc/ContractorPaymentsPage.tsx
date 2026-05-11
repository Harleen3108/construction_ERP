import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR, formatDate } from '../../utils/format';
import { Search, Users, Wallet, Clock4, CheckCircle2 } from 'lucide-react';

export default function ContractorPaymentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/acc/contractor-payments').then((r) => setItems(r.data.data));
  }, []);

  const filtered = items.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.gstNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const totals = {
    paid: items.reduce((s, c) => s + (c.paid || 0), 0),
    pending: items.reduce((s, c) => s + (c.pending || 0), 0),
    contractors: items.length,
  };

  return (
    <div>
      <PageHeader
        title="Contractor Payments"
        subtitle="Per-contractor payment tracking · bill history · last payment · pending amounts"
        badge={`${items.length} active contractors`}
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Total Paid (All Time)" value={formatINR(totals.paid, { compact: true })} icon={CheckCircle2} color="text-govt-green" />
        <Stat label="Pending Payments" value={formatINR(totals.pending, { compact: true })} icon={Clock4} color="text-amber-600" />
        <Stat label="Active Contractors" value={totals.contractors} icon={Users} />
      </div>

      <div className="card-gov p-3 mb-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search by name, email, GST..." className="input-gov pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-[10px] uppercase">Contractor</th>
              <th className="px-4 py-2.5 text-[10px] uppercase">GST / PAN</th>
              <th className="px-4 py-2.5 text-[10px] uppercase text-right">Projects</th>
              <th className="px-4 py-2.5 text-[10px] uppercase text-right">Bills</th>
              <th className="px-4 py-2.5 text-[10px] uppercase text-right">Total Paid</th>
              <th className="px-4 py-2.5 text-[10px] uppercase text-right">Pending</th>
              <th className="px-4 py-2.5 text-[10px] uppercase">Last Payment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c._id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-[13px]">{c.name || '—'}</div>
                  <div className="text-[10px] text-slate-500">{c.email}</div>
                </td>
                <td className="px-4 py-3 text-[10px] font-mono">
                  <div>GST: {c.gstNumber || '—'}</div>
                  <div className="text-slate-500">PAN: {c.panNumber || '—'}</div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{c.projectCount}</td>
                <td className="px-4 py-3 text-right">
                  <div className="text-[11px]"><span className="text-govt-green">{c.paidCount}</span> paid</div>
                  {c.pendingCount > 0 && <div className="text-[10px] text-amber-600">{c.pendingCount} pending</div>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-govt-green">{formatINR(c.paid, { compact: true })}</td>
                <td className="px-4 py-3 text-right tabular-nums text-amber-600">{formatINR(c.pending, { compact: true })}</td>
                <td className="px-4 py-3 text-[11px]">
                  {c.lastPayment ? (
                    <>
                      <div>{formatDate(c.lastPayment.paymentDate)}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{c.lastPayment.utrNumber}</div>
                    </>
                  ) : <span className="text-slate-400">—</span>}
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No contractors match the filter</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, color = 'text-slate-800' }: any) {
  return (
    <div className="card-gov p-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-slate-500 uppercase">{label}</div>
        {Icon && <Icon className={`w-3.5 h-3.5 ${color}`} />}
      </div>
      <div className={`text-lg font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
