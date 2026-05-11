import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate, roleLabel } from '../../utils/format';
import toast from 'react-hot-toast';
import { Power, BadgeCheck, Plus, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const ROLES = ['CE','EE','SDO','JE','CONTRACTOR','ACCOUNTANT'];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({
    name: '', email: '', password: '', role: 'JE',
    phone: '', designation: '', employeeId: '',
    companyName: '', gstNumber: '', panNumber: '',
  });
  const { user } = useAuthStore();
  const canCreate = user?.role === 'DEPT_ADMIN' || user?.role === 'SUPER_ADMIN';

  const load = () => api.get('/users', { params: { role: filter || undefined } }).then((r) => setUsers(r.data.data));
  useEffect(() => { load(); }, [filter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      toast.success('User created');
      setShow(false);
      setForm({ name: '', email: '', password: '', role: 'JE', phone: '', designation: '', employeeId: '', companyName: '', gstNumber: '', panNumber: '' });
      load();
    } catch {/* toast in interceptor */}
  };

  const toggle = async (id: string) => {
    await api.put(`/users/${id}/toggle`);
    toast.success('User updated');
    load();
  };

  const verify = async (id: string) => {
    await api.put(`/users/${id}/verify`);
    toast.success('Contractor verified');
    load();
  };

  return (
    <div>
      <PageHeader
        title="Users & Contractors"
        subtitle="Manage department engineers, accountants, and contractors"
        actions={
          <div className="flex items-center gap-2">
            <select className="input-gov w-44" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
            {canCreate && (
              <button onClick={() => setShow(true)} className="btn-gov">
                <Plus className="w-4 h-4" /> Onboard User
              </button>
            )}
          </div>
        }
      />

      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-md shadow-2xl w-full max-w-2xl">
            <div className="px-5 py-3 border-b bg-govt-navy text-white rounded-t-md flex items-center justify-between">
              <h3 className="font-semibold">Onboard New User</h3>
              <button type="button" onClick={() => setShow(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <div><label className="label-gov">Name *</label>
                <input required className="input-gov" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
              <div><label className="label-gov">Role *</label>
                <select className="input-gov" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
                  {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select></div>
              <div><label className="label-gov">Email *</label>
                <input type="email" required className="input-gov" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
              <div><label className="label-gov">Password *</label>
                <input type="password" required minLength={6} className="input-gov" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} /></div>
              <div><label className="label-gov">Phone</label>
                <input className="input-gov" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
              <div><label className="label-gov">Designation</label>
                <input className="input-gov" value={form.designation} onChange={(e) => setForm({...form, designation: e.target.value})} /></div>
              <div><label className="label-gov">Employee ID</label>
                <input className="input-gov" value={form.employeeId} onChange={(e) => setForm({...form, employeeId: e.target.value})} /></div>
              {form.role === 'CONTRACTOR' && (
                <>
                  <div><label className="label-gov">Company Name</label>
                    <input className="input-gov" value={form.companyName} onChange={(e) => setForm({...form, companyName: e.target.value})} /></div>
                  <div><label className="label-gov">GST Number</label>
                    <input className="input-gov" value={form.gstNumber} onChange={(e) => setForm({...form, gstNumber: e.target.value})} /></div>
                  <div><label className="label-gov">PAN Number</label>
                    <input className="input-gov" value={form.panNumber} onChange={(e) => setForm({...form, panNumber: e.target.value})} /></div>
                </>
              )}
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button type="button" className="btn-gov-outline" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn-gov">Create User</button>
            </div>
          </form>
        </div>
      )}

      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs uppercase">Name</th>
              <th className="px-4 py-2.5 text-xs uppercase">Email</th>
              <th className="px-4 py-2.5 text-xs uppercase">Role</th>
              <th className="px-4 py-2.5 text-xs uppercase">Designation / Company</th>
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
                <td className="px-4 py-3 text-xs">{u.designation || u.companyName || '—'}</td>
                <td className="px-4 py-3 text-xs">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className={`pill ${u.active ? 'pill-approved' : 'pill-rejected'}`}>
                    {u.active ? <><BadgeCheck className="w-3 h-3 inline" /> Active</> : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {u.role === 'CONTRACTOR' && !u.contractorVerified && (
                    <button onClick={() => verify(u._id)} className="text-xs text-govt-green hover:underline">Verify</button>
                  )}
                  <button onClick={() => toggle(u._id)} className="text-slate-500 hover:text-erp-danger" title="Toggle">
                    <Power className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No users found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
