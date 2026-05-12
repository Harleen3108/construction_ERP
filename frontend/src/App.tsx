import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RegisterOrgPage from './pages/auth/RegisterOrgPage';
import SetPasswordPage from './pages/auth/SetPasswordPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardRouter from './pages/dashboards/DashboardRouter';

// 12 Stages
import ProjectProposalsPage from './pages/proposal/ProjectProposalsPage';
import NewProposalPage from './pages/proposal/NewProposalPage';
import ProposalDetailPage from './pages/proposal/ProposalDetailPage';
import ApprovalsPage from './pages/approval/ApprovalsPage';
import TenderListPage from './pages/tender/TenderListPage';
import NewTenderPage from './pages/tender/NewTenderPage';
import TenderDetailPage from './pages/tender/TenderDetailPage';
import PublishedTendersPage from './pages/tender/PublishedTendersPage';
import MyBidsPage from './pages/bid/MyBidsPage';
import BidEvaluationPage from './pages/bid/BidEvaluationPage';
import SubmitBidPage from './pages/bid/SubmitBidPage';
import WorkOrderListPage from './pages/workOrder/WorkOrderListPage';
import WorkOrderDetailPage from './pages/workOrder/WorkOrderDetailPage';
import ProjectsListPage from './pages/execution/ProjectsListPage';
import ProjectExecutionPage from './pages/execution/ProjectExecutionPage';
import MBListPage from './pages/mb/MBListPage';
import NewMBPage from './pages/mb/NewMBPage';
import MBDetailPage from './pages/mb/MBDetailPage';
import BillsListPage from './pages/billing/BillsListPage';
import NewBillPage from './pages/billing/NewBillPage';
import BillDetailPage from './pages/billing/BillDetailPage';
import PaymentsPage from './pages/payment/PaymentsPage';
import AuditPage from './pages/audit/AuditPage';
import UsersPage from './pages/admin/UsersPage';
import ProfilePage from './pages/profile/ProfilePage';

// SaaS layer (Super Admin + Dept Admin)
import DepartmentsPage from './pages/admin/DepartmentsPage';
import SubscriptionsPage from './pages/admin/SubscriptionsPage';
import DepartmentProfilePage from './pages/admin/DepartmentProfilePage';
import RegistrationsPage from './pages/admin/RegistrationsPage';
import InvoicesPage from './pages/admin/InvoicesPage';
import SupportPage from './pages/admin/SupportPage';
import EmailDiagnosticsPage from './pages/admin/EmailDiagnosticsPage';
import DivisionsPage from './pages/admin/DivisionsPage';
import PermissionsMatrixPage from './pages/admin/PermissionsMatrixPage';
import ContractorsPage from './pages/admin/ContractorsPage';
import WorkflowConfigPage from './pages/admin/WorkflowConfigPage';
import DocumentsPage from './pages/admin/DocumentsPage';
import ReportsPage from './pages/admin/ReportsPage';
import NotificationSettingsPage from './pages/admin/NotificationSettingsPage';
import DailyProgressPage from './pages/dailyProgress/DailyProgressPage';

// CE — Governance
import HighValueApprovalsPage from './pages/ce/HighValueApprovalsPage';
import RiskDashboardPage from './pages/ce/RiskDashboardPage';
import EngineerPerformancePage from './pages/ce/EngineerPerformancePage';
import FinancialMonitoringPage from './pages/ce/FinancialMonitoringPage';
import ProjectMonitorPage from './pages/ce/ProjectMonitorPage';
import TenderOversightPage from './pages/ce/TenderOversightPage';
import InspectionsPage from './pages/ce/InspectionsPage';
import ApprovalHistoryPage from './pages/ce/ApprovalHistoryPage';
import NotificationsPage from './pages/NotificationsPage';

// EE — Operations
import EEApprovalQueuePage from './pages/ee/EEApprovalQueuePage';
import TeamPage from './pages/ee/TeamPage';
import MaterialRequestsPage from './pages/MaterialRequestsPage';

// SDO — Verification
import SDOApprovalQueuePage from './pages/sdo/SDOApprovalQueuePage';
import MBVerificationPage from './pages/sdo/MBVerificationPage';
import DailyProgressReviewPage from './pages/sdo/DailyProgressReviewPage';

// JE — Field Execution
import MySubmissionsPage from './pages/je/MySubmissionsPage';
import MyTasksPage from './pages/je/MyTasksPage';
import SiteDiaryPage from './pages/je/SiteDiaryPage';
import SiteMonitoringPage from './pages/je/SiteMonitoringPage';
import ProjectTimelinePage from './pages/je/ProjectTimelinePage';

// Accountant — Finance
import BillVerificationQueuePage from './pages/acc/BillVerificationQueuePage';
import DeductionsManagementPage from './pages/acc/DeductionsManagementPage';
import BudgetMonitoringPage from './pages/acc/BudgetMonitoringPage';
import ContractorPaymentsPage from './pages/acc/ContractorPaymentsPage';

// Contractor — Workspace
import ContractorProfilePage from './pages/contractor/ContractorProfilePage';
import EarningsPage from './pages/contractor/EarningsPage';
import ContractorProjectsPage from './pages/contractor/MyProjectsPage';

function App() {
  const { loadFromStorage, isAuthenticated } = useAuthStore();
  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/register-organization" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterOrgPage />} />
      <Route path="/set-password/:token" element={<SetPasswordPage />} />
      <Route path="/reset-password/:token" element={<SetPasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRouter />} />

          {/* Super Admin SaaS layer */}
          <Route path="/admin/registrations" element={<RegistrationsPage />} />
          <Route path="/admin/departments" element={<DepartmentsPage />} />
          <Route path="/admin/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/admin/invoices" element={<InvoicesPage />} />
          <Route path="/admin/support" element={<SupportPage />} />
          <Route path="/admin/email-diagnostics" element={<EmailDiagnosticsPage />} />

          {/* CE — Governance */}
          <Route path="/ce/approvals" element={<HighValueApprovalsPage />} />
          <Route path="/ce/projects" element={<ProjectMonitorPage />} />
          <Route path="/ce/tenders" element={<TenderOversightPage />} />
          <Route path="/ce/risk" element={<RiskDashboardPage />} />
          <Route path="/ce/engineers" element={<EngineerPerformancePage />} />
          <Route path="/ce/financial" element={<FinancialMonitoringPage />} />
          <Route path="/ce/inspections" element={<InspectionsPage />} />
          <Route path="/ce/approval-history" element={<ApprovalHistoryPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* EE — Operations */}
          <Route path="/ee/queue" element={<EEApprovalQueuePage />} />
          <Route path="/ee/team" element={<TeamPage />} />
          <Route path="/material-requests" element={<MaterialRequestsPage />} />

          {/* SDO — Verification */}
          <Route path="/sdo/queue" element={<SDOApprovalQueuePage />} />
          <Route path="/sdo/mb-verify" element={<MBVerificationPage />} />
          <Route path="/sdo/daily-progress" element={<DailyProgressReviewPage />} />

          {/* JE — Field Execution */}
          <Route path="/je/submissions" element={<MySubmissionsPage />} />
          <Route path="/je/tasks" element={<MyTasksPage />} />
          <Route path="/je/site-diary" element={<SiteDiaryPage />} />
          <Route path="/je/site-monitoring" element={<SiteMonitoringPage />} />
          <Route path="/je/project-timeline/:id" element={<ProjectTimelinePage />} />

          {/* Accountant — Finance */}
          <Route path="/acc/bill-queue" element={<BillVerificationQueuePage />} />
          <Route path="/acc/deductions" element={<DeductionsManagementPage />} />
          <Route path="/acc/budget" element={<BudgetMonitoringPage />} />
          <Route path="/acc/contractor-payments" element={<ContractorPaymentsPage />} />

          {/* Contractor — Workspace */}
          <Route path="/contractor/profile" element={<ContractorProfilePage />} />
          <Route path="/contractor/earnings" element={<EarningsPage />} />
          <Route path="/contractor/projects" element={<ContractorProjectsPage />} />

          {/* Department Admin */}
          <Route path="/department/profile" element={<DepartmentProfilePage />} />
          <Route path="/divisions" element={<DivisionsPage />} />
          <Route path="/permissions" element={<PermissionsMatrixPage />} />
          <Route path="/contractors" element={<ContractorsPage />} />
          <Route path="/workflows" element={<WorkflowConfigPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notification-settings" element={<NotificationSettingsPage />} />

          {/* Stage 1 — Project Proposal */}
          <Route path="/proposals" element={<ProjectProposalsPage />} />
          <Route path="/proposals/new" element={<NewProposalPage />} />
          <Route path="/proposals/:id" element={<ProposalDetailPage />} />

          {/* Stage 2 — Sanction & Approvals */}
          <Route path="/approvals" element={<ApprovalsPage />} />

          {/* Stage 3-4 — Tender */}
          <Route path="/tenders" element={<TenderListPage />} />
          <Route path="/tenders/new" element={<NewTenderPage />} />
          <Route path="/tenders/:id" element={<TenderDetailPage />} />
          <Route path="/tenders/published" element={<PublishedTendersPage />} />

          {/* Stage 5-6 — Bidding */}
          <Route path="/bids" element={<MyBidsPage />} />
          <Route path="/bids/submit/:tenderId" element={<SubmitBidPage />} />
          <Route path="/bids/evaluate" element={<BidEvaluationPage />} />
          <Route path="/bids/evaluate/:tenderId" element={<BidEvaluationPage />} />

          {/* Stage 7 — Work Orders */}
          <Route path="/work-orders" element={<WorkOrderListPage />} />
          <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />

          {/* Stage 8 — Execution + Daily Progress */}
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/:id" element={<ProjectExecutionPage />} />
          <Route path="/daily-progress" element={<DailyProgressPage />} />

          {/* Stage 9 — Measurement Book */}
          <Route path="/mb" element={<MBListPage />} />
          <Route path="/mb/new" element={<NewMBPage />} />
          <Route path="/mb/:id" element={<MBDetailPage />} />

          {/* Stage 10 — Billing */}
          <Route path="/bills" element={<BillsListPage />} />
          <Route path="/bills/new" element={<NewBillPage />} />
          <Route path="/bills/:id" element={<BillDetailPage />} />

          {/* Stage 11 — Payments */}
          <Route path="/payments" element={<PaymentsPage />} />

          {/* Stage 12 — Audit */}
          <Route path="/audit" element={<AuditPage />} />

          {/* User mgmt */}
          <Route path="/users" element={<UsersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
