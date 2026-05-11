import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { roleLabel } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Save, RotateCcw, ArrowRight, Activity,
  FileText, ClipboardList, Ruler, Receipt, Award,
} from 'lucide-react';

const ENTITY_INFO: Record<string, { label: string; icon: any; desc: string }> = {
  PROJECT: { label: 'Project Proposal', icon: FileText, desc: 'Approval chain when JE creates a new project proposal' },
  TENDER: { label: 'Tender Publish', icon: ClipboardList, desc: 'Approval chain to publish a tender after creation' },
  MB: { label: 'Measurement Book', icon: Ruler, desc: 'Approval chain when JE submits MB entries' },
  BILL: { label: 'Running Bill', icon: Receipt, desc: 'Approval chain when contractor raises a bill' },
  WORK_ORDER: { label: 'Work Order', icon: Award, desc: 'Approval chain when issuing LOA / Work Order' },
};

const ROLES = ['JE', 'SDO', 'EE', 'CE', 'ACCOUNTANT', 'DEPT_ADMIN'];

export default function WorkflowConfigPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [active, setActive] = useState<string>('PROJECT');
  const [edits, setEdits] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/workflows').then((r) => setWorkflows(r.data.data));
  useEffect(() => { load(); }, []);

  const current = workflows.find((w) => w.entityType === active);
  const editing = edits?.entityType === active ? edits : current;

  const startEdit = () => {
    if (current) setEdits({ ...current, steps: [...(current.steps || [])] });
  };

  const cancelEdit = () => setEdits(null);

  const updateStep = (idx: number, key: string, val: any) => {
    setEdits((s: any) => ({
      ...s,
      steps: s.steps.map((st: any, i: number) => i === idx ? { ...st, [key]: val } : st),
    }));
  };

  const addStep = () => {
    setEdits((s: any) => ({
      ...s,
      steps: [...s.steps, { stage: 'EE', order: s.steps.length + 1, required: true, notes: '' }],
    }));
  };

  const removeStep = (idx: number) => {
    setEdits((s: any) => ({
      ...s,
      steps: s.steps.filter((_: any, i: number) => i !== idx).map((st: any, i: number) => ({ ...st, order: i + 1 })),
    }));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setEdits((s: any) => {
      const arr = [...s.steps];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return { ...s, steps: arr.map((st: any, i: number) => ({ ...st, order: i + 1 })) };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/workflows/${active}`, {
        steps: edits.steps,
        active: edits.active,
        notifyOnEachStep: edits.notifyOnEachStep,
        autoEscalateAfterDays: edits.autoEscalateAfterDays,
      });
      toast.success('Workflow updated');
      setEdits(null);
      load();
    } finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm('Reset to default workflow? This will overwrite current steps.')) return;
    await api.put(`/workflows/${active}/reset`);
    toast.success('Reset to default');
    setEdits(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Approval Workflow Configuration"
        subtitle="Configure custom approval chains for projects, tenders, MBs, bills, and work orders"
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 mb-5">
        {Object.entries(ENTITY_INFO).map(([k, v]) => {
          const Icon = v.icon;
          return (
            <button
              key={k}
              onClick={() => { setActive(k); setEdits(null); }}
              className={`px-4 py-2 text-sm border-b-2 transition flex items-center gap-2 ${
                active === k ? 'border-govt-navy text-govt-navy font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {v.label}
            </button>
          );
        })}
      </div>

      {!editing ? (
        <div className="card-gov p-12 text-center text-slate-400">Loading workflow...</div>
      ) : (
        <div className="card-gov">
          <div className="card-gov-header flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{ENTITY_INFO[active].label}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{ENTITY_INFO[active].desc}</p>
            </div>
            <div className="flex gap-2">
              {edits ? (
                <>
                  <button onClick={cancelEdit} className="btn-gov-outline text-xs">Cancel</button>
                  <button onClick={save} disabled={saving} className="btn-gov text-xs"><Save className="w-3.5 h-3.5" /> Save</button>
                </>
              ) : (
                <>
                  <button onClick={reset} className="btn-gov-outline text-xs"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
                  <button onClick={startEdit} className="btn-gov text-xs"><Activity className="w-3.5 h-3.5" /> Edit</button>
                </>
              )}
            </div>
          </div>

          {/* Visual chain */}
          <div className="p-5">
            <div className="flex items-center gap-2 flex-wrap mb-5 p-4 bg-slate-50 rounded-md">
              <div className="text-xs text-slate-500">Approval flow:</div>
              <span className="px-3 py-1 bg-white border border-slate-300 rounded-full text-xs font-medium">Submitted</span>
              {editing.steps.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="px-3 py-1 bg-govt-navy text-white rounded-full text-xs font-medium">
                    {roleLabel(s.stage)}
                  </span>
                </div>
              ))}
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="px-3 py-1 bg-govt-green text-white rounded-full text-xs font-medium">Approved</span>
            </div>

            {/* Steps editor */}
            <div className="space-y-2">
              {editing.steps.map((s: any, i: number) => (
                <div key={i} className="border border-slate-200 rounded p-3 grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-1 text-center font-bold text-slate-400">#{s.order}</div>
                  <div className="col-span-3">
                    <label className="text-[10px] text-slate-500 uppercase">Approver Role</label>
                    {edits ? (
                      <select className="input-gov" value={s.stage} onChange={(e) => updateStep(i, 'stage', e.target.value)}>
                        {ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    ) : <div className="font-medium text-sm">{roleLabel(s.stage)}</div>}
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] text-slate-500 uppercase">Required</label>
                    {edits ? (
                      <select className="input-gov" value={String(s.required)} onChange={(e) => updateStep(i, 'required', e.target.value === 'true')}>
                        <option value="true">Required</option>
                        <option value="false">Optional</option>
                      </select>
                    ) : (
                      <div className="text-sm">{s.required ? '✓ Required' : 'Optional'}</div>
                    )}
                  </div>
                  <div className="col-span-4">
                    <label className="text-[10px] text-slate-500 uppercase">Notes</label>
                    {edits ? (
                      <input className="input-gov" value={s.notes || ''} onChange={(e) => updateStep(i, 'notes', e.target.value)} />
                    ) : (
                      <div className="text-xs text-slate-600">{s.notes || '—'}</div>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    {edits && (
                      <>
                        <button onClick={() => moveUp(i)} disabled={i === 0} className="text-xs text-slate-500 hover:text-govt-navy">↑</button>
                        <button onClick={() => removeStep(i)} className="text-erp-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {edits && (
                <button onClick={addStep} className="w-full border-2 border-dashed border-slate-300 rounded p-3 text-xs text-slate-500 hover:border-govt-navy hover:text-govt-navy transition flex items-center justify-center gap-2">
                  <Plus className="w-3.5 h-3.5" /> Add Approval Step
                </button>
              )}
            </div>

            {edits && (
              <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={edits.notifyOnEachStep} onChange={(e) => setEdits({...edits, notifyOnEachStep: e.target.checked})} />
                  Notify approvers via email at each step
                </label>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase">Auto-escalate if pending for (days)</label>
                  <input type="number" className="input-gov" value={edits.autoEscalateAfterDays || ''} onChange={(e) => setEdits({...edits, autoEscalateAfterDays: Number(e.target.value) || undefined})} placeholder="Leave blank to disable" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
