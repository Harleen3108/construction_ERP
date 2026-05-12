import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import { Plus, Power, Settings as SettingsIcon, Building2 } from 'lucide-react';

const ALL_MODULES = [
  { key: 'etender', label: 'eTender' },
  { key: 'erp', label: 'Construction ERP' },
  { key: 'finance', label: 'Finance & Billing' },
  { key: 'mb', label: 'Measurement Book' },
  { key: 'reports', label: 'Reports & Analytics' },
  { key: 'inspections', label: 'Inspections' },
];

export default function DepartmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', code: '', type: 'PWD', state: '', city: '',
    contactEmail: '', contactPhone: '', headOfDepartment: '',
    enabledModules: ['etender','erp','finance','mb','reports'],
  });

  const load = () => api.get('/departments').then((r) => setItems(r.data.data));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/departments', form);
    toast.success('Department onboarded with 30-day trial');
    setShow(false);
    setForm({ name: '', code: '', type: 'PWD', state: '', city: '',
              contactEmail: '', contactPhone: '', headOfDepartment: '',
              enabledModules: ['etender','erp','finance','mb','reports'] });
    load();
  };

  const toggle = async (id: string) => {
    await api.put(`/departments/${id}/toggle`);
    toast.success('Status updated');
    load();
  };

  const updateModulesFor = async (id: string, modules: string[]) => {
    await api.put(`/departments/${id}/modules`, { modules });
    toast.success('Modules updated');
    load();
  };

  const toggleModule = (key: string) => {
    setForm((s) => ({
      ...s,
      enabledModules: s.enabledModules.includes(key)
        ? s.enabledModules.filter((m) => m !== key)
        : [...s.enabledModules, key],
    }));
  };

  const deleteDept = async (d: any) => {
    const confirmCode = prompt(
      `⚠️ DELETE "${d.name}"?\n\nThis will permanently delete:\n• The department\n• All ${d.userCount || 0} users (DEPT_ADMIN, CE, EE, SDO, JE, etc.)\n• All subscriptions and invoices\n• All ${d.projectCount || 0} projects\n• The original registration\n\nThis CANNOT be undone.\n\nTo confirm, type the department code: ${d.code}`
    );
    if (!confirmCode) return;
    if (confirmCode.trim().toUpperCase() !== d.code.toUpperCase()) {
      toast.error('Code did not match. Deletion cancelled.');
      return;
    }
    try {
      const r = await api.delete(`/departments/${d._id}`);
      const del = r.data.data?.deleted || {};
      toast.success(
        `Deleted "${d.name}" · ${del.users || 0} users, ${del.subscriptions || 0} subs, ${del.registrations || 0} regs, ${del.projects || 0} projects removed`,
        { duration: 6000 }
      );
      load();
    } catch {/* toast in interceptor */}
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Onboard new departments / engineering companies and manage modules"
        actions={
          <button onClick={() => setShow(true)} className="btn-gov">
            <Plus className="w-4 h-4" /> New Department
          </button>
        }
      />

      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-md shadow-2xl w-full max-w-2xl">
            <div className="px-5 py-3 border-b bg-govt-navy text-white rounded-t-md">
              <h3 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> New Department</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <div><label className="label-gov">Name *</label>
                <input required className="input-gov" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Haryana PWD" /></div>
              <div><label className="label-gov">Code *</label>
                <input required className="input-gov uppercase" value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="HRY-PWD-002" /></div>
              <div><label className="label-gov">Type</label>
                <select className="input-gov" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                  <option>PWD</option><option>IRRIGATION</option><option>PUBLIC_HEALTH</option>
                  <option>B&R</option><option>RAILWAYS</option><option>PRIVATE_COMPANY</option><option>OTHER</option>
                </select></div>
              <div><label className="label-gov">State</label>
                <input className="input-gov" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} /></div>
              <div><label className="label-gov">City</label>
                <input className="input-gov" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} /></div>
              <div><label className="label-gov">Head of Department</label>
                <input className="input-gov" value={form.headOfDepartment} onChange={(e) => setForm({...form, headOfDepartment: e.target.value})} /></div>
              <div><label className="label-gov">Contact Email</label>
                <input type="email" className="input-gov" value={form.contactEmail} onChange={(e) => setForm({...form, contactEmail: e.target.value})} /></div>
              <div><label className="label-gov">Contact Phone</label>
                <input className="input-gov" value={form.contactPhone} onChange={(e) => setForm({...form, contactPhone: e.target.value})} /></div>
              <div className="col-span-2">
                <label className="label-gov">Enabled Modules</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {ALL_MODULES.map((m) => (
                    <label key={m.key} className="flex items-center gap-2 p-2 border rounded text-xs cursor-pointer hover:bg-slate-50">
                      <input type="checkbox" checked={form.enabledModules.includes(m.key)} onChange={() => toggleModule(m.key)} />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button type="button" className="btn-gov-outline" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn-gov">Create Department</button>
            </div>
          </form>
        </div>
      )}

      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs uppercase">Name</th>
              <th className="px-4 py-2.5 text-xs uppercase">Code</th>
              <th className="px-4 py-2.5 text-xs uppercase">Type</th>
              <th className="px-4 py-2.5 text-xs uppercase">Users</th>
              <th className="px-4 py-2.5 text-xs uppercase">Projects</th>
              <th className="px-4 py-2.5 text-xs uppercase">Modules</th>
              <th className="px-4 py-2.5 text-xs uppercase">Onboarded</th>
              <th className="px-4 py-2.5 text-xs uppercase">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d._id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-[10px] text-slate-500">{d.city}, {d.state}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{d.code}</td>
                <td className="px-4 py-3 text-xs">{d.type}</td>
                <td className="px-4 py-3 tabular-nums">{d.userCount || 0}</td>
                <td className="px-4 py-3 tabular-nums">{d.projectCount || 0}</td>
                <td className="px-4 py-3 text-[10px] text-slate-500">{(d.enabledModules || []).length} active</td>
                <td className="px-4 py-3 text-xs">{formatDate(d.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className={`pill ${d.status === 'ACTIVE' ? 'pill-approved' : d.status === 'TRIAL' ? 'pill-pending' : 'pill-rejected'}`}>{d.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => toggle(d._id)} className="text-slate-500 hover:text-amber-600" title="Suspend / Activate">
                      <Power className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteDept(d)} className="text-slate-500 hover:text-erp-danger" title="Delete department (cascade)">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">No departments — onboard one to start</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
