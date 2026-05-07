import { useAuthStore } from '../../store/authStore';
import JEDashboard from './JEDashboard';
import SDODashboard from './SDODashboard';
import EEDashboard from './EEDashboard';
import CEDashboard from './CEDashboard';
import ContractorDashboard from './ContractorDashboard';
import AccountantDashboard from './AccountantDashboard';
import AdminDashboard from './AdminDashboard';
import TenderOfficerDashboard from './TenderOfficerDashboard';

export default function DashboardRouter() {
  const { user } = useAuthStore();
  if (!user) return null;
  switch (user.role) {
    case 'JE': return <JEDashboard />;
    case 'SDO': return <SDODashboard />;
    case 'EE': return <EEDashboard />;
    case 'CE': return <CEDashboard />;
    case 'TENDER_OFFICER': return <TenderOfficerDashboard />;
    case 'CONTRACTOR': return <ContractorDashboard />;
    case 'ACCOUNTANT':
    case 'TREASURY': return <AccountantDashboard />;
    case 'ADMIN': return <AdminDashboard />;
    default: return <div>Welcome</div>;
  }
}
