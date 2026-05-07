import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import ApprovalTimeline from '../../components/shared/ApprovalTimeline';
import { formatDate, formatINR } from '../../utils/format';
import { ArrowLeft } from 'lucide-react';

export default function MBDetailPage() {
  const { id } = useParams();
  const [mb, setMb] = useState<any>(null);
  useEffect(() => { api.get(`/mb/${id}`).then((r) => setMb(r.data.data)); }, [id]);
  if (!mb) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title={mb.workItem}
        subtitle={`Stage 9 · MB ID: ${mb.mbId}`}
        stage={9}
        actions={<Link to="/mb" className="btn-gov-outline"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-gov">
            <div className="card-gov-header flex items-center justify-between">
              <h3 className="font-semibold">MB Details</h3>
              <StatusPill status={mb.status} />
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <D label="Project" v={mb.project?.name} />
              <D label="Location" v={mb.location} />
              <D label="Date" v={formatDate(mb.entryDate)} />
              <D label="Recorded By" v={mb.recordedBy?.name} />
              <D label="Total Amount" v={formatINR(mb.totalAmount)} />
              <D label="Approved On" v={formatDate(mb.approvedAt)} />
            </div>
          </div>

          <div className="card-gov">
            <div className="card-gov-header"><h3 className="font-semibold">Measurement Entries</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-3 py-2 text-xs">Description</th>
                    <th className="px-3 py-2 text-xs">L</th>
                    <th className="px-3 py-2 text-xs">W</th>
                    <th className="px-3 py-2 text-xs">H</th>
                    <th className="px-3 py-2 text-xs">Qty</th>
                    <th className="px-3 py-2 text-xs">Unit</th>
                    <th className="px-3 py-2 text-xs">Rate</th>
                    <th className="px-3 py-2 text-xs">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {mb.entries.map((e: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{e.description}</td>
                      <td className="px-3 py-2">{e.length}</td>
                      <td className="px-3 py-2">{e.width}</td>
                      <td className="px-3 py-2">{e.height}</td>
                      <td className="px-3 py-2 font-medium">{e.quantity}</td>
                      <td className="px-3 py-2">{e.unit}</td>
                      <td className="px-3 py-2">{formatINR(e.rate)}</td>
                      <td className="px-3 py-2 font-medium">{formatINR(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={7} className="px-3 py-2 text-right">Total:</td>
                    <td className="px-3 py-2 text-govt-navy">{formatINR(mb.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="card-gov">
          <div className="card-gov-header"><h3 className="font-semibold">Approval Workflow</h3></div>
          <div className="p-5"><ApprovalTimeline approvals={mb.approvals || []} /></div>
        </div>
      </div>
    </div>
  );
}

const D = ({ label, v }: any) => <div><div className="text-xs text-slate-500 uppercase">{label}</div><div className="font-medium mt-0.5">{v ?? '—'}</div></div>;
