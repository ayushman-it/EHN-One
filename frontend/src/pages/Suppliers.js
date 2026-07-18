import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* Mock Suppliers Database */
let suppliersDB = [
  { 
    id: 'SUP-001', 
    name: 'Tech Distributors India', 
    contact: 'Rajesh Kumar', 
    email: 'rajesh@techdist.com', 
    phone: '+91 98765 43210',
    address: '123 Electronics Hub, Nehru Place, Delhi',
    category: 'Electronics',
    gst: '07AAAAA1234A1Z5',
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
    category: 'Office Supplies',
    gst: '27BBBBB5678B2Z6',
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
    category: 'Hardware',
    gst: '29CCCCC9101C3Z7',
    rating: 4.2,
    totalOrders: 98,
    totalAmount: 3200000,
    status: 'active',
    joinDate: new Date('2023-03-10'),
    products: ['Networking', 'Storage', 'Servers']
  },
  { 
    id: 'SUP-004', 
    name: 'Smart Components Pvt Ltd', 
    contact: 'Sneha Patel', 
    email: 'sneha@smartcomp.com', 
    phone: '+91 98765 43213',
    address: '321 Tech Park, Hinjewadi, Pune',
    category: 'Electronics',
    gst: '27DDDDD2345D4Z8',
    rating: 3.9,
    totalOrders: 67,
    totalAmount: 890000,
    status: 'inactive',
    joinDate: new Date('2023-06-05'),
    products: ['Components', 'Cables', 'Tools']
  },
  { 
    id: 'SUP-005', 
    name: 'Metro Wholesale', 
    contact: 'Vikram Reddy', 
    email: 'vikram@metrowhole.com', 
    phone: '+91 98765 43214',
    address: '555 Business District, Madhapur, Hyderabad',
    category: 'General',
    gst: '36EEEEE6789E5Z9',
    rating: 4.6,
    totalOrders: 189,
    totalAmount: 1650000,
    status: 'active',
    joinDate: new Date('2022-11-12'),
    products: ['Mixed Goods', 'Bulk Items']
  },
];

let nextSupplierNum = 6;

export default function Suppliers() {
  const { can } = useAuth();
  const [suppliers, setSuppliers] = useState(suppliersDB);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewSupplier, setViewSupplier] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter logic
  const filteredSuppliers = suppliers.filter((sup) => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      sup.name.toLowerCase().includes(q) || 
      sup.contact.toLowerCase().includes(q) ||
      sup.email.toLowerCase().includes(q) ||
      sup.category.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || sup.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || sup.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  // Stats
  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === 'active').length,
    totalOrders: suppliers.reduce((sum, s) => sum + s.totalOrders, 0),
    totalAmount: suppliers.reduce((sum, s) => sum + s.totalAmount, 0),
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

  const getRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<i key={i} className="bi bi-star-fill" style={{ color: '#ff9f43', fontSize: '0.8rem' }}></i>);
      } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
        stars.push(<i key={i} className="bi bi-star-half" style={{ color: '#ff9f43', fontSize: '0.8rem' }}></i>);
      } else {
        stars.push(<i key={i} className="bi bi-star" style={{ color: '#ddd', fontSize: '0.8rem' }}></i>);
      }
    }
    return <span className="d-inline-flex gap-1">{stars}</span>;
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
            <h1 className="page-title">
              <i className="bi bi-truck me-2" style={{ color: 'var(--primary)' }}></i>
              Suppliers
            </h1>
            <p className="page-subtitle">Manage supplier relationships and contacts</p>
          </div>
          {can('suppliers.add') && (
            <button className="btn-v primary" onClick={() => setShowCreateModal(true)}>
              <i className="bi bi-plus-lg"></i>
              <span>Add Supplier</span>
            </button>
          )}
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
              <div className="stat-card-label">Total Suppliers</div>
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
              <div className="stat-card-label">Active Suppliers</div>
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
              <div className="stat-card-label">Total Value</div>
              <div className="stat-card-value">₹{(stats.totalAmount / 100000).toFixed(1)}L</div>
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
                  placeholder="Search suppliers, contacts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>Category</label>
              <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
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
            <div className="col-md-2">
              <button className="btn-v light w-100" style={{ justifyContent: 'center' }} title="Export">
                <i className="bi bi-download"></i> Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="v-card">
        <div className="v-card-header">
          <i className="bi bi-table"></i>
          All Suppliers
          <span className="badge-v secondary ms-auto">{filteredSuppliers.length}</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {filteredSuppliers.length === 0 ? (
            <div className="empty-state-v">
              <i className="bi bi-inbox"></i>
              <h5>No Suppliers Found</h5>
              <p>{search || statusFilter !== 'all' || categoryFilter !== 'all' ? 'Try adjusting filters' : 'Click "Add Supplier" to get started'}</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact Person</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Orders</th>
                  <th>Total Value</th>
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
                      <span className="badge-v light" style={{ fontSize: '0.8rem' }}>
                        {sup.category}
                      </span>
                    </td>
                    <td>
                      <div>{getRatingStars(sup.rating)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {sup.rating.toFixed(1)}/5.0
                      </div>
                    </td>
                    <td className="fw-semibold">{sup.totalOrders}</td>
                    <td className="fw-bold">₹{(sup.totalAmount / 100000).toFixed(1)}L</td>
                    <td>{getStatusBadge(sup.status)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
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

      {/* Create/Edit Supplier Modal */}
      {showCreateModal && <SupplierFormModal onClose={() => setShowCreateModal(false)} onSave={handleCreate} />}
      {editSupplier && <SupplierFormModal supplier={editSupplier} onClose={() => setEditSupplier(null)} onSave={handleUpdate} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW SUPPLIER MODAL
═══════════════════════════════════════════════════════════ */
function ViewSupplierModal({ supplier, onClose }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 700 }}>
        <div className="modal-box-header">
          <i className="bi bi-truck" style={{ color: 'var(--primary)' }}></i>
          Supplier Details
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-box-body">
          {/* Basic Info */}
          <div className="row g-3 mb-3">
            <div className="col-12">
              <div className="v-card" style={{ background: 'rgba(115,103,240,0.04)', border: '1px solid rgba(115,103,240,0.2)' }}>
                <div className="v-card-body" style={{ padding: '20px' }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="mb-1" style={{ color: 'var(--primary)' }}>{supplier.name}</h5>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{supplier.id}</div>
                    </div>
                    <span className={`badge-v ${supplier.status === 'active' ? 'success' : 'secondary'}`}>
                      {supplier.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Rating</div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        {[1,2,3,4,5].map(i => (
                          <i key={i} className={`bi bi-star${i <= Math.floor(supplier.rating) ? '-fill' : ''}`} style={{ color: i <= supplier.rating ? '#ff9f43' : '#ddd', fontSize: '1rem' }}></i>
                        ))}
                        <span className="fw-bold">{supplier.rating}</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Orders</div>
                      <div className="fw-bold" style={{ fontSize: '1.2rem', marginTop: '4px' }}>{supplier.totalOrders}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Value</div>
                      <div className="fw-bold" style={{ fontSize: '1.2rem', marginTop: '4px', color: 'var(--success)' }}>
                        ₹{supplier.totalAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-section-title mb-2">
            <i className="bi bi-person-circle"></i> Contact Information
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">Contact Person</label>
              <div className="info-box">{supplier.contact}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Category</label>
              <div className="info-box">{supplier.category}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <div className="info-box">{supplier.email}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <div className="info-box">{supplier.phone}</div>
            </div>
            <div className="col-12">
              <label className="form-label">Address</label>
              <div className="info-box">{supplier.address}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">GST Number</label>
              <div className="info-box">{supplier.gst}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Join Date</label>
              <div className="info-box">
                {new Date(supplier.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="form-section-title mb-2">
            <i className="bi bi-box-seam"></i> Products Supplied
          </div>
          <div className="d-flex flex-wrap gap-2">
            {supplier.products.map((product, idx) => (
              <span key={idx} className="badge-v info" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                {product}
              </span>
            ))}
          </div>
        </div>
        <div className="modal-box-footer">
          <button className="btn-v light" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUPPLIER FORM MODAL (Create/Edit)
═══════════════════════════════════════════════════════════ */
function SupplierFormModal({ supplier, onClose, onSave }) {
  const [form, setForm] = useState(supplier || {
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    category: 'Electronics',
    gst: '',
    rating: 4.0,
    status: 'active',
    products: [],
  });
  const [productInput, setProductInput] = useState('');
  const [error, setError] = useState('');

  const categories = ['Electronics', 'Office Supplies', 'Hardware', 'General'];

  const handleAddProduct = () => {
    if (productInput.trim()) {
      setForm({ ...form, products: [...form.products, productInput.trim()] });
      setProductInput('');
    }
  };

  const handleRemoveProduct = (index) => {
    setForm({ ...form, products: form.products.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.contact || !form.email || !form.phone) {
      setError('Please fill all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address');
      return;
    }

    onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 700 }}>
        <div className="modal-box-header">
          <i className="bi bi-truck" style={{ color: 'var(--primary)' }}></i>
          {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-box-body">
            {error && (
              <div className="alert-v danger mb-3">
                <i className="bi bi-exclamation-circle"></i> {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="form-section-title mb-2">
              <i className="bi bi-building"></i> Basic Information
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Supplier Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Tech Distributors"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Category *</label>
                <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Contact Person *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Rajesh Kumar"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Contact Info */}
            <div className="form-section-title mb-2">
              <i className="bi bi-telephone"></i> Contact Details
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Email *</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="supplier@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone *</label>
                <input
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Full address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                ></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label">GST Number</label>
                <input
                  className="form-control"
                  placeholder="e.g. 07AAAAA1234A1Z5"
                  value={form.gst}
                  onChange={(e) => setForm({ ...form, gst: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Rating (1-5)</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 4.0 })}
                />
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Products */}
            <div className="form-section-title mb-2">
              <i className="bi bi-box-seam"></i> Products Supplied
            </div>
            <div className="row g-2 mb-2">
              <div className="col-9">
                <input
                  className="form-control"
                  placeholder="Enter product name"
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProduct(); } }}
                />
              </div>
              <div className="col-3">
                <button type="button" className="btn-v light w-100" onClick={handleAddProduct} style={{ justifyContent: 'center' }}>
                  <i className="bi bi-plus-lg"></i> Add
                </button>
              </div>
            </div>
            {form.products.length > 0 && (
              <div className="d-flex flex-wrap gap-2">
                {form.products.map((product, idx) => (
                  <span key={idx} className="badge-v info d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                    {product}
                    <i className="bi bi-x-circle" style={{ cursor: 'pointer' }} onClick={() => handleRemoveProduct(idx)}></i>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="modal-box-footer">
            <button className="btn-v light" type="button" onClick={onClose}>Cancel</button>
            <button className="btn-v primary" type="submit">
              <i className="bi bi-check-circle"></i> {supplier ? 'Update' : 'Create'} Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
