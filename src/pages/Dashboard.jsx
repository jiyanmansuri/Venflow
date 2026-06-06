import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 text-red-800 rounded-xl m-8">
          <h1 className="text-2xl font-bold mb-4">Dashboard Crashed!</h1>
          <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const DashboardContent = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Mock Stats to exactly match the design
  const stats = {
    activeRFQs: 12,
    approvals: 5,
    posThisMonth: '₹ 2.3L',
    overdueInvoices: 3
  };

  const recentPOs = [
    { poNum: 'Po1', vendor: 'Infra', amount: '87000', status: 'Approved' },
    { poNum: 'Po2', vendor: 'Tech core', amount: '140000', status: 'Pending' },
    { poNum: 'Po3', vendor: 'OfficeNeed Co', amount: '34900', status: 'draft' },
  ];

  // Realistic Chart Data
  const realisticChartData = [
    { name: 'Dec', spend: 8.2 },
    { name: 'Jan', spend: 9.1 },
    { name: 'Feb', spend: 7.8 },
    { name: 'Mar', spend: 11.4 },
    { name: 'Apr', spend: 10.2 },
    { name: 'May', spend: 13.6 },
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const getStatusBadge = (status) => {
    switch(status.toLowerCase()) {
      case 'approved': return 'text-green-600 dark:text-green-400 font-semibold';
      case 'pending': return 'text-amber-500 dark:text-amber-400 font-semibold';
      default: return 'text-gray-500 dark:text-gray-400 font-semibold';
    }
  };

  const StatBox = ({ value, label }) => (
    <div className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-xl p-6 flex flex-col items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-200">
      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {loading ? <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div> : value}
      </div>
      <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 text-center">
        {label}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Welcome back, {role || 'Procurement Officer'} - Today's Overview
        </p>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatBox value={stats.activeRFQs} label="Active RFQ's" />
        <StatBox value={stats.approvals} label="Approvals" />
        <StatBox value={stats.posThisMonth} label="PO's this month" />
        <StatBox value={stats.overdueInvoices} label="overdue invoices" />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Recent Purchase Orders */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3 ml-1">Recent Purchase Orders</h2>
          <div className="border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-transparent">
            <table className="min-w-full text-left">
              <thead className="border-b border-gray-300 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400">PO#</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400">Vendor</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
                {recentPOs.map((po, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{po.poNum}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{po.vendor}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <span className={po.amount === '87000' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded' : ''}>
                        {po.amount}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm capitalize ${getStatusBadge(po.status)}`}>{po.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Spending Trends Widget */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3 ml-1">Spending Trends last 6 months</h2>
          <div className="bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl p-4 h-full" style={{ minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={realisticChartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d1d5db" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `₹${val}L`} />
                <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
                  {realisticChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === realisticChartData.length - 1 ? '#3b82f6' : '#9ca3af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="pt-6 border-t border-gray-300 dark:border-gray-700">
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => navigate('/rfq/create')}
            className="px-6 py-2 border border-gray-400 dark:border-gray-500 rounded-xl text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            + new RFQ
          </button>
          <button 
            onClick={() => navigate('/invoices')}
            className="px-6 py-2 border border-gray-400 dark:border-gray-500 rounded-xl text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            view Invoices
          </button>
        </div>
      </div>

    </div>
  );
};

const Dashboard = () => (
  <ErrorBoundary>
    <DashboardContent />
  </ErrorBoundary>
);

export default Dashboard;
