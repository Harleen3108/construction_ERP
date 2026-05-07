import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate, roleLabel } from '../../utils/format';
import toast from 'react-hot-toast';
import { Power, BadgeCheck } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  const load = () => api.get('/users', { params: { role: filter || undefined } }).then((r) => setUsers(r.data.data));
  useEffect(() => { load(); }, [filter]);

  const toggle = async (id: string) => {
    await api.put(`/users/${id}/toggle`);
    toast.success('User updated');
    load();
  };

  return (
    <div>
      <PageHeader
        title="Users & Contractors"
        subtitle="Manage all users · Verify contractors · Assign roles"
        actions={
          <select className="input-gov w-44" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All roles</option>
            {['JE','SDO','EE','CE','TENDER_OFFICER','CONTRACTOR','ACCOUNTANT','TREASURY','ADMIN'].map((r) => (
              <option key={r} value={r}>{roleLabel(r)}</option>
            ))}
          </select>
        }
      />
      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs uppercase">Name</th>
              <th className="px-4 py-2.5 text-xs uppercase">Email</th>
              <th className="px-4 py-2.5 text-xs uppercase">Role</th>
              <th className="px-4 py-2.5 text-xs uppercase">Company / Dept</th>
              <th className="px-4 py-2.5 text-xs uppercase">Joined</th>
              <th className="px-4 py-2.5 text-xs uppercase">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{u.email}</td>
                <td className="px-4 py-3"><span className="pill pill-info">{roleLabel(u.role)}</span></td>
                <td className="px-4 py-3">{u.companyName || u.department || '—'}</td>
                <td className="px-4 py-3 text-xs">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className={`pill ${u.active ? 'pill-approved' : 'pill-rejected'}`}>
                    {u.active ? <><BadgeCheck className="w-3 h-3 inline" /> Active</> : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggle(u._id)} className="text-slate-500 hover:text-erp-danger">
                    <Power className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
