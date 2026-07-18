import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* Customers Database */
const customersDB = [];

/* Invoices Database */
let invoicesDB = [];

let nextInvoiceNum = 1;

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
      inv.customer.email.toLowerCase().includes(q);
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
      setInvoices(invoices.filter((i) => i.id !== id));
      invoicesDB = invoices.filter((i) => i.id !== id);
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
              Invoices
            </h1>
            <p className="page-subtitle">Manage customer invoices and billing</p>
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
                  placeholder="Search by invoice number, customer…"
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
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
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
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {inv.customer.email}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(inv.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="fw-bold">₹{inv.total.toLocaleString('en-IN')}</td>
                    <td>{getStatusBadge(inv.status)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn-v outline-primary icon-only" onClick={() => setViewInvoice(inv)} title="View">
                          <i className="bi bi-eye"></i>
                        </button>
                        {can('products.edit') && (
                          <button className="btn-v outline-primary icon-only" title="Edit">
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        <button className="btn-v outline-primary icon-only" title="Print">
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

      {/* View Invoice Modal */}
      {viewInvoice && <InvoicePreviewModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />}

      {/* Create Invoice Modal */}
      {showCreateModal && <CreateInvoiceModal onClose={() => setShowCreateModal(false)} onCreate={(newInv) => { setInvoices([newInv, ...invoices]); invoicesDB = [newInv, ...invoices]; }} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INVOICE PREVIEW MODAL
═══════════════════════════════════════════════════════════ */
function InvoicePreviewModal({ invoice, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('PDF download functionality - integrate with jsPDF or html2pdf library');
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box invoice-modal">
        <div className="modal-box-header">
          <i className="bi bi-receipt" style={{ color: 'var(--primary)' }}></i>
          Invoice Preview
          <div className="ms-auto d-flex gap-2">
            <button className="btn-v light icon-only" onClick={handlePrint} title="Print">
              <i className="bi bi-printer"></i>
            </button>
            <button className="btn-v light icon-only" onClick={handleDownloadPDF} title="Download PDF">
              <i className="bi bi-download"></i>
            </button>
            <button className="close-btn" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <div className="modal-box-body invoice-preview">
          {/* Invoice Header */}
          <div className="invoice-header">
            <div>
              <div className="invoice-logo">EHN One</div>
              <div className="invoice-company">Inventory Management System</div>
            </div>
            <div className="text-end">
              <div className="invoice-number">{invoice.invoiceNumber}</div>
              <div className="invoice-date">
                <strong>Issue Date:</strong> {new Date(invoice.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className="invoice-date">
                <strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="invoice-divider"></div>

          {/* Bill To / From */}
          <div className="row invoice-addresses">
            <div className="col-md-6">
              <div className="invoice-section-title">Invoice From</div>
              <div className="invoice-address-box">
                <div className="fw-bold">EHN One Pvt Ltd</div>
                <div>123 Business Center</div>
                <div>Mumbai, Maharashtra 400001</div>
                <div>GSTIN: 27XXXXX1234X1Z5</div>
                <div>Phone: +91 22 1234 5678</div>
                <div>Email: billing@ehnsystem.com</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="invoice-section-title">Invoice To</div>
              <div className="invoice-address-box">
                <div className="fw-bold">{invoice.customer.name}</div>
                <div>{invoice.customer.address}</div>
                <div>Phone: {invoice.customer.phone}</div>
                <div>Email: {invoice.customer.email}</div>
              </div>
            </div>
          </div>

          <div className="invoice-divider"></div>

          {/* Items Table */}
          <div className="invoice-items">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-end">Price</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td className="fw-semibold">{item.product}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-end">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="text-end fw-bold">₹{item.total.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="invoice-totals">
            <div className="invoice-total-row">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="invoice-total-row">
                <span>Discount:</span>
                <span className="text-danger">- ₹{invoice.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="invoice-total-row">
              <span>Tax (18% GST):</span>
              <span>₹{invoice.tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="invoice-divider"></div>
            <div className="invoice-total-row invoice-total-final">
              <span>Total Amount:</span>
              <span>₹{invoice.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <>
              <div className="invoice-divider"></div>
              <div className="invoice-notes">
                <div className="invoice-section-title">Notes</div>
                <p>{invoice.notes}</p>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="invoice-footer">
            <p>Thank you for your business!</p>
            <p className="text-muted">This is a computer-generated invoice and does not require a signature.</p>
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
   CREATE INVOICE MODAL
═══════════════════════════════════════════════════════════ */
function CreateInvoiceModal({ onClose, onCreate }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    customerId: '',
    customer: { name: '', email: '', address: '', phone: '' },
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ product: '', quantity: 1, price: 0 }],
    notes: '',
    discount: 0,
  });
  const [error, setError] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Handle customer selection from dropdown
  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    if (customerId === 'new') {
      setIsNewCustomer(true);
      setForm({ 
        ...form, 
        customerId: 'new',
        customer: { name: '', email: '', address: '', phone: '' } 
      });
    } else if (customerId) {
      const selectedCustomer = customersDB.find((c) => c.id === customerId);
      if (selectedCustomer) {
        setIsNewCustomer(false);
        setForm({ 
          ...form, 
          customerId,
          customer: { 
            name: selectedCustomer.name, 
            email: selectedCustomer.email, 
            address: selectedCustomer.address, 
            phone: selectedCustomer.phone 
          } 
        });
      }
    } else {
      setIsNewCustomer(false);
      setForm({ 
        ...form, 
        customerId: '',
        customer: { name: '', email: '', address: '', phone: '' } 
      });
    }
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { product: '', quantity: 1, price: 0 }] });
  };

  const removeItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx][field] = field === 'product' ? value : Number(value) || 0;
    items[idx].total = items[idx].quantity * items[idx].price;
    setForm({ ...form, items });
  };

  const calculateTotals = () => {
    const subtotal = form.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const discount = Number(form.discount) || 0;
    const taxableAmount = subtotal - discount;
    const tax = Math.round(taxableAmount * 0.18); // 18% GST
    const total = taxableAmount + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.customerId) {
      setError('Please select a customer');
      return;
    }
    if ((isNewCustomer || form.customerId === 'new') && (!form.customer.name || !form.customer.email)) {
      setError('Customer name and email are required for new customer');
      return;
    }
    if (form.items.some((i) => !i.product || i.quantity <= 0 || i.price <= 0)) {
      setError('All items must have product name, quantity and price');
      return;
    }
    if (!form.dueDate) {
      setError('Due date is required');
      return;
    }

    const { subtotal, tax, total } = calculateTotals();
    const newInvoice = {
      id: `INV-${String(nextInvoiceNum++).padStart(3, '0')}`,
      invoiceNumber: `INV-${String(nextInvoiceNum - 1).padStart(3, '0')}`,
      customer: form.customer,
      issueDate: new Date(form.issueDate),
      dueDate: new Date(form.dueDate),
      status: 'draft',
      items: form.items.map((i) => ({ ...i, total: i.quantity * i.price })),
      subtotal,
      tax,
      discount: Number(form.discount) || 0,
      total,
      notes: form.notes,
      createdBy: user?.name || 'Admin',
      createdAt: new Date(),
    };

    onCreate(newInvoice);
    onClose();
  };

  const totals = calculateTotals();

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 900 }}>
        <div className="modal-box-header">
          <i className="bi bi-plus-circle" style={{ color: 'var(--primary)' }}></i>
          Create New Invoice
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

            {/* Customer Info */}
            <div className="invoice-form-section">
              <div className="invoice-form-section-title">
                <i className="bi bi-person"></i> Customer Information
              </div>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Select Customer *</label>
                  <select 
                    className="form-select" 
                    value={form.customerId} 
                    onChange={handleCustomerSelect}
                    required
                  >
                    <option value="">-- Select Existing Customer --</option>
                    {customersDB.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.email})
                      </option>
                    ))}
                    <option value="new">+ Add New Customer</option>
                  </select>
                </div>

                {(isNewCustomer || form.customerId === 'new') && (
                  <>
                    <div className="col-12">
                      <div className="alert-v info" style={{ fontSize: '0.85rem', padding: '10px 16px' }}>
                        <i className="bi bi-info-circle"></i> Enter new customer details below
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Customer Name *</label>
                      <input
                        className="form-control"
                        placeholder="e.g. ABC Electronics"
                        value={form.customer.name}
                        onChange={(e) => setForm({ ...form, customer: { ...form.customer, name: e.target.value } })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email *</label>
                      <input
                        className="form-control"
                        type="email"
                        placeholder="customer@example.com"
                        value={form.customer.email}
                        onChange={(e) => setForm({ ...form, customer: { ...form.customer, email: e.target.value } })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input
                        className="form-control"
                        placeholder="+91 98765 43210"
                        value={form.customer.phone}
                        onChange={(e) => setForm({ ...form, customer: { ...form.customer, phone: e.target.value } })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Address</label>
                      <input
                        className="form-control"
                        placeholder="Customer address"
                        value={form.customer.address}
                        onChange={(e) => setForm({ ...form, customer: { ...form.customer, address: e.target.value } })}
                      />
                    </div>
                  </>
                )}

                {form.customerId && form.customerId !== 'new' && (
                  <div className="col-12">
                    <div className="v-card" style={{ background: 'rgba(115,103,240,0.04)', border: '1px solid rgba(115,103,240,0.2)' }}>
                      <div className="v-card-body" style={{ padding: '16px' }}>
                        <div className="row g-2">
                          <div className="col-md-6">
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              <i className="bi bi-person-circle"></i> Customer Name
                            </div>
                            <div className="fw-semibold">{form.customer.name}</div>
                          </div>
                          <div className="col-md-6">
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              <i className="bi bi-envelope"></i> Email
                            </div>
                            <div className="fw-semibold">{form.customer.email}</div>
                          </div>
                          <div className="col-md-6">
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              <i className="bi bi-telephone"></i> Phone
                            </div>
                            <div className="fw-semibold">{form.customer.phone || 'N/A'}</div>
                          </div>
                          <div className="col-md-6">
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              <i className="bi bi-geo-alt"></i> Address
                            </div>
                            <div className="fw-semibold">{form.customer.address || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Dates */}
            <div className="invoice-form-section">
              <div className="invoice-form-section-title">
                <i className="bi bi-calendar"></i> Invoice Dates
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Issue Date *</label>
                  <input
                    className="form-control"
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Due Date *</label>
                  <input
                    className="form-control"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Items */}
            <div className="invoice-form-section">
              <div className="invoice-form-section-title">
                <i className="bi bi-box"></i> Invoice Items
                <button type="button" className="btn-v light ms-auto" onClick={addItem} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  <i className="bi bi-plus"></i> Add Item
                </button>
              </div>
              <div className="invoice-items-form">
                {form.items.map((item, idx) => (
                  <div key={idx} className="invoice-item-row">
                    <div className="invoice-item-num">{idx + 1}</div>
                    <div className="row g-2 flex-grow-1">
                      <div className="col-md-4">
                        <input
                          className="form-control"
                          placeholder="Product name"
                          value={item.product}
                          onChange={(e) => updateItem(idx, 'product', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <input
                          className="form-control"
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-3">
                        <input
                          className="form-control"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) => updateItem(idx, 'price', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-3 d-flex align-items-center">
                        <div className="fw-bold">₹{(item.quantity * item.price).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                    {form.items.length > 1 && (
                      <button type="button" className="btn-v outline-danger icon-only" onClick={() => removeItem(idx)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Totals Preview */}
            <div className="invoice-form-totals">
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label">Discount (₹)</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <div className="invoice-total-preview">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Subtotal:</span>
                      <span>₹{totals.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {form.discount > 0 && (
                      <div className="d-flex justify-content-between mb-1 text-danger">
                        <span>Discount:</span>
                        <span>- ₹{Number(form.discount).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between mb-1">
                      <span>Tax (18%):</span>
                      <span>₹{totals.tax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="form-divider" style={{ margin: '8px 0' }}></div>
                    <div className="d-flex justify-content-between fw-bold" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                      <span>Total:</span>
                      <span>₹{totals.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Notes */}
            <div>
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Additional notes or terms…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              ></textarea>
            </div>
          </div>
          <div className="modal-box-footer">
            <button className="btn-v light" type="button" onClick={onClose}>Cancel</button>
            <button className="btn-v primary" type="submit">
              <i className="bi bi-check-circle"></i> Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
