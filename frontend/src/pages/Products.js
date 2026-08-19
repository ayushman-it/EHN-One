import React, { useEffect, useState, useCallback } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, exportTallyItems } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { sendLowStockWhatsAppAlert } from '../utils/whatsappHelper';

// Import categories from mock data
const availableCategories = [
  'Electronics',
  'Computers',
  'Mobile Phones',
  'Accessories',
  'Office Supplies',
  'Furniture',
  'Stationery',
  'Hardware',
];

const UQC_UNITS = [
  { code: 'PCS-PIECES', label: 'PCS (Pieces)' },
  { code: 'NOS-NUMBERS', label: 'NOS (Numbers)' },
  { code: 'KGS-KILOGRAMS', label: 'KGS (Kilograms)' },
  { code: 'BOX-BOXES', label: 'BOX (Boxes)' },
  { code: 'MTR-METERS', label: 'MTR (Meters)' },
  { code: 'SET-SETS', label: 'SET (Sets)' },
  { code: 'PAC-PACKETS', label: 'PAC (Packets)' },
];

const emptyForm = {
  name: '', category: '', quantity: 0, price: 0, cost: 0,
  sku: '', description: '', lowStockThreshold: 10, unit: 'PCS', uqcUnit: 'PCS-PIECES',
  hsnCode: '', gstRate: 18, taxability: 'Taxable', typeOfSupply: 'Goods',
  openingQuantity: 0, openingRate: 0, openingValue: 0
};

export default function Products() {
  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showImportModal, setShowImportModal] = useState(false);
  const { can } = useAuth();

  const load = useCallback(() => {
    setLoading(true);
    getProducts(search)
      .then((r) => {
        const data = r.data || r;
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setError('Failed to load products.');
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { 
    setForm(emptyForm); 
    setEditId(null); 
    setError(''); 
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setShowModal(true); 
  };

  const openEdit = (p) => {
    setForm({ 
      name: p.name, category: p.category, quantity: p.quantity,
      price: p.price, cost: p.cost || 0, sku: p.sku, description: p.description || '',
      lowStockThreshold: p.lowStockThreshold || 10, unit: p.unit || 'PCS',
      uqcUnit: p.uqcUnit || 'PCS-PIECES', hsnCode: p.hsnCode || '', gstRate: p.gstRate || 18,
      taxability: p.taxability || 'Taxable', typeOfSupply: p.typeOfSupply || 'Goods',
      openingQuantity: p.openingQuantity || 0, openingRate: p.openingRate || 0, openingValue: p.openingValue || 0
    });
    setEditId(p._id); 
    setError(''); 
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setShowModal(true);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === '__create_new__') {
      setShowNewCategoryInput(true);
      setForm({ ...form, category: '' });
      setNewCategoryName('');
    } else {
      setShowNewCategoryInput(false);
      setForm({ ...form, category: value });
    }
  };

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      setForm({ ...form, category: newCategoryName.trim() });
      setShowNewCategoryInput(false);
      setNewCategoryName('');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'name' || sortBy === 'category') {
      aVal = (aVal || '').toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field) => {
    if (sortBy !== field) return <i className="bi bi-arrow-down-up" style={{ opacity: 0.3, fontSize: '0.75rem' }}></i>;
    return sortOrder === 'asc' 
      ? <i className="bi bi-arrow-up" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}></i>
      : <i className="bi bi-arrow-down" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}></i>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const data = { 
        ...form, 
        quantity: Number(form.quantity), 
        price: Number(form.price),
        cost: Number(form.cost),
        gstRate: Number(form.gstRate),
        lowStockThreshold: Number(form.lowStockThreshold) 
      };
      if (editId) await updateProduct(editId, data); else await addProduct(data);
      setShowModal(false); load();
    } catch (err) { 
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Something went wrong';
      setError(errorMsg);
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await deleteProduct(id); load(); }
    catch { alert('Failed to delete product'); }
  };

  const statusBadge = (p) => {
    if (p.quantity === 0)                    return <span className="badge-v danger">Out of Stock</span>;
    if (p.quantity <= p.lowStockThreshold)   return <span className="badge-v warning">Low Stock</span>;
    return <span className="badge-v success">In Stock</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title"><i className="bi bi-box-seam me-2" style={{ color: 'var(--primary)' }}></i>Products / Stock Items Master</h1>
            <p className="page-subtitle">Manage inventory items with Tally HSN/SAC codes, GST rates, and UQC units</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn-v outline-success" onClick={exportTallyItems} title="Export Stock Items to Tally Prime XML">
              <i className="bi bi-file-earmark-code-fill"></i>
              <span>Export Tally XML</span>
            </button>
            {can('products.add') && (
              <button className="btn-v primary" onClick={openAdd}>
                <i className="bi bi-plus-lg"></i>
                <span>Add Stock Item</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="v-card mb-4">
        <div className="v-card-body" style={{ padding: '16px 24px' }}>
          <div className="d-flex align-items-center flex-wrap gap-3">
            <div className="search-box-v">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, SKU, HSN, category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="ms-auto d-flex align-items-center gap-2">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {products.length} product{products.length !== 1 ? 's' : ''}
              </span>
              <button className="btn-v light icon-only" onClick={load} title="Refresh">
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="v-card">
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="spinner-center">
              <div className="spinner-border" style={{ color: 'var(--primary)' }}></div>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state-v">
              <i className="bi bi-inbox"></i>
              <h5>No Products Found</h5>
              <p>{search ? 'Try a different search term' : 'Click "Add Stock Item" to create your first product'}</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th className="sortable-th" onClick={() => handleSort('name')}>
                    Product Name {getSortIcon('name')}
                  </th>
                  <th>SKU / HSN</th>
                  <th className="sortable-th" onClick={() => handleSort('category')}>
                    Category {getSortIcon('category')}
                  </th>
                  <th>GST Rate</th>
                  <th className="sortable-th" onClick={() => handleSort('quantity')}>
                    Stock Qty {getSortIcon('quantity')}
                  </th>
                  <th className="sortable-th" onClick={() => handleSort('price')}>
                    Sales Price {getSortIcon('price')}
                  </th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((p, i) => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td>
                      <div className="fw-semibold">{p.name}</div>
                      <small className="text-muted d-block">{p.uqcUnit || 'PCS-PIECES'} • {p.typeOfSupply || 'Goods'}</small>
                    </td>
                    <td>
                      <code style={{ color: 'var(--primary)', fontSize: '0.82rem' }}>{p.sku}</code>
                      {p.hsnCode && (
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>HSN: {p.hsnCode}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge-v secondary">{p.category}</span>
                    </td>
                    <td>
                      <span className="badge-v info" style={{ fontSize: '0.78rem' }}>
                        {p.gstRate !== undefined ? `${p.gstRate}% GST` : '18% GST'}
                      </span>
                    </td>
                    <td className="fw-bold">{p.quantity} {p.unit || 'Pcs'}</td>
                    <td>₹{p.price.toLocaleString('en-IN')}</td>
                    <td>{statusBadge(p)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        {can('products.edit') && (
                          <button className="btn-v outline-primary icon-only" onClick={() => openEdit(p)} title="Edit">
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {can('products.delete') && (
                          <button className="btn-v outline-danger icon-only" onClick={() => handleDelete(p._id, p.name)} title="Delete">
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

      {/* Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 750 }}>
            <div className="modal-box-header">
              <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-plus-circle'}`} style={{ color: 'var(--primary)' }}></i>
              {editId ? 'Edit Stock Item' : 'Add New Stock Item'}
              <button className="close-btn" onClick={() => setShowModal(false)} aria-label="Close">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-box-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
                {error && (
                  <div className="alert-v danger">
                    <i className="bi bi-exclamation-circle"></i> {error}
                  </div>
                )}
                
                <div className="form-section-title mb-2"><i className="bi bi-box-seam"></i> Item Identification</div>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Product Name *</label>
                    <input className="form-control" placeholder="e.g. Dell XPS 15 Laptop"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">SKU / Item Code *</label>
                    <input className="form-control" placeholder="e.g. LAP-DELL-001"
                      value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Category / Stock Group *</label>
                    {!showNewCategoryInput ? (
                      <select 
                        className="form-select" 
                        value={form.category} 
                        onChange={handleCategoryChange}
                        required
                      >
                        <option value="">-- Select Category --</option>
                        {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__create_new__" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          + Create New Category
                        </option>
                      </select>
                    ) : (
                      <div className="d-flex gap-2">
                        <input 
                          className="form-control" 
                          placeholder="Enter category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <button type="button" className="btn-v success icon-only" onClick={handleAddNewCategory}>
                          <i className="bi bi-check-lg"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">UQC Unit (Tally Measure)</label>
                    <select 
                      className="form-select" 
                      value={form.uqcUnit} 
                      onChange={(e) => setForm({ ...form, uqcUnit: e.target.value, unit: e.target.value.split('-')[0] })}
                    >
                      {UQC_UNITS.map(u => <option key={u.code} value={u.code}>{u.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-divider"></div>

                <div className="form-section-title mb-2"><i className="bi bi-receipt"></i> Statutory & GST Configuration</div>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">HSN / SAC Code</label>
                    <input className="form-control" placeholder="e.g. 84713010"
                      value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">GST Tax Rate (%)</label>
                    <select 
                      className="form-select" 
                      value={form.gstRate} 
                      onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}
                    >
                      <option value="0">0% (Nil Rated / Exempt)</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST (Standard)</option>
                      <option value="28">28% GST (Luxury/High)</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Taxability Type</label>
                    <select className="form-select" value={form.taxability} onChange={(e) => setForm({ ...form, taxability: e.target.value })}>
                      <option value="Taxable">Taxable</option>
                      <option value="Exempt">Exempt</option>
                      <option value="Nil Rated">Nil Rated</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Type of Supply</label>
                    <select className="form-select" value={form.typeOfSupply} onChange={(e) => setForm({ ...form, typeOfSupply: e.target.value })}>
                      <option value="Goods">Goods</option>
                      <option value="Services">Services</option>
                    </select>
                  </div>
                </div>

                <div className="form-divider"></div>

                <div className="form-section-title mb-2"><i className="bi bi-currency-rupee"></i> Pricing & Stock Quantities</div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Sales Price (₹) *</label>
                    <input type="number" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Cost Price (₹)</label>
                    <input type="number" className="form-control" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Current Stock Qty *</label>
                    <input type="number" className="form-control" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Low Stock Alert Threshold</label>
                    <input type="number" className="form-control" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Description</label>
                    <input className="form-control" placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="modal-box-footer">
                <button type="button" className="btn-v light" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-v primary" disabled={saving}>
                  <i className="bi bi-check-circle"></i> {saving ? 'Saving...' : editId ? 'Update Stock Item' : 'Create Stock Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
