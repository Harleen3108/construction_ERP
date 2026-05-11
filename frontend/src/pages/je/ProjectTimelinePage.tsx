import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import StatusPill from '../../components/shared/StatusPill';
import { formatDate, formatINR } from '../../utils/format';
import {
  ArrowLeft, Calendar, MapPin, AlertTriangle, CheckCircle2,
  Clock4, User as UserIcon, Activity,
} from 'lucide-react';

export default function ProjectTimelinePage() {
  const { id } = useParams();
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    api.get(`/je/project-timeline/${id}`).then((r) => setD(r.data.data));
  }, [id]);

  if (!d) return <div className="p-12 text-center text-slate-400">Loading timeline...</div>;

  const { project, milestones, timelineStart, timelineEnd, recentReports } = d;

  // Generate month markers for timeline axis
  const months: any[] = [];
  let cursor = new Date(timelineStart);
  cursor.setDate(1);
  while (cursor.getTime() < timelineEnd) {
    months.push({
      label: cursor.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      offset: ((cursor.getTime() - timelineStart) / (timelineEnd - timelineStart)) * 100,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const nowOffset = ((Date.now() - timelineStart) / (timelineEnd - timelineStart)) * 100;
  const showNow = nowOffset >= 0 && nowOffset <= 100;

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle="Visual Gantt-style timeline · planned vs actual · milestones · daily activity"
        actions={<Link to="/je/site-monitoring" className="btn-gov-outline text-xs"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link>}
      />

      <div className="card-gov p-5 mb-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <Info icon={MapPin} label="Location" value={project.location} />
        <Info label="Status" value={<StatusPill status={project.status} />} />
        <Info label="Budget" value={formatINR(project.estimatedCost, { compact: true })} />
        <Info label="Progress" value={`${project.overallProgress || 0}%`} />
        <Info icon={Calendar} label="Start Date" value={formatDate(project.startDate)} />
        <Info icon={Calendar} label="End Date" value={formatDate(project.endDate)} />
        <Info icon={UserIcon} label="Proposed By" value={project.proposedBy?.name} />
        <Info icon={UserIcon} label="Contractor" value={project.awardedTo?.companyName || project.awardedTo?.name} />
      </div>

      <div className="card-gov mb-5">
        <div className="card-gov-header">
          <h3 className="font-semibold text-sm">Milestone Timeline</h3>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Solid bars = planned · Striped overlay = actual · Vertical dashed line = today
          </div>
        </div>

        {milestones.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No milestones defined for this project</p>
            <Link to={`/projects/${id}`} className="text-xs text-govt-navy hover:underline mt-1 inline-block">
              Add milestones in project page →
            </Link>
          </div>
        ) : (
          <div className="p-5">
            {/* Month axis */}
            <div className="relative h-6 mb-2 border-b border-slate-200">
              {months.map((m, i) => (
                <div key={i} className="absolute top-0 text-[10px] text-slate-500 -translate-x-1/2" style={{ left: `${m.offset}%` }}>
                  {m.label}
                </div>
              ))}
            </div>

            {/* Gantt rows */}
            <div className="space-y-3 relative">
              {showNow && (
                <div className="absolute top-0 bottom-0 w-px bg-erp-danger border-l border-dashed border-erp-danger z-10"
                     style={{ left: `${nowOffset}%` }}>
                  <div className="absolute top-0 -translate-x-1/2 -translate-y-5 bg-erp-danger text-white text-[9px] px-1 rounded">TODAY</div>
                </div>
              )}

              {milestones.map((m: any) => (
                <div key={m._id} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-3 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1">
                      {m.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-govt-green flex-shrink-0" />}
                      {m.timeline.isOverdue && <AlertTriangle className="w-3 h-3 text-erp-danger flex-shrink-0" />}
                      <span className="truncate">{m.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{m.progress || 0}% · {m.status?.replace('_', ' ')}</div>
                  </div>
                  <div className="col-span-9 relative h-7 bg-slate-50 rounded">
                    {/* Planned bar */}
                    <div className={`absolute top-1 bottom-1 rounded ${
                      m.timeline.isOverdue ? 'bg-red-200' :
                      m.status === 'COMPLETED' ? 'bg-green-200' :
                      'bg-blue-200'
                    }`} style={{ left: `${m.timeline.plannedOffset}%`, width: `${m.timeline.plannedWidth}%` }} />

                    {/* Progress fill inside planned bar */}
                    <div className={`absolute top-1 bottom-1 rounded ${
                      m.timeline.isOverdue ? 'bg-erp-danger' :
                      m.status === 'COMPLETED' ? 'bg-govt-green' :
                      'bg-govt-navy'
                    }`} style={{
                      left: `${m.timeline.plannedOffset}%`,
                      width: `${(m.timeline.plannedWidth * (m.progress || 0)) / 100}%`,
                    }} />

                    {/* Actual bar (if recorded) */}
                    {m.timeline.actualOffset !== null && (
                      <div className="absolute top-0 bottom-0 border-2 border-dashed border-amber-500 rounded"
                           style={{
                             left: `${m.timeline.actualOffset}%`,
                             width: `${m.timeline.actualWidth ?? 0.5}%`,
                           }} />
                    )}

                    {/* Planned date labels */}
                    <div className="absolute top-1/2 -translate-y-1/2 text-[9px] text-white px-1 z-[1]"
                         style={{ left: `${m.timeline.plannedOffset + 0.5}%` }}>
                      {formatDate(m.plannedStartDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded-sm" /> Planned (active)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-govt-navy rounded-sm" /> Progress fill</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-200 rounded-sm" /> Completed</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-200 rounded-sm" /> Overdue</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-dashed border-amber-500 rounded-sm" /> Actual execution</span>
              <span className="flex items-center gap-1"><span className="w-px h-3 bg-erp-danger" /> Today</span>
            </div>
          </div>
        )}
      </div>

      {/* Recent daily reports for this project */}
      <div className="card-gov">
        <div className="card-gov-header">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Activity className="w-4 h-4" /> Recent Daily Activity</h3>
        </div>
        {recentReports?.length ? (
          <div className="divide-y divide-slate-100">
            {recentReports.map((r: any) => (
              <div key={r._id} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">{formatDate(r.reportDate)}</span>
                  {r.verifiedBy ? (
                    <span className="pill pill-approved text-[9px]"><CheckCircle2 className="w-2.5 h-2.5 inline" /> Verified</span>
                  ) : (
                    <span className="pill pill-pending text-[9px]"><Clock4 className="w-2.5 h-2.5 inline" /> Pending SDO</span>
                  )}
                </div>
                <p className="text-sm text-slate-700">{r.workDescription}</p>
                <div className="text-[10px] text-slate-500 mt-1">
                  By {r.recordedBy?.name} ({r.recordedBy?.role})
                  {r.issues && <span className="text-amber-600 ml-2">⚠ Issues</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">No daily reports for this project yet</div>
        )}
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase text-slate-500">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <div className="font-medium mt-0.5">{value ?? '—'}</div>
    </div>
  );
}
