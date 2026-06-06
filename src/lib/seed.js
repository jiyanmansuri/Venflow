import { supabase } from './supabase';

export const seedDatabase = async () => {
  try {
    // 1. Check if vendors exist
    const { count, error: countError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true });
      
    if (countError) throw countError;
    if (count > 0) return { message: 'Database already seeded' };

    console.log('Seeding database...');

    // 2. Insert Vendors
    const vendorsData = [
      { name: 'TechCore Ltd', gst_number: '27AADCT4221F1Z1', category: 'IT Hardware', contact_name: 'Rahul Sharma', status: 'Active' },
      { name: 'Infra Supplies Ltd', gst_number: '27AABCU9603R1ZM', category: 'Construction', contact_name: 'Amit Patel', status: 'Active' },
      { name: 'FormUp Solutions', gst_number: '29AABCF4567G1Z1', category: 'Office Furniture', contact_name: 'Priya Singh', status: 'Active' },
      { name: 'OfficeKart India', gst_number: '07AAECI9876K1Z9', category: 'Office Supplies', contact_name: 'Neha Gupta', status: 'Active' }
    ];

    const { data: vendors, error: vError } = await supabase.from('vendors').insert(vendorsData).select();
    if (vError) throw vError;

    // We need an admin user to own these. Let's try to get current user, or leave created_by null
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;

    // 3. Insert RFQs
    const rfqsData = [
      { title: 'Laptops for Engineering Team', description: 'Need 10 high-performance laptops.', deadline: new Date(Date.now() + 86400000 * 7).toISOString(), status: 'Open', created_by: userId },
      { title: 'Office Chairs Replacement', description: 'Ergonomic chairs for the entire floor.', deadline: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'Approved', created_by: userId }
    ];
    const { data: rfqs, error: rError } = await supabase.from('rfqs').insert(rfqsData).select();
    if (rError) throw rError;

    // 4. Insert RFQ Items
    const rfqItemsData = [
      { rfq_id: rfqs[0].id, product_name: 'MacBook Pro 16"', quantity: 10, unit: 'pcs', estimated_price: 2500 },
      { rfq_id: rfqs[1].id, product_name: 'Ergonomic Mesh Chair', quantity: 50, unit: 'pcs', estimated_price: 150 }
    ];
    const { data: rfqItems, error: riError } = await supabase.from('rfq_items').insert(rfqItemsData).select();
    if (riError) throw riError;

    // 5. Insert Vendor Assignments
    const assignments = [
      { rfq_id: rfqs[0].id, vendor_id: vendors[0].id }, // TechCore -> Laptops
      { rfq_id: rfqs[1].id, vendor_id: vendors[2].id }, // FormUp -> Chairs
      { rfq_id: rfqs[1].id, vendor_id: vendors[3].id }  // OfficeKart -> Chairs
    ];
    await supabase.from('rfq_vendor_assignments').insert(assignments);

    // 6. Insert Quotations for Open RFQ (Laptops)
    const quotesData = [
      { rfq_id: rfqs[0].id, vendor_id: vendors[0].id, total_amount: 24500, delivery_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0], status: 'Submitted', notes: 'Includes 3 years AppleCare' }
    ];
    const { data: quotes, error: qError } = await supabase.from('quotations').insert(quotesData).select();
    if (qError) throw qError;

    // 7. Insert Quotation Items
    const qItemsData = [
      { quotation_id: quotes[0].id, rfq_item_id: rfqItems[0].id, unit_price: 2450, total_price: 24500, notes: 'Standard config' }
    ];
    await supabase.from('quotation_items').insert(qItemsData);

    // 8. Approvals & POs for the Approved RFQ
    // Let's create a quote that was approved
    const { data: approvedQuote } = await supabase.from('quotations').insert([
      { rfq_id: rfqs[1].id, vendor_id: vendors[2].id, total_amount: 7000, delivery_date: new Date().toISOString().split('T')[0], status: 'Selected' }
    ]).select();

    const { data: approvals } = await supabase.from('approvals').insert([
      { rfq_id: rfqs[1].id, quotation_id: approvedQuote[0].id, status: 'Approved', remarks: 'Looks good.' }
    ]).select();

    const { data: pos } = await supabase.from('purchase_orders').insert([
      { approval_id: approvals[0].id, po_number: `PO-${new Date().getFullYear()}-001`, status: 'Issued' }
    ]).select();

    // 9. Invoices
    await supabase.from('invoices').insert([
      { purchase_order_id: pos[0].id, invoice_number: `INV-${new Date().getFullYear()}-001`, invoice_date: new Date().toISOString().split('T')[0], subtotal: 7000, cgst: 630, sgst: 630, grand_total: 8260, status: 'Draft' }
    ]);

    return { message: 'Database seeded successfully' };
  } catch (error) {
    console.error('Seeding error:', error);
    return { error };
  }
};
