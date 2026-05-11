import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';
import { Plus, X, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'pill-info', MEDIUM: 'pill-pending', HIGH: 'pill-progress', CRITICAL: 'pill-rejected',
};

export default function SupportPage() {
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({});
  const [filter, setFilter] = useState('');
  const [show, setShow] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [form, setForm] = useState({ subject: '', description: '', category: 'TECHNICAL', priority: 'MEDIUM' });
  const [response, setResponse] = useState('');
  const { user } = useAuthStore();

  const load = () => {
    const params: any = {};
    if (filter) params.status = filter;
    api.get('/support', { params }).then((r) => { setItems(r.data.data); setCounts(r.data.counts); });
  };
  useEffect(() => { load(); }, [filter]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/support', form);
    toast.success('Ticket raised');
    setShow(false);
    setForm({ subject: '', description: '', category: 'TECHNICAL', priority: 'MEDIUM' });
    load();
  };

  const respond = async () => {
    if (!response) return;
    await api.post(`/support/${active._id}/respond`, { message: response });
    setResponse('');
    const r = await api.get(`/support/${active._id}`);
    setActive(r.data.data);
    load();
  };

  const updateStatus = async (status: string) => {
    await api.put(`/support/${active._id}/status`, { status });
    toast.success('Status updated');
    const r = await api.get(`/support/${active._id}`);
    setActive(r.data.data);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Support Tickets"
        subtitle="Manage support requests, bug reports, and feature requests across all departments"
        actions={<button className="btn-gov" onClick={() => setShow(true)}><Plus className="w-4 h-4" /> Raise Ticket</button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Open" value={counts.open || 0} color="text-amber-600" />
        <Stat label="In Progress" value={counts.inProgress || 0} color="text-blue-600" />
        <Stat label="Resolved" value={counts.resolved || 0} color="text-govt-green" />
        <Stat label="Critical" value={counts.critical || 0} color="text-erp-danger" />
      </div>

      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 text-xs border-b-2 transition ${filter === s ? 'border-govt-navy text-govt-navy font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {items.map((t) => (
          <div key={t._id} onClick={() => { setActive(t); }} className="card-gov p-4 cursor-pointer hover:shadow-gov-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-500">{t.ticketId}</span>
                  <span className={`pill ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                  <span className="pill pill-info text-[10px]">{t.category}</span>
                </div>
                <h3 className="font-semibold mt-1">{t.subject}</h3>
                <div className="text-xs text-slate-500 mt-1">
                  Raised by <strong>{t.raisedBy?.name}</strong> ({t.raisedBy?.role}) ·
                  {t.department?.name && <> {t.department.name} · </>}
                  {formatDateTime(t.createdAt)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`pill ${t.status === 'RESOLVED' ? 'pill-approved' : t.status === 'OPEN' ? 'pill-pending' : 'pill-info'}`}>
                  {t.status}
                </span>
                <span className="text-[10px] text-slate-500">{t.responses?.length || 0} replies</span>
              </div>
            </div>
          </div>
        ))}
        {!items.length && <div className="card-gov p-12 text-center text-slate-400">No support tickets</div>}
      </div>

      {/* Create modal */}
      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={create} className="bg-white rounded-md shadow-2xl w-full max-w-lg">
            <div className="px-5 py-3 border-b bg-govt-navy text-white flex items-center justify-between">
              <h3 className="font-semibold">Raise Support Ticket</h3>
              <button type="button" onClick={() => setShow(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="label-gov">Subject *</label>
                <input required className="input-gov" value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-gov">Category</label>
                  <select className="input-gov" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                    <option>TECHNICAL</option><option>BUG</option><option>FEATURE_REQUEST</option><option>BILLING</option><option>OTHER</option>
                  </select></div>
                <div><label className="label-gov">Priority</label>
                  <select className="input-gov" value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})}>
                    <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
                  </select></div>
              </div>
              <div><label className="label-gov">Description *</label>
                <textarea required className="input-gov h-32" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button type="button" className="btn-gov-outline" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn-gov">Submit</button>
            </div>
          </form>
        </div>
      )}

      {/* Detail modal */}
      {active && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3 border-b bg-govt-navy text-white sticky top-0 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{active.subject}</h3>
                <div className="text-[11px] opacity-80">{active.ticketId} · {active.priority}</div>
              </div>
              <button onClick={() => setActive(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <div className="bg-slate-50 rounded p-3 mb-4 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-slate-500" />
                  <strong>{active.raisedBy?.name}</strong>
                  <span className="text-xs text-slate-500">{formatDateTime(active.createdAt)}</span>
                </div>
                <p>{active.description}</p>
              </div>

              <div className="space-y-2 mb-4">
                {(active.responses || []).map((r: any, i: number) => (
                  <div key={i} className={`rounded p-3 text-sm ${r.by?.role === 'SUPER_ADMIN' ? 'bg-blue-50 ml-6' : 'bg-slate-50 mr-6'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <strong className="text-xs">{r.by?.name}</strong>
                      <span className="text-[10px] text-slate-500">{r.by?.role}</span>
                      <span className="text-[10px] text-slate-400">· {formatDateTime(r.at)}</span>
                    </div>
                    <p>{r.message}</p>
                  </div>
                ))}
              </div>

              {active.status !== 'CLOSED' && (
                <div className="border-t pt-3">
                  <textarea className="input-gov h-20" placeholder="Type your reply..."
                    value={response} onChange={(e) => setResponse(e.target.value)} />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1">
                      {user?.role === 'SUPER_ADMIN' && active.status !== 'RESOLVED' && (
                        <button onClick={() => updateStatus('RESOLVED')} className="btn-gov-success text-xs">Resolve</button>
                      )}
                      {user?.role === 'SUPER_ADMIN' && (
                        <button onClick={() => updateStatus('CLOSED')} className="btn-gov-outline text-xs">Close</button>
                      )}
                    </div>
                    <button onClick={respond} className="btn-gov text-xs"><Send className="w-3 h-3" /> Reply</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: any) {
  return (
    <div className="card-gov p-4">
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
      <div className={`text-xl font-bold tabular-nums mt-1 ${color}`}>{value}</div>
    </div>
  );
}
