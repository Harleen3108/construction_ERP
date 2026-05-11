import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import PageHeader from './../components/shared/PageHeader';
import { formatDateTime } from '../utils/format';
import { Bell, CheckCircle2, Inbox, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    const params: any = {};
    if (filter === 'unread') params.unread = 'true';
    setLoading(true);
    api.get('/notifications', { params })
      .then((r) => { setItems(r.data.data); setUnreadCount(r.data.unreadCount); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const markRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    load();
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="In-app notifications · approvals, bills, payments, project alerts"
        badge={`${unreadCount} unread`}
        actions={
          unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-gov-outline text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
            </button>
          )
        }
      />

      <div className="flex gap-1 mb-3 border-b border-slate-200">
        {[
          { val: 'all', label: `All (${items.length})` },
          { val: 'unread', label: `Unread (${unreadCount})` },
        ].map((b: any) => (
          <button key={b.val} onClick={() => setFilter(b.val)}
            className={`px-4 py-2 text-sm border-b-2 transition ${filter === b.val ? 'border-govt-navy text-govt-navy font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {b.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card-gov p-12 text-center text-slate-400">Loading...</div>
      ) : !items.length ? (
        <div className="card-gov p-12 text-center text-slate-400">
          <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="font-medium">No notifications</p>
          <p className="text-xs mt-1">{filter === 'unread' ? 'All caught up!' : 'You\'ll see updates here when things happen'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n._id} className={`card-gov p-4 transition ${n.read ? 'opacity-70' : 'border-l-4 border-l-govt-navy'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  n.read ? 'bg-slate-100 text-slate-500' : 'bg-govt-navy/10 text-govt-navy'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-medium ${n.read ? 'text-slate-600' : 'text-slate-800'}`}>{n.title}</h3>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-govt-navy" />}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">{n.type}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span>{formatDateTime(n.createdAt)}</span>
                    {n.link && <Link to={n.link} onClick={() => !n.read && markRead(n._id)} className="text-govt-navy hover:underline">View →</Link>}
                  </div>
                </div>
                {!n.read && (
                  <button onClick={() => markRead(n._id)} className="text-xs text-slate-500 hover:text-govt-navy" title="Mark read">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
