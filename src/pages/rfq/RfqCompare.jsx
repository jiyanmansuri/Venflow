import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Award, CheckCircle, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

const RfqCompare = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [rfq, setRfq] = useState(null);
  const [rfqItems, setRfqItems] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [quotationItems, setQuotationItems] = useState({}); // { quoteId_itemId: itemData }
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCompareData();
  }, [id]);

  const fetchCompareData = async () => {
    setLoading(true);
    try {
      // 1. Fetch RFQ & Items
      const { data: rfqData } = await supabase.from('rfqs').select('*').eq('id', id).single();
      const { data: itemsData } = await supabase.from('rfq_items').select('*').eq('rfq_id', id);
      setRfq(rfqData);
      setRfqItems(itemsData || []);

      // 2. Fetch Quotations
      const { data: quotesData } = await supabase
        .from('quotations')
        .select('*, vendors(name, status)')
        .eq('rfq_id', id);
      setQuotations(quotesData || []);

      // 3. Fetch Quotation Items
      if (quotesData && quotesData.length > 0) {
        const quoteIds = quotesData.map(q => q.id);
        const { data: qItemsData } = await supabase
          .from('quotation_items')
          .select('*')
          .in('quotation_id', quoteIds);
          
        const itemsMap = {};
        qItemsData?.forEach(item => {
          itemsMap[`${item.quotation_id}_${item.rfq_item_id}`] = item;
        });
        setQuotationItems(itemsMap);
      }

    } catch (error) {
      toast.error('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVendor = async (quotation) => {
    if (!window.confirm(`Are you sure you want to select ${quotation.vendors.name} and send for approval?`)) return;
    
    setProcessing(true);
    try {
      // Create Approval Record
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert([{
          rfq_id: id,
          quotation_id: quotation.id,
          status: 'Pending'
        }]);

      if (approvalError) throw approvalError;

      // Update RFQ Status
      await supabase.from('rfqs').update({ status: 'Under Review' }).eq('id', id);
      
      // Update Quotation Status
      await supabase.from('quotations').update({ status: 'Selected' }).eq('id', quotation.id);

      // Add to Activity Logs
      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        user_name: user.user_metadata?.first_name || 'System',
        action: 'Selected Quotation for Approval',
        entity_type: 'RFQ',
        entity_id: id,
        status: 'Success'
      }]);

      toast.success('Sent to manager for approval!');
      navigate('/approvals');
    } catch (error) {
      toast.error(error.message || 'Error processing selection');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full"></div></div>;
  }

  if (quotations.length === 0) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500 mb-4">No quotations available to compare yet.</p>
        <button onClick={() => navigate(`/rfq/${id}/quotations`)} className="text-indigo-600 hover:underline">Go Back</button>
      </div>
    );
  }

  // Find lowest total
  const lowestTotal = Math.min(...quotations.map(q => parseFloat(q.total_amount)));
  const lowestQuoteId = quotations.find(q => parseFloat(q.total_amount) === lowestTotal)?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/rfq/${id}/quotations`} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compare Quotations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{rfq?.title}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="w-1/4 px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 z-10">
                Line Item
              </th>
              {quotations.map(quote => {
                const isBest = quote.id === lowestQuoteId;
                return (
                  <th key={quote.id} className={`px-6 py-4 text-center border-r border-gray-200 dark:border-gray-700 min-w-[250px] relative ${isBest ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                    {isBest && (
                      <div className="absolute top-0 inset-x-0 -mt-3 flex justify-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                          <Award className="mr-1 h-3 w-3" /> Best Price
                        </span>
                      </div>
                    )}
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{quote.vendors?.name}</h3>
                    <p className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center">
                      <ShieldCheck className="h-3 w-3 mr-1 text-blue-500" /> Vendor Status: {quote.vendors?.status}
                    </p>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Quantity/Unit row info */}
            <tr className="bg-gray-50/50 dark:bg-gray-800/20">
              <td className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50/50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700">
                Unit Prices
              </td>
              {quotations.map(quote => (
                <td key={`header-${quote.id}`} className={`border-r border-gray-200 dark:border-gray-700 ${quote.id === lowestQuoteId ? 'bg-green-50/30 dark:bg-green-900/10' : ''}`}></td>
              ))}
            </tr>

            {/* Line Items */}
            {rfqItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-6 py-4 sticky left-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Qty: {item.quantity} {item.unit}</p>
                </td>
                {quotations.map(quote => {
                  const isBest = quote.id === lowestQuoteId;
                  const qItem = quotationItems[`${quote.id}_${item.id}`];
                  return (
                    <td key={`${quote.id}-${item.id}`} className={`px-6 py-4 text-center border-r border-gray-200 dark:border-gray-700 ${isBest ? 'bg-green-50/30 dark:bg-green-900/5 border-x-green-200 dark:border-x-green-800/30' : ''}`}>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {qItem ? `₹${parseFloat(qItem.unit_price).toFixed(2)}` : '-'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Total: {qItem ? `₹${parseFloat(qItem.total_price).toFixed(2)}` : '-'}
                      </p>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Delivery Date */}
            <tr className="bg-gray-50/50 dark:bg-gray-800/20">
              <td className="px-6 py-4 sticky left-0 bg-gray-50/50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Delivery Date</p>
              </td>
              {quotations.map(quote => {
                 const isBest = quote.id === lowestQuoteId;
                 return (
                  <td key={`del-${quote.id}`} className={`px-6 py-4 text-center border-r border-gray-200 dark:border-gray-700 ${isBest ? 'bg-green-50/30 dark:bg-green-900/5 border-x-green-200 dark:border-x-green-800/30' : ''}`}>
                    <span className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm">
                      {format(new Date(quote.delivery_date), 'MMM dd, yyyy')}
                    </span>
                  </td>
                 );
              })}
            </tr>

            {/* Totals */}
            <tr>
              <td className="px-6 py-6 sticky left-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <p className="text-base font-bold text-gray-900 dark:text-white">Grand Total (inc. GST)</p>
              </td>
              {quotations.map(quote => {
                 const isBest = quote.id === lowestQuoteId;
                 return (
                  <td key={`tot-${quote.id}`} className={`px-6 py-6 text-center border-r border-gray-200 dark:border-gray-700 ${isBest ? 'bg-green-50 border-x-green-300 dark:bg-green-900/20 dark:border-x-green-700/50 ring-inset ring-2 ring-green-400/50 dark:ring-green-500/30' : ''}`}>
                    <p className={`text-xl font-bold ${isBest ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                      ₹{parseFloat(quote.total_amount).toLocaleString()}
                    </p>
                  </td>
                 );
              })}
            </tr>

            {/* Actions */}
            <tr className="bg-gray-50 dark:bg-gray-800/30">
              <td className="px-6 py-4 sticky left-0 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700"></td>
              {quotations.map(quote => {
                 const isBest = quote.id === lowestQuoteId;
                 return (
                  <td key={`act-${quote.id}`} className={`px-6 py-4 text-center border-r border-gray-200 dark:border-gray-700 ${isBest ? 'bg-green-50/50 dark:bg-green-900/10 border-x-green-200 border-b-green-200 dark:border-green-800/30 rounded-br-lg' : ''}`}>
                    <button 
                      onClick={() => handleSelectVendor(quote)}
                      disabled={processing || rfq?.status !== 'Open'}
                      className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all transform hover:-translate-y-0.5 ${
                        isBest ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Select & Proceed
                    </button>
                  </td>
                 );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RfqCompare;
