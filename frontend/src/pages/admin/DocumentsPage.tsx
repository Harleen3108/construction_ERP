import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate } from '../../utils/format';
import { FileText, FolderOpen, Search, Filter, Download, ExternalLink, Briefcase, ClipboardList, Ruler, Receipt } from 'lucide-react';

type DocItem = {
  source: 'PROJECT' | 'TENDER' | 'BID' | 'MB';
  sourceId: string;
  sourceName: string;
  url: string;
  name?: string;
  uploadedAt?: string;
  publicId?: string;
};

const SOURCE_META: Record<string, { icon: any; color: string }> = {
  PROJECT: { icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
  TENDER: { icon: ClipboardList, color: 'text-amber-600 bg-amber-50' },
  BID: { icon: FileText, color: 'text-purple-600 bg-purple-50' },
  MB: { icon: Ruler, color: 'text-green-600 bg-green-50' },
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/projects').then((r) => r.data.data || []),
      api.get('/tenders').then((r) => r.data.data || []),
    ]).then(([projects, tenders]) => {
      const all: DocItem[] = [];
      projects.forEach((p: any) => {
        (p.documents || []).forEach((d: any) =>
          all.push({ source: 'PROJECT', sourceId: p._id, sourceName: p.name, url: d.url, name: d.name, uploadedAt: d.uploadedAt, publicId: d.publicId })
        );
        (p.drawings || []).forEach((d: any) =>
          all.push({ source: 'PROJECT', sourceId: p._id, sourceName: `${p.name} (Drawing)`, url: d.url, name: d.name, uploadedAt: d.uploadedAt, publicId: d.publicId })
        );
      });
      tenders.forEach((t: any) => {
        (t.documents || []).forEach((d: any) =>
          all.push({ source: 'TENDER', sourceId: t._id, sourceName: t.title, url: d.url, name: d.name, publicId: d.publicId })
        );
      });
      setDocs(all);
      setLoading(false);
    });
  }, []);

  const filtered = docs.filter((d) => {
    if (filter && d.source !== filter) return false;
    if (search) {
      const t = search.toLowerCase();
      return (d.name?.toLowerCase().includes(t) || d.sourceName?.toLowerCase().includes(t));
    }
    return true;
  });

  const counts = {
    total: docs.length,
    project: docs.filter((d) => d.source === 'PROJECT').length,
    tender: docs.filter((d) => d.source === 'TENDER').length,
    bid: docs.filter((d) => d.source === 'BID').length,
    mb: docs.filter((d) => d.source === 'MB').length,
  };

  return (
    <div>
      <PageHeader
        title="Document Management"
        subtitle="Centralized document hub · drawings, BOQ, NOCs, contracts, MB photos across all projects and tenders"
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Stat label="Total Documents" value={counts.total} />
        <Stat label="Project" value={counts.project} />
        <Stat label="Tender" value={counts.tender} />
        <Stat label="Bid" value={counts.bid} />
        <Stat label="MB" value={counts.mb} />
      </div>

      <div className="card-gov p-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search documents by name or source..." className="input-gov pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {[
            { label: 'All', val: '' },
            { label: 'Projects', val: 'PROJECT' },
            { label: 'Tenders', val: 'TENDER' },
            { label: 'Bids', val: 'BID' },
            { label: 'MB', val: 'MB' },
          ].map((b) => (
            <button key={b.label} onClick={() => setFilter(b.val)}
              className={`px-3 py-1.5 text-xs rounded border ${filter === b.val ? 'bg-govt-navy text-white border-govt-navy' : 'bg-white border-slate-300 text-slate-600 hover:border-govt-navy'}`}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card-gov p-12 text-center text-slate-400">Loading documents...</div>
      ) : !filtered.length ? (
        <div className="card-gov p-12 text-center text-slate-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>No documents found</p>
          <p className="text-xs mt-1">Documents uploaded against projects, tenders, MB entries appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((d, i) => {
            const meta = SOURCE_META[d.source];
            const Icon = meta?.icon || FileText;
            return (
              <div key={i} className="card-gov p-4 hover:shadow-gov-lg transition">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded ${meta?.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{d.name || 'Document'}</div>
                    <div className="text-[10px] text-slate-500 truncate">{d.sourceName}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="pill pill-info text-[9px]">{d.source}</span>
                      {d.uploadedAt && <span className="text-[10px] text-slate-400">{formatDate(d.uploadedAt)}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <a href={d.url} target="_blank" rel="noreferrer" className="btn-gov-outline text-[10px] flex-1">
                    <ExternalLink className="w-3 h-3" /> View
                  </a>
                  <a href={d.url} download className="btn-gov-outline text-[10px]">
                    <Download className="w-3 h-3" />
                  </a>
                  {d.source === 'PROJECT' && (
                    <Link to={`/projects/${d.sourceId}`} className="text-[10px] text-govt-navy hover:underline">Open Project</Link>
                  )}
                  {d.source === 'TENDER' && (
                    <Link to={`/tenders/${d.sourceId}`} className="text-[10px] text-govt-navy hover:underline">Open Tender</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="card-gov p-3 text-center">
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
      <div className="text-xl font-bold text-slate-800 tabular-nums">{value}</div>
    </div>
  );
}
