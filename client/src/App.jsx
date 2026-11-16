import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { adminNavItems } from './config/navigation'
import AdminLayout from './layouts/AdminLayout'
import AgentGate from './layouts/AgentGate'
import AgentLayout from './layouts/AgentLayout'
import PreviewGate from './layouts/PreviewGate'
import CustomerFormPage from './pages/admin/CustomerFormPage'
import CustomerProfilePage from './pages/admin/CustomerProfilePage'
import CollectionDetailPage from './pages/admin/CollectionDetailPage'
import CollectionsPage from './pages/admin/CollectionsPage'
import CustomersPage from './pages/admin/CustomersPage'
import RecordPaymentPage from './pages/admin/RecordPaymentPage'
import CustomerLedgerPage from './pages/admin/CustomerLedgerPage'
import LedgerPage from './pages/admin/LedgerPage'
import LoanLedgerPage from './pages/admin/LoanLedgerPage'
import StatementPage from './pages/admin/StatementPage'
import LoanDetailPage from './pages/admin/LoanDetailPage'
import LoanFormPage from './pages/admin/LoanFormPage'
import LoansPage from './pages/admin/LoansPage'
import ReceiptPage from './pages/admin/ReceiptPage'
import ReportsPage from './pages/admin/ReportsPage'
import ReversePaymentPage from './pages/admin/ReversePaymentPage'
import TransactionsPage from './pages/admin/TransactionsPage'
import ModulePendingPage from './pages/admin/ModulePendingPage'
import NotFoundPage from './pages/admin/NotFoundPage'
import AgentAssignPage from './pages/admin/AgentAssignPage'
import AgentDetailPage from './pages/admin/AgentDetailPage'
import AgentFormPage from './pages/admin/AgentFormPage'
import AgentsPage from './pages/admin/AgentsPage'
import SettingsPage from './pages/admin/SettingsPage'
import NotificationsPage from './pages/admin/NotificationsPage'
import AgentNotificationsPage from './pages/agent/AgentNotificationsPage'
import AgentCollectionsPage from './pages/agent/AgentCollectionsPage'
import AgentForgotPage from './pages/agent/AgentForgotPage'
import AgentCustomerPage from './pages/agent/AgentCustomerPage'
import AgentCustomersPage from './pages/agent/AgentCustomersPage'
import AgentHistoryPage from './pages/agent/AgentHistoryPage'
import AgentHomePage from './pages/agent/AgentHomePage'
import AgentLoginPage from './pages/agent/AgentLoginPage'
import AgentProfilePage from './pages/agent/AgentProfilePage'
import AgentReceiptPage from './pages/agent/AgentReceiptPage'
import AgentRecordPage from './pages/agent/AgentRecordPage'
import LoginPage from './pages/auth/LoginPage'
import { hasAgentSession } from './services/access'
import { hasPreviewSession } from './utils/previewSession'

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))

function HomeRedirect() {
  if (hasAgentSession()) return <Navigate to="/agent/dashboard" replace />
  return <Navigate to={hasPreviewSession() ? '/dashboard' : '/login'} replace />
}

function DashboardRoute() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1600px]" aria-busy="true">
          <p className="sr-only">Loading dashboard</p>
          <div className="h-16 animate-pulse rounded-2xl bg-white" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        </div>
      }
    >
      <DashboardPage />
    </Suspense>
  )
}

export default function App() {
  const pendingItems = adminNavItems.filter(
    (item) =>
      item.to !== '/dashboard' &&
      item.to !== '/customers' &&
      item.to !== '/loans' &&
      item.to !== '/collections' &&
      item.to !== '/transactions' &&
      item.to !== '/ledger' &&
      item.to !== '/reports' &&
      item.to !== '/agents' &&
      item.to !== '/settings' &&
      item.to !== '/notifications',
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/agent/login" element={<AgentLoginPage />} />
        <Route path="/agent/forgot" element={<AgentForgotPage />} />
        <Route element={<AgentGate />}>
          <Route element={<AgentLayout />}>
            <Route path="/agent" element={<Navigate to="/agent/dashboard" replace />} />
            <Route path="/agent/dashboard" element={<AgentHomePage />} />
            <Route path="/agent/collections" element={<AgentCollectionsPage />} />
            <Route path="/agent/collections/:loanId/:instalmentNumber/record" element={<AgentRecordPage />} />
            <Route path="/agent/customers" element={<AgentCustomersPage />} />
            <Route path="/agent/customers/:customerId" element={<AgentCustomerPage />} />
            <Route path="/agent/history" element={<AgentHistoryPage />} />
            <Route path="/agent/profile" element={<AgentProfilePage />} />
            <Route path="/agent/notifications" element={<AgentNotificationsPage />} />
            <Route path="/agent/receipts/:paymentId" element={<AgentReceiptPage />} />
          </Route>
        </Route>
        <Route element={<PreviewGate />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardRoute />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/new" element={<CustomerFormPage />} />
            <Route path="/customers/:customerId/edit" element={<CustomerFormPage />} />
            <Route path="/customers/:customerId" element={<CustomerProfilePage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/loans/new" element={<LoanFormPage />} />
            <Route path="/loans/:loanId/edit" element={<LoanFormPage />} />
            <Route path="/loans/:loanId" element={<LoanDetailPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collections/:loanId/:instalmentNumber/record" element={<RecordPaymentPage />} />
            <Route path="/collections/:loanId/:instalmentNumber" element={<CollectionDetailPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/:paymentId/reverse" element={<ReversePaymentPage />} />
            <Route path="/transactions/:paymentId" element={<ReceiptPage />} />
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/:section" element={<SettingsPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/agents/new" element={<AgentFormPage />} />
            <Route path="/agents/:agentId/edit" element={<AgentFormPage />} />
            <Route path="/agents/:agentId/assign" element={<AgentAssignPage />} />
            <Route path="/agents/:agentId" element={<AgentDetailPage />} />
            <Route path="/ledger/:customerId/statement" element={<StatementPage />} />
            <Route path="/ledger/:customerId/:loanId" element={<LoanLedgerPage />} />
            <Route path="/ledger/:customerId" element={<CustomerLedgerPage />} />
            {pendingItems.map((item) => (
              <Route key={item.to} path={item.to} element={<ModulePendingPage />} />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
