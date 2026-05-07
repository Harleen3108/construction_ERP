import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
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

function App() {
  const { loadFromStorage, isAuthenticated } = useAuthStore();
  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRouter />} />

          {/* Stage 1 — Project Proposal */}
          <Route path="/proposals" element={<ProjectProposalsPage />} />
          <Route path="/proposals/new" element={<NewProposalPage />} />
          <Route path="/proposals/:id" element={<ProposalDetailPage />} />

          {/* Stage 2 — Sanction & Approvals */}
          <Route path="/approvals" element={<ApprovalsPage />} />

          {/* Stage 3 — Tender Creation & Approval */}
          <Route path="/tenders" element={<TenderListPage />} />
          <Route path="/tenders/new" element={<NewTenderPage />} />
          <Route path="/tenders/:id" element={<TenderDetailPage />} />

          {/* Stage 4 — Published Tenders (contractor view) */}
          <Route path="/tenders/published" element={<PublishedTendersPage />} />

          {/* Stage 5 — Bid Submission */}
          <Route path="/bids" element={<MyBidsPage />} />
          <Route path="/bids/submit/:tenderId" element={<SubmitBidPage />} />

          {/* Stage 6 — Bid Evaluation */}
          <Route path="/bids/evaluate" element={<BidEvaluationPage />} />
          <Route path="/bids/evaluate/:tenderId" element={<BidEvaluationPage />} />

          {/* Stage 7 — Work Orders & LOA */}
          <Route path="/work-orders" element={<WorkOrderListPage />} />
          <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />

          {/* Stage 8 — Project Execution */}
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/:id" element={<ProjectExecutionPage />} />

          {/* Stage 9 — Measurement Book */}
          <Route path="/mb" element={<MBListPage />} />
          <Route path="/mb/new" element={<NewMBPage />} />
          <Route path="/mb/:id" element={<MBDetailPage />} />

          {/* Stage 10 — Billing */}
          <Route path="/bills" element={<BillsListPage />} />
          <Route path="/bills/new" element={<NewBillPage />} />
          <Route path="/bills/:id" element={<BillDetailPage />} />

          {/* Stage 11 — Payment Release */}
          <Route path="/payments" element={<PaymentsPage />} />

          {/* Stage 12 — Audit */}
          <Route path="/audit" element={<AuditPage />} />

          {/* Admin */}
          <Route path="/users" element={<UsersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
