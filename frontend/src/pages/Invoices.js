import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { numberToIndianWords } from '../utils/numberToWords';
import { getCustomers } from '../services/api';
import { sendInvoiceWhatsApp } from '../utils/whatsappHelper';

/* Helper function to format date as "10-Aug-26" */
function formatInvoiceDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;

  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

/* Customers Database */
const customersDB = [
  { id: 'CUST-000', name: 'CITY DENTAL CARE NIHARIKA', location: 'NIHARIKA', email: 'citydental@example.com', address: 'NIHARIKA, Korba', phone: '+91 98765 00000' },
  { id: 'CUST-001', name: 'ABC Electronics', location: 'Mumbai Central', email: 'abc@electronics.com', address: '123 Business Park, Mumbai', phone: '+91 98765 43210' },
  { id: 'CUST-002', name: 'XYZ Retail', location: 'Connaught Place', email: 'contact@xyzretail.com', address: '456 Market Street, Delhi', phone: '+91 98765 43211' },
  { id: 'CUST-003', name: 'Tech Solutions', location: 'Indiranagar', email: 'info@techsol.com', address: '789 Tech Hub, Bangalore', phone: '+91 98765 43212' },
  { id: 'CUST-004', name: 'Office Supplies Co', location: 'Kothrud', email: 'sales@officesupplies.com', address: '321 Corporate Ave, Pune', phone: '+91 98765 43213' },
];

/* Default Company Profile */
const defaultCompany = {
  name: 'Kedvass Hygiene Products ( EHN )',
  address: 'Agrasen Chowk Korba',
  phone1: '70890 31212',
  phone2: '96755 50312',
  prefix: 'KHP/',
  signatory: 'Authorised Signatory',
};

/* Standalone print helper that opens clean print window - 100% fail-safe */
export function printInvoiceDocument(invoice) {
  const amountInWords = numberToIndianWords(invoice.total);
  const emptyRowsCount = Math.max(0, 8 - (invoice.items ? invoice.items.length : 0));
  
  const itemsHtml = (invoice.items || []).map((item) => `
    <tr>
      <td class="col-desc"><strong>${item.product}</strong></td>
      <td class="col-qty"><strong>${item.quantity} ${item.unit || 'PCS'}</strong></td>
      <td class="col-rate">${item.price.toFixed(2)}</td>
      <td class="col-per">${item.unit || 'PCS'}</td>
      <td class="col-amount"><strong>${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
    </tr>
  `).join('');

  let emptyRowsHtml = '';
  for (let i = 0; i < emptyRowsCount; i++) {
    emptyRowsHtml += `
      <tr class="empty-row">
        <td class="col-desc">&nbsp;</td>
        <td class="col-qty"></td>
        <td class="col-rate"></td>
        <td class="col-per"></td>
        <td class="col-amount"></td>
      </tr>
    `;
  }

  const printWindow = window.open('', '_blank', 'width=900,height=1100');
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups for this site to print invoices.');
    return;
  }

  const companyName = invoice.company?.name || defaultCompany.name;
  const companyAddr = invoice.company?.address || defaultCompany.address;
  const companyPhone1 = invoice.company?.phone1 || defaultCompany.phone1;
  const companyPhone2 = invoice.company?.phone2 || defaultCompany.phone2;
  const signatory = invoice.company?.signatory || defaultCompany.signatory;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice_${invoice.invoiceNumber.replace('/', '_')}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 15mm 10mm 15mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 10px;
          background: #ffffff;
          color: #000000;
          font-family: 'Times New Roman', Times, serif, Arial, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .invoice-exact-paper {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        .invoice-exact-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .invoice-exact-invno {
          font-size: 14px;
          width: 25%;
        }
        .invoice-exact-company {
          text-align: center;
          width: 50%;
        }
        .company-title {
          font-weight: bold;
          font-size: 16px;
        }
        .company-addr, .company-mob {
          font-size: 13px;
        }
        .company-mob.underline {
          text-decoration: underline;
        }
        .invoice-main-title {
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 1px;
          margin-top: 12px;
          text-align: center;
        }
        .invoice-exact-date {
          font-size: 14px;
          text-align: right;
          width: 25%;
        }
        .invoice-exact-party {
          margin-top: 10px;
          margin-bottom: 16px;
          text-align: center;
        }
        .party-label { font-size: 15px; }
        .party-name { font-size: 15px; font-weight: bold; text-transform: uppercase; }
        .party-location { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 2px; }
        
        .invoice-exact-table-container {
          border: 2px solid #000000;
          margin-bottom: 12px;
        }
        .invoice-exact-table {
          width: 100%;
          border-collapse: collapse;
        }
        .invoice-exact-table th,
        .invoice-exact-table td {
          border-right: 1px solid #000000;
          border-bottom: 1px solid #000000;
          padding: 5px 8px;
          font-size: 13px;
          vertical-align: top;
          color: #000000;
        }
        .invoice-exact-table th:last-child,
        .invoice-exact-table td:last-child {
          border-right: none;
        }
        .invoice-exact-table thead th {
          border-bottom: 2px solid #000000;
          font-weight: normal;
          text-align: center;
          background: #ffffff;
        }
        .col-desc { width: 50%; text-align: left; }
        .col-qty { width: 13%; text-align: right; }
        .col-rate { width: 12%; text-align: right; }
        .col-per { width: 9%; text-align: center; }
        .col-amount { width: 16%; text-align: right; }
        
        .empty-row td {
          height: 24px;
          border-bottom: none;
        }
        .total-row td {
          border-top: 2px solid #000000;
          border-bottom: none;
          font-weight: bold;
          font-size: 14px;
        }
        .total-label { padding-right: 20px; text-align: right; }
        .invoice-exact-footer-section {
          margin-top: 10px;
          font-size: 13px;
        }
        .footer-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .chargeable-label { font-size: 12px; color: #333333; }
        .chargeable-words { font-size: 14px; font-weight: bold; margin-top: 2px; }
        .eoe-tag { font-style: italic; font-size: 13px; }
        .sig-box { text-align: right; margin-top: 25px; }
        .company-for { font-weight: bold; font-size: 14px; }
        .sig-space { height: 45px; }
        .sig-text { font-size: 13px; }
        .computer-gen-text { font-size: 13px; text-align: center; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="invoice-exact-paper">
        <div class="invoice-exact-header">
          <div class="invoice-exact-invno">
            Invoice No. &nbsp;&nbsp;<strong>${invoice.invoiceNumber}</strong>
          </div>
          <div class="invoice-exact-company">
            <div class="company-title">${companyName}</div>
            <div class="company-addr">${companyAddr}</div>
            <div class="company-mob">Mob : ${companyPhone1}</div>
            <div class="company-mob underline">Mob ; ${companyPhone2}</div>
            <div class="invoice-main-title">INVOICE</div>
          </div>
          <div class="invoice-exact-date">
            Dated &nbsp;&nbsp;<strong>${formatInvoiceDate(invoice.issueDate)}</strong>
          </div>
        </div>

        <div class="invoice-exact-party">
          <span class="party-label">Party &nbsp;&nbsp;:&nbsp;&nbsp;</span>
          <span class="party-name">${invoice.customer?.name}</span>
          ${invoice.customer?.location ? `<div class="party-location"><u>${invoice.customer.location}</u></div>` : ''}
        </div>

        <div class="invoice-exact-table-container">
          <table class="invoice-exact-table">
            <thead>
              <tr>
                <th class="col-desc">Description of Goods</th>
                <th class="col-qty">Quantity</th>
                <th class="col-rate">Rate</th>
                <th class="col-per">per</th>
                <th class="col-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              ${emptyRowsHtml}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4" class="total-label">Total</td>
                <td class="col-amount">₹ ${invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="invoice-exact-footer-section">
          <div class="footer-flex">
            <div>
              <div class="chargeable-label">Amount Chargeable (in words)</div>
              <div class="chargeable-words">${amountInWords}</div>
            </div>
            <div class="eoe-tag">E. & O.E</div>
          </div>

          <div class="sig-box">
            <div class="company-for">for ${companyName}</div>
            <div class="sig-space"></div>
            <div class="sig-text">${signatory}</div>
          </div>

          <div class="computer-gen-text">
            <u>This is a Computer Generated Invoice</u>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.focus();
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/* Invoices Database with KHP/311 initial seed */
let invoicesDB = [
  { 
    id: 'KHP-311',
    invoiceNumber: 'KHP/311',
    prefix: 'KHP/',
    numberOnly: '311',
    company: {
      name: 'Kedvass Hygiene Products ( EHN )',
      address: 'Agrasen Chowk Korba',
      phone1: '70890 31212',
      phone2: '96755 50312',
      signatory: 'Authorised Signatory',
    },
    customer: { 
      name: 'CITY DENTAL CARE NIHARIKA', 
      location: 'NIHARIKA', 
      email: 'citydental@example.com', 
      address: 'NIHARIKA, Korba', 
      phone: '+91 98765 00000' 
    },
    issueDate: '2026-08-10',
    dueDate: '2026-08-25',
    status: 'paid',
    items: [
      { product: 'Kair Floor Cleaner 5 Ltr', quantity: 2, price: 510, unit: 'JAR', total: 1020 },
      { product: 'AIR POCKET', quantity: 12, price: 60, unit: 'PCS', total: 720 },
      { product: 'VIM BAR SOAP 10/-', quantity: 10, price: 10, unit: 'PCS', total: 100 },
    ],
    subtotal: 1840,
    tax: 0,
    discount: 0,
    total: 1840,
    notes: 'Computer Generated Invoice',
    createdBy: 'Admin',
    createdAt: new Date('2026-08-10'),
  },
  { 
    id: 'INV-001', 
    invoiceNumber: 'INV-001',
    prefix: 'INV-',
    numberOnly: '001',
    company: defaultCompany,
    customer: { name: 'ABC Electronics', location: 'Mumbai Central', email: 'abc@electronics.com', address: '123 Business Park, Mumbai', phone: '+91 98765 43210' },
    issueDate: '2026-06-01', 
    dueDate: '2026-06-15', 
    status: 'paid', 
    items: [
      { product: 'Wireless Mouse', quantity: 50, price: 799, unit: 'PCS', total: 39950 },
      { product: 'Mechanical Keyboard', quantity: 25, price: 2499, unit: 'PCS', total: 62475 },
    ],
    subtotal: 102425, tax: 0, discount: 0, total: 102425, notes: 'Thank you for your business',
    createdBy: 'Admin', createdAt: new Date('2026-06-01')
  },
];

let nextInvoiceSeq = 312;

export default function Invoices() {
  const { can } = useAuth();
  const [invoices, setInvoices] = useState(invoicesDB);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewInvoice, setViewInvoice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter logic
  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      inv.invoiceNumber.toLowerCase().includes(q) || 
      inv.customer.name.toLowerCase().includes(q) ||
      (inv.customer.email && inv.customer.email.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    pending: invoices.filter((i) => i.status === 'pending').reduce((sum, i) => sum + i.total, 0),
    overdue: invoices.filter((i) => i.status === 'overdue').length,
    draft: invoices.filter((i) => i.status === 'draft').length,
  };

  const getStatusBadge = (status) => {
    const map = {
      paid: { color: 'success', icon: 'bi-check-circle', label: 'Paid' },
      pending: { color: 'warning', icon: 'bi-clock', label: 'Pending' },
      overdue: { color: 'danger', icon: 'bi-exclamation-circle', label: 'Overdue' },
      draft: { color: 'secondary', icon: 'bi-file-earmark', label: 'Draft' },
      sent: { color: 'info', icon: 'bi-send', label: 'Sent' },
    };
    const s = map[status] || map.draft;
    return <span className={`badge-v ${s.color}`}><i className={`bi ${s.icon}`}></i> {s.label}</span>;
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this invoice? This cannot be undone.')) {
      const updated = invoices.filter((i) => i.id !== id);
      setInvoices(updated);
      invoicesDB = updated;
    }
  };

  if (!can('products.view')) {
    return (
      <div className="empty-state-v" style={{ paddingTop: 80 }}>
        <i className="bi bi-shield-x" style={{ color: 'var(--danger)' }}></i>
        <h5>Access Denied</h5>
        <p>You don't have permission to view invoices.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">
              <i className="bi bi-receipt me-2" style={{ color: 'var(--primary)' }}></i>
              Invoices & Billing
            </h1>
            <p className="page-subtitle">Custom invoice building and print generation</p>
          </div>
          {can('products.add') && (
            <button className="btn-v primary" onClick={() => setShowCreateModal(true)}>
              <i className="bi bi-plus-lg"></i>
              <span>Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon primary">
              <i className="bi bi-receipt"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Total Invoices</div>
              <div className="stat-card-value">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon success">
              <i className="bi bi-cash-coin"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Paid Amount</div>
              <div className="stat-card-value">₹{stats.paid.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon warning">
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Pending Amount</div>
              <div className="stat-card-value">₹{stats.pending.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon danger">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Overdue Invoices</div>
              <div className="stat-card-value">{stats.overdue}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="v-card mb-4">
        <div className="v-card-body" style={{ padding: '16px 24px' }}>
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <div className="search-box-v">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by invoice number, party name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="overdue">Overdue</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn-v light w-100" onClick={() => { setSearch(''); setStatusFilter('all'); }} style={{ justifyContent: 'center' }}>
                <i className="bi bi-x-lg"></i> Clear
              </button>
            </div>
            <div className="col-md-2">
              <button className="btn-v light w-100" style={{ justifyContent: 'center' }} title="Export">
                <i className="bi bi-download"></i> Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="v-card">
        <div className="v-card-header">
          <i className="bi bi-table"></i>
          All Invoices
          <span className="badge-v secondary ms-auto">{filteredInvoices.length}</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {filteredInvoices.length === 0 ? (
            <div className="empty-state-v">
              <i className="bi bi-inbox"></i>
              <h5>No Invoices Found</h5>
              <p>{search || statusFilter !== 'all' ? 'Try adjusting filters' : 'Click "Create Invoice" to get started'}</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Party / Customer</th>
                  <th>Dated</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div className="fw-bold" style={{ color: 'var(--primary)' }}>{inv.invoiceNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        by {inv.createdBy}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold">{inv.customer.name}</div>
                      {inv.customer.location && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Location: {inv.customer.location}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {formatInvoiceDate(inv.issueDate)}
                    </td>
                    <td className="fw-bold">₹{inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>{getStatusBadge(inv.status)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn-v outline-primary icon-only" onClick={() => setViewInvoice(inv)} title="View 1:1 Preview">
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="btn-v primary icon-only" onClick={() => printInvoiceDocument(inv)} title="Print Invoice (1:1 Clean Format)">
                          <i className="bi bi-printer"></i>
                        </button>
                        {can('products.delete') && (
                          <button className="btn-v outline-danger icon-only" onClick={() => handleDelete(inv.id)} title="Delete">
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View 1:1 Invoice Preview Modal */}
      {viewInvoice && <InvoicePreviewModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal 
          onClose={() => setShowCreateModal(false)} 
          onCreate={(newInv) => { 
            setInvoices([newInv, ...invoices]); 
            invoicesDB = [newInv, ...invoices]; 
            setViewInvoice(newInv); // Open preview modal immediately!
          }} 
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   1:1 EXACT INVOICE PREVIEW MODAL (MATCHES REFERENCE IMAGE)
═══════════════════════════════════════════════════════════ */
function InvoicePreviewModal({ invoice, onClose }) {
  const handlePrint = () => {
    printInvoiceDocument(invoice);
  };

  const amountInWords = numberToIndianWords(invoice.total);
  const emptyRowsCount = Math.max(0, 8 - (invoice.items ? invoice.items.length : 0));

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box invoice-modal" style={{ maxWidth: 880, background: '#f5f5f5' }}>
        <div className="modal-box-header">
          <i className="bi bi-receipt" style={{ color: 'var(--primary)' }}></i>
          1:1 Invoice Preview ({invoice.invoiceNumber})
          <div className="ms-auto d-flex gap-2">
            <button className="btn-v primary" onClick={handlePrint} title="Print Invoice">
              <i className="bi bi-printer"></i> Print Invoice
            </button>
            <button className="close-btn" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <div className="modal-box-body p-4" style={{ background: '#e9ecef', overflowY: 'auto' }}>
          
          {/* EXACT 1:1 PRINTABLE PAPER SECTION */}
          <div className="invoice-exact-paper" id="invoice-printable-area">
            
            {/* Header Row */}
            <div className="invoice-exact-header">
              <div className="invoice-exact-invno">
                Invoice No. &nbsp;&nbsp;<strong>{invoice.invoiceNumber}</strong>
              </div>
              <div className="invoice-exact-company">
                <div className="company-title">{invoice.company?.name || defaultCompany.name}</div>
                <div className="company-addr">{invoice.company?.address || defaultCompany.address}</div>
                <div className="company-mob">Mob : {invoice.company?.phone1 || defaultCompany.phone1}</div>
                <div className="company-mob underline">Mob ; {invoice.company?.phone2 || defaultCompany.phone2}</div>
                
                <div className="invoice-main-title">INVOICE</div>
              </div>
              <div className="invoice-exact-date">
                Dated &nbsp;&nbsp;<strong>{formatInvoiceDate(invoice.issueDate)}</strong>
              </div>
            </div>

            {/* Party / Customer Row */}
            <div className="invoice-exact-party">
              <span className="party-label">Party &nbsp;&nbsp;:&nbsp;&nbsp;</span>
              <span className="party-name">{invoice.customer?.name}</span>
              {invoice.customer?.location && (
                <div className="party-location">
                  <u>{invoice.customer.location}</u>
                </div>
              )}
            </div>

            {/* Full Grid Table */}
            <div className="invoice-exact-table-container">
              <table className="invoice-exact-table">
                <thead>
                  <tr>
                    <th className="col-desc">Description of Goods</th>
                    <th className="col-qty">Quantity</th>
                    <th className="col-rate">Rate</th>
                    <th className="col-per">per</th>
                    <th className="col-amount">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="col-desc"><strong>{item.product}</strong></td>
                      <td className="col-qty"><strong>{item.quantity} {item.unit || 'PCS'}</strong></td>
                      <td className="col-rate">{item.price.toFixed(2)}</td>
                      <td className="col-per">{item.unit || 'PCS'}</td>
                      <td className="col-amount"><strong>{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                    </tr>
                  ))}

                  {/* Empty rows to maintain full vertical height grid */}
                  {Array.from({ length: emptyRowsCount }).map((_, i) => (
                    <tr key={`empty-${i}`} className="empty-row">
                      <td className="col-desc">&nbsp;</td>
                      <td className="col-qty"></td>
                      <td className="col-rate"></td>
                      <td className="col-per"></td>
                      <td className="col-amount"></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan="4" className="text-end total-label">Total</td>
                    <td className="col-amount total-value">₹ {invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer Section */}
            <div className="invoice-exact-footer-section">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div className="chargeable-label">Amount Chargeable (in words)</div>
                  <div className="chargeable-words">{amountInWords}</div>
                </div>
                <div className="eoe-tag">E. & O.E</div>
              </div>

              <div className="signatory-box text-end mt-4 pt-2">
                <div className="company-for">for {invoice.company?.name || defaultCompany.name}</div>
                <div className="sig-space"></div>
                <div className="sig-text">{invoice.company?.signatory || 'Authorised Signatory'}</div>
              </div>

              <div className="computer-gen-text text-center mt-4">
                <u>This is a Computer Generated Invoice</u>
              </div>
            </div>

          </div>

        </div>
        <div className="modal-box-footer">
          <button className="btn-v light" onClick={onClose}>Close</button>
          <button className="btn-v primary" onClick={handlePrint}>
            <i className="bi bi-printer"></i> Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CREATE INVOICE MODAL WITH FULL CUSTOMIZATION
═══════════════════════════════════════════════════════════ */
function CreateInvoiceModal({ onClose, onCreate }) {
  const { user } = useAuth();
  const [customerList, setCustomerList] = useState(customersDB);
  const [form, setForm] = useState({
    prefix: 'KHP/',
    numberOnly: String(nextInvoiceSeq),
    company: { ...defaultCompany },
    customerId: 'CUST-000',
    customer: { 
      name: 'CITY DENTAL CARE NIHARIKA', 
      location: 'NIHARIKA',
      email: 'citydental@example.com', 
      address: 'NIHARIKA, Korba', 
      phone: '+91 98765 00000',
      gstin: ''
    },
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    items: [
      { product: 'Kair Floor Cleaner 5 Ltr', quantity: 2, price: 510, unit: 'JAR' },
      { product: 'AIR POCKET', quantity: 12, price: 60, unit: 'PCS' },
      { product: 'VIM BAR SOAP 10/-', quantity: 10, price: 10, unit: 'PCS' },
    ],
    notes: 'This is a Computer Generated Invoice',
  });

  const [error, setError] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  useEffect(() => {
    getCustomers().then(res => {
      if (res.data && res.data.length > 0) {
        const merged = [...res.data.map(c => ({
          id: c._id,
          name: c.name,
          location: c.state || c.address || '',
          email: c.email,
          address: c.address,
          phone: c.phone,
          gstin: c.gstin || '',
          defaultCreditPeriod: c.defaultCreditPeriod || 30
        })), ...customersDB];
        setCustomerList(merged);
      }
    }).catch(err => console.log('Using default customers list'));
  }, []);

  // Available units for "per" column
  const unitOptions = ['JAR', 'PCS', 'BOX', 'KG', 'LTR', 'BAG', 'PACKET', 'SET', 'TIN', 'BOTTLE', 'DOZEN'];

  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    if (customerId === 'new') {
      setIsNewCustomer(true);
      setForm({ 
        ...form, 
        customerId: 'new',
        customer: { name: '', location: '', email: '', address: '', phone: '', gstin: '' } 
      });
    } else if (customerId) {
      const selectedCustomer = customerList.find((c) => c.id === customerId);
      if (selectedCustomer) {
        setIsNewCustomer(false);
        const creditDays = selectedCustomer.defaultCreditPeriod || 30;
        const issueDateObj = new Date(form.issueDate);
        issueDateObj.setDate(issueDateObj.getDate() + creditDays);
        const calculatedDueDate = issueDateObj.toISOString().split('T')[0];

        setForm({ 
          ...form, 
          customerId,
          dueDate: calculatedDueDate,
          customer: { 
            name: selectedCustomer.name, 
            location: selectedCustomer.location || selectedCustomer.address || '',
            email: selectedCustomer.email || '', 
            address: selectedCustomer.address || '', 
            phone: selectedCustomer.phone || '',
            gstin: selectedCustomer.gstin || ''
          } 
        });
      }
    }
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { product: '', quantity: 1, price: 0, unit: 'PCS' }] });
  };

  const removeItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    if (field === 'quantity' || field === 'price') {
      items[idx][field] = Number(value) || 0;
    } else {
      items[idx][field] = value;
    }
    setForm({ ...form, items });
  };

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.customer.name) {
      setError('Party / Customer name is required');
      return;
    }
    if (form.items.some((i) => !i.product || i.quantity <= 0)) {
      setError('All items must have a product name and quantity greater than 0');
      return;
    }

    const total = calculateTotal();
    const invoiceNumStr = `${form.prefix}${form.numberOnly}`;
    nextInvoiceSeq++;

    const newInvoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: invoiceNumStr,
      prefix: form.prefix,
      numberOnly: form.numberOnly,
      company: form.company,
      customer: form.customer,
      issueDate: form.issueDate,
      dueDate: form.dueDate || form.issueDate,
      status: 'paid',
      items: form.items.map((i) => ({ 
        ...i, 
        total: (i.quantity || 0) * (i.price || 0) 
      })),
      subtotal: total,
      tax: 0,
      discount: 0,
      total,
      notes: form.notes,
      createdBy: user?.name || 'Admin',
      createdAt: new Date(),
    };

    onCreate(newInvoice);
    onClose();
  };

  const currentTotal = calculateTotal();
  const currentWords = numberToIndianWords(currentTotal);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 920 }}>
        <div className="modal-box-header">
          <i className="bi bi-plus-circle" style={{ color: 'var(--primary)' }}></i>
          Create Custom Invoice (1:1 Template)
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-box-body">
            {error && (
              <div className="alert-v danger">
                <i className="bi bi-exclamation-circle"></i> {error}
              </div>
            )}

            {/* Company Customization Accordion/Section */}
            <div className="invoice-form-section">
              <div className="invoice-form-section-title">
                <i className="bi bi-building"></i> Company Branding & Header Customization
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Company Name *</label>
                  <input
                    className="form-control"
                    value={form.company.name}
                    onChange={(e) => setForm({ ...form, company: { ...form.company, name: e.target.value } })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Company Address</label>
                  <input
                    className="form-control"
                    value={form.company.address}
                    onChange={(e) => setForm({ ...form, company: { ...form.company, address: e.target.value } })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Mobile 1</label>
                  <input
                    className="form-control"
                    value={form.company.phone1}
                    onChange={(e) => setForm({ ...form, company: { ...form.company, phone1: e.target.value } })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Mobile 2 (Underlined)</label>
                  <input
                    className="form-control"
                    value={form.company.phone2}
                    onChange={(e) => setForm({ ...form, company: { ...form.company, phone2: e.target.value } })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Invoice Prefix</label>
                  <input
                    className="form-control"
                    placeholder="e.g. KHP/"
                    value={form.prefix}
                    onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Invoice Header Details */}
            <div className="invoice-form-section">
              <div className="invoice-form-section-title">
                <i className="bi bi-receipt"></i> Invoice Info & Dates
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Invoice Number *</label>
                  <div className="input-group">
                    <span className="input-group-text">{form.prefix}</span>
                    <input
                      className="form-control"
                      value={form.numberOnly}
                      onChange={(e) => setForm({ ...form, numberOnly: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Dated *</label>
                  <input
                    className="form-control"
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Party / Customer Information */}
            <div className="invoice-form-section">
              <div className="invoice-form-section-title">
                <i className="bi bi-person"></i> Party / Customer Details
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Select Party / Customer</label>
                  <select 
                    className="form-select" 
                    value={form.customerId} 
                    onChange={handleCustomerSelect}
                  >
                    {customerList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.location || c.address})
                      </option>
                    ))}
                    <option value="new">+ Add Custom Party</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Party Name *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. CITY DENTAL CARE NIHARIKA"
                    value={form.customer.name}
                    onChange={(e) => setForm({ ...form, customer: { ...form.customer, name: e.target.value } })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Party Sub-Location / Address (Underlined)</label>
                  <input
                    className="form-control"
                    placeholder="e.g. NIHARIKA"
                    value={form.customer.location}
                    onChange={(e) => setForm({ ...form, customer: { ...form.customer, location: e.target.value } })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    placeholder="e.g. +91 98765 43210"
                    value={form.customer.phone}
                    onChange={(e) => setForm({ ...form, customer: { ...form.customer, phone: e.target.value } })}
                  />
                </div>
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Items Table Form */}
            <div className="invoice-form-section">
              <div className="d-flex align-items-center mb-3">
                <div className="invoice-form-section-title mb-0">
                  <i className="bi bi-box"></i> Description of Goods & Quantities
                </div>
                <button type="button" className="btn-v light ms-auto" onClick={addItem} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  <i className="bi bi-plus"></i> Add Product
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-2" style={{ fontSize: '0.88rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '4%' }}>#</th>
                      <th style={{ width: '40%' }}>Description of Goods</th>
                      <th style={{ width: '15%' }}>Quantity</th>
                      <th style={{ width: '15%' }}>Rate (₹)</th>
                      <th style={{ width: '14%' }}>per (Unit)</th>
                      <th style={{ width: '12%' }} className="text-end">Amount (₹)</th>
                      <th style={{ width: '4%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-center fw-bold">{idx + 1}</td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            placeholder="e.g. Kair Floor Cleaner 5 Ltr"
                            value={item.product}
                            onChange={(e) => updateItem(idx, 'product', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => updateItem(idx, 'price', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={item.unit}
                            onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                          >
                            {unitOptions.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>
                        <td className="text-end fw-bold">
                          ₹{((item.quantity || 0) * (item.price || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-center">
                          {form.items.length > 1 && (
                            <button type="button" className="btn-v outline-danger icon-only p-1" onClick={() => removeItem(idx)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Totals & Live Amount In Words Preview */}
            <div className="v-card p-3" style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
              <div className="row align-items-center">
                <div className="col-md-7">
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <i className="bi bi-fonts me-1"></i> Amount Chargeable (in words):
                  </div>
                  <div className="fw-bold text-primary mt-1" style={{ fontSize: '0.95rem' }}>
                    {currentWords}
                  </div>
                </div>
                <div className="col-md-5 text-end">
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Amount:</div>
                  <div className="fw-bold" style={{ fontSize: '1.4rem', color: '#000' }}>
                    ₹ {currentTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div className="modal-box-footer">
            <button className="btn-v light" type="button" onClick={onClose}>Cancel</button>
            <button className="btn-v primary" type="submit">
              <i className="bi bi-check-circle"></i> Generate & View Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
