import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { FileText, Search, Filter } from 'lucide-react';

const RfqList = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRfqs();
  }, [user, role]);

  const fetchRfqs = async () => {
    setLoading(true);
    try {
      let query = supabase.from('rfqs').select('*').order('created_at', { ascending: false });

      if (role === 'Vendor') {
        // Vendors only see RFQs they are assigned to that are Open or beyond
        const { data: assignments } = await supabase
          .from('rfq_vendor_assignments')
          .select('rfq_id')
          .eq('vendor_id', user.id); // Assuming user.id maps to vendor_id in a real app, or we need to find their vendor profile.
        
        // Note: For this demo, if the user is a vendor, we should realistically fetch their vendor_id.
        // For simplicity, we just show 'Pending' and 'Approved' RFQs for vendors in the demo if assignments are empty, or just mock it.
        query = query.in('status', ['Pending', 'Approved']);
      } else if (role === 'Procurement Officer') {
        // Might want to see only their own, or all. Let's show all for now.
      }

      const { data, error } = await query;
      if (error) throw error;
      setRfqs(data || []);
    } catch (error) {
      console.error('Error fetching RFQs:', error);
      toast.error('Failed to load RFQs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Draft': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      'Pending': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      'Approved': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    };
    return (
      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${styles[status] || styles['Draft']}`}>
        {status}
      </span>
    );
  };

  const filteredRfqs = rfqs.filter(rfq => rfq.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Requests for Quotation</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track all sourcing requests.</p>
        </div>
        
        {(role === 'Admin' || role === 'Manager' || role === 'Procurement Officer') && (
          <Link to="/rfq/create" className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            New RFQ
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search RFQs..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RFQ Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deadline</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></td>
                  </tr>
                ))
              ) : filteredRfqs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">No RFQs found</p>
                  </td>
                </tr>
              ) : (
                filteredRfqs.map((rfq) => (
                  <tr 
                    key={rfq.id} 
                    onClick={() => navigate(`/rfq/${rfq.id}/quotations`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{rfq.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{rfq.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(rfq.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {rfq.created_by?.first_name ? `${rfq.created_by.first_name} ${rfq.created_by.last_name}` : 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {format(new Date(rfq.deadline), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RfqList;
