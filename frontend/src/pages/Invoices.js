import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportHelper';
import { numberToIndianWords } from '../utils/numberToWords';
import { getCustomers } from '../services/api';
import { sendInvoiceWhatsApp } from '../utils/whatsappHelper';
import Pagination from '../components/Pagination';
import DataImportModal from '../components/DataImportModal';

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

const customersDB = [
  { id: 'CUST-000', name: 'CITY DENTAL CARE NIHARIKA', location: 'NIHARIKA', email: 'citydental@example.com', address: 'NIHARIKA, Korba', phone: '+91 98765 00000' },
  { id: 'CUST-001', name: 'ABC Electronics', location: 'Mumbai Central', email: 'abc@electronics.com', address: '123 Business Park, Mumbai', phone: '+91 98765 43210' },
  { id: 'CUST-002', name: 'XYZ Retail', location: 'Connaught Place', email: 'contact@xyzretail.com', address: '456 Market Street, Delhi', phone: '+91 98765 43211' },
  { id: 'CUST-003', name: 'Tech Solutions', location: 'Indiranagar', email: 'info@techsol.com', address: '789 Tech Hub, Bangalore', phone: '+91 98765 43212' },
  { id: 'CUST-004', name: 'Office Supplies Co', location: 'Kothrud', email: 'sales@officesupplies.com', address: '321 Corporate Ave, Pune', phone: '+91 98765 43213' },
];

const defaultCompany = {
  name: 'Kedvass Hygiene Products ( EHN )',
  address: 'Agrasen Chowk Korba',
  phone1: '70890 31212',
  phone2: '96755 50312',
  prefix: 'KHP/',
  signatory: 'Authorised Signatory',
};

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
    alert('Pop-up blocked! Allow pop-ups to print invoices.');
    return;
  }

  const companyName = invoice.firmDetails?.name || invoice.company?.name || defaultCompany.name;
  const companyAddr = invoice.firmDetails?.address || invoice.company?.address || defaultCompany.address;
  const companyPhone1 = invoice.firmDetails?.phone || invoice.company?.phone1 || defaultCompany.phone1;
  const companyPhone2 = invoice.company?.phone2 || defaultCompany.phone2;
  const signatory = invoice.company?.signatory || defaultCompany.signatory;

  const isGst = invoice.firmDetails?.isGstRegistered !== false && invoice.invoiceType !== 'bill_of_supply';
  const docTitle = isGst ? 'TAX INVOICE' : 'BILL OF SUPPLY / RETAIL INVOICE';
  const gstinStr = isGst && invoice.firmDetails?.gstin ? `GSTIN: ${invoice.firmDetails.gstin}` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice_${(invoice.invoiceNumber || '').replace('/', '_')}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm 15mm 10mm 15mm; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 10px; background: #ffffff; color: #000000; font-family: 'Times New Roman', Times, serif, Arial, sans-serif; font-size: 14px; line-height: 1.4; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .invoice-exact-paper { width: 100%; max-width: 800px; margin: 0 auto; }
        .invoice-exact-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .invoice-exact-invno { font-size: 14px; width: 25%; }
        .invoice-exact-company { text-align: center; width: 50%; }
        .company-title { font-weight: bold; font-size: 16px; }
        .company-addr, .company-mob { font-size: 13px; }
        .company-mob.underline { text-decoration: underline; }
        .invoice-main-title { font-size: 17px; font-weight: bold; letter-spacing: 1px; margin-top: 8px; text-align: center; }
        .invoice-exact-date { font-size: 14px; text-align: right; width: 25%; }
        .invoice-exact-party { margin-top: 10px; margin-bottom: 16px; text-align: center; }
        .party-label { font-size: 15px; }
        .party-name { font-size: 15px; font-weight: bold; text-transform: uppercase; }
        .party-location { font-size: 14px; margin-top: 2px; }
        .invoice-exact-table-container { margin-bottom: 15px; }
        .invoice-exact-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000000; }
        .invoice-exact-table th { border-bottom: 1.5px solid #000000; border-right: 1.5px solid #000000; padding: 6px 8px; font-size: 14px; font-weight: bold; text-align: center; }
        .invoice-exact-table th:last-child { border-right: none; }
        .invoice-exact-table td { border-right: 1.5px solid #000000; padding: 6px 8px; font-size: 14px; vertical-align: top; }
        .invoice-exact-table td:last-child { border-right: none; }
        .col-desc { width: 50%; text-align: left; }
        .col-qty { width: 15%; text-align: center; }
        .col-rate { width: 12%; text-align: right; }
        .col-per { width: 8%; text-align: center; }
        .col-amount { width: 15%; text-align: right; }
        .empty-row td { height: 28px; }
        .total-row td { border-top: 1.5px solid #000000; font-weight: bold; font-size: 15px; }
        .total-label { text-align: right; padding-right: 15px; }
        .invoice-exact-footer-section { margin-top: 20px; }
        .footer-flex { display: flex; justify-content: space-between; align-items: flex-start; }
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
          <div class="invoice-exact-invno">Invoice No. &nbsp;&nbsp;<strong>${invoice.invoiceNumber}</strong></div>
          <div class="invoice-exact-company">
            <div class="company-title">${companyName}</div>
            <div class="company-addr">${companyAddr}</div>
            ${gstinStr ? `<div class="company-mob font-monospace"><strong>${gstinStr}</strong></div>` : ''}
            <div class="company-mob">Mob : ${companyPhone1}</div>
            <div class="invoice-main-title">${docTitle}</div>
          </div>
          <div class="invoice-exact-date">Dated &nbsp;&nbsp;<strong>${formatInvoiceDate(invoice.issueDate)}</strong></div>
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
        window.onload = function() { window.focus(); window.print(); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

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
    customer: { name: 'CITY DENTAL CARE NIHARIKA', location: 'NIHARIKA', email: 'citydental@example.com', address: 'NIHARIKA, Korba', phone: '+91 98765 00000' },
    issueDate: '2026-08-10',
    dueDate: '2026-08-25',
    status: 'paid',
    items: [
      { product: 'Kair Floor Cleaner 5 Ltr', quantity: 2, price: 510, unit: 'JAR', total: 1020 },
      { product: 'AIR POCKET', quantity: 12, price: 60, unit: 'PCS', total: 720 },
      { product: 'VIM BAR SOAP 10/-', quantity: 10, price: 10, unit: 'PCS', total: 100 },
    ],
    subtotal: 1840, tax: 0, discount: 0, total: 1840, notes: 'Computer Generated Invoice', createdBy: 'Admin', createdAt: new Date('2026-08-10'),
  },
  { 
    id: 'INV-001', 
    invoiceNumber: 'INV-001',
    prefix: 'INV-',
    numberOnly: '001',
    company: defaultCompany,
    customer: { name: 'ABC Electronics', location: 'Mumbai Central', email: 'abc@electronics.com', address: '123 Business Park, Mumbai', phone: '+91 98765 43210' },
    issueDate: '2026-06-01', dueDate: '2026-06-15', status: 'paid', 
    items: [
      { product: 'Wireless Mouse', quantity: 50, price: 799, unit: 'PCS', total: 39950 },
      { product: 'Mechanical Keyboard', quantity: 25, price: 2499, unit: 'PCS', total: 62475 },
    ],
    subtotal: 102425, tax: 0, discount: 0, total: 102425, notes: 'Thank you for your business', createdBy: 'Arjun Sharma', createdAt: new Date('2026-06-01'),
  },
  { 
    id: 'INV-002', 
    invoiceNumber: 'INV-002',
    prefix: 'INV-',
    numberOnly: '002',
    company: defaultCompany,
    customer: { name: 'XYZ Retail', location: 'Connaught Place', email: 'contact@xyzretail.com', address: '456 Market Street, Delhi', phone: '+91 98765 43211' },
    issueDate: '2026-06-05', dueDate: '2026-06-20', status: 'pending', 
    items: [
      { product: 'USB-C Cable', quantity: 100, price: 299, unit: 'PCS', total: 29900 },
      { product: 'Power Bank 10000mAh', quantity: 30, price: 1299, unit: 'PCS', total: 38970 },
    ],
    subtotal: 68870, tax: 0, discount: 0, total: 68870, notes: 'Payment due in 15 days', createdBy: 'Arjun Sharma', createdAt: new Date('2026-06-05'),
  },
];

let nextInvNum = 3;

export default function Invoices() {
  const { can } = useAuth();
  const [invoices, setInvoices] = useState(invoicesDB);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewInvoice, setViewInvoice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/invoices', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setInvoices(data.data);
          invoicesDB = data.data;
        }
      }
    } catch (e) {
      console.error('Fetch invoices error:', e);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (inv.invoiceNumber || '').toLowerCase().includes(q) || (inv.customer?.name || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const stats = {
    total: invoices.length,
    totalRevenue: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
    paid: invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
    pending: invoices.filter((inv) => inv.status === 'pending' || inv.status === 'sent').reduce((sum, inv) => sum + (inv.total || 0), 0),
    overdue: invoices.filter((inv) => inv.status === 'overdue').length,
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && e.key !== 'F2' && !(e.altKey && (e.key === 'i' || e.key === 'I' || e.key === 'c' || e.key === 'C' || e.key === 'p' || e.key === 'P'))) return;

      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('invoice-search-input')?.focus();
      } else if (e.key === 'F4' || (e.altKey && (e.key === 'i' || e.key === 'I'))) {
        e.preventDefault();
        setShowCreateModal(true);
      } else if (e.key === 'F5') {
        e.preventDefault();
        fetchInvoices();
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        if (invoices[0]) {
          e.preventDefault();
          printInvoiceDocument(invoices[0]);
        }
      } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleExportCSV();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invoices]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this sales invoice voucher? This cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/invoices/${id}`, {
          method: 'DELETE',
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        fetchInvoices();
      } catch (e) {
        const updated = invoices.filter((inv) => inv._id !== id && inv.id !== id);
        setInvoices(updated);
        invoicesDB = updated;
      }
    }
  };

  const getExportData = () => {
    const headers = ['Voucher No', 'Issue Date', 'Customer Name', 'Status', 'Total Voucher Amount (₹)'];
    const rows = invoices.map(i => [
      i.invoiceNumber || '',
      formatInvoiceDate(i.issueDate),
      i.customer?.name || '',
      (i.status || '').toUpperCase(),
      i.total || 0
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    exportToCSV('Sales_Billing_Vouchers_Register', headers, rows);
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel('Sales_Billing_Vouchers_Register', 'Sales Invoices', headers, rows);
  };

  const handleExportPDF = () => {
    const { headers, rows } = getExportData();
    const grandTotal = invoices.reduce((acc, i) => acc + (i.total || 0), 0);
    exportToPDF(
      'SALES BILLING VOUCHERS REGISTER',
      { name: 'Kedvass Hygiene Products', address: 'Korba Industrial Area' },
      headers,
      rows,
      { label: 'Total Invoices Sales Amount', value: `₹${grandTotal.toLocaleString('en-IN')}` }
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      paid: { color: 'success', icon: 'bi-check-circle', label: 'PAID' },
      pending: { color: 'warning', icon: 'bi-clock', label: 'PENDING' },
      sent: { color: 'info', icon: 'bi-send', label: 'SENT' },
      overdue: { color: 'danger', icon: 'bi-exclamation-triangle', label: 'OVERDUE' },
      draft: { color: 'secondary', icon: 'bi-pencil-square', label: 'DRAFT' },
    };
    const s = map[status] || map.pending;
    return <span className={`badge-v ${s.color}`} style={{ fontSize: '0.7rem' }}><i className={`bi ${s.icon} me-1`}></i> {s.label}</span>;
  };

  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportInvoices = async (parsedData) => {
    const newInvoices = [];
    for (const row of parsedData.rows) {
      if (!row || row.length === 0 || !row[0]) continue;
      const invObj = {
        id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceNumber: row[0] || `KHP/${Math.floor(100 + Math.random() * 900)}`,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 86400000),
        customerName: row[1] || 'Imported Customer',
        customerPhone: '',
        customerEmail: '',
        items: [{ product: row[2] || 'Stock Item', quantity: Number(row[3]) || 1, price: Number(row[4]) || 100, total: (Number(row[3]) || 1) * (Number(row[4]) || 100) }],
        subtotal: (Number(row[3]) || 1) * (Number(row[4]) || 100),
        tax: ((Number(row[3]) || 1) * (Number(row[4]) || 100)) * 0.18,
        total: ((Number(row[3]) || 1) * (Number(row[4]) || 100)) * 1.18,
        status: (row[5] || 'pending').toLowerCase()
      };
      newInvoices.push(invObj);
    }
    setInvoices([...newInvoices, ...invoices]);
    invoicesDB = [...newInvoices, ...invoicesDB];
  };

  return (
    <div className="py-2">
      {/* Clean Modern Page Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold text-dark" style={{ letterSpacing: '-0.3px' }}>Sales Billing & Invoices</h4>
          <p className="text-muted small mb-0">Create sales billing vouchers, track payments & print statutory GST invoices</p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button className="btn-v outline-secondary btn-sm" onClick={handleExportCSV} title="Export CSV">
            <i className="bi bi-filetype-csv me-1"></i> CSV
          </button>
          <button className="btn-v outline-success btn-sm" onClick={handleExportExcel} title="Export Excel">
            <i className="bi bi-file-earmark-excel me-1"></i> Excel
          </button>
          <button className="btn-v outline-danger btn-sm" onClick={handleExportPDF} title="Export PDF">
            <i className="bi bi-file-earmark-pdf me-1"></i> PDF
          </button>
          <button className="btn-v outline-primary btn-sm style-cursor" onClick={() => setShowImportModal(true)} title="Import Invoices Excel/CSV">
            <i className="bi bi-file-earmark-arrow-up me-1"></i> Import
          </button>
          <button className="btn-v primary btn-sm" onClick={() => setShowCreateModal(true)}>
            <i className="bi bi-plus-lg me-1"></i> Create Invoice
          </button>
        </div>
      </div>

      {/* Tally Metric Summary Cards */}
      <div className="row g-2 mb-3">
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL SALES VOUCHERS</div>
            <div className="tally-stat-value">{stats.total}</div>
            <div className="tally-stat-sub text-muted">Active B2B / B2C Invoices</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">GROSS BILLING REVENUE</div>
            <div className="tally-stat-value text-primary">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
            <div className="tally-stat-sub text-muted">Gross Turnover Value</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">REALIZED COLLECTIONS</div>
            <div className="tally-stat-value text-success">₹{stats.paid.toLocaleString('en-IN')}</div>
            <div className="tally-stat-sub text-muted">Paid Receipts Accounted</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">PENDING RECEIVABLES</div>
            <div className="tally-stat-value text-warning">₹{stats.pending.toLocaleString('en-IN')}</div>
            <div className="tally-stat-sub text-muted">Outstanding Customer Dues</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="v-card mb-3">
        <div className="v-card-body p-2">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="search-box-v">
                <i className="bi bi-search"></i>
                <input
                  id="invoice-search-input"
                  type="text"
                  className="form-control"
                  placeholder="Filter vouchers by invoice number, party name, location... [Press F2]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select className="form-select btn-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="col-md-2 text-end">
              <span className="badge-v secondary fw-bold" style={{ fontSize: '0.72rem' }}>
                {filteredInvoices.length} VOUCHERS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Density Tally Table */}
      <div className="v-card">
        <div className="v-card-header d-flex justify-content-between align-items-center">
          <span><i className="bi bi-receipt me-2" style={{ color: 'var(--primary)' }}></i>SALES VOUCHER REGISTER</span>
          <span className="text-muted small">HIGH-DENSITY ERP VIEW</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {filteredInvoices.length === 0 ? (
            <div className="empty-state-v py-4">
              <i className="bi bi-receipt text-muted" style={{ fontSize: '2rem' }}></i>
              <h5 className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.88rem' }}>No Invoices Found</h5>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Click "[F4] New Invoice" to generate a sales billing voucher</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>VOUCHER NO.</th>
                  <th>DATED</th>
                  <th>PARTY / CUSTOMER NAME</th>
                  <th>LOCATION / BRANCH</th>
                  <th>ITEMS QTY</th>
                  <th className="text-end">VOUCHER TOTAL (₹)</th>
                  <th>STATUS</th>
                  <th className="text-end" style={{ width: 120 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((inv, i) => (
                  <tr key={inv.id}>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                      {(currentPage - 1) * pageSize + i + 1}
                    </td>
                    <td>
                      <div className="fw-bold" style={{ color: 'var(--primary)' }}>{inv.invoiceNumber}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>by {inv.createdBy || 'Admin'}</div>
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>{formatInvoiceDate(inv.issueDate)}</td>
                    <td>
                      <div className="fw-bold text-dark">{inv.customer.name}</div>
                    </td>
                    <td><span className="badge-v secondary">{inv.customer.location || 'Default'}</span></td>
                    <td className="fw-semibold">{inv.items ? inv.items.reduce((s, it) => s + it.quantity, 0) : 0} Pcs</td>
                    <td className="text-end fw-bold text-primary">₹{inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>{getStatusBadge(inv.status)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button className="btn-v outline-secondary btn-sm px-2" onClick={() => setViewInvoice(inv)} title="1:1 Bill Preview">
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="btn-v outline-primary btn-sm px-2" onClick={() => printInvoiceDocument(inv)} title="Print A4 Invoice">
                          <i className="bi bi-printer"></i>
                        </button>
                        {can('products.delete') && (
                          <button className="btn-v outline-danger btn-sm px-2" onClick={() => handleDelete(inv.id)} title="Delete Voucher">
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

          {filteredInvoices.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredInvoices.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* 1:1 Invoice Preview Modal */}
      {viewInvoice && <InvoicePreviewModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />}

      {/* Create Sales Voucher Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            fetchInvoices();
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Data Import Modal */}
      <DataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Sales Billing Invoices Master"
        templateHeaders={['Voucher No.', 'Customer Name', 'Product Item', 'Quantity', 'Rate (₹)', 'Status (paid/pending)']}
        sampleRows={[
          ['KHP/201', 'CITY DENTAL CARE NIHARIKA', 'Disinfectant Fragrance Cleaner 5L', 5, 450, 'paid'],
          ['KHP/202', 'Quality Hardware Ltd', 'Glass Cleaner Spray 500ml', 12, 120, 'pending']
        ]}
        onImport={handleImportInvoices}
      />
    </div>
  );
}

function InvoicePreviewModal({ invoice, onClose }) {
  const amountInWords = numberToIndianWords(invoice.total);
  const companyName = invoice.company?.name || defaultCompany.name;
  const companyAddr = invoice.company?.address || defaultCompany.address;
  const companyPhone1 = invoice.company?.phone1 || defaultCompany.phone1;
  const companyPhone2 = invoice.company?.phone2 || defaultCompany.phone2;
  const signatory = invoice.company?.signatory || defaultCompany.signatory;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ width: '95vw', maxWidth: 960, padding: 0 }}>
        <div className="modal-box-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-receipt" style={{ color: 'var(--primary)' }}></i>
            <span>SALES VOUCHER PREVIEW &mdash; {invoice.invoiceNumber}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn-v primary btn-sm" onClick={() => printInvoiceDocument(invoice)}>
              <i className="bi bi-printer me-1"></i> Print Invoice
            </button>
            <button className="close-btn" onClick={onClose}><i className="bi bi-x-lg"></i></button>
          </div>
        </div>
        <div className="modal-box-body p-3 p-md-4 bg-white" style={{ maxHeight: '82vh', overflowY: 'auto', overflowX: 'auto' }}>
          <div className="border p-3 p-md-4 bg-white shadow-sm" style={{ border: '1.5px solid #000', minWidth: '100%' }}>
            <div className="d-flex justify-content-between border-bottom pb-3 mb-3">
              <div>
                <h5 className="fw-bold mb-1">{companyName}</h5>
                <div className="small text-muted">{companyAddr}</div>
                <div className="small text-muted">Mob: {companyPhone1} | {companyPhone2}</div>
              </div>
              <div className="text-end">
                <h5 className="fw-bold text-primary mb-1">INVOICE</h5>
                <div>No: <strong>{invoice.invoiceNumber}</strong></div>
                <div className="small text-muted">Dated: {formatInvoiceDate(invoice.issueDate)}</div>
              </div>
            </div>

            <div className="p-2 bg-light border mb-3">
              <strong>Party Name:</strong> {invoice.customer?.name} ({invoice.customer?.location || 'N/A'})
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="v-table mb-3" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>DESCRIPTION OF GOODS</th>
                    <th className="text-center" style={{ minWidth: 80 }}>QTY</th>
                    <th className="text-end" style={{ minWidth: 100 }}>RATE (₹)</th>
                    <th className="text-end" style={{ minWidth: 110 }}>AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{it.product}</td>
                      <td className="text-center">{it.quantity} {it.unit || 'PCS'}</td>
                      <td className="text-end">₹{(it.price || 0).toLocaleString('en-IN')}</td>
                      <td className="text-end fw-bold">₹{(it.total || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center pt-2 border-top">
              <div>
                <div className="small text-muted">Amount Chargeable (in words):</div>
                <div className="fw-bold">{amountInWords}</div>
              </div>
              <div className="text-end">
                <div className="small text-muted">Total Amount</div>
                <h4 className="fw-bold text-primary mb-0">₹{invoice.total.toLocaleString('en-IN')}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateInvoiceModal({ onClose, onSave }) {
  const [customers, setCustomers] = useState([]);
  const [firms, setFirms] = useState([]);
  const [productList, setProductList] = useState([]);
  const [selectedFirmId, setSelectedFirmId] = useState('');
  const [selectedFirm, setSelectedFirm] = useState(null);

  const [selectedCustId, setSelectedCustId] = useState('');
  const [prefix, setPrefix] = useState('KHP/');
  const [numberOnly, setNumberOnly] = useState('101');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().substring(0, 10));

  const [items, setItems] = useState([
    { product: '', quantity: 1, price: 0, unit: 'PCS', total: 0 }
  ]);

  useEffect(() => {
    // Fetch Products catalog with FG/RM classification
    const token = localStorage.getItem('token');
    fetch('/api/products', {
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProductList(data);
      })
      .catch(() => {});

    // Fetch Customers from MongoDB
    getCustomers().then(r => {
      const data = r.data || r;
      if (Array.isArray(data) && data.length > 0) {
        setCustomers(data);
        setSelectedCustId(data[0]._id || data[0].id);
      }
    }).catch(() => {});

    // Fetch Business Firms from MongoDB
    fetch('/api/company-firms', {
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setFirms(data.data);
          const defaultF = data.data.find(f => f.isDefault) || data.data[0];
          setSelectedFirmId(defaultF._id);
          setSelectedFirm(defaultF);
          setPrefix(defaultF.invoicePrefix || 'KHP/');
          setNumberOnly(String(defaultF.currentInvoiceSequence || 101));
        }
      })
      .catch(() => {});
  }, []);

  const handleFirmSelect = (firmId) => {
    setSelectedFirmId(firmId);
    const f = firms.find(item => item._id === firmId);
    if (f) {
      setSelectedFirm(f);
      setPrefix(f.invoicePrefix || 'INV/');
      setNumberOnly(String(f.currentInvoiceSequence || 101));
    }
  };

  const handleItemChange = (index, field, val) => {
    const newItems = [...items];
    newItems[index][field] = val;

    if (field === 'quantity' || field === 'price') {
      const q = Number(newItems[index].quantity) || 0;
      const p = Number(newItems[index].price) || 0;
      newItems[index].total = q * p;
    }
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { product: '', quantity: 1, price: 0, unit: 'PCS', total: 0 }]);
  };

  const removeItemRow = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((acc, it) => acc + (it.total || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const custObj = customers.find(c => (c._id || c.id) === selectedCustId) || { name: 'Cash Customer' };
    const fullInvNo = `${prefix}${numberOnly}`;

    const firmDetailsSnapshot = selectedFirm ? {
      name: selectedFirm.name,
      isGstRegistered: selectedFirm.isGstRegistered,
      gstin: selectedFirm.gstin,
      address: selectedFirm.address,
      state: selectedFirm.state,
      phone: selectedFirm.phone,
      email: selectedFirm.email,
      bankName: selectedFirm.bankName,
      bankAccountNo: selectedFirm.bankAccountNo,
      ifscCode: selectedFirm.ifscCode,
      branchName: selectedFirm.branchName,
      logoUrl: selectedFirm.logoUrl,
    } : null;

    const newInv = {
      invoiceNumber: fullInvNo,
      prefix,
      numberOnly,
      firm: selectedFirmId,
      firmDetails: firmDetailsSnapshot,
      invoiceType: selectedFirm?.isGstRegistered === false ? 'bill_of_supply' : 'tax_invoice',
      customer: custObj,
      issueDate,
      dueDate: issueDate,
      status: 'paid',
      items,
      subtotal,
      tax: 0,
      discount: 0,
      total: subtotal,
      notes: selectedFirm?.isGstRegistered === false ? 'Bill of Supply - Non-GST Retail Sale' : 'Tax Invoice - Computer Generated',
    };

    // Save via API to MongoDB
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(newInv)
      });
    } catch (e) {}

    onSave(newInv);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 780, borderRadius: 0 }}>
        <div className="modal-box-header d-flex align-items-center justify-content-between px-3.5 py-2.5" style={{ background: '#1E4D2B', color: '#ffffff', borderRadius: 0 }}>
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-receipt-cutoff text-warning"></i>
            <span className="fw-bold">CREATE NEW SALES BILLING VOUCHER</span>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-box-body p-3.5 bg-white" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
            
            {/* SLEEK PROFESSIONAL MULTI-FIRM BAR */}
            <div className="row g-2 mb-3 align-items-center bg-light p-2.5 rounded border m-0">
              <div className="col-md-8">
                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-building me-1 text-success"></i> Billing Company Firm Master
                </label>
                <select
                  className="form-select form-select-sm fw-bold text-dark style-cursor"
                  value={selectedFirmId}
                  onChange={(e) => handleFirmSelect(e.target.value)}
                >
                  {firms.map(f => (
                    <option key={f._id} value={f._id}>
                      {f.name} {f.isGstRegistered ? `[GST: ${f.gstin || 'Registered'}]` : '[NON-GST / EXEMPT]'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 text-md-end pt-md-3">
                {selectedFirm?.isGstRegistered !== false ? (
                  <span className="badge bg-success font-monospace px-2.5 py-1.5" style={{ fontSize: '0.7rem' }}>
                    <i className="bi bi-patch-check me-1"></i> TAX INVOICE (GST)
                  </span>
                ) : (
                  <span className="badge bg-secondary font-monospace px-2.5 py-1.5" style={{ fontSize: '0.7rem' }}>
                    <i className="bi bi-info-circle me-1"></i> BILL OF SUPPLY (NON-GST)
                  </span>
                )}
              </div>
            </div>

            <div className="form-section-title mb-2 fw-bold text-dark" style={{ fontSize: '0.82rem' }}>
              <i className="bi bi-hash me-1"></i> Voucher Numbering & Party Details
            </div>
            <div className="row g-2 mb-3">
              <div className="col-md-3">
                <label className="form-label fw-bold text-dark" style={{ fontSize: '0.78rem' }}>Prefix *</label>
                <input className="form-control font-monospace fw-bold" value={prefix} onChange={(e) => setPrefix(e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold text-dark" style={{ fontSize: '0.78rem' }}>Voucher No *</label>
                <input className="form-control font-monospace fw-bold text-success" value={numberOnly} onChange={(e) => setNumberOnly(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold text-dark" style={{ fontSize: '0.78rem' }}>Issue Date *</label>
                <input type="date" className="form-control fw-bold" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
              </div>
              <div className="col-12">
                <label className="form-label fw-bold text-dark" style={{ fontSize: '0.78rem' }}>Party / Customer Master *</label>
                <select className="form-select fw-bold text-dark" value={selectedCustId} onChange={(e) => setSelectedCustId(e.target.value)}>
                  {customers.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name} {c.location ? `(${c.location})` : ''} {c.phone ? `— ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-divider mb-3"></div>

            <div className="form-section-title mb-2 d-flex justify-content-between align-items-center">
              <span className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}><i className="bi bi-box-seam me-1"></i> Item Voucher Entry Table</span>
              <button type="button" className="btn btn-outline-primary btn-sm py-0 fw-bold" style={{ fontSize: '0.75rem' }} onClick={addItemRow}>
                <i className="bi bi-plus-lg me-1"></i> Add Line Item
              </button>
            </div>

            <div className="table-responsive mb-3">
              <table className="v-table">
                <thead>
                  <tr>
                    <th>PRODUCT DESCRIPTION</th>
                    <th style={{ width: 90 }}>QTY</th>
                    <th style={{ width: 110 }}>UNIT</th>
                    <th style={{ width: 110 }}>RATE (₹)</th>
                    <th style={{ width: 120 }}>AMOUNT (₹)</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <input 
                          list={`product-options-${idx}`}
                          className="form-control form-control-sm fw-semibold" 
                          placeholder="Type or select product..." 
                          value={it.product} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const found = productList.find(p => p.name === val);
                            if (found) {
                              const newItems = [...items];
                              newItems[idx].product = found.name;
                              newItems[idx].price = found.price || 0;
                              newItems[idx].unit = found.unit || 'PCS';
                              newItems[idx].total = (newItems[idx].quantity || 1) * (found.price || 0);
                              setItems(newItems);
                            } else {
                              handleItemChange(idx, 'product', val);
                            }
                          }} 
                          required 
                        />
                        <datalist id={`product-options-${idx}`}>
                          {productList.map((p) => (
                            <option key={p._id || p.sku} value={p.name}>
                              {p.name} [{p.itemType === 'raw_material' ? 'RM - Raw Material' : 'FG - Finished Goods'}] - ₹{p.price}
                            </option>
                          ))}
                        </datalist>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="form-control form-control-sm text-center fw-bold" 
                          value={it.quantity} 
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} 
                          required 
                        />
                      </td>
                      <td>
                        <select 
                          className="form-select form-select-sm fw-bold" 
                          value={it.unit} 
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        >
                          <option value="PCS">PCS</option>
                          <option value="JAR">JAR</option>
                          <option value="BOX">BOX</option>
                          <option value="KG">KG</option>
                          <option value="LTR">LTR</option>
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="form-control form-control-sm text-end fw-bold" 
                          value={it.price} 
                          onChange={(e) => handleItemChange(idx, 'price', e.target.value)} 
                          required 
                        />
                      </td>
                      <td className="fw-bold text-end">₹{(it.total || 0).toLocaleString('en-IN')}</td>
                      <td>
                        {items.length > 1 && (
                          <button type="button" className="btn btn-outline-danger btn-sm p-1" onClick={() => removeItemRow(idx)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-light rounded-2 border d-flex justify-content-between align-items-center">
              <span className="fw-bold text-dark">Total Voucher Amount:</span>
              <span className="fs-5 fw-bold text-success">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="modal-box-footer d-flex justify-content-end gap-2 p-3 bg-light" style={{ borderRadius: 0 }}>
            <button type="button" className="btn btn-outline-secondary btn-sm fw-semibold" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success btn-sm fw-bold px-4" style={{ background: '#1E4D2B', border: 'none' }}>
              <i className="bi bi-check-circle me-1"></i> Save Sales Voucher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
