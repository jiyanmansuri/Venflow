import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowRight, ArrowLeft, Save, Send, Check } from 'lucide-react';

const RfqCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Basic Info
  const [rfqDetails, setRfqDetails] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  // Step 2: Line Items
  const [items, setItems] = useState([
    { product_name: '', quantity: '', unit: 'pcs', estimated_price: '' }
  ]);

  // Step 3: Vendors
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');

  useEffect(() => {
    if (step === 3) {
      fetchVendors();
    }
  }, [step]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, category')
        .eq('status', 'Active');
      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const addItem = () => {
    setItems([...items, { product_name: '', quantity: '', unit: 'pcs', estimated_price: '' }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const toggleVendorSelection = (vendorId) => {
    if (selectedVendors.includes(vendorId)) {
      setSelectedVendors(selectedVendors.filter(id => id !== vendorId));
    } else {
      setSelectedVendors([...selectedVendors, vendorId]);
    }
  };

  const handleSubmit = async (status) => {
    setSubmitting(true);
    try {
      // 1. Insert RFQ
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .insert([{
          title: rfqDetails.title,
          description: rfqDetails.description,
          deadline: rfqDetails.deadline,
          status: status,
          created_by: user.id
        }])
        .select()
        .single();

      if (rfqError) throw rfqError;
      const rfqId = rfqData.id;

      // 2. Insert Items
      const itemsToInsert = items.map(item => ({
        rfq_id: rfqId,
        product_name: item.product_name,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        estimated_price: item.estimated_price ? parseFloat(item.estimated_price) : null
      }));
      
      const { error: itemsError } = await supabase
        .from('rfq_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // 3. Insert Vendor Assignments
      if (selectedVendors.length > 0) {
        const assignmentsToInsert = selectedVendors.map(vid => ({
          rfq_id: rfqId,
          vendor_id: vid
        }));
        
        const { error: vendorError } = await supabase
          .from('rfq_vendor_assignments')
          .insert(assignmentsToInsert);

        if (vendorError) throw vendorError;
      }

      toast.success(status === 'Draft' ? 'RFQ saved as draft!' : 'RFQ sent to vendors!');
      navigate('/rfq');
      
    } catch (error) {
      console.error('Error creating RFQ:', error);
      toast.error(error.message || 'Failed to create RFQ');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(vendorSearch.toLowerCase()) || 
    v.category.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New RFQ</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Request quotations from your trusted vendors.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full z-0"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full z-0 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
          
          {[1, 2, 3].map((s) => (
            <div key={s} className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-colors ${
              step === s 
                ? 'bg-white dark:bg-gray-800 border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : step > s 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
            }`}>
              {step > s ? <Check size={20} /> : s}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">RFQ Details</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RFQ Title *</label>
                <input 
                  type="text" 
                  value={rfqDetails.title}
                  onChange={(e) => setRfqDetails({...rfqDetails, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="e.g., Office Supplies Q3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Submission Deadline *</label>
                <input 
                  type="datetime-local" 
                  value={rfqDetails.deadline}
                  onChange={(e) => setRfqDetails({...rfqDetails, deadline: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description / Notes</label>
                <textarea 
                  rows={4}
                  value={rfqDetails.description}
                  onChange={(e) => setRfqDetails({...rfqDetails, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="Any additional requirements or instructions for vendors..."
                />
              </div>
            </div>
            <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={handleNext}
                disabled={!rfqDetails.title || !rfqDetails.deadline}
                className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Line Items */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Line Items</h2>
              <button 
                onClick={addItem}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="-ml-1 mr-1 h-4 w-4" /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product / Service *</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">Quantity *</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-48">Est. Price (Opt)</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-2 py-3">
                        <input 
                          type="text" required
                          value={item.product_name}
                          onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <input 
                          type="number" min="0.01" step="0.01" required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        >
                          <option value="pcs">pcs</option>
                          <option value="kg">kg</option>
                          <option value="ltr">ltr</option>
                          <option value="box">box</option>
                          <option value="hours">hours</option>
                        </select>
                      </td>
                      <td className="px-2 py-3">
                        <input 
                          type="number" min="0" step="0.01"
                          value={item.estimated_price}
                          onChange={(e) => handleItemChange(index, 'estimated_price', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          placeholder="₹"
                        />
                      </td>
                      <td className="px-2 py-3 text-right">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 transition-colors p-2">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={handlePrev}
                className="inline-flex items-center px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </button>
              <button 
                onClick={handleNext}
                disabled={items.some(i => !i.product_name || !i.quantity)}
                className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Vendor Assignment */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Assign Vendors</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select the vendors who will receive this RFQ.</p>
            </div>

            <div>
              <input 
                type="text" 
                placeholder="Search vendors by name or category..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors mb-4"
              />

              {loading ? (
                <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                  {filteredVendors.map(vendor => {
                    const isSelected = selectedVendors.includes(vendor.id);
                    return (
                      <div 
                        key={vendor.id}
                        onClick={() => toggleVendorSelection(vendor.id)}
                        className={`cursor-pointer border rounded-xl p-4 transition-all duration-200 flex items-center justify-between ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                      >
                        <div>
                          <p className={`font-medium text-sm ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-white'}`}>
                            {vendor.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{vendor.category}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={handlePrev}
                disabled={submitting}
                className="inline-flex items-center px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </button>
              
              <div className="space-x-3 flex">
                <button 
                  onClick={() => handleSubmit('Draft')}
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" /> Save as Draft
                </button>
                <button 
                  onClick={() => handleSubmit('Pending')}
                  disabled={submitting || selectedVendors.length === 0}
                  className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Sending...' : <><Send className="mr-2 h-4 w-4" /> Send to Vendors</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RfqCreate;
