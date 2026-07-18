import React, { useEffect, useState, useCallback } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

const emptyForm = {
  name: '', category: '', quantity: '', price: '',
  sku: '', description: '', lowStockThreshold: 10,
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
  const [sortBy, setSortBy] = useState('name'); // name, category, quantity, price
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [showImportModal, setShowImportModal] = useState(false);
  const { can } = useAuth();

  const load = useCallback(() => {
    setLoading(true);
    getProducts(search)
      .then((r) => {
        // Handle different response formats
        const data = r.data || r;
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setError('Failed to load products.');
        setProducts([]); // Set empty array on error
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
    setForm({ name: p.name, category: p.category, quantity: p.quantity,
              price: p.price, sku: p.sku, description: p.description || '',
              lowStockThreshold: p.lowStockThreshold });
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

  // Sorting function
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Sort products
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
      const data = { ...form, quantity: Number(form.quantity), price: Number(form.price),
                     lowStockThreshold: Number(form.lowStockThreshold) };
      if (editId) await updateProduct(editId, data); else await addProduct(data);
      setShowModal(false); load();
    } catch (err) { 
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Something went wrong';
      setError(errorMsg);
      console.error('Add/Update error:', err);
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
            <h1 className="page-title"><i className="bi bi-box-seam me-2" style={{ color: 'var(--primary)' }}></i>Products</h1>
            <p className="page-subtitle">Manage and track your inventory products</p>
          </div>
          {can('products.add') && (
            <button className="btn-v primary" onClick={openAdd}>
              <i className="bi bi-plus-lg"></i>
              <span>Add Product</span>
            </button>
          )}
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
                placeholder="Search by name, SKU, category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="ms-auto d-flex align-items-center gap-2">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {products.length} product{products.length !== 1 ? 's' : ''}
              </span>
              <button className="btn-v light" onClick={() => setShowImportModal(true)} title="Import/Export">
                <i className="bi bi-arrow-down-up"></i>
                <span>Import/Export</span>
              </button>
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
              <p>{search ? 'Try a different search term' : 'Click "Add Product" to create your first product'}</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th className="sortable-th" onClick={() => handleSort('name')}>
                    Product {getSortIcon('name')}
                  </th>
                  <th>SKU</th>
                  <th className="sortable-th" onClick={() => handleSort('category')}>
                    Category {getSortIcon('category')}
                  </th>
                  <th className="sortable-th" onClick={() => handleSort('quantity')}>
                    Quantity {getSortIcon('quantity')}
                  </th>
                  <th className="sortable-th" onClick={() => handleSort('price')}>
                    Price {getSortIcon('price')}
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
                      {p.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {p.description.substring(0, 50)}{p.description.length > 50 && '…'}
                        </div>
                      )}
                    </td>
                    <td><code style={{ color: 'var(--primary)', fontSize: '0.82rem' }}>{p.sku}</code></td>
                    <td>
                      <span className="badge-v secondary">{p.category}</span>
                    </td>
                    <td className="fw-bold">{p.quantity}</td>
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
                        {!can('products.edit') && !can('products.delete') && (
                          <span className="badge-v secondary">View only</span>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box">
            <div className="modal-box-header">
              <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-plus-circle'}`} style={{ color: 'var(--primary)' }}></i>
              {editId ? 'Edit Product' : 'Add New Product'}
              <button className="close-btn" onClick={() => setShowModal(false)} aria-label="Close">
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
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Product Name *</label>
                    <input className="form-control" placeholder="e.g. Wireless Mouse"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">SKU *</label>
                    <input className="form-control" placeholder="e.g. WM-001"
                      value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Category *</label>
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
                        <option value="__create_new__" style={{ borderTop: '1px solid var(--border-color)', marginTop: '4px', fontWeight: 600, color: 'var(--primary)' }}>
                          + Create New Category
                        </option>
                      </select>
                    ) : (
                      <div className="d-flex gap-2">
                        <input 
                          className="form-control" 
                          placeholder="Enter new category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewCategory(); } }}
                          autoFocus
                        />
                        <button 
                          type="button" 
                          className="btn-v success icon-only" 
                          onClick={handleAddNewCategory}
                          disabled={!newCategoryName.trim()}
                          title="Add Category"
                        >
                          <i className="bi bi-check-lg"></i>
                        </button>
                        <button 
                          type="button" 
                          className="btn-v light icon-only" 
                          onClick={() => { setShowNewCategoryInput(false); setNewCategoryName(''); }}
                          title="Cancel"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    )}
                    {form.category && !showNewCategoryInput && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px' }}>
                        <i className="bi bi-check-circle"></i> Selected: {form.category}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Low Stock Threshold</label>
                    <input className="form-control" type="number" min="0"
                      value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Quantity *</label>
                    <input className="form-control" type="number" min="0" placeholder="0"
                      value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Price (₹) *</label>
                    <input className="form-control" type="number" min="0" step="0.01" placeholder="0.00"
                      value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows="3" placeholder="Optional product description…"
                      value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-box-footer">
                <button className="btn-v light" type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-v primary" type="submit" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving…</> : editId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import/Export Modal */}
      {showImportModal && <ImportExportModal onClose={() => setShowImportModal(false)} products={products} onImport={(newProducts) => { setProducts([...products, ...newProducts]); load(); }} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   IMPORT/EXPORT MODAL
═══════════════════════════════════════════════════════════ */
function ImportExportModal({ onClose, products, onImport }) {
  const [activeTab, setActiveTab] = useState('export');
  const [exportCategory, setExportCategory] = useState('all');
  const [exportFormat, setExportFormat] = useState('csv');
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importCategory, setImportCategory] = useState('all');

  const categories = ['all', ...new Set(products.map(p => p.category))];

  // Export functionality
  const handleExport = () => {
    let dataToExport = products;
    
    // Filter by category
    if (exportCategory !== 'all') {
      dataToExport = products.filter(p => p.category === exportCategory);
    }

    if (exportFormat === 'csv') {
      exportToCSV(dataToExport);
    } else {
      exportToJSON(dataToExport);
    }
  };

  const exportToCSV = (data) => {
    const headers = ['Name', 'SKU', 'Category', 'Quantity', 'Price', 'Low Stock Threshold', 'Description'];
    const rows = data.map(p => [
      p.name,
      p.sku,
      p.category,
      p.quantity,
      p.price,
      p.lowStockThreshold,
      p.description || ''
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    downloadFile(csv, `products_${exportCategory}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const exportToJSON = (data) => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `products_${exportCategory}_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import functionality
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(event.target.result);
          setImportPreview(Array.isArray(data) ? data : [data]);
        } else if (file.name.endsWith('.csv')) {
          const csv = event.target.result;
          const lines = csv.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            return {
              name: values[0] || '',
              sku: values[1] || '',
              category: values[2] || '',
              quantity: parseInt(values[3]) || 0,
              price: parseFloat(values[4]) || 0,
              lowStockThreshold: parseInt(values[5]) || 10,
              description: values[6] || ''
            };
          });
          setImportPreview(data.filter(item => item.name));
        }
      } catch (err) {
        alert('Error parsing file. Please check the format.');
      }
    };

    reader.readAsText(file);
  };

  const handleImport = () => {
    let dataToImport = importPreview;

    // Filter by category if specified
    if (importCategory !== 'all') {
      dataToImport = importPreview.filter(p => p.category === importCategory);
    }

    onImport(dataToImport);
    alert(`Successfully imported ${dataToImport.length} products!`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 800 }}>
        <div className="modal-box-header">
          <i className="bi bi-arrow-down-up" style={{ color: 'var(--primary)' }}></i>
          Import / Export Products
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-box-body">
          {/* Tabs */}
          <div className="import-export-tabs">
            <button 
              className={`tab-btn${activeTab === 'export' ? ' active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              <i className="bi bi-upload"></i> Export Data
            </button>
            <button 
              className={`tab-btn${activeTab === 'import' ? ' active' : ''}`}
              onClick={() => setActiveTab('import')}
            >
              <i className="bi bi-download"></i> Import Data
            </button>
          </div>

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="tab-content">
              <div className="alert-v info mb-3">
                <i className="bi bi-info-circle"></i> Export your products data to CSV or JSON format
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Select Category</label>
                  <select className="form-select" value={exportCategory} onChange={(e) => setExportCategory(e.target.value)}>
                    <option value="all">All Categories ({products.length} products)</option>
                    {categories.filter(c => c !== 'all').map(cat => {
                      const count = products.filter(p => p.category === cat).length;
                      return <option key={cat} value={cat}>{cat} ({count} products)</option>;
                    })}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Export Format</label>
                  <select className="form-select" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                    <option value="csv">CSV (Comma Separated)</option>
                    <option value="json">JSON (JavaScript Object)</option>
                  </select>
                </div>
              </div>

              <div className="export-preview mt-3">
                <div className="fw-semibold mb-2" style={{ fontSize: '0.9rem' }}>
                  <i className="bi bi-file-earmark-text"></i> Preview:
                </div>
                <div className="preview-box">
                  {exportCategory === 'all' ? (
                    <div>Exporting <strong>{products.length} products</strong> from all categories</div>
                  ) : (
                    <div>Exporting <strong>{products.filter(p => p.category === exportCategory).length} products</strong> from <strong>{exportCategory}</strong> category</div>
                  )}
                  <div className="mt-2" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Format: {exportFormat.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="tab-content">
              <div className="alert-v warning mb-3">
                <i className="bi bi-exclamation-triangle"></i> Import products from CSV or JSON file. Make sure the format matches our template.
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12">
                  <label className="form-label">Select File</label>
                  <input 
                    type="file" 
                    className="form-control" 
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Supported formats: CSV, JSON
                  </div>
                </div>
                {importPreview.length > 0 && (
                  <div className="col-md-6">
                    <label className="form-label">Filter by Category (Optional)</label>
                    <select className="form-select" value={importCategory} onChange={(e) => setImportCategory(e.target.value)}>
                      <option value="all">Import All ({importPreview.length} products)</option>
                      {[...new Set(importPreview.map(p => p.category))].map(cat => {
                        const count = importPreview.filter(p => p.category === cat).length;
                        return <option key={cat} value={cat}>{cat} ({count} products)</option>;
                      })}
                    </select>
                  </div>
                )}
              </div>

              {importPreview.length > 0 && (
                <div className="import-preview">
                  <div className="fw-semibold mb-2" style={{ fontSize: '0.9rem' }}>
                    <i className="bi bi-file-earmark-check"></i> Preview ({importPreview.length} products found):
                  </div>
                  <div className="preview-table-container">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>SKU</th>
                          <th>Category</th>
                          <th>Qty</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 5).map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.name}</td>
                            <td><code>{item.sku}</code></td>
                            <td><span className="badge-v light">{item.category}</span></td>
                            <td>{item.quantity}</td>
                            <td>₹{item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importPreview.length > 5 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                        ... and {importPreview.length - 5} more products
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-box-footer">
          <button className="btn-v light" onClick={onClose}>Cancel</button>
          {activeTab === 'export' ? (
            <button className="btn-v primary" onClick={handleExport}>
              <i className="bi bi-upload"></i> Export {exportCategory === 'all' ? 'All' : exportCategory}
            </button>
          ) : (
            <button className="btn-v primary" onClick={handleImport} disabled={importPreview.length === 0}>
              <i className="bi bi-download"></i> Import {importPreview.length} Products
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
