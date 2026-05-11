import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  Calendar, CheckCircle2, AlertTriangle, CloudRain, Sun, Cloud,
  User as UserIcon, MapPin, Users as UsersIcon,
} from 'lucide-react';

const WEATHER_ICON: Record<string, any> = {
  CLEAR: Sun, CLOUDY: Cloud, RAIN: CloudRain, EXTREME: AlertTriangle,
};

export default function DailyProgressReviewPage() {
  const [items, setItems] = useState<any[]>([]);
  const [verifiedToday, setVerifiedToday] = useState(0);
  const [acting, setActing] = useState<string | null>(null);

  const load = () => {
    api.get('/sdo/daily-progress-to-verify').then((r) => {
      setItems(r.data.data);
      setVerifiedToday(r.data.verifiedToday);
    });
  };
  useEffect(() => { load(); }, []);

  const verify = async (id: string) => {
    setActing(id);
    try {
      await api.put(`/daily-progress/${id}/verify`);
      toast.success('Verified');
      load();
    } finally { setActing(null); }
  };

  return (
    <div>
      <PageHeader
        title="Daily Progress Review"
        subtitle="Verify JE-submitted site reports — manpower, materials, weather, issues"
        badge={`${items.length} pending · ${verifiedToday} verified today`}
      />

      <div className="card-gov p-3 mb-4 bg-blue-50 border-blue-200 text-xs text-slate-700 flex items-start gap-2">
        <Calendar className="w-4 h-4 text-govt-navy flex-shrink-0 mt-0.5" />
        <div>
          <strong>What to verify:</strong> Reported manpower matches site reality · Material usage aligns with BOQ ·
          Weather conditions are honestly recorded · Any reported issues need follow-up action.
        </div>
      </div>

      <div className="space-y-3">
        {items.map((r) => {
          const WIcon = r.weather ? (WEATHER_ICON[r.weather] || Cloud) : null;
          const totalWorkers = (r.manpower?.skilled || 0) + (r.manpower?.unskilled || 0) + (r.manpower?.supervisors || 0);
          return (
            <div key={r._id} className="card-gov p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/projects/${r.project?._id}`} className="font-semibold hover:underline">{r.project?.name}</Link>
                    {WIcon && <WIcon className={`w-4 h-4 ${r.weather === 'RAIN' ? 'text-blue-500' : r.weather === 'CLEAR' ? 'text-amber-500' : 'text-slate-500'}`} />}
                    {r.weather && <span className="text-[10px] text-slate-500">{r.weather}</span>}
                    {r.issues && <span className="pill pill-pending text-[10px]"><AlertTriangle className="w-3 h-3 inline" /> Issues reported</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {r.recordedBy?.name} ({r.recordedBy?.role})</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(r.reportDate)}</span>
                    {r.project?.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.project.location}</span>}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded p-3 text-sm mb-3">
                <div className="font-medium mb-1">Work Description</div>
                <p className="text-slate-700">{r.workDescription}</p>
                {r.workCompletedToday && (
                  <div className="mt-2 italic text-slate-600">"{r.workCompletedToday}"</div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                <Stat icon={UsersIcon} label="Total Workers" value={totalWorkers} />
                <Stat label="Skilled" value={r.manpower?.skilled || 0} />
                <Stat label="Unskilled" value={r.manpower?.unskilled || 0} />
                <Stat label="Supervisors" value={r.manpower?.supervisors || 0} />
              </div>

              {r.materialsUsed?.length > 0 && (
                <div className="mb-3 text-xs">
                  <div className="font-medium mb-1">Materials Used</div>
                  <div className="flex flex-wrap gap-1">
                    {r.materialsUsed.map((m: any, i: number) => (
                      <span key={i} className="bg-slate-100 px-2 py-0.5 rounded">{m.name}: {m.quantity} {m.unit}</span>
                    ))}
                  </div>
                </div>
              )}

              {r.issues && (
                <div className="bg-amber-50 border border-amber-200 p-2 rounded text-xs text-amber-800 mb-3">
                  <strong>Issues:</strong> {r.issues}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button disabled={acting === r._id} onClick={() => verify(r._id)} className="btn-gov-success text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verify Report
                </button>
              </div>
            </div>
          );
        })}
        {!items.length && (
          <div className="card-gov p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-govt-green mx-auto mb-3" />
            <h3 className="font-semibold">All caught up</h3>
            <p className="text-xs text-slate-500 mt-1">No daily reports pending verification</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-slate-50 rounded p-2 text-center">
      {Icon && <Icon className="w-3 h-3 text-slate-400 mx-auto" />}
      <div className="text-base font-bold tabular-nums">{value}</div>
      <div className="text-[9px] text-slate-500 uppercase">{label}</div>
    </div>
  );
}
