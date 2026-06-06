import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FileText, ArrowLeft, Plus, CheckCircle, Clock, Percent } from 'lucide-react';

const RfqQuotations = () => {
  const { id } = useParams();
  const { role, user } = useAuth();
  const navigate = useNavigate();
  
  const [rfq, setRfq] = useState(null);
  const [rfqItems, setRfqItems] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Submission Form State (for Vendors)
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [vendorId, setVendorId] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [quoteItems, setQuoteItems] = useState({}); // { rfq_item_id: { unit_price: 0 } }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRfqData();
  }, [id, user]);

  const fetchRfqData = async () => {
    setLoading(true);
    try {
      // 1. Fetch RFQ details
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', id)
        .single();
      if (rfqError) throw rfqError;
      setRfq(rfqData);

      // 2. Fetch RFQ Items
      const { data: itemsData, error: itemsError } = await supabase
        .from('rfq_items')
        .select('*')
        .eq('rfq_id', id);
      if (itemsError) throw itemsError;
      setRfqItems(itemsData || []);
      
      // Initialize quote form state if empty
      const initialQuoteState = {};
      itemsData.forEach(item => {
        initialQuoteState[item.id] = { unit_price: '' };
      });
      setQuoteItems(initialQuoteState);

      // 3. Fetch Quotations
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotations')
        .select('*, vendors(name, contact_name)')
        .eq('rfq_id', id);
      if (quotesError) throw quotesError;
      setQuotations(quotesData || []);

      // If vendor, try to find their vendor record (mocking for now by checking assignments)
      if (role === 'Vendor') {
        const { data: assignmentData } = await supabase
          .from('rfq_vendor_assignments')
          .select('vendor_id')
          .eq('rfq_id', id)
          .limit(1);
          
        if (assignmentData && assignmentData.length > 0) {
           // In real app, we find vendor_id from user's profile. 
           // Here we just grab the assignment to allow them to submit.
           setVendorId(assignmentData[0].vendor_id);
        }
      }

    } catch (error) {
      console.error('Error fetching RFQ details:', error);
      toast.error('Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  // Calculations for Vendor Submit Form
  const calculateTotals = () => {
    let subtotal = 0;
    rfqItems.forEach(item => {
      const price = parseFloat(quoteItems[item.id]?.unit_price || 0);
      subtotal += price * parseFloat(item.quantity);
    });
    const gst = subtotal * 0.18; // 18% GST
    return { subtotal, gst, total: subtotal + gst };
  };

  const handleQuoteItemChange = (itemId, value) => {
    setQuoteItems({
      ...quoteItems,
      [itemId]: { ...quoteItems[itemId], unit_price: value }
    });
  };

  const handleSubmitQuotation = async (e) => {
    e.preventDefault();
    if (!vendorId) {
      toast.error("You are not assigned as a vendor to this RFQ.");
      return;
    }

    setSubmitting(true);
    try {
      const { total } = calculateTotals();

      // 1. Insert Quotation
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotations')
        .insert([{
          rfq_id: id,
          vendor_id: vendorId,
          total_amount: total,
          delivery_date: deliveryDate,
          notes: notes,
          status: 'Submitted'
        }])
        .select()
        .single();

      if (quoteError) throw quoteError;

      // 2. Insert Quotation Items
      const itemsToInsert = rfqItems.map(item => {
        const unitPrice = parseFloat(quoteItems[item.id]?.unit_price || 0);
        return {
          quotation_id: quoteData.id,
          rfq_item_id: item.id,
          unit_price: unitPrice,
          total_price: unitPrice * parseFloat(item.quantity),
          notes: ''
        };
      });

      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Quotation submitted successfully!');
      setShowSubmitForm(false);
      fetchRfqData(); // Refresh list

    } catch (error) {
      console.error("Error submitting quotation:", error);
      toast.error(error.message || 'Failed to submit quotation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full"></div></div>;
  }

  if (!rfq) {
    return <div className="text-center p-12 text-gray-500">RFQ not found</div>;
  }

  const { subtotal, gst, total } = calculateTotals();
  const hasSubmittedQuote = role === 'Vendor' && quotations.some(q => q.vendor_id === vendorId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button onClick={() => navigate('/rfq')} className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to RFQs
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            {rfq.title}
            <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {rfq.status}
            </span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">{rfq.description}</p>
        </div>
        
        <div className="flex gap-3">
          {(role === 'Manager' || role === 'Admin' || role === 'Procurement Officer') && quotations.length > 0 && (
            <Link to={`/rfq/${id}/compare`} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
              Compare Quotations
            </Link>
          )}
          {role === 'Vendor' && !hasSubmittedQuote && !showSubmitForm && rfq.status === 'Open' && (
            <button onClick={() => setShowSubmitForm(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
              <Plus className="-ml-1 mr-2 h-5 w-5" /> Submit Quotation
            </button>
          )}
        </div>
      </div>

      {/* Vendor Submission Form */}
      {showSubmitForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-900 overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
            <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-300">Submit Your Quotation</h2>
            <p className="text-sm text-indigo-700 dark:text-indigo-400">Fill out your unit prices for the requested items. GST is calculated automatically.</p>
          </div>
          <form onSubmit={handleSubmitQuotation} className="p-6 space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unit Price (₹)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rfqItems.map(item => {
                    const price = parseFloat(quoteItems[item.id]?.unit_price || 0);
                    const itemTotal = price * parseFloat(item.quantity);
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" step="0.01" min="0" required
                            className="w-32 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                            value={quoteItems[item.id]?.unit_price}
                            onChange={(e) => handleQuoteItemChange(item.id, e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                          ₹{itemTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Promised Delivery Date *</label>
                  <input 
                    type="date" required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Terms & Notes</label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="Payment terms, warranties, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Summary</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500 dark:text-gray-400">Subtotal</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500 dark:text-gray-400">GST (18%)</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">₹{gst.toFixed(2)}</dd>
                  </div>
                  <div className="pt-3 flex justify-between border-t border-gray-200 dark:border-gray-700">
                    <dt className="text-base font-bold text-gray-900 dark:text-white">Grand Total</dt>
                    <dd className="text-base font-bold text-indigo-600 dark:text-indigo-400">₹{total.toFixed(2)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button" 
                onClick={() => setShowSubmitForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Quotation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quotations List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FileText className="mr-2 h-5 w-5 text-gray-400" />
          Submitted Quotations ({quotations.length})
        </h2>
        
        {quotations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">No quotations have been submitted yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotations.map(quote => (
              <div key={quote.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{quote.vendors?.name || 'Unknown Vendor'}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(quote.created_at), 'MMM dd, yyyy')}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                    quote.status === 'Selected' ? 'bg-green-100 text-green-800 border-green-200' : 
                    quote.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' : 
                    'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {quote.status}
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <Percent className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400 mr-2">Total Amount:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₹{parseFloat(quote.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400 mr-2">Delivery By:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{format(new Date(quote.delivery_date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>

                {(role === 'Manager' || role === 'Admin' || role === 'Procurement Officer') && (
                   <Link to={`/rfq/${id}/compare`} className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                     View Details
                   </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RfqQuotations;
