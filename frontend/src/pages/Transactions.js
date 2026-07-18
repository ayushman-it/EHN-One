import React, { useEffect, useState, useCallback } from 'react';
import { getProducts, getTransactions, stockIn, stockOut } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Transactions({ defaultType = 'in' }) {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts]         = useState([]);
  const [form, setForm]                 = useState({ productId: '', quantity: '', notes: '' });
  const [type, setType]                 = useState(defaultType);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const { can } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([getTransactions(), getProducts()]);
      setTransactions(t.data);
      setProducts(p.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3500); return () => clearTimeout(t); }
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const data = { ...form, quantity: Number(form.quantity) };
      if (type === 'in') await stockIn(data); else await stockOut(data);
      setForm({ productId: '', quantity: '', notes: '' });
      setSuccess(type === 'in' ? '✓ Stock added successfully!' : '✓ Stock removed successfully!');
      loadData();
    } catch (err) { setError(err.response?.data?.error || 'Transaction failed'); }
    finally { setSaving(false); }
  };

  const selectedProduct = products.find((p) => p._id === form.productId);
  const afterQty = selectedProduct
    ? selectedProduct.quantity + (type === 'in' ? 1 : -1) * Number(form.quantity || 0)
    : null;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">
              <i className="bi bi-arrow-left-right me-2" style={{ color: 'var(--primary)' }}></i>
              Transactions
            </h1>
            <p className="page-subtitle">Record stock in and stock out movements</p>
          </div>
        </div>
      </div>

      {/* Transaction Form Card */}
      {(can('transactions.stockin') || can('transactions.stockout')) ? (
      <div className="v-card mb-4">
        <div className="v-card-header">
          <i className="bi bi-pencil-square"></i>
          New Transaction
        </div>
        <div className="v-card-body">

          {/* Type Toggle */}
          <div className="d-flex gap-2 mb-4">
            <button
              type="button"
              className={`btn-v${type === 'in' ? ' success' : ' light'}`}
              onClick={() => { setType('in'); setError(''); }}
              style={{ minWidth: 120 }}
            >
              <i className="bi bi-arrow-down-circle"></i> Stock In
            </button>
            <button
              type="button"
              className={`btn-v${type === 'out' ? ' danger' : ' light'}`}
              onClick={() => { setType('out'); setError(''); }}
              style={{ minWidth: 120 }}
            >
              <i className="bi bi-arrow-up-circle"></i> Stock Out
            </button>
          </div>

          {error   && <div className="alert-v danger"><i className="bi bi-exclamation-circle"></i> {error}</div>}
          {success && <div className="alert-v success"><i className="bi bi-check-circle"></i> {success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Select Product *</label>
                <select
                  className="form-select"
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  required
                >
                  <option value="">— Choose product —</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku}) — Stock: {p.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label">Quantity *</label>
                <input
                  className="form-control"
                  type="number" min="1" placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Notes</label>
                <input
                  className="form-control"
                  placeholder="Optional notes…"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="col-md-3">
                <button
                  className={`btn-v w-100 ${type === 'in' ? 'success' : 'danger'}`}
                  type="submit"
                  disabled={saving}
                  style={{ justifyContent: 'center' }}
                >
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-1"></span>Processing…</>
                    : type === 'in' ? 'Add Stock' : 'Remove Stock'
                  }
                </button>
              </div>
            </div>

            {/* Product preview */}
            {selectedProduct && (
              <div className="txn-preview mt-3">
                <div className="row text-center g-2">
                  <div className="col-6 col-sm-3 txn-preview-item">
                    <div className="label">Current Stock</div>
                    <div className="value">{selectedProduct.quantity}</div>
                  </div>
                  <div className="col-6 col-sm-3 txn-preview-item">
                    <div className="label">Threshold</div>
                    <div className="value">{selectedProduct.lowStockThreshold}</div>
                  </div>
                  <div className="col-6 col-sm-3 txn-preview-item">
                    <div className="label">Price</div>
                    <div className="value">₹{selectedProduct.price.toLocaleString('en-IN')}</div>
                  </div>
                  {form.quantity && (
                    <div className="col-6 col-sm-3 txn-preview-item">
                      <div className="label">After Transaction</div>
                      <div className="value" style={{ color: afterQty < 0 ? 'var(--danger)' : afterQty <= selectedProduct.lowStockThreshold ? 'var(--warning)' : 'var(--success)' }}>
                        {afterQty}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
      ) : (
      <div className="v-card mb-4">
        <div className="v-card-body">
          <div className="empty-state-v" style={{ padding: '40px 20px' }}>
            <i className="bi bi-shield-x" style={{ color: 'var(--warning)' }}></i>
            <h5>View Only Access</h5>
            <p>You don't have permission to create transactions</p>
          </div>
        </div>
      </div>
      )}

      {/* Transaction History */}
      <div className="v-card">
        <div className="v-card-header">
          <i className="bi bi-clock-history"></i>
          Transaction History
          <span className="badge-v secondary ms-auto">{transactions.length}</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="spinner-center">
              <div className="spinner-border" style={{ color: 'var(--primary)' }}></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="empty-state-v">
              <i className="bi bi-arrow-left-right"></i>
              <h5>No Transactions Yet</h5>
              <p>Use the form above to record stock movements</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleTimeString('en-IN')}</div>
                    </td>
                    <td className="fw-semibold">{t.product?.name}</td>
                    <td><code style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>{t.product?.sku}</code></td>
                    <td>
                      {t.type === 'in'
                        ? <span className="badge-v success"><i className="bi bi-arrow-down-short"></i>IN</span>
                        : <span className="badge-v danger"><i className="bi bi-arrow-up-short"></i>OUT</span>
                      }
                    </td>
                    <td className="fw-bold">{t.quantity}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
