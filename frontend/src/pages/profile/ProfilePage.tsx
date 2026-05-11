import { useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { roleLabel } from '../../utils/format';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    designation: user?.designation || '',
    companyName: user?.companyName || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put('/auth/profile', form);
      updateUser(r.data.data);
      toast.success('Profile updated');
    } finally { setSaving(false); }
  };

  if (!user) return null;

  return (
    <div>
      <PageHeader title="My Profile" subtitle={`${roleLabel(user.role)} · ${user.email}`} />
      <form onSubmit={save} className="card-gov p-6 max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-govt-navy text-white flex items-center justify-center text-2xl font-bold">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-bold">{user.name}</div>
            <div className="text-sm text-slate-500">{roleLabel(user.role)} · {user.department?.name || user.department?.code || 'Platform'}</div>
          </div>
        </div>
        <div><label className="label-gov">Name</label>
          <input className="input-gov" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label-gov">Phone</label>
          <input className="input-gov" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><label className="label-gov">Designation</label>
          <input className="input-gov" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
        {user.role === 'CONTRACTOR' && (
          <div><label className="label-gov">Company Name</label>
            <input className="input-gov" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
        )}
        <div className="md:col-span-2"><button disabled={saving} className="btn-gov">{saving ? 'Saving...' : 'Save Changes'}</button></div>
      </form>
    </div>
  );
}
