import React, { useEffect, useState, useCallback } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportHelper';
import Pagination from '../components/Pagination';

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
  name: '', category: 'Finished Goods', quantity: 0, price: 0, cost: 0,
  itemType: 'finished_goods',
  sku: '', description: '', lowStockThreshold: 10, unit: 'PCS', uqcUnit: 'PCS-PIECES',
  hsnCode: '', gstRate: 18, taxability: 'Taxable', typeOfSupply: 'Goods'
};

export default function FinishedGoods() {
  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [sortBy, setSortBy]       = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const { can }                   = useAuth();

  const load = useCallback(() => {
    setLoading(true);
    getProducts(search)
      .then((r) => {
        const data = r.data || r;
        const fgItems = (Array.isArray(data) ? data : []).filter(
          p => (p.itemType || 'finished_goods') === 'finished_goods'
        );
        setProducts(fgItems);
      })
      .catch(() => {
        setError('Failed to load finished goods.');
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(10);

  const sortedProducts = [...products].sort((a, b) => {
    let aVal = (a[sortBy] || '').toString().toLowerCase();
    let bVal = (b[sortBy] || '').toString().toLowerCase();
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const openAdd = () => {
    setForm({ ...emptyForm, itemType: 'finished_goods' });
    setEditId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, category: p.category || 'Finished Goods', quantity: p.quantity,
      itemType: 'finished_goods',
      price: p.price, cost: p.cost || 0, sku: p.sku, description: p.description || '',
      lowStockThreshold: p.lowStockThreshold || 10, unit: p.unit || 'PCS',
      uqcUnit: p.uqcUnit || 'PCS-PIECES', hsnCode: p.hsnCode || '', gstRate: p.gstRate || 18,
      taxability: p.taxability || 'Taxable', typeOfSupply: p.typeOfSupply || 'Goods'
    });
    setEditId(p._id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = {
        ...form,
        itemType: 'finished_goods',
        quantity: Number(form.quantity),
        price: Number(form.price),
        cost: Number(form.cost),
        gstRate: Number(form.gstRate),
        lowStockThreshold: Number(form.lowStockThreshold)
      };
      if (editId) await updateProduct(editId, data);
      else await addProduct(data);
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete Finished Goods item "${name}"?`)) return;
    try { await deleteProduct(id); load(); }
    catch { alert('Failed to delete item'); }
  };

  const totalValuation = products.reduce((acc, p) => acc + ((p.quantity || 0) * (p.price || 0)), 0);
  const totalStockUnits = products.reduce((acc, p) => acc + (p.quantity || 0), 0);

  return (
    <div className="py-2">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold text-dark" style={{ letterSpacing: '-0.3px' }}>
            <i className="bi bi-box-seam-fill me-2 text-success"></i>Finished Goods (FG) Master
          </h4>
          <p className="text-muted small mb-0">
            Catalog & inventory management for ready-to-sell manufactured products
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {can('finishedgoods.add') && (
            <button className="btn-v primary btn-sm" onClick={openAdd}>
              <i className="bi bi-plus-lg me-1"></i> Add Finished Goods
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL FG ITEMS</div>
            <div className="tally-stat-value text-success">{products.length}</div>
            <div className="tally-stat-sub text-muted">Ready for Sale SKUs</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL FG STOCK QUANTITY</div>
            <div className="tally-stat-value text-primary">{totalStockUnits.toLocaleString()} Pcs</div>
            <div className="tally-stat-sub text-muted">Available In Stock</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="tally-stat-card">
            <div className="tally-stat-label">FG STOCK VALUATION</div>
            <div className="tally-stat-value text-dark">₹{totalValuation.toLocaleString('en-IN')}</div>
            <div className="tally-stat-sub text-muted">Sales Valuation</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="v-card">
        <div className="v-card-header d-flex justify-content-between align-items-center">
          <span><i className="bi bi-box-seam-fill me-2 text-success"></i>FINISHED GOODS REGISTER</span>
          <span className="badge bg-success bg-opacity-15 text-success fw-bold">READY TO SELL</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="spinner-center py-4">
              <div className="spinner-border text-success" style={{ width: '2rem', height: '2rem' }}></div>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state-v py-4">
              <i className="bi bi-box-seam text-muted" style={{ fontSize: '2rem' }}></i>
              <h5 className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.88rem' }}>No Finished Goods Found</h5>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Click "Add Finished Goods" to create your first product</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>FG ITEM NAME</th>
                  <th>SKU / HSN</th>
                  <th>STOCK GROUP</th>
                  <th className="text-end">AVAILABLE QTY</th>
                  <th className="text-end">SALES PRICE</th>
                  <th className="text-end">TOTAL VALUE</th>
                  <th className="text-end" style={{ width: 90 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p, i) => (
                  <tr key={p._id}>
                    <td className="text-muted fw-semibold">{(currentPage - 1) * pageSize + i + 1}</td>
                    <td>
                      <div className="fw-bold text-dark">{p.name}</div>
                      <small className="text-muted">{p.uqcUnit || 'PCS'}</small>
                    </td>
                    <td>
                      <code className="text-success">{p.sku}</code>
                      {p.hsnCode && <div className="small text-muted">HSN: {p.hsnCode}</div>}
                    </td>
                    <td><span className="badge-v secondary">{p.category || 'Finished Goods'}</span></td>
                    <td className="fw-bold text-end text-success">{p.quantity} {p.unit || 'Pcs'}</td>
                    <td className="text-end fw-semibold">₹{(p.price || 0).toLocaleString('en-IN')}</td>
                    <td className="text-end fw-bold text-primary">₹{((p.quantity || 0) * (p.price || 0)).toLocaleString('en-IN')}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        {can('finishedgoods.edit') && (
                          <button className="btn-v outline-primary btn-sm px-2" onClick={() => openEdit(p)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {can('finishedgoods.delete') && (
                          <button className="btn-v outline-danger btn-sm px-2" onClick={() => handleDelete(p._id, p.name)}>
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 640 }}>
            <div className="modal-box-header d-flex justify-content-between align-items-center bg-success text-white p-3">
              <div className="fw-bold"><i className="bi bi-box-seam-fill me-2"></i>{editId ? 'EDIT FINISHED GOODS ITEM' : 'CREATE NEW FINISHED GOODS ITEM'}</div>
              <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-box-body p-3" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
                {error && <div className="alert-v danger mb-3"><i className="bi bi-exclamation-circle me-1"></i> {error}</div>}
                
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Product Name *</label>
                    <input className="form-control" placeholder="e.g. Assembled Laptop / Chair"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">SKU / Item Code *</label>
                    <input className="form-control" placeholder="e.g. FG-LAP-001"
                      value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Sales Price (₹) *</label>
                    <input type="number" className="form-control" placeholder="0.00"
                      value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Initial Opening Qty</label>
                    <input type="number" className="form-control" placeholder="0"
                      value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">HSN Code</label>
                    <input className="form-control" placeholder="84713010"
                      value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">UQC Unit</label>
                    <select className="form-select" value={form.uqcUnit} onChange={(e) => setForm({ ...form, uqcUnit: e.target.value, unit: e.target.value.split('-')[0] })}>
                      {UQC_UNITS.map(u => <option key={u.code} value={u.code}>{u.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-box-footer d-flex justify-content-end gap-2 p-3 bg-light border-top">
                <button type="button" className="btn-v secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-v success" disabled={saving}>
                  {saving ? 'Saving...' : editId ? 'Update Finished Goods' : 'Create Finished Goods'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
