import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate } from '../../utils/format';
import {
  Camera, CheckCircle2, Clock4, Calendar, MapPin, AlertTriangle,
  CloudRain, Sun, Cloud, Plus, Users,
} from 'lucide-react';

const WEATHER_ICON: Record<string, any> = {
  CLEAR: Sun, CLOUDY: Cloud, RAIN: CloudRain, EXTREME: AlertTriangle,
};

export default function SiteDiaryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectFilter, setProjectFilter] = useState('');

  useEffect(() => {
    api.get('/daily-progress').then((r) => setItems(r.data.data));
    api.get('/projects').then((r) => setProjects(r.data.data || []));
  }, []);

  const filtered = projectFilter
    ? items.filter((i) => i.project?._id === projectFilter)
    : items;

  // Group by date
  const grouped: Record<string, any[]> = {};
  filtered.forEach((r) => {
    const k = new Date(r.reportDate).toISOString().slice(0, 10);
    (grouped[k] = grouped[k] || []).push(r);
  });
  const sortedDates = Object.keys(grouped).sort().reverse();

  return (
    <div>
      <PageHeader
        title="Site Diary"
        subtitle="Your daily field log · timeline of every site visit, manpower used, materials, photos, issues"
        badge={`${filtered.length} entr${filtered.length !== 1 ? 'ies' : 'y'}`}
        actions={
          <Link to="/daily-progress" className="btn-gov text-xs">
            <Plus className="w-4 h-4" /> New Entry
          </Link>
        }
      />

      <div className="card-gov p-3 mb-4 flex items-center gap-3">
        <span className="text-xs text-slate-500">Project:</span>
        <select className="input-gov w-64" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-govt-navy text-white flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold">{formatDate(date)}</div>
                <div className="text-[10px] text-slate-500">{grouped[date].length} report{grouped[date].length !== 1 ? 's' : ''}</div>
              </div>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="space-y-2 ml-13 pl-3 border-l-2 border-slate-100">
              {grouped[date].map((r) => {
                const WIcon = r.weather ? (WEATHER_ICON[r.weather] || Cloud) : null;
                const total = (r.manpower?.skilled || 0) + (r.manpower?.unskilled || 0) + (r.manpower?.supervisors || 0);
                return (
                  <div key={r._id} className="card-gov p-4 ml-2">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{r.project?.name}</span>
                        {WIcon && <WIcon className={`w-3.5 h-3.5 ${r.weather === 'RAIN' ? 'text-blue-500' : r.weather === 'CLEAR' ? 'text-amber-500' : 'text-slate-500'}`} />}
                        {r.project?.location && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {r.project.location}
                          </span>
                        )}
                        {r.verifiedBy ? (
                          <span className="pill pill-approved text-[10px]"><CheckCircle2 className="w-2.5 h-2.5 inline" /> Verified</span>
                        ) : (
                          <span className="pill pill-pending text-[10px]"><Clock4 className="w-2.5 h-2.5 inline" /> Awaiting SDO</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700">{r.workDescription}</p>
                    {r.workCompletedToday && (
                      <p className="text-xs text-slate-600 italic mt-1">"{r.workCompletedToday}"</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                        <Users className="w-2.5 h-2.5" /> {total} workers
                      </span>
                      {r.materialsUsed?.length > 0 && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded">📦 {r.materialsUsed.length} materials</span>
                      )}
                      {r.photos?.length > 0 && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <Camera className="w-2.5 h-2.5" /> {r.photos.length} photos
                        </span>
                      )}
                      {r.issues && (
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">⚠ Issues</span>
                      )}
                      {r.verifiedBy && (
                        <span className="text-slate-400">· Verified by {r.verifiedBy.name}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {!sortedDates.length && (
          <div className="card-gov p-12 text-center text-slate-400">
            <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No diary entries yet</p>
            <Link to="/daily-progress" className="text-xs text-govt-navy hover:underline mt-1 inline-block">
              Create your first daily report →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
