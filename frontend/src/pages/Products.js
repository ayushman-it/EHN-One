import React, { useEffect, useState, useCallback } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, exportTallyItems } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportHelper';

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

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && e.key !== 'F2' && !(e.altKey && (e.key === 'e' || e.key === 'E' || e.key === 'c' || e.key === 'C'))) return;

      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('product-search-input')?.focus();
      } else if (e.key === 'F4') {
        if (can('products.add')) {
          e.preventDefault();
          openAdd();
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        load();
      } else if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        exportTallyItems();
      } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleExportCSV();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [can, load]);

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

  const getExportData = () => {
    const headers = ['Stock Item Name', 'SKU Code', 'Category Group', 'Stock Qty', 'Sales Price (₹)', 'Cost Price (₹)', 'HSN Code', 'GST %'];
    const rows = products.map(p => [
      p.name || '',
      p.sku || '',
      p.category || '',
      p.quantity || 0,
      p.price || 0,
      p.cost || 0,
      p.hsnCode || '',
      `${p.gstRate || 18}%`
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    exportToCSV('Stock_Item_Masters_Register', headers, rows);
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel('Stock_Item_Masters_Register', 'Stock Items', headers, rows);
  };

  const handleExportPDF = () => {
    const { headers, rows } = getExportData();
    const totalQty = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
    exportToPDF(
      'STOCK ITEM MASTERS REGISTER',
      { name: 'Kedvass Hygiene Products', address: 'Korba Industrial Area' },
      headers,
      rows,
      { label: 'Total Items Qty Summary', value: `${totalQty} Units` }
    );
  };

  const statusBadge = (p) => {
    if (p.quantity === 0)                    return <span className="badge-v danger">OUT OF STOCK</span>;
    if (p.quantity <= p.lowStockThreshold)   return <span className="badge-v warning">LOW STOCK</span>;
    return <span className="badge-v success">IN STOCK</span>;
  };

  const totalStockUnits = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const totalValuation = products.reduce((acc, p) => acc + ((p.quantity || 0) * (p.price || 0)), 0);
  const lowStockCount = products.filter(p => p.quantity <= (p.lowStockThreshold || 10)).length;

  return (
    <div>
      {/* Gateway of Tally Software Module Header Bar */}
      <div className="tally-header-bar mb-3 shadow-sm">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="tally-header-badge" style={{ background: 'var(--primary)', color: '#fff' }}>MASTERS</span>
            <div>
              <h5 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                STOCK ITEM MASTERS REGISTER &mdash; PRODUCTS CATALOG
              </h5>
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                F.Y. 2026-2027 | Inventory Stock Item Register | Kedvass Hygiene Products
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn-v outline-primary btn-sm" onClick={exportTallyItems} title="Export Tally XML">
              <i className="bi bi-file-earmark-code me-1"></i> [Alt+E] Tally XML
            </button>
            <button className="btn-v outline-secondary btn-sm" onClick={handleExportCSV} title="Export CSV">
              <i className="bi bi-filetype-csv me-1"></i> [Alt+C] CSV
            </button>
            <button className="btn-v outline-success btn-sm" onClick={handleExportExcel} title="Export Excel (.xls)">
              <i className="bi bi-file-earmark-excel me-1"></i> [Alt+X] Excel
            </button>
            <button className="btn-v outline-danger btn-sm" onClick={handleExportPDF} title="Export PDF">
              <i className="bi bi-file-earmark-pdf me-1"></i> [Alt+P] PDF
            </button>
            {can('products.add') && (
              <button className="btn-v primary btn-sm" onClick={openAdd}>
                <i className="bi bi-plus-lg me-1"></i> [F4] Add Stock Item
              </button>
            )}
          </div>
        </div>

        {/* F1-F8 Action Toolbar */}
        <div className="tally-toolbar mt-2 pt-2 border-top d-flex gap-2 flex-wrap">
          <button className="tally-shortcut-btn" onClick={() => document.getElementById('product-search-input')?.focus()}>
            <span className="key">[F2]</span> Search Item
          </button>
          {can('products.add') && (
            <button className="tally-shortcut-btn" onClick={openAdd}>
              <span className="key">[F4]</span> New Item Master
            </button>
          )}
          <button className="tally-shortcut-btn" onClick={load}>
            <span className="key">[F5]</span> Refresh Data
          </button>
          <button className="tally-shortcut-btn" onClick={exportTallyItems}>
            <span className="key">[Alt+E]</span> Export XML
          </button>
          <button className="tally-shortcut-btn" onClick={handleExportCSV}>
            <span className="key">[Alt+C]</span> Export CSV
          </button>
        </div>
      </div>

      {/* Tally Metric Summary Cards */}
      <div className="row g-2 mb-3">
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL ITEM MASTERS</div>
            <div className="tally-stat-value">{products.length}</div>
            <div className="tally-stat-sub text-muted">Active Stock SKUs</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL VALUATION (VAL)</div>
            <div className="tally-stat-value text-primary">₹{totalValuation.toLocaleString('en-IN')}</div>
            <div className="tally-stat-sub text-muted">Calculated Sales Valuation</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">PHYSICAL STOCK UNITS</div>
            <div className="tally-stat-value text-success">{totalStockUnits.toLocaleString()}</div>
            <div className="tally-stat-sub text-muted">Total Quantity Available</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">LOW STOCK ALERTS</div>
            <div className="tally-stat-value text-danger">{lowStockCount}</div>
            <div className="tally-stat-sub text-muted">Requires Reorder Action</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="v-card mb-3">
        <div className="v-card-body p-2">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <div className="search-box-v flex-grow-1">
              <i className="bi bi-search"></i>
              <input
                id="product-search-input"
                type="text"
                className="form-control"
                placeholder="Filter stock items by name, SKU, HSN code, category... [Press F2]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge-v secondary fw-bold" style={{ fontSize: '0.75rem' }}>
                {sortedProducts.length} RECORDS FOUND
              </span>
              <button className="btn-v outline-secondary btn-sm" onClick={load} title="Refresh Register">
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* High-Density Tally Grid Table */}
      <div className="v-card">
        <div className="v-card-header d-flex justify-content-between align-items-center">
          <span><i className="bi bi-box-seam me-2" style={{ color: 'var(--primary)' }}></i>STOCK ITEM MASTER REGISTER</span>
          <span className="text-muted small">HIGH-DENSITY ERP VIEW</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="spinner-center py-4">
              <div className="spinner-border" style={{ color: 'var(--primary)', width: '2rem', height: '2rem' }}></div>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state-v py-4">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '2rem' }}></i>
              <h5 className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.88rem' }}>No Stock Items Found</h5>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                {search ? 'Try adjusting your search criteria' : 'Click "[F4] Add Stock Item" to create your first stock item master'}
              </p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th className="sortable-th" onClick={() => handleSort('name')}>
                    ITEM NAME {getSortIcon('name')}
                  </th>
                  <th>SKU / HSN CODE</th>
                  <th className="sortable-th" onClick={() => handleSort('category')}>
                    STOCK GROUP {getSortIcon('category')}
                  </th>
                  <th>GST RATE</th>
                  <th className="sortable-th text-end" onClick={() => handleSort('quantity')}>
                    STOCK QTY {getSortIcon('quantity')}
                  </th>
                  <th className="sortable-th text-end" onClick={() => handleSort('price')}>
                    SALES PRICE {getSortIcon('price')}
                  </th>
                  <th className="text-end">TOTAL VALUE</th>
                  <th>STATUS</th>
                  <th className="text-end" style={{ width: 90 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((p, i) => (
                  <tr key={p._id}>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>{i + 1}</td>
                    <td>
                      <div className="fw-bold text-dark">{p.name}</div>
                      <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
                        {p.uqcUnit || 'PCS-PIECES'} &bull; {p.typeOfSupply || 'Goods'}
                      </small>
                    </td>
                    <td>
                      <code style={{ color: 'var(--primary)', fontSize: '0.78rem' }}>{p.sku}</code>
                      {p.hsnCode && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HSN: {p.hsnCode}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge-v secondary">{p.category}</span>
                    </td>
                    <td>
                      <span className="badge-v info" style={{ fontSize: '0.7rem' }}>
                        {p.gstRate !== undefined ? `${p.gstRate}% GST` : '18% GST'}
                      </span>
                    </td>
                    <td className="fw-bold text-end">{p.quantity} {p.unit || 'Pcs'}</td>
                    <td className="text-end fw-semibold">₹{(p.price || 0).toLocaleString('en-IN')}</td>
                    <td className="text-end fw-bold text-primary">₹{((p.quantity || 0) * (p.price || 0)).toLocaleString('en-IN')}</td>
                    <td>{statusBadge(p)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        {can('products.edit') && (
                          <button className="btn-v outline-primary btn-sm px-2" onClick={() => openEdit(p)} title="Edit Master">
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {can('products.delete') && (
                          <button className="btn-v outline-danger btn-sm px-2" onClick={() => handleDelete(p._id, p.name)} title="Delete Master">
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

      {/* Desktop Rectangular Window Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 750 }}>
            <div className="modal-box-header d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-plus-circle'}`} style={{ color: 'var(--primary)' }}></i>
                <span>{editId ? 'MODIFY STOCK ITEM MASTER' : 'CREATE NEW STOCK ITEM MASTER'}</span>
              </div>
              <button className="close-btn" onClick={() => setShowModal(false)} aria-label="Close">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-box-body p-3" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
                {error && (
                  <div className="alert-v danger mb-3">
                    <i className="bi bi-exclamation-circle me-1"></i> {error}
                  </div>
                )}
                
                <div className="form-section-title mb-2"><i className="bi bi-box-seam me-1"></i> Stock Item Identification</div>
                <div className="row g-2 mb-3">
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
                          + Create New Category Group
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
                        <button type="button" className="btn-v success btn-sm" onClick={handleAddNewCategory}>
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

                <div className="form-divider mb-3"></div>

                <div className="form-section-title mb-2"><i className="bi bi-receipt me-1"></i> Statutory & GST Configuration</div>
                <div className="row g-2 mb-3">
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

                <div className="form-divider mb-3"></div>

                <div className="form-section-title mb-2"><i className="bi bi-currency-rupee me-1"></i> Pricing & Stock Quantities</div>
                <div className="row g-2">
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

              <div className="modal-box-footer d-flex justify-content-end gap-2">
                <button type="button" className="btn-v outline-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-v primary btn-sm" disabled={saving}>
                  <i className="bi bi-check-circle me-1"></i> {saving ? 'Saving...' : editId ? 'Update Stock Item' : 'Create Stock Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
