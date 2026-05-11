import { useState } from 'react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { Bell, Mail, MessageSquare, Save } from 'lucide-react';

const NOTIFICATIONS = [
  { key: 'approval_pending', label: 'Approval Pending', desc: 'When something lands in your approval queue', defaults: { inApp: true, email: true } },
  { key: 'approval_completed', label: 'Approval Completed', desc: 'When your submitted item is approved', defaults: { inApp: true, email: true } },
  { key: 'project_created', label: 'New Project', desc: 'When a project is created in your department', defaults: { inApp: true, email: false } },
  { key: 'tender_published', label: 'Tender Published', desc: 'When a new tender is opened for bidding', defaults: { inApp: true, email: true } },
  { key: 'bid_submitted', label: 'Bid Submitted', desc: 'Contractor submits a bid against your tender', defaults: { inApp: true, email: false } },
  { key: 'l1_identified', label: 'L1 Bidder Identified', desc: 'After auto-evaluation', defaults: { inApp: true, email: true } },
  { key: 'work_order_issued', label: 'Work Order Issued', desc: 'Contractor receives LOA / WO', defaults: { inApp: true, email: true } },
  { key: 'mb_submitted', label: 'MB Submitted', desc: 'JE submits a measurement entry', defaults: { inApp: true, email: false } },
  { key: 'bill_raised', label: 'Bill Raised', desc: 'Contractor raises a running bill', defaults: { inApp: true, email: true } },
  { key: 'payment_released', label: 'Payment Released', desc: 'Treasury releases payment with UTR', defaults: { inApp: true, email: true } },
  { key: 'project_delayed', label: 'Project Delayed', desc: 'Project past planned end date', defaults: { inApp: true, email: true } },
  { key: 'subscription_expiring', label: 'Subscription Expiring', desc: '7 days before SaaS subscription expires', defaults: { inApp: true, email: true } },
];

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, { inApp: boolean; email: boolean; sms?: boolean }>>(
    () => Object.fromEntries(NOTIFICATIONS.map((n) => [n.key, n.defaults]))
  );

  const toggle = (key: string, channel: 'inApp' | 'email' | 'sms') => {
    setPrefs((s) => ({ ...s, [key]: { ...s[key], [channel]: !s[key][channel] } }));
  };

  const save = () => {
    // Backend hook would be: PUT /api/notifications/preferences
    toast.success('Notification preferences saved');
  };

  return (
    <div>
      <PageHeader
        title="Notification Settings"
        subtitle="Choose which events trigger notifications and through which channels"
        actions={<button onClick={save} className="btn-gov text-xs"><Save className="w-3.5 h-3.5" /> Save</button>}
      />

      <div className="card-gov overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] uppercase font-semibold text-slate-600">Event</th>
              <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold text-slate-600">
                <Bell className="w-3.5 h-3.5 inline" /> In-App
              </th>
              <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold text-slate-600">
                <Mail className="w-3.5 h-3.5 inline" /> Email
              </th>
              <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold text-slate-600">
                <MessageSquare className="w-3.5 h-3.5 inline" /> SMS
              </th>
            </tr>
          </thead>
          <tbody>
            {NOTIFICATIONS.map((n) => (
              <tr key={n.key} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-[13px]">{n.label}</div>
                  <div className="text-[11px] text-slate-500">{n.desc}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={prefs[n.key].inApp} onChange={() => toggle(n.key, 'inApp')} className="w-4 h-4" />
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={prefs[n.key].email} onChange={() => toggle(n.key, 'email')} className="w-4 h-4" />
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={prefs[n.key].sms || false} onChange={() => toggle(n.key, 'sms')} className="w-4 h-4" disabled />
                  <div className="text-[9px] text-slate-400">soon</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 card-gov p-4 bg-blue-50 border-blue-200 text-xs text-slate-600">
        <strong className="text-govt-navy">Tip:</strong> Email notifications use the SMTP credentials configured by Super Admin.
        SMS gateway integration is planned for Phase 3.
      </div>
    </div>
  );
}
