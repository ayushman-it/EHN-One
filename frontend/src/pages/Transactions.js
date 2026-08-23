import React, { useEffect, useState, useCallback } from 'react';
import { getProducts, getTransactions, stockIn, stockOut } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportHelper';
import DataImportModal from '../components/DataImportModal';
import Pagination from '../components/Pagination';

export default function Transactions({ defaultType = 'in' }) {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts]         = useState([]);
  const [form, setForm]                 = useState({ productId: '', quantity: '', notes: '' });
  const [type, setType]                 = useState(defaultType);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [pageSize, setPageSize]         = useState(10);
  const [showImportModal, setShowImportModal] = useState(false);
  const { can } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([getTransactions(), getProducts()]);
      const txnList = Array.isArray(t?.data) ? t.data : Array.isArray(t) ? t : [];
      const prodList = Array.isArray(p?.data) ? p.data : Array.isArray(p) ? p : [];
      setTransactions(txnList);
      setProducts(prodList);
    } catch {
      setTransactions([]);
      setProducts([]);
    }
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
    } catch (err) { setError(err.response?.data?.error || err.message || 'Transaction failed'); }
    finally { setSaving(false); }
  };

  const getExportData = () => {
    const headers = ['Voucher Date', 'Type', 'Product Name', 'Quantity', 'Notes'];
    const rows = transactions.map(t => [
      t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
      t.type?.toUpperCase() || 'STOCK IN',
      t.product?.name || 'Stock Item',
      t.quantity || 0,
      t.notes || ''
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    exportToCSV('Daybook_Stock_Ledger_Transactions', headers, rows);
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel('Daybook_Stock_Ledger_Transactions', 'Transactions', headers, rows);
  };

  const handleExportPDF = () => {
    const { headers, rows } = getExportData();
    exportToPDF('DAYBOOK STOCK LEDGER TRANSACTIONS', { name: 'Inventory System' }, headers, rows, { label: 'Total Transactions Count', value: `${transactions.length}` });
  };

  const handleImportTransactions = async (parsedData) => {
    for (const row of parsedData.rows) {
      if (!row || row.length === 0 || !row[0]) continue;
      const matchedProd = products.find(p => p.name?.toLowerCase() === row[2]?.toLowerCase());
      if (matchedProd) {
        const txnType = (row[1] || 'in').toLowerCase().includes('out') ? 'out' : 'in';
        const data = { productId: matchedProd._id || matchedProd.id, quantity: Number(row[3]) || 1, notes: row[4] || 'Bulk Imported Voucher' };
        try {
          if (txnType === 'in') await stockIn(data); else await stockOut(data);
        } catch (err) {}
      }
    }
    loadData();
  };

  const selectedProduct = Array.isArray(products)
    ? products.find((p) => (p._id || p.id) === form.productId)
    : null;
  const afterQty = selectedProduct
    ? selectedProduct.quantity + (type === 'in' ? 1 : -1) * Number(form.quantity || 0)
    : null;

  return (
    <div className="py-2">
      <DataImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        title="Import Stock Ledger Transactions (Vouchers)"
        templateHeaders={['Voucher Date', 'Type (in/out)', 'Product Name', 'Quantity', 'Notes']}
        sampleRows={[
          ['23/08/2026', 'in', 'Disinfectant Fragrance Cleaner 5L', 50, 'Opening Stock Import'],
          ['23/08/2026', 'out', 'Glass Cleaner Spray 500ml', 10, 'Branch Issue V-102']
        ]}
        onImport={handleImportTransactions} 
      />
      
      {/* Clean Modern Page Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold text-dark" style={{ letterSpacing: '-0.3px' }}>Stock Ledger & Transactions</h4>
          <p className="text-muted small mb-0">Record stock in, stock out movements & view complete daybook history</p>
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
          <button className="btn-v outline-primary btn-sm style-cursor" onClick={() => setShowImportModal(true)} title="Import Transactions Excel/CSV">
            <i className="bi bi-file-earmark-arrow-up me-1"></i> Import
          </button>
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
                  {(products || []).map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
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
            <>
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
                  {(transactions || [])
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((t) => (
                      <tr key={t._id || t.id}>
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

              <Pagination
                currentPage={currentPage}
                totalItems={transactions.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
