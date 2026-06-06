import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding database...');

  try {
    console.log('Clearing old data...');
    // Delete in reverse order of dependencies
    await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('purchase_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('approvals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('quotation_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('quotations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('rfq_vendor_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('rfq_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('rfqs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vendors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Old data cleared.');

    // 1. Seed Vendors
    const { data: vendors, error: vendorError } = await supabase.from('vendors').insert([
      { name: 'TechCorp Supplies', gst_number: '27AADCT1111A1Z5', category: 'IT Hardware', contact_name: 'Alice Smith', contact_email: 'alice@techcorp.com', contact_phone: '+919876543210', status: 'Active' },
      { name: 'Global Logistics Pvt', gst_number: '27AADCG2222A1Z5', category: 'Logistics', contact_name: 'Bob Jones', contact_email: 'bob@globallogistics.com', contact_phone: '+919876543211', status: 'Active' },
      { name: 'Office Essentials Ltd', gst_number: '27AADCO3333A1Z5', category: 'Office Supplies', contact_name: 'Charlie Brown', contact_email: 'charlie@officeessentials.com', contact_phone: '+919876543212', status: 'Active' }
    ]).select();
    
    if (vendorError) throw vendorError;
    console.log('Vendors seeded.');

    // 2. Seed RFQs
    const { data: rfqs, error: rfqError } = await supabase.from('rfqs').insert([
      { title: 'Q3 Laptops Procurement', description: 'Need 50 high-end laptops for new engineering hires.', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'Pending' },
      { title: 'Annual Office Furniture', description: 'Desks and ergonomic chairs for the new branch.', deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), status: 'Pending' }
    ]).select();

    if (rfqError) throw rfqError;
    console.log('RFQs seeded.');

    // 3. Seed RFQ Items
    const { data: rfqItems, error: rfqItemError } = await supabase.from('rfq_items').insert([
      { rfq_id: rfqs[0].id, product_name: 'MacBook Pro 16"', quantity: 20, unit: 'Pieces', estimated_price: 250000 },
      { rfq_id: rfqs[0].id, product_name: 'Dell XPS 15', quantity: 30, unit: 'Pieces', estimated_price: 180000 },
      { rfq_id: rfqs[1].id, product_name: 'Ergonomic Chair', quantity: 50, unit: 'Pieces', estimated_price: 15000 },
      { rfq_id: rfqs[1].id, product_name: 'Standing Desk', quantity: 50, unit: 'Pieces', estimated_price: 35000 }
    ]).select();

    if (rfqItemError) throw rfqItemError;

    // 4. Seed RFQ Vendor Assignments
    const { error: assignmentError } = await supabase.from('rfq_vendor_assignments').insert([
      { rfq_id: rfqs[0].id, vendor_id: vendors[0].id },
      { rfq_id: rfqs[1].id, vendor_id: vendors[2].id }
    ]);

    if (assignmentError) throw assignmentError;

    // 5. Seed Quotations
    const { data: quotations, error: quoteError } = await supabase.from('quotations').insert([
      { rfq_id: rfqs[0].id, vendor_id: vendors[0].id, total_amount: 10400000, delivery_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), status: 'Submitted', notes: 'Includes 3 years AppleCare+ for all MacBooks.' },
      { rfq_id: rfqs[1].id, vendor_id: vendors[2].id, total_amount: 2500000, delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), status: 'Selected', notes: 'Bulk discount applied.' }
    ]).select();

    if (quoteError) throw quoteError;
    console.log('Quotations seeded.');

    // 6. Seed Quotation Items
    const { error: quoteItemError } = await supabase.from('quotation_items').insert([
      { quotation_id: quotations[0].id, rfq_item_id: rfqItems[0].id, unit_price: 250000, total_price: 5000000, notes: 'M3 Max config' },
      { quotation_id: quotations[0].id, rfq_item_id: rfqItems[1].id, unit_price: 180000, total_price: 5400000, notes: 'i9 config' },
      { quotation_id: quotations[1].id, rfq_item_id: rfqItems[2].id, unit_price: 15000, total_price: 750000, notes: 'Herman Miller clones' },
      { quotation_id: quotations[1].id, rfq_item_id: rfqItems[3].id, unit_price: 35000, total_price: 1750000, notes: 'Motorized standing desks' }
    ]);

    if (quoteItemError) throw quoteItemError;

    // 7. Seed Approvals
    const { data: approvals, error: approvalError } = await supabase.from('approvals').insert([
      { rfq_id: rfqs[1].id, quotation_id: quotations[1].id, status: 'Approved', remarks: 'Good pricing. Proceed.', processed_at: new Date().toISOString() }
    ]).select();

    if (approvalError) throw approvalError;
    console.log('Approvals seeded.');

    // 8. Seed Purchase Orders
    const { data: pos, error: poError } = await supabase.from('purchase_orders').insert([
      { approval_id: approvals[0].id, po_number: 'PO-2023-0001', status: 'Issued' }
    ]).select();

    if (poError) throw poError;
    console.log('Purchase Orders seeded.');

    // 9. Seed Invoices
    const subtotal = 2500000;
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const grand_total = subtotal + cgst + sgst;

    const { error: invError } = await supabase.from('invoices').insert([
      { purchase_order_id: pos[0].id, invoice_number: 'INV-2023-1001', invoice_date: new Date().toISOString(), subtotal, cgst, sgst, grand_total, status: 'Paid' }
    ]);

    if (invError) throw invError;
    console.log('Invoices seeded.');

    // 10. Seed Mock Fraud Detection Logs
    const { error: logError } = await supabase.from('activity_logs').insert([
      { action: '[Fraud Alert] Quotation price 40% above estimated value', entity_type: 'Quotation', status: 'Danger', user_name: 'System AI' },
      { action: '[System] Unrecognized IP accessed RFQ details', entity_type: 'RFQ', status: 'Warning', user_name: 'Security Bot' },
      { action: 'Approved quotation from Office Essentials Ltd', entity_type: 'Approval', status: 'Success', user_name: 'Procurement Head' },
      { action: 'RFQ "Q3 Laptops Procurement" created successfully', entity_type: 'RFQ', status: 'Info', user_name: 'Admin User' }
    ]);

    if (logError) throw logError;
    console.log('Activity Logs seeded.');

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
  }
}

seed();
