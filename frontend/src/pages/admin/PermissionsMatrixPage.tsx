import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { roleLabel } from '../../utils/format';
import toast from 'react-hot-toast';
import { Save, ShieldCheck, Search } from 'lucide-react';

const PERMISSIONS = [
  { key: 'canCreateProject', label: 'Create Project', cat: 'Project' },
  { key: 'canApproveProject', label: 'Approve Project', cat: 'Project' },
  { key: 'canCreateTender', label: 'Create Tender', cat: 'Tender' },
  { key: 'canApproveTender', label: 'Approve Tender', cat: 'Tender' },
  { key: 'canEvaluateBids', label: 'Evaluate Bids', cat: 'Tender' },
  { key: 'canIssueWorkOrder', label: 'Issue Work Order', cat: 'Tender' },
  { key: 'canRecordMB', label: 'Record MB', cat: 'Execution' },
  { key: 'canApproveMB', label: 'Approve MB', cat: 'Execution' },
  { key: 'canRaiseBill', label: 'Raise Bill', cat: 'Finance' },
  { key: 'canApproveBill', label: 'Approve Bill', cat: 'Finance' },
  { key: 'canReleasePayment', label: 'Release Payment', cat: 'Finance' },
  { key: 'canManageBudget', label: 'Manage Budget', cat: 'Finance' },
  { key: 'canManageUsers', label: 'Manage Users', cat: 'Admin' },
  { key: 'canViewAuditLogs', label: 'View Audit Logs', cat: 'Admin' },
];

export default function PermissionsMatrixPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => {
    const params: any = {};
    if (filter) params.role = filter;
    if (search) params.search = search;
    api.get('/users', { params }).then((r) => setUsers(r.data.data));
  };
  useEffect(() => { load(); }, [filter, search]);

  const togglePerm = (userId: string, key: string, currentPerms: any) => {
    setEdits((s) => ({
      ...s,
      [userId]: {
        ...currentPerms,
        ...(s[userId] || {}),
        [key]: !((s[userId]?.[key]) ?? currentPerms[key]),
      },
    }));
  };

  const isChecked = (userId: string, key: string, currentPerms: any) => {
    const e = edits[userId];
    if (e && key in e) return e[key];
    return !!currentPerms?.[key];
  };

  const save = async (userId: string) => {
    setSavingId(userId);
    try {
      await api.put(`/users/${userId}/permissions`, edits[userId]);
      toast.success('Permissions updated');
      setEdits((s) => { const c = { ...s }; delete c[userId]; return c; });
      load();
    } finally { setSavingId(null); }
  };

  // Group permissions by category
  const grouped = PERMISSIONS.reduce<Record<string, typeof PERMISSIONS>>((acc, p) => {
    (acc[p.cat] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Permissions Matrix"
        subtitle="Override default role permissions per user · grant or restrict access to specific actions"
      />

      <div className="card-gov p-3 mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search by name, email..."
            className="input-gov pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-gov w-44" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All roles</option>
          {['CE','EE','SDO','JE','ACCOUNTANT','CONTRACTOR'].map((r) => (
            <option key={r} value={r}>{roleLabel(r)}</option>
          ))}
        </select>
      </div>

      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 bg-slate-50 z-10 border-b border-r border-slate-200 px-3 py-2 text-left text-[10px] uppercase font-semibold text-slate-600">User</th>
              {Object.entries(grouped).map(([cat, perms]) => (
                <th key={cat} colSpan={perms.length} className="border-b border-slate-200 px-2 py-1 text-center text-[10px] uppercase font-semibold text-govt-navy bg-blue-50">
                  {cat}
                </th>
              ))}
              <th className="border-b border-l border-slate-200 px-3 py-2"></th>
            </tr>
            <tr className="bg-slate-50">
              <th className="sticky left-0 bg-slate-50 z-10 border-b border-r border-slate-200 px-3 py-2"></th>
              {PERMISSIONS.map((p) => (
                <th key={p.key} className="border-b border-slate-200 px-1 py-2 text-[9px] font-medium text-slate-600 align-bottom" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 100 }}>
                  {p.label}
                </th>
              ))}
              <th className="border-b border-l border-slate-200 px-3 py-2 text-[10px] uppercase font-semibold">Save</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-slate-50">
                <td className="sticky left-0 bg-white z-10 border-b border-r border-slate-100 px-3 py-2.5">
                  <div className="font-medium text-[13px]">{u.name}</div>
                  <div className="text-[10px] text-slate-500">{roleLabel(u.role)}</div>
                </td>
                {PERMISSIONS.map((p) => (
                  <td key={p.key} className="border-b border-slate-100 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked(u._id, p.key, u.permissions || {})}
                      onChange={() => togglePerm(u._id, p.key, u.permissions || {})}
                      className="w-3.5 h-3.5"
                    />
                  </td>
                ))}
                <td className="border-b border-l border-slate-100 px-3 py-2.5 text-center">
                  {edits[u._id] && (
                    <button onClick={() => save(u._id)} disabled={savingId === u._id} className="btn-gov text-[10px] px-2 py-1">
                      <Save className="w-3 h-3" /> Save
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr><td colSpan={PERMISSIONS.length + 2} className="px-4 py-12 text-center text-slate-400">No users match the filter</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 card-gov p-4 bg-blue-50 border-blue-200 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-govt-navy flex-shrink-0 mt-0.5" />
        <div>
          <strong>How permissions work:</strong> Every user has a default permission set based on their role.
          Use this matrix to <strong>add</strong> or <strong>revoke</strong> specific actions for individual users.
          Checked = allowed. Save changes per row.
        </div>
      </div>
    </div>
  );
}
