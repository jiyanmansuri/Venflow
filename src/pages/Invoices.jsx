import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft, Printer, Download, Send, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Invoices = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef(null);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          purchase_orders (
            po_number,
            approvals (
              quotations (
                quotation_items (
                  unit_price,
                  total_price,
                  rfq_items (product_name, quantity, unit)
                ),
                vendors (name, contact_name, contact_email, gst_number)
              )
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoice_number}.pdf`);
      toast.success('PDF Downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleMarkAsSent = async () => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'Sent' })
        .eq('id', id);

      if (error) throw error;
      
      setInvoice({ ...invoice, status: 'Sent' });
      toast.success('Invoice marked as Sent');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full"></div></div>;
  }

  if (!invoice) {
    return <div className="text-center p-12 text-gray-500">Invoice not found</div>;
  }

  const vendor = invoice.purchase_orders?.approvals?.quotations?.vendors;
  const items = invoice.purchase_orders?.approvals?.quotations?.quotation_items || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <button onClick={() => navigate('/purchase-orders')} className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to POs
        </button>
        
        <div className="flex gap-3">
          <button onClick={handlePrint} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Printer className="mr-2 h-4 w-4" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </button>
          {invoice.status === 'Draft' ? (
            <button onClick={handleMarkAsSent} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
              <Send className="mr-2 h-4 w-4" /> Mark as Sent
            </button>
          ) : (
            <span className="inline-flex items-center px-4 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm font-medium">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Sent
            </span>
          )}
        </div>
      </div>

      {/* Invoice Document rendering area */}
      <div 
        ref={invoiceRef} 
        className="bg-white rounded-none sm:rounded-2xl shadow-xl border border-gray-200 overflow-hidden text-gray-900"
        style={{ color: '#111827' }} // Force text color for PDF capture regardless of dark mode
      >
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-indigo-600">Venflow</h1>
              <p className="text-sm text-gray-500 mt-1">Procurement & Vendor Management</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-300 uppercase tracking-widest">Invoice</h2>
              <p className="font-semibold text-gray-900 mt-2">{invoice.invoice_number}</p>
              <p className="text-sm text-gray-500">Date: {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-800">
                {invoice.status}
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-12 mb-8">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To:</h3>
              <p className="text-base font-bold text-gray-900">Venflow Corp.</p>
              <p className="text-sm text-gray-600 mt-1">123 Business Avenue</p>
              <p className="text-sm text-gray-600">Tech Park, BLR 560001</p>
              <p className="text-sm text-gray-600 mt-1">GSTIN: 29ABCDE1234F1Z5</p>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">From Vendor:</h3>
              <p className="text-base font-bold text-gray-900">{vendor?.name || 'Unknown Vendor'}</p>
              <p className="text-sm text-gray-600 mt-1">Attn: {vendor?.contact_name || '-'}</p>
              <p className="text-sm text-gray-600">{vendor?.contact_email || '-'}</p>
              <p className="text-sm text-gray-600 mt-1">GSTIN: {vendor?.gst_number || '-'}</p>
            </div>
          </div>

          {/* PO Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8 flex gap-8 text-sm">
            <div>
              <span className="font-semibold text-gray-900">PO Number: </span>
              <span className="text-gray-600">{invoice.purchase_orders?.po_number}</span>
            </div>
          </div>

          {/* Items Table */}
          <table className="min-w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 text-sm font-bold text-gray-900 uppercase tracking-wider">Description</th>
                <th className="text-center py-3 text-sm font-bold text-gray-900 uppercase tracking-wider">Qty</th>
                <th className="text-right py-3 text-sm font-bold text-gray-900 uppercase tracking-wider">Rate</th>
                <th className="text-right py-3 text-sm font-bold text-gray-900 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="border-b border-gray-200">
              {items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 last:border-0">
                  <td className="py-4 text-sm text-gray-900">{item.rfq_items?.product_name}</td>
                  <td className="py-4 text-sm text-center text-gray-600">{item.rfq_items?.quantity} {item.rfq_items?.unit}</td>
                  <td className="py-4 text-sm text-right text-gray-600">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                  <td className="py-4 text-sm text-right font-medium text-gray-900">₹{parseFloat(item.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-1/2 sm:w-1/3">
              <div className="flex justify-between py-2 text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{parseFloat(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-gray-600">
                <span>CGST (9%)</span>
                <span>₹{parseFloat(invoice.cgst).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-200">
                <span>SGST (9%)</span>
                <span>₹{parseFloat(invoice.sgst).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-4">
                <span className="text-lg font-bold text-gray-900">Grand Total</span>
                <span className="text-lg font-bold text-indigo-600">₹{parseFloat(invoice.grand_total).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-medium">Thank you for your business!</p>
            <p className="text-xs text-gray-400 mt-1">This is a system generated invoice and does not require a physical signature.</p>
          </div>
        </div>
      </div>
      
      {/* Print CSS is needed via a class or injected style, handled by Tailwind's print: modifier */}
    </div>
  );
};

export default Invoices;
