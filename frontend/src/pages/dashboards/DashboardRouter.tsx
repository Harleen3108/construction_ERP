import { useAuthStore } from '../../store/authStore';
import JEDashboard from './JEDashboard';
import SDODashboard from './SDODashboard';
import EEDashboard from './EEDashboard';
import CEDashboard from './CEDashboard';
import ContractorDashboard from './ContractorDashboard';
import AccountantDashboard from './AccountantDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';
import DeptAdminDashboard from './DeptAdminDashboard';

export default function DashboardRouter() {
  const { user } = useAuthStore();
  if (!user) return null;
  switch (user.role) {
    case 'SUPER_ADMIN': return <SuperAdminDashboard />;
    case 'DEPT_ADMIN':  return <DeptAdminDashboard />;
    case 'JE':          return <JEDashboard />;
    case 'SDO':         return <SDODashboard />;
    case 'EE':          return <EEDashboard />;
    case 'CE':          return <CEDashboard />;
    case 'CONTRACTOR':  return <ContractorDashboard />;
    case 'ACCOUNTANT':  return <AccountantDashboard />;
    default: return <div className="p-10 text-center text-slate-400">Welcome</div>;
  }
}
