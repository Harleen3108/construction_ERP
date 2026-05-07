import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate, formatINR } from '../../utils/format';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function WorkOrderDetailPage() {
  const { id } = useParams();
  const [wo, setWo] = useState<any>(null);
  const { user } = useAuthStore();

  const load = () => api.get(`/work-orders/${id}`).then((r) => setWo(r.data.data));
  useEffect(() => { load(); }, [id]);

  const accept = async () => { await api.put(`/work-orders/${id}/accept`); toast.success('Work Order accepted'); load(); };
  if (!wo) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title="Work Order"
        subtitle={`Stage 7 · LOA: ${wo.loaId}`}
        stage={7}
        actions={<Link to="/work-orders" className="btn-gov-outline"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-gov">
          <div className="card-gov-header flex items-center justify-between">
            <h3 className="font-semibold">{wo.workOrderId}</h3>
            <span className={`pill ${wo.acceptedByContractor ? 'pill-approved' : 'pill-pending'}`}>
              {wo.acceptedByContractor ? 'Accepted by Contractor' : 'Awaiting Acceptance'}
            </span>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4 text-sm">
            <D label="Project" v={wo.project?.name} />
            <D label="Contractor" v={wo.contractor?.companyName || wo.contractor?.name} />
            <D label="Awarded Amount" v={formatINR(wo.awardedAmount)} />
            <D label="Duration" v={`${wo.durationDays} days`} />
            <D label="Start Date" v={formatDate(wo.startDate)} />
            <D label="End Date" v={formatDate(wo.endDate)} />
            <D label="Issued Date" v={formatDate(wo.issuedAt)} />
            <D label="Accepted On" v={formatDate(wo.acceptedAt)} />
          </div>
          {user?.role === 'CONTRACTOR' && wo.contractor?._id === user._id && !wo.acceptedByContractor && (
            <div className="px-5 pb-5">
              <button onClick={accept} className="btn-gov-success w-full"><CheckCircle2 className="w-4 h-4" /> Accept Work Order</button>
            </div>
          )}
        </div>

        <div className="card-gov p-5">
          <h3 className="font-semibold mb-3">Tender Award Successfully</h3>
          <p className="text-sm text-slate-500 mb-3">Tender has been awarded to the L1 contractor. The project is now active.</p>
          <Link to={`/projects/${wo.project?._id || wo.project}`} className="btn-gov w-full">
            View Project Execution →
          </Link>
        </div>
      </div>
    </div>
  );
}
const D = ({ label, v }: any) => (
  <div><div className="text-xs text-slate-500 uppercase">{label}</div><div className="font-medium mt-0.5">{v ?? '—'}</div></div>
);
