import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, FileText, CheckCircle2, ClipboardList,
  Megaphone, Send, Scale, Award, Activity, Ruler,
  Receipt, Wallet, ShieldCheck, Users, Building2, X,
} from 'lucide-react';
import { UserRole } from '../../types';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  roles: UserRole[];
  stage?: number;
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['JE','SDO','EE','CE','TENDER_OFFICER','CONTRACTOR','ACCOUNTANT','TREASURY','ADMIN'] },
  // 12 stages
  { to: '/proposals', label: 'Project Proposals', icon: FileText, roles: ['JE','SDO','EE','CE','ADMIN'], stage: 1 },
  { to: '/approvals', label: 'Sanction & Approvals', icon: CheckCircle2, roles: ['SDO','EE','CE','ACCOUNTANT','ADMIN'], stage: 2 },
  { to: '/tenders', label: 'Tender Management', icon: ClipboardList, roles: ['JE','SDO','EE','CE','TENDER_OFFICER','ADMIN'], stage: 3 },
  { to: '/tenders/published', label: 'Published Tenders', icon: Megaphone, roles: ['CONTRACTOR'], stage: 4 },
  { to: '/bids', label: 'My Bids', icon: Send, roles: ['CONTRACTOR'], stage: 5 },
  { to: '/bids/evaluate', label: 'Bid Evaluation', icon: Scale, roles: ['TENDER_OFFICER','EE','CE','ADMIN'], stage: 6 },
  { to: '/work-orders', label: 'Work Orders & LOA', icon: Award, roles: ['TENDER_OFFICER','EE','CE','CONTRACTOR','ADMIN'], stage: 7 },
  { to: '/projects', label: 'Project Execution', icon: Activity, roles: ['JE','SDO','EE','CE','CONTRACTOR','ADMIN'], stage: 8 },
  { to: '/mb', label: 'Measurement Book', icon: Ruler, roles: ['JE','SDO','EE','CE','CONTRACTOR','ADMIN'], stage: 9 },
  { to: '/bills', label: 'Billing & Approvals', icon: Receipt, roles: ['JE','SDO','EE','CE','CONTRACTOR','ACCOUNTANT','ADMIN'], stage: 10 },
  { to: '/payments', label: 'Payment Release', icon: Wallet, roles: ['ACCOUNTANT','TREASURY','CE','EE','CONTRACTOR','ADMIN'], stage: 11 },
  { to: '/audit', label: 'Audit & Compliance', icon: ShieldCheck, roles: ['CE','EE','ACCOUNTANT','ADMIN'], stage: 12 },
  // Admin
  { to: '/users', label: 'Users / Contractors', icon: Users, roles: ['ADMIN','CE'] },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuthStore();
  if (!user) return null;
  const items = NAV.filter((n) => n.roles.includes(user.role));

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
              <div className="text-[10px] opacity-80">eTender · eGovernance</div>
            </div>
          </div>
          <button className="lg:hidden text-white" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-md text-sm transition',
                  isActive
                    ? 'bg-govt-navy text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                )
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.stage && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 group-hover:bg-white">
                  S{item.stage}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 text-[10px] text-center text-slate-400">
          <div>v1.0.0 · © 2026 PWD</div>
          <div className="mt-1">Powered by Govt of India NIC</div>
        </div>
      </aside>
    </>
  );
}
