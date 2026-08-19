import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { exportTallyLedgers } from '../services/api';
import LedgerStatementModal from '../components/LedgerStatementModal';
import { sendSupplierPayableWhatsApp } from '../utils/whatsappHelper';

/* Mock Suppliers Database with Tally Sundry Creditors attributes */
let suppliersDB = [
  { 
    id: 'SUP-001', 
    name: 'Tech Distributors India', 
    contact: 'Rajesh Kumar', 
    email: 'rajesh@techdist.com', 
    phone: '+91 98765 43210',
    address: '123 Electronics Hub, Nehru Place, Delhi',
    state: 'Delhi',
    pincode: '110019',
    group: 'Sundry Creditors',
    category: 'Electronics',
    gst: '07AAAAA1234A1Z5',
    pan: 'AAAAA1234A',
    maintainBillByBill: true,
    defaultCreditPeriod: 30,
    tdsApplicable: true,
    tdsSection: '194Q',
    bankDetails: { accountNo: '112233445566', ifsc: 'SBIN0000123', bankName: 'SBI' },
    openingBalance: 45000,
    openingBalanceType: 'Cr',
    rating: 4.5,
    totalOrders: 145,
    totalAmount: 2450000,
    status: 'active',
    joinDate: new Date('2023-01-15'),
    products: ['Laptops', 'Mobiles', 'Accessories']
  },
  { 
    id: 'SUP-002', 
    name: 'Global Supplies Co', 
    contact: 'Priya Mehta', 
    email: 'priya@globalsupply.com', 
    phone: '+91 98765 43211',
    address: '456 Trade Center, Andheri, Mumbai',
    state: 'Maharashtra',
    pincode: '400069',
    group: 'Sundry Creditors',
    category: 'Office Supplies',
    gst: '27BBBBB5678B2Z6',
    pan: 'BBBBB5678B',
    maintainBillByBill: true,
    defaultCreditPeriod: 45,
    tdsApplicable: false,
    tdsSection: '194C',
    bankDetails: { accountNo: '998877665544', ifsc: 'HDFC0000456', bankName: 'HDFC Bank' },
    openingBalance: 12000,
    openingBalanceType: 'Cr',
    rating: 4.8,
    totalOrders: 230,
    totalAmount: 1850000,
    status: 'active',
    joinDate: new Date('2022-08-20'),
    products: ['Stationery', 'Furniture', 'Printers']
  },
  { 
    id: 'SUP-003', 
    name: 'Quality Hardware Ltd', 
    contact: 'Amit Singh', 
    email: 'amit@qualityhw.com', 
    phone: '+91 98765 43212',
    address: '789 Industrial Area, Whitefield, Bangalore',
    state: 'Karnataka',
    pincode: '560066',
    group: 'Sundry Creditors',
    category: 'Hardware',
    gst: '29CCCCC9101C3Z7',
    pan: 'CCCCC9101C',
    maintainBillByBill: true,
    defaultCreditPeriod: 30,
    tdsApplicable: true,
    tdsSection: '194Q',
    bankDetails: { accountNo: '554433221100', ifsc: 'ICIC0000789', bankName: 'ICICI Bank' },
    openingBalance: 35000,
    openingBalanceType: 'Cr',
    rating: 4.2,
    totalOrders: 98,
    totalAmount: 3200000,
    status: 'active',
    joinDate: new Date('2023-03-10'),
    products: ['Networking', 'Storage', 'Servers']
  }
];

let nextSupplierNum = 4;

const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function Suppliers() {
  const { can } = useAuth();
  const [suppliers, setSuppliers] = useState(suppliersDB);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewSupplier, setViewSupplier] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);
  const [selectedLedgerParty, setSelectedLedgerParty] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter logic
  const filteredSuppliers = suppliers.filter((sup) => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      sup.name.toLowerCase().includes(q) || 
      sup.contact.toLowerCase().includes(q) ||
      sup.email.toLowerCase().includes(q) ||
      sup.category.toLowerCase().includes(q) ||
      (sup.gst && sup.gst.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || sup.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || sup.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  // Stats
  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === 'active').length,
    totalOrders: suppliers.reduce((sum, s) => sum + s.totalOrders, 0),
    totalPayables: suppliers.reduce((sum, s) => sum + (Number(s.openingBalance) || 0), 0),
  };

  const categories = ['All', 'Electronics', 'Office Supplies', 'Hardware', 'General'];

  const getStatusBadge = (status) => {
    const map = {
      active: { color: 'success', icon: 'bi-check-circle', label: 'Active' },
      inactive: { color: 'secondary', icon: 'bi-dash-circle', label: 'Inactive' },
    };
    const s = map[status] || map.active;
    return <span className={`badge-v ${s.color}`}><i className={`bi ${s.icon}`}></i> {s.label}</span>;
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this supplier? This action cannot be undone.')) {
      setSuppliers(suppliers.filter((s) => s.id !== id));
      suppliersDB = suppliers.filter((s) => s.id !== id);
    }
  };

  const handleCreate = (newSupplier) => {
    const supplier = {
      ...newSupplier,
      id: `SUP-${String(nextSupplierNum++).padStart(3, '0')}`,
      group: 'Sundry Creditors',
      totalOrders: 0,
      totalAmount: 0,
      joinDate: new Date(),
    };
    setSuppliers([supplier, ...suppliers]);
    suppliersDB = [supplier, ...suppliers];
  };

  const handleUpdate = (updatedSupplier) => {
    setSuppliers(suppliers.map((s) => s.id === updatedSupplier.id ? updatedSupplier : s));
    suppliersDB = suppliers.map((s) => s.id === updatedSupplier.id ? updatedSupplier : s);
  };

  if (!can('suppliers.view')) {
    return (
      <div className="empty-state-v" style={{ paddingTop: 80 }}>
        <i className="bi bi-shield-x" style={{ color: 'var(--danger)' }}></i>
        <h5>Access Denied</h5>
        <p>You don't have permission to view suppliers.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title d-flex align-items-center gap-2">
              <i className="bi bi-truck" style={{ color: 'var(--primary)' }}></i>
              Suppliers Master (Sundry Creditors)
            </h1>
            <p className="page-subtitle">Manage vendor ledgers, TDS applicability, credit days, and Tally Prime sync</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn-v outline-success" onClick={exportTallyLedgers} title="Export Tally XML">
              <i className="bi bi-file-earmark-code-fill"></i>
              <span>Export Tally XML</span>
            </button>
            {can('suppliers.add') && (
              <button className="btn-v primary" onClick={() => setShowCreateModal(true)}>
                <i className="bi bi-plus-lg"></i>
                <span>Add Supplier</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon primary">
              <i className="bi bi-truck"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Total Vendors</div>
              <div className="stat-card-value">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon success">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Active Creditors</div>
              <div className="stat-card-value">{stats.active}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon warning">
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Total Orders</div>
              <div className="stat-card-value">{stats.totalOrders}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon info">
              <i className="bi bi-currency-rupee"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Opening Payables</div>
              <div className="stat-card-value">₹{(stats.totalPayables).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="v-card mb-4">
        <div className="v-card-body" style={{ padding: '16px 24px' }}>
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <div className="search-box-v">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search suppliers, GSTIN, contacts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>Category</label>
              <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn-v light w-100" onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); }} style={{ justifyContent: 'center' }}>
                <i className="bi bi-x-lg"></i> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="v-card">
        <div className="v-card-header">
          <i className="bi bi-journal-bookmark"></i>
          Sundry Creditors List
          <span className="badge-v secondary ms-auto">{filteredSuppliers.length}</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {filteredSuppliers.length === 0 ? (
            <div className="empty-state-v">
              <i className="bi bi-inbox"></i>
              <h5>No Suppliers Found</h5>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Contact Person</th>
                  <th>State & GSTIN</th>
                  <th>Credit Period</th>
                  <th>TDS & Bank Info</th>
                  <th>Opening Bal.</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.id}>
                    <td>
                      <div className="fw-bold" style={{ color: 'var(--primary)' }}>{sup.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {sup.id} • {sup.email}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold">{sup.contact}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {sup.phone}
                      </div>
                    </td>
                    <td>
                      <span className="badge-v light me-1" style={{ fontSize: '0.75rem' }}>
                        {sup.state || 'Delhi'}
                      </span>
                      {sup.gst ? (
                        <span className="badge-v success" style={{ fontSize: '0.72rem' }}>{sup.gst}</span>
                      ) : (
                        <span className="badge-v secondary" style={{ fontSize: '0.72rem' }}>Unregistered</span>
                      )}
                    </td>
                    <td>
                      <span className="fw-bold text-info">{sup.defaultCreditPeriod || 30} Days</span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bill-by-Bill: Yes</div>
                    </td>
                    <td>
                      {sup.tdsApplicable ? (
                        <span className="badge-v warning d-inline-block mb-1" style={{ fontSize: '0.7rem' }}>
                          TDS {sup.tdsSection || '194Q'}
                        </span>
                      ) : (
                        <span className="badge-v secondary d-inline-block mb-1" style={{ fontSize: '0.7rem' }}>No TDS</span>
                      )}
                      {sup.bankDetails?.accountNo && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <i className="bi bi-bank me-1"></i>{sup.bankDetails.bankName}: {sup.bankDetails.accountNo}
                        </div>
                      )}
                    </td>
                    <td className="fw-bold">
                      ₹{(Number(sup.openingBalance) || 0).toLocaleString('en-IN')} <small className="text-muted">({sup.openingBalanceType || 'Cr'})</small>
                    </td>
                    <td>{getStatusBadge(sup.status)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn-v outline-primary" onClick={() => setSelectedLedgerParty(sup)} title="View Account Ledger">
                          <i className="bi bi-journal-bookmark-fill me-1"></i> Ledger
                        </button>
                        <button className="btn-v outline-primary icon-only" onClick={() => setViewSupplier(sup)} title="View">
                          <i className="bi bi-eye"></i>
                        </button>
                        {can('suppliers.edit') && (
                          <button className="btn-v outline-primary icon-only" onClick={() => setEditSupplier(sup)} title="Edit">
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {can('suppliers.delete') && (
                          <button className="btn-v outline-danger icon-only" onClick={() => handleDelete(sup.id)} title="Delete">
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

      {/* View Supplier Modal */}
      {viewSupplier && <ViewSupplierModal supplier={viewSupplier} onClose={() => setViewSupplier(null)} />}

      {/* Ledger Statement Modal */}
      {selectedLedgerParty && (
        <LedgerStatementModal
          party={selectedLedgerParty}
          partyType="Creditor"
          onClose={() => setSelectedLedgerParty(null)}
        />
      )}

      {/* Create/Edit Supplier Modal */}
      {showCreateModal && <SupplierFormModal onClose={() => setShowCreateModal(false)} onSave={handleCreate} />}
      {editSupplier && <SupplierFormModal supplier={editSupplier} onClose={() => setEditSupplier(null)} onSave={handleUpdate} />}
    </div>
  );
}

/* VIEW SUPPLIER MODAL */
function ViewSupplierModal({ supplier, onClose }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 700 }}>
        <div className="modal-box-header">
          <i className="bi bi-truck" style={{ color: 'var(--primary)' }}></i>
          Supplier Details (Sundry Creditor)
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-box-body">
          <div className="v-card mb-3" style={{ background: 'rgba(115,103,240,0.04)', border: '1px solid rgba(115,103,240,0.2)' }}>
            <div className="v-card-body p-3">
              <h5 className="mb-1" style={{ color: 'var(--primary)' }}>{supplier.name}</h5>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tally Group: Sundry Creditors • {supplier.state || 'Delhi'}
              </div>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Contact Person</label>
              <div className="info-box">{supplier.contact} ({supplier.phone})</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">GSTIN / PAN</label>
              <div className="info-box">{supplier.gst || 'Unregistered'} / {supplier.pan || '-'}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Credit Period</label>
              <div className="info-box">{supplier.defaultCreditPeriod || 30} Days (Bill-by-Bill: Yes)</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">TDS Applicability</label>
              <div className="info-box">{supplier.tdsApplicable ? `Yes (${supplier.tdsSection || '194Q'})` : 'No'}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Opening Balance</label>
              <div className="info-box">₹{supplier.openingBalance || 0} ({supplier.openingBalanceType || 'Cr'})</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Bank Account</label>
              <div className="info-box">{supplier.bankDetails?.bankName} - {supplier.bankDetails?.accountNo} ({supplier.bankDetails?.ifsc})</div>
            </div>
          </div>
        </div>
        <div className="modal-box-footer">
          <button className="btn-v light" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* SUPPLIER FORM MODAL (Create/Edit) */
function SupplierFormModal({ supplier, onClose, onSave }) {
  const [form, setForm] = useState(supplier || {
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    state: 'Delhi',
    pincode: '',
    group: 'Sundry Creditors',
    category: 'Electronics',
    gst: '',
    pan: '',
    maintainBillByBill: true,
    defaultCreditPeriod: 30,
    tdsApplicable: false,
    tdsSection: '194Q',
    bankDetails: { accountNo: '', ifsc: '', bankName: '' },
    openingBalance: 0,
    openingBalanceType: 'Cr',
    status: 'active',
    products: [],
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.phone) {
      setError('Please fill required fields (Name, Contact Person, Phone)');
      return;
    }
    onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 750 }}>
        <div className="modal-box-header">
          <i className="bi bi-truck" style={{ color: 'var(--primary)' }}></i>
          {supplier ? 'Edit Supplier (Sundry Creditor)' : 'Add New Supplier (Sundry Creditor)'}
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-box-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
            {error && <div className="alert-v danger mb-3">{error}</div>}

            <div className="form-section-title mb-2"><i className="bi bi-building"></i> Basic & Tally Info</div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Supplier Name *</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Tally Group</label>
                <input className="form-control bg-light" value="Sundry Creditors" disabled />
              </div>
              <div className="col-md-6">
                <label className="form-label">Contact Person *</label>
                <input className="form-control" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone *</label>
                <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label">State *</label>
                <select className="form-select" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                  {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>

            <div className="form-divider"></div>

            <div className="form-section-title mb-2"><i className="bi bi-receipt"></i> Tax, TDS & Credit Settings</div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">GSTIN / UIN</label>
                <input className="form-control text-uppercase" placeholder="e.g. 07AAAAA1234A1Z5" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value.toUpperCase() })} />
              </div>
              <div className="col-md-6">
                <label className="form-label">PAN Number</label>
                <input className="form-control text-uppercase" placeholder="e.g. AAAAA1234A" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Credit Period (Days)</label>
                <input type="number" className="form-control" value={form.defaultCreditPeriod} onChange={(e) => setForm({ ...form, defaultCreditPeriod: Number(e.target.value) })} />
              </div>
              <div className="col-md-6">
                <label className="form-label">TDS Section</label>
                <select className="form-select" value={form.tdsSection} onChange={(e) => setForm({ ...form, tdsSection: e.target.value, tdsApplicable: true })}>
                  <option value="194Q">Sec 194Q (Purchase of Goods)</option>
                  <option value="194C">Sec 194C (Contractor)</option>
                  <option value="194J">Sec 194J (Professional Fee)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Opening Balance (₹)</label>
                <input type="number" className="form-control" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Balance Type</label>
                <select className="form-select" value={form.openingBalanceType} onChange={(e) => setForm({ ...form, openingBalanceType: e.target.value })}>
                  <option value="Cr">Credit (Cr - Payable)</option>
                  <option value="Dr">Debit (Dr - Advance Given)</option>
                </select>
              </div>
            </div>

            <div className="form-divider"></div>

            <div className="form-section-title mb-2"><i className="bi bi-bank"></i> Bank Details for e-Payments</div>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Bank Name</label>
                <input className="form-control" placeholder="SBI / HDFC" value={form.bankDetails?.bankName} onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Account No</label>
                <input className="form-control" placeholder="Account Number" value={form.bankDetails?.accountNo} onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, accountNo: e.target.value } })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">IFSC Code</label>
                <input className="form-control text-uppercase" placeholder="SBIN0000123" value={form.bankDetails?.ifsc} onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, ifsc: e.target.value.toUpperCase() } })} />
              </div>
            </div>
          </div>

          <div className="modal-box-footer">
            <button className="btn-v light" type="button" onClick={onClose}>Cancel</button>
            <button className="btn-v primary" type="submit">
              <i className="bi bi-check-circle"></i> {supplier ? 'Update' : 'Save'} Supplier Master
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
