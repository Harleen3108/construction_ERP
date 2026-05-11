import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, FileText, CheckCircle2, ClipboardList,
  Megaphone, Send, Scale, Award, Activity, Ruler,
  Receipt, Wallet, ShieldCheck, Users, Building2, X,
  Calendar, CreditCard, Settings, Inbox, Headphones,
  Layers, Briefcase, FolderOpen, BarChart3, Bell, KeyRound,
  AlertTriangle, Package,
} from 'lucide-react';
import { UserRole } from '../../types';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  roles: UserRole[];
  stage?: number;
  group?: string;
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard,
    roles: ['SUPER_ADMIN','DEPT_ADMIN','CE','EE','SDO','JE','CONTRACTOR','ACCOUNTANT'] },

  // SUPER ADMIN — SaaS layer
  { to: '/admin/registrations', label: 'Pending Registrations', icon: Inbox, roles: ['SUPER_ADMIN'], group: 'SaaS' },
  { to: '/admin/departments', label: 'Departments', icon: Building2, roles: ['SUPER_ADMIN'], group: 'SaaS' },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard, roles: ['SUPER_ADMIN'], group: 'SaaS' },
  { to: '/admin/invoices', label: 'Invoices & Billing', icon: Receipt, roles: ['SUPER_ADMIN'], group: 'SaaS' },
  { to: '/admin/support', label: 'Support Tickets', icon: Headphones, roles: ['SUPER_ADMIN','DEPT_ADMIN','CE','EE','SDO','JE','CONTRACTOR','ACCOUNTANT'], group: 'SaaS' },

  // EE — Operations
  { to: '/ee/queue', label: 'My Approval Queue', icon: Inbox, roles: ['EE'], group: 'Operations' },
  { to: '/ee/team', label: 'My Team (SDO/JE)', icon: Users, roles: ['EE'], group: 'Operations' },
  { to: '/material-requests', label: 'Material Requests', icon: Package, roles: ['EE','SDO','JE','CONTRACTOR','DEPT_ADMIN'], group: 'Operations' },

  // SDO — Verification
  { to: '/sdo/queue', label: 'Verification Queue', icon: Inbox, roles: ['SDO'], group: 'Verification' },
  { to: '/sdo/mb-verify', label: 'MB Verification', icon: Ruler, roles: ['SDO'], group: 'Verification' },
  { to: '/sdo/daily-progress', label: 'Daily Progress Review', icon: Calendar, roles: ['SDO'], group: 'Verification' },
  { to: '/ce/inspections', label: 'My Inspections', icon: CheckCircle2, roles: ['SDO'], group: 'Verification' },

  // JE — Field Execution
  { to: '/je/site-monitoring', label: 'Site Monitoring', icon: Activity, roles: ['JE'], group: 'Field' },
  { to: '/je/submissions', label: 'My Submissions', icon: ClipboardList, roles: ['JE'], group: 'Field' },
  { to: '/je/tasks', label: 'My Tasks', icon: CheckCircle2, roles: ['JE'], group: 'Field' },
  { to: '/je/site-diary', label: 'Site Diary', icon: Calendar, roles: ['JE'], group: 'Field' },

  // Accountant — Finance
  { to: '/acc/bill-queue', label: 'Bill Verification Queue', icon: Inbox, roles: ['ACCOUNTANT'], group: 'Finance' },
  { to: '/acc/deductions', label: 'GST / TDS Management', icon: BarChart3, roles: ['ACCOUNTANT'], group: 'Finance' },
  { to: '/acc/budget', label: 'Budget Monitor', icon: Wallet, roles: ['ACCOUNTANT'], group: 'Finance' },
  { to: '/acc/contractor-payments', label: 'Contractor Payments', icon: Users, roles: ['ACCOUNTANT'], group: 'Finance' },

  // Contractor — Workspace
  { to: '/contractor/projects', label: 'My Projects', icon: Briefcase, roles: ['CONTRACTOR'], group: 'Workspace' },
  { to: '/contractor/earnings', label: 'My Earnings', icon: Wallet, roles: ['CONTRACTOR'], group: 'Workspace' },
  { to: '/contractor/profile', label: 'Profile & Documents', icon: KeyRound, roles: ['CONTRACTOR'], group: 'Workspace' },

  // CE — Governance
  { to: '/ce/approvals', label: 'High-Value Approvals', icon: Inbox, roles: ['CE'], group: 'Governance' },
  { to: '/ce/projects', label: 'Project Monitor', icon: Briefcase, roles: ['CE'], group: 'Governance' },
  { to: '/ce/tenders', label: 'Tender Oversight', icon: ClipboardList, roles: ['CE'], group: 'Governance' },
  { to: '/ce/risk', label: 'Risk Dashboard', icon: AlertTriangle, roles: ['CE'], group: 'Governance' },
  { to: '/ce/financial', label: 'Financial Monitor', icon: Wallet, roles: ['CE'], group: 'Governance' },
  { to: '/ce/engineers', label: 'Engineer Performance', icon: Users, roles: ['CE'], group: 'Governance' },
  { to: '/ce/inspections', label: 'Site Inspections', icon: CheckCircle2, roles: ['CE','EE','SDO','DEPT_ADMIN'], group: 'Governance' },
  { to: '/ce/approval-history', label: 'My Approval History', icon: ShieldCheck, roles: ['CE'], group: 'Governance' },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['SUPER_ADMIN','DEPT_ADMIN','CE','EE','SDO','JE','CONTRACTOR','ACCOUNTANT'], group: 'Main' },

  // DEPT ADMIN — operational management
  { to: '/users', label: 'Users', icon: Users, roles: ['DEPT_ADMIN','SUPER_ADMIN'], group: 'Department' },
  { to: '/permissions', label: 'Permissions Matrix', icon: KeyRound, roles: ['DEPT_ADMIN','SUPER_ADMIN'], group: 'Department' },
  { to: '/divisions', label: 'Divisions', icon: Layers, roles: ['DEPT_ADMIN','SUPER_ADMIN','CE'], group: 'Department' },
  { to: '/contractors', label: 'Contractors', icon: Briefcase, roles: ['DEPT_ADMIN','EE','CE','SUPER_ADMIN'], group: 'Department' },
  { to: '/workflows', label: 'Approval Workflows', icon: Activity, roles: ['DEPT_ADMIN','SUPER_ADMIN'], group: 'Department' },
  { to: '/documents', label: 'Document Hub', icon: FolderOpen, roles: ['DEPT_ADMIN','CE','EE','SDO','JE','SUPER_ADMIN'], group: 'Department' },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['DEPT_ADMIN','CE','EE','SUPER_ADMIN'], group: 'Department' },
  { to: '/notification-settings', label: 'Notification Settings', icon: Bell, roles: ['DEPT_ADMIN','SUPER_ADMIN'], group: 'Department' },
  { to: '/department/profile', label: 'Department Profile', icon: Settings, roles: ['DEPT_ADMIN'], group: 'Department' },

  // 12-stage workflow
  { to: '/proposals', label: 'Project Proposals', icon: FileText,
    roles: ['JE','SDO','EE','CE','DEPT_ADMIN'], stage: 1 },
  { to: '/approvals', label: 'Sanction & Approvals', icon: CheckCircle2,
    roles: ['SDO','EE','CE','ACCOUNTANT','DEPT_ADMIN'], stage: 2 },
  { to: '/tenders', label: 'Tender Management', icon: ClipboardList,
    roles: ['JE','SDO','EE','CE','DEPT_ADMIN'], stage: 3 },
  { to: '/tenders/published', label: 'Open Tenders', icon: Megaphone,
    roles: ['CONTRACTOR'], stage: 4 },
  { to: '/bids', label: 'My Bids', icon: Send, roles: ['CONTRACTOR'], stage: 5 },
  { to: '/bids/evaluate', label: 'Bid Evaluation', icon: Scale,
    roles: ['EE','CE','DEPT_ADMIN'], stage: 6 },
  { to: '/work-orders', label: 'Work Orders & LOA', icon: Award,
    roles: ['EE','CE','CONTRACTOR','DEPT_ADMIN'], stage: 7 },
  { to: '/projects', label: 'Project Execution', icon: Activity,
    roles: ['JE','SDO','EE','CE','CONTRACTOR','DEPT_ADMIN'], stage: 8 },
  { to: '/daily-progress', label: 'Daily Progress', icon: Calendar,
    roles: ['JE','SDO','EE','CONTRACTOR','DEPT_ADMIN'], stage: 8 },
  { to: '/mb', label: 'Measurement Book', icon: Ruler,
    roles: ['JE','SDO','EE','CE','CONTRACTOR','DEPT_ADMIN'], stage: 9 },
  { to: '/bills', label: 'Billing', icon: Receipt,
    roles: ['JE','SDO','EE','CE','CONTRACTOR','ACCOUNTANT','DEPT_ADMIN'], stage: 10 },
  { to: '/payments', label: 'Payment Release', icon: Wallet,
    roles: ['ACCOUNTANT','CE','EE','CONTRACTOR','DEPT_ADMIN'], stage: 11 },
  { to: '/audit', label: 'Audit & Compliance', icon: ShieldCheck,
    roles: ['CE','EE','ACCOUNTANT','DEPT_ADMIN','SUPER_ADMIN'], stage: 12 },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuthStore();
  if (!user) return null;
  const items = NAV.filter((n) => n.roles.includes(user.role));

  // Group items
  const grouped: Record<string, NavItem[]> = {};
  items.forEach((it) => {
    const g = it.group || (it.stage ? 'Workflow' : 'Main');
    grouped[g] = grouped[g] || [];
    grouped[g].push(it);
  });

  const orderedGroups = ['Main', 'SaaS', 'Governance', 'Operations', 'Verification', 'Field', 'Finance', 'Workspace', 'Department', 'Admin', 'Workflow'];

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-40 transform transition lg:translate-x-0 flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between gov-header-bg text-white">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            <div>
              <div className="font-bold text-sm">Constructor ERP</div>
              <div className="text-[10px] opacity-80">Govt eTender · ERP Platform</div>
            </div>
          </div>
          <button className="lg:hidden text-white" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {orderedGroups.filter((g) => grouped[g]?.length).map((group) => (
            <div key={group} className="mb-2">
              {group !== 'Main' && (
                <div className="px-5 mt-3 mb-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  {group}
                </div>
              )}
              {grouped[group].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-4 py-2 mx-2 my-0.5 rounded-md text-[13px] transition',
                      isActive
                        ? 'bg-govt-navy text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    )
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.stage && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      S{item.stage}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 text-[10px] text-center text-slate-400">
          <div className="font-medium text-slate-500">{user.department?.name || 'Constructor ERP'}</div>
          <div className="mt-0.5">v2.0 · © 2026 Govt of India</div>
        </div>
      </aside>
    </>
  );
}
