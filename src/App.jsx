import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import RfqCreate from './pages/rfq/RfqCreate';
import RfqList from './pages/rfq/RfqList';
import RfqQuotations from './pages/rfq/RfqQuotations';
import RfqCompare from './pages/rfq/RfqCompare';
import QuotationsList from './pages/QuotationsList';
import Profile from './pages/Profile';
import Approvals from './pages/Approvals';
import PurchaseOrders from './pages/PurchaseOrders';
import InvoicesList from './pages/InvoicesList';
import Invoices from './pages/Invoices';
import Activity from './pages/Activity';
import Reports from './pages/Reports';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  const hasToken = window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery');

  if (hasToken) {
    if (user && !loading) {
      return <Navigate to="/dashboard" replace />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-400 font-medium">Confirming...</p>
      </div>
    );
  }
  return <Navigate to="/dashboard" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route element={<AuthGuard />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/rfq/create" element={<RfqCreate />} />
              <Route path="/rfq" element={<RfqList />} />
              <Route path="/rfq/:id/quotations" element={<RfqQuotations />} />
              <Route path="/rfq/:id/compare" element={<RfqCompare />} />
              <Route path="/quotations" element={<QuotationsList />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/invoices" element={<InvoicesList />} />
              <Route path="/invoices/:id" element={<Invoices />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
          
          {/* Handle Root & Auth Redirects */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
