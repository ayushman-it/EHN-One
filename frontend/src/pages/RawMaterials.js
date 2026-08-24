import React, { useEffect, useState, useCallback } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

const UQC_UNITS = [
  { code: 'KGS-KILOGRAMS', label: 'KGS (Kilograms)' },
  { code: 'PCS-PIECES', label: 'PCS (Pieces)' },
  { code: 'NOS-NUMBERS', label: 'NOS (Numbers)' },
  { code: 'BOX-BOXES', label: 'BOX (Boxes)' },
  { code: 'MTR-METERS', label: 'MTR (Meters)' },
  { code: 'SET-SETS', label: 'SET (Sets)' },
  { code: 'PAC-PACKETS', label: 'PAC (Packets)' },
];

const emptyForm = {
  name: '', category: 'Raw Materials', quantity: 0, price: 0, cost: 0,
  itemType: 'raw_material',
  sku: '', description: '', lowStockThreshold: 10, unit: 'KGS', uqcUnit: 'KGS-KILOGRAMS',
  hsnCode: '', gstRate: 18, taxability: 'Taxable', typeOfSupply: 'Goods'
};

export default function RawMaterials() {
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
        const rmItems = (Array.isArray(data) ? data : []).filter(
          p => p.itemType === 'raw_material'
        );
        setProducts(rmItems);
      })
      .catch(() => {
        setError('Failed to load raw materials.');
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
    setForm({ ...emptyForm, itemType: 'raw_material' });
    setEditId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, category: p.category || 'Raw Materials', quantity: p.quantity,
      itemType: 'raw_material',
      price: p.price || 0, cost: p.cost || 0, sku: p.sku, description: p.description || '',
      lowStockThreshold: p.lowStockThreshold || 10, unit: p.unit || 'KGS',
      uqcUnit: p.uqcUnit || 'KGS-KILOGRAMS', hsnCode: p.hsnCode || '', gstRate: p.gstRate || 18,
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
        itemType: 'raw_material',
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
      setError(err.response?.data?.message || err.message || 'Error saving raw material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete Raw Material item "${name}"?`)) return;
    try { await deleteProduct(id); load(); }
    catch { alert('Failed to delete item'); }
  };

  const totalCostValuation = products.reduce((acc, p) => acc + ((p.quantity || 0) * (p.cost || p.price || 0)), 0);
  const totalStockUnits = products.reduce((acc, p) => acc + (p.quantity || 0), 0);

  return (
    <div className="py-2">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold text-dark" style={{ letterSpacing: '-0.3px' }}>
            <i className="bi bi-bricks me-2 text-warning"></i>Raw Material (RM) Master
          </h4>
          <p className="text-muted small mb-0">
            Catalog & stock inventory for raw ingredients, components & packing materials
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {can('rawmaterials.add') && (
            <button className="btn-v warning btn-sm text-dark fw-bold" onClick={openAdd}>
              <i className="bi bi-plus-lg me-1"></i> Add Raw Material
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL RAW MATERIALS</div>
            <div className="tally-stat-value text-warning">{products.length}</div>
            <div className="tally-stat-sub text-muted">Input Components SKUs</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL MATERIAL STOCK</div>
            <div className="tally-stat-value text-primary">{totalStockUnits.toLocaleString()} Units</div>
            <div className="tally-stat-sub text-muted">In Godowns / Stores</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="tally-stat-card">
            <div className="tally-stat-label">RM INVENTORY COST VALUE</div>
            <div className="tally-stat-value text-dark">₹{totalCostValuation.toLocaleString('en-IN')}</div>
            <div className="tally-stat-sub text-muted">Purchase Cost Value</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="v-card">
        <div className="v-card-header d-flex justify-content-between align-items-center">
          <span><i className="bi bi-bricks me-2 text-warning"></i>RAW MATERIAL REGISTER</span>
          <span className="badge bg-warning bg-opacity-25 text-dark fw-bold">PRODUCTION INGREDIENTS</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="spinner-center py-4">
              <div className="spinner-border text-warning" style={{ width: '2rem', height: '2rem' }}></div>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state-v py-4">
              <i className="bi bi-bricks text-muted" style={{ fontSize: '2rem' }}></i>
              <h5 className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.88rem' }}>No Raw Materials Found</h5>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Click "Add Raw Material" to record your first component stock</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>RM MATERIAL NAME</th>
                  <th>SKU / HSN</th>
                  <th>GROUP</th>
                  <th className="text-end">AVAILABLE QTY</th>
                  <th className="text-end">COST PRICE (₹)</th>
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
                      <small className="text-muted">{p.uqcUnit || 'KGS'}</small>
                    </td>
                    <td>
                      <code className="text-warning text-dark">{p.sku}</code>
                      {p.hsnCode && <div className="small text-muted">HSN: {p.hsnCode}</div>}
                    </td>
                    <td><span className="badge-v secondary">{p.category || 'Raw Materials'}</span></td>
                    <td className="fw-bold text-end text-dark">{p.quantity} {p.unit || 'Kgs'}</td>
                    <td className="text-end fw-semibold">₹{(p.cost || p.price || 0).toLocaleString('en-IN')}</td>
                    <td className="text-end fw-bold text-primary">₹{((p.quantity || 0) * (p.cost || p.price || 0)).toLocaleString('en-IN')}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        {can('rawmaterials.edit') && (
                          <button className="btn-v outline-primary btn-sm px-2" onClick={() => openEdit(p)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {can('rawmaterials.delete') && (
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
            <div className="modal-box-header d-flex justify-content-between align-items-center bg-warning text-dark p-3">
              <div className="fw-bold"><i className="bi bi-bricks me-2"></i>{editId ? 'EDIT RAW MATERIAL ITEM' : 'CREATE NEW RAW MATERIAL ITEM'}</div>
              <button className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-box-body p-3" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
                {error && <div className="alert-v danger mb-3"><i className="bi bi-exclamation-circle me-1"></i> {error}</div>}
                
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Material Name *</label>
                    <input className="form-control" placeholder="e.g. Steel Sheet / IC Chip"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">SKU / Item Code *</label>
                    <input className="form-control" placeholder="e.g. RM-STEEL-001"
                      value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Cost Purchase Price (₹) *</label>
                    <input type="number" className="form-control" placeholder="0.00"
                      value={form.cost || form.price} onChange={(e) => setForm({ ...form, cost: e.target.value, price: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Initial Opening Stock Qty</label>
                    <input type="number" className="form-control" placeholder="0"
                      value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">HSN Code</label>
                    <input className="form-control" placeholder="72081000"
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
                <button type="submit" className="btn-v warning text-dark fw-bold" disabled={saving}>
                  {saving ? 'Saving...' : editId ? 'Update Raw Material' : 'Create Raw Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
