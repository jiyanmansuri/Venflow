import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CheckSquare, Check, X, ArrowRight, IndianRupee, Clock } from 'lucide-react';

const Approvals = () => {
  const { role, user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  
  // Processing state
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, [user, role]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('approvals')
        .select(`
          *,
          rfqs (id, title, deadline, description),
          quotations (id, total_amount, delivery_date, vendors(name, contact_name))
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setApprovals(data || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status) => {
    if (!selectedApproval) return;
    setProcessing(true);
    
    try {
      // 1. Update Approval record
      const { error: appError } = await supabase
        .from('approvals')
        .update({ 
          status: status, 
          remarks: remarks,
          processed_by: user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', selectedApproval.id);

      if (appError) throw appError;

      // 2. Update RFQ Status
      // If Approved, RFQ is Approved. If Draft, RFQ goes back to Pending (or Draft, let's set to Draft).
      await supabase.from('rfqs').update({ 
        status: status === 'Approved' ? 'Approved' : 'Draft' 
      }).eq('id', selectedApproval.rfq_id);

      // 3. Log Activity
      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        user_name: user.user_metadata?.first_name || 'System',
        action: `${status === 'Draft' ? 'Sent to Draft' : status} quotation from ${selectedApproval.quotations.vendors.name}`,
        entity_type: 'Approval',
        entity_id: selectedApproval.id,
        status: status === 'Approved' ? 'Success' : 'Info'
      }]);

      // 4. If Approved, generate Purchase Order
      if (status === 'Approved') {
        const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const { error: poError } = await supabase
          .from('purchase_orders')
          .insert([{
            approval_id: selectedApproval.id,
            po_number: poNumber,
            status: 'Issued'
          }]);
          
        if (poError) throw poError;
        toast.success(`Approval granted! Purchase Order ${poNumber} generated.`);
      } else {
        toast.success('Approval moved back to Draft.');
      }

      setSelectedApproval(null);
      setRemarks('');
      fetchApprovals();

    } catch (error) {
      toast.error(error.message || `Failed to process approval`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200';
      case 'Draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200';
      default: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approvals Queue</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review and approve selected vendor quotations.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Approvals List */}
        <div className={`w-full ${selectedApproval ? 'lg:w-1/3' : 'lg:w-full'} space-y-4 transition-all duration-300`}>
          {loading ? (
            <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full"></div></div>
          ) : approvals.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-100 dark:border-gray-700 text-center">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No pending approvals at the moment.</p>
            </div>
          ) : (
            approvals.map(approval => (
              <div 
                key={approval.id} 
                onClick={() => setSelectedApproval(approval)}
                className={`bg-white dark:bg-gray-800 rounded-xl p-5 border cursor-pointer transition-all hover:shadow-md ${
                  selectedApproval?.id === approval.id 
                    ? 'border-indigo-500 ring-1 ring-indigo-500 dark:border-indigo-400 shadow-md' 
                    : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{approval.rfqs?.title}</h3>
                  <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full border ${getStatusColor(approval.status)}`}>
                    {approval.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center">
                  Vendor: <span className="font-medium text-gray-900 dark:text-gray-200 ml-1">{approval.quotations?.vendors?.name}</span>
                </p>
                <div className="flex justify-between items-center text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
                  <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold">
                    <IndianRupee className="h-4 w-4 mr-0.5" />
                    {parseFloat(approval.quotations?.total_amount || 0).toLocaleString()}
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 flex items-center">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Details
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Approval Detail Pane */}
        {selectedApproval && (
          <div className="w-full lg:w-2/3 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-6">
              
              {/* Top Horizontal Tracker */}
              <div className="flex items-center justify-between px-8 py-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-[#111111]/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Check size={16} />
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 leading-tight">RFQ<br/>Submitted</div>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1 mx-4"></div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Check size={16} />
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 leading-tight">L1<br/>Review</div>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1 mx-4"></div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-4 ring-amber-100 dark:ring-amber-900/30">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-500 leading-tight">L2<br/>Approval</div>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1 mx-4"></div>
                <div className="flex items-center gap-3 opacity-60">
                  <div className="text-sm font-bold text-gray-500 dark:text-gray-400">4</div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 leading-tight">Generate<br/>PO</div>
                </div>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: APPROVAL CHAIN */}
                <div>
                  <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-6">Approval Chain</h3>
                  
                  <div className="relative border-l-2 border-gray-100 dark:border-gray-700 ml-4 space-y-8">
                    {/* Node 1: Mocked L1 Approval */}
                    <div className="relative pl-8">
                      <div className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10 shadow-sm border-[3px] border-white dark:border-gray-800">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <div className="bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100/50 dark:border-emerald-800/50 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Procurement Head</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{format(new Date(selectedApproval.created_at), 'dd MMM, HH:mm a')}</p>
                        </div>
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/40 rounded-full">Approved</span>
                      </div>
                    </div>

                    {/* Node 2: Current Pending Approval */}
                    <div className="relative pl-8">
                      <div className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-500 flex items-center justify-center z-10 border-[3px] border-white dark:border-gray-800">
                        <Clock size={12} strokeWidth={3} />
                      </div>
                      <div className="p-4 flex justify-between items-center bg-white dark:bg-transparent">
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Finance Manager</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Assigned {format(new Date(selectedApproval.created_at), 'MMM dd')}</p>
                        </div>
                        {selectedApproval.status === 'Pending' ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 rounded-full">Pending</span>
                        ) : (
                           <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(selectedApproval.status)}`}>{selectedApproval.status}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remarks Input placed under the chain */}
                  {selectedApproval.status === 'Pending' && (
                    <div className="mt-12">
                      <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-2">Approval Remarks</h3>
                      <textarea
                        rows={2}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add your comments or conditions..."
                        className="w-full bg-transparent border-0 border-b border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-0 p-0 text-sm dark:text-white transition-colors resize-none placeholder-gray-400 dark:placeholder-gray-600"
                      />
                    </div>
                  )}
                </div>

                {/* Right Column: QUOTATION SUMMARY */}
                <div className="flex flex-col h-full border-l border-gray-100 dark:border-gray-700/50 pl-8">
                  <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-6">Quotation Summary</h3>
                  
                  <div className="space-y-5 flex-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Vendor</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{selectedApproval.quotations?.vendors?.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Total</span>
                      <span className="font-semibold text-gray-800 dark:text-white">₹{parseFloat(selectedApproval.quotations?.total_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Delivery</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{format(new Date(selectedApproval.quotations?.delivery_date || new Date()), 'dd MMM yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Rating</span>
                      <span className="font-semibold text-gray-800 dark:text-white flex items-center">
                        <span className="text-amber-400 mr-1">★</span> 4.8
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">GST (18%)</span>
                      <span className="font-semibold text-gray-800 dark:text-white">₹{(parseFloat(selectedApproval.quotations?.total_amount || 0) * 0.18).toLocaleString()}</span>
                    </div>
                  </div>

                  {selectedApproval.status === 'Pending' ? (
                    <div className="flex gap-4 mt-12 pt-6">
                      <button 
                        onClick={() => handleAction('Approved')}
                        disabled={processing || (role !== 'Admin' && role !== 'Manager')}
                        className="flex-1 flex justify-center items-center px-4 py-3.5 rounded-xl shadow-sm text-sm font-semibold text-white bg-[#1B4E3B] hover:bg-[#143B2C] dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        <Check className="mr-2 h-4 w-4" /> Approve
                      </button>
                      <button 
                        onClick={() => handleAction('Draft')}
                        disabled={processing || (role !== 'Admin' && role !== 'Manager')}
                        className="flex-1 flex justify-center items-center px-4 py-3.5 rounded-xl shadow-sm text-sm font-semibold text-[#8B4A4A] bg-[#FDF2F2] hover:bg-[#FBE4E4] dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors border border-[#F6E1E1] dark:border-transparent"
                      >
                        <X className="mr-2 h-4 w-4" /> Send to Draft
                      </button>
                    </div>
                  ) : (
                    <div className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-800">
                       <p className="text-sm text-gray-500 dark:text-gray-400">Processed At: <span className="font-medium text-gray-900 dark:text-white">{selectedApproval.processed_at ? format(new Date(selectedApproval.processed_at), 'MMM dd, yyyy HH:mm') : '-'}</span></p>
                       <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Remarks: <span className="font-medium text-gray-900 dark:text-white italic">{selectedApproval.remarks || 'None'}</span></p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
