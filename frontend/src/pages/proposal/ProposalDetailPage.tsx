import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import ApprovalTimeline from '../../components/shared/ApprovalTimeline';
import { formatINR, formatDate } from '../../utils/format';
import { ArrowLeft, MapPin, IndianRupee, Calendar, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function ProposalDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    api.get(`/projects/${id}`).then((r) => setProject(r.data.data));
  }, [id]);

  if (!project) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={`Project ID: ${project.projectId}`}
        stage={1}
        actions={<Link to="/proposals" className="btn-gov-outline"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-gov">
            <div className="card-gov-header flex items-center justify-between">
              <h3 className="font-semibold">Project Details</h3>
              <StatusPill status={project.status} />
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Detail icon={MapPin} label="Location" value={`${project.location}${project.district ? ', ' + project.district : ''}, ${project.state || ''}`} />
              <Detail icon={IndianRupee} label="Estimated Cost" value={formatINR(project.estimatedCost)} />
              <Detail icon={Building2} label="Type" value={project.projectType} />
              <Detail icon={Building2} label="Funding Source" value={project.fundingSource} />
              <Detail icon={Calendar} label="Proposed Date" value={formatDate(project.proposedAt)} />
              <Detail icon={Calendar} label="Sanctioned Date" value={formatDate(project.sanctionedAt)} />
              {project.description && (
                <div className="md:col-span-2">
                  <div className="text-xs text-slate-500 uppercase">Description</div>
                  <p className="text-slate-700 mt-1">{project.description}</p>
                </div>
              )}
            </div>
          </div>

          {project.documents?.length > 0 && (
            <div className="card-gov">
              <div className="card-gov-header"><h3 className="font-semibold">Documents</h3></div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                {project.documents.map((d: any, i: number) => (
                  <a key={i} href={d.url} target="_blank" rel="noreferrer" className="block p-3 border rounded-md text-xs text-center hover:bg-slate-50">
                    📄 {d.name || `Doc ${i+1}`}
                  </a>
                ))}
              </div>
            </div>
          )}

          {project.tender && (
            <div className="card-gov p-5 bg-blue-50 border-blue-200">
              <div className="text-xs text-slate-500 uppercase mb-1">Linked Tender</div>
              <Link to={`/tenders/${project.tender._id || project.tender}`} className="font-mono text-sm text-govt-navy hover:underline">
                {project.tender.tenderId || 'View Tender'}
              </Link>
            </div>
          )}
        </div>

        {/* Approval workflow */}
        <div className="card-gov">
          <div className="card-gov-header"><h3 className="font-semibold">Sanction & Approvals (Stage 2)</h3></div>
          <div className="p-5">
            <ApprovalTimeline approvals={project.approvals || []} />
            {project.status === 'SANCTIONED' && (user?.role === 'TENDER_OFFICER' || user?.role === 'EE' || user?.role === 'ADMIN') && (
              <Link to={`/tenders/new?projectId=${project._id}`} className="btn-gov mt-4 w-full">
                Create Tender →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: any) {
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</div>
      <div className="text-slate-800 font-medium mt-0.5">{value || '—'}</div>
    </div>
  );
}
