import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpend: 0,
    activeVendors: 0,
    poFulfillment: 94,
    overdueInvoices: 3
  });
  
  const [spendData, setSpendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [currentMonthStr, setCurrentMonthStr] = useState('May 2025');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatLakhs = (val) => {
    return `₹${(val / 100000).toFixed(1)}L`;
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // In a real app, you would fetch real data from supabase here.
      // For this UI overhaul, we are mapping the specific dummy data to perfectly match the design.
      
      const mockTotalSpend = 1460000;
      const mockActiveVendors = 28;
      
      setStats({
        totalSpend: mockTotalSpend,
        activeVendors: mockActiveVendors,
        poFulfillment: 94,
        overdueInvoices: 3
      });

      // Category Data
      setCategoryData([
        { name: 'IT Hardware', spend: 480000, color: 'bg-blue-600 dark:bg-blue-500' },
        { name: 'Furniture', spend: 320000, color: 'bg-green-500 dark:bg-green-400' },
        { name: 'Logistics', spend: 230000, color: 'bg-red-500 dark:bg-red-400' },
        { name: 'Stationery', spend: 210000, color: 'bg-yellow-500 dark:bg-yellow-400' }
      ]);

      // Top Vendors
      setTopVendors([
        { name: 'TechCore Ltd', spend: 420000, pos: 6 },
        { name: 'Infra Supplies', spend: 310000, pos: 4 },
        { name: 'FastLog', spend: 190000, pos: 3 },
        { name: 'OfficeNeed Co', spend: 90000, pos: 2 }
      ]);

      // Monthly Spend
      setSpendData([
        { name: 'Dec', spend: 8.2, isActive: false },
        { name: 'Jan', spend: 9.1, isActive: false },
        { name: 'Feb', spend: 7.8, isActive: false },
        { name: 'Mar', spend: 11.4, isActive: false },
        { name: 'Apr', spend: 10.2, isActive: false },
        { name: 'May', spend: 13.6, isActive: true }
      ]);

      setCurrentMonthStr('May 2025');

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Vendor Name,Total Spend (₹),POs\n";
    topVendors.forEach(v => {
      csvContent += `"${v.name}",${v.spend},${v.pos}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vendor_spend_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported as CSV');
  };

  // Custom Bar Label for Recharts
  const CustomBarLabel = (props) => {
    const { x, y, width, value } = props;
    return (
      <text x={x + width / 2} y={y - 8} fill="#6b7280" fontSize="10" textAnchor="middle" fontWeight="500">
        ₹{value}L
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Procurement Insights — {currentMonthStr}</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select 
            value={currentMonthStr}
            onChange={(e) => setCurrentMonthStr(e.target.value)}
            className="block w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="May 2025">May 2025</option>
            <option value="Apr 2025">Apr 2025</option>
            <option value="Mar 2025">Mar 2025</option>
          </select>
          
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center px-5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mb-2">
            {loading ? '-' : formatLakhs(stats.totalSpend)}
          </p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spend</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-green-500 dark:text-green-400 mb-2">
            {loading ? '-' : stats.activeVendors}
          </p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Vendors</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-amber-500 dark:text-amber-400 mb-2">
            {loading ? '-' : `${stats.poFulfillment}%`}
          </p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">PO Fulfillment</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-red-500 dark:text-red-400 mb-2">
            {loading ? '-' : stats.overdueInvoices}
          </p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue Invoices</p>
        </div>
      </div>

      {/* Bottom 3 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Spend by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">Spend by Category</h2>
          
          <div className="flex-1 flex flex-col justify-between space-y-6">
            {categoryData.map((cat, index) => {
              const maxSpend = Math.max(...categoryData.map(c => c.spend));
              const percentage = (cat.spend / maxSpend) * 100;
              
              return (
                <div key={index} className="w-full">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                    <span className="text-gray-900 dark:text-white">{formatLakhs(cat.spend)}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div 
                      className={`${cat.color} h-1.5 rounded-full`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 2: Top Vendors by Spend */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Top Vendors by Spend</h2>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
                  <th className="py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Spend (₹)</th>
                  <th className="py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">POs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {topVendors.map((vendor, index) => (
                  <tr key={index}>
                    <td className="py-4 text-sm font-semibold text-gray-900 dark:text-white">{vendor.name}</td>
                    <td className="py-4 text-sm text-gray-600 dark:text-gray-300">{formatLakhs(vendor.spend)}</td>
                    <td className="py-4 text-sm text-gray-500 dark:text-gray-400 text-right">{vendor.pos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 3: Monthly Procurement Spend */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Monthly Procurement Spend</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 6 months (₹ in Lakhs)</p>
          </div>
          
          <div className="flex-1 h-48 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }} 
                  dy={10}
                />
                <Bar dataKey="spend" radius={[4, 4, 0, 0]} label={<CustomBarLabel />}>
                  {spendData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isActive ? '#2563eb' : '#cbd5e1'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
