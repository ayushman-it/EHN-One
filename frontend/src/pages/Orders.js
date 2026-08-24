import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCustomers } from '../services/api';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportHelper';
import Pagination from '../components/Pagination';

export default function Orders() {
  const { user, can } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [salesmanFilter, setSalesmanFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orders', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setOrders(data.data);
        }
      }
    } catch (e) {
      console.error('Error loading orders:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (e) {
      console.error('Error updating order status:', e);
    }
  };

  const availableSalesmen = Array.from(new Set(orders.map(o => o.salesman).filter(Boolean)));

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
      (o.customer && o.customer.toLowerCase().includes(q)) ||
      (o.salesman && o.salesman.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchSalesman = salesmanFilter === 'all' || o.salesman === salesmanFilter;
    return matchSearch && matchStatus && matchSalesman;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'approved').length,
    invoiced: orders.filter(o => o.status === 'invoiced').length,
    totalValue: orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0),
  };

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Order Date', 'Customer / Shop', 'Created By (Salesman)', 'Items Qty', 'Total Value (₹)', 'Status'];
    const rows = filteredOrders.map(o => [
      o.orderNumber || '',
      new Date(o.orderDate || o.createdAt).toLocaleDateString('en-IN'),
      o.customer || '',
      o.salesman || '',
      (o.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0),
      o.totalAmount || 0,
      (o.status || '').toUpperCase()
    ]);
    exportToCSV('sales_orders_report.csv', headers, rows);
  };

  return (
    <div className="py-2">
      {/* Page Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold text-dark" style={{ letterSpacing: '-0.3px' }}>
            <i className="bi bi-cart-check me-2 text-primary"></i>Sales Orders Booking & Dispatch Register
          </h4>
          <p className="text-muted small mb-0">
            Book salesman field orders, inspect live stock, view previous shop order history & fulfill orders
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn-v outline-secondary btn-sm" onClick={handleExportCSV}>
            <i className="bi bi-filetype-csv me-1"></i> Export CSV
          </button>
          {can('orders.manage') && (
            <button className="btn-v primary btn-sm" onClick={() => setShowCreateModal(true)}>
              <i className="bi bi-plus-lg me-1"></i> Book New Sales Order
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-2 mb-3">
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL BOOKED ORDERS</div>
            <div className="tally-stat-value text-dark">{stats.total}</div>
            <div className="tally-stat-sub text-muted">Sales Orders Register</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">PENDING BACKEND REVIEW</div>
            <div className="tally-stat-value text-warning">{stats.pending}</div>
            <div className="tally-stat-sub text-danger fw-bold">Requires Action</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">APPROVED / INVOICED</div>
            <div className="tally-stat-value text-success">{stats.approved + stats.invoiced}</div>
            <div className="tally-stat-sub text-muted">Dispatched & Completed</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL ORDERS VALUE</div>
            <div className="tally-stat-value text-primary">₹{stats.totalValue.toLocaleString('en-IN')}</div>
            <div className="tally-stat-sub text-muted">Booked Gross Value</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="v-card mb-3">
        <div className="v-card-body p-2">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <div className="search-box-v flex-grow-1">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search orders by order #, customer/shop name, or salesman..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center gap-2">
              {/* Filter by Creator / Salesman User */}
              <select
                className="form-select form-select-sm fw-bold style-cursor text-success border-success"
                value={salesmanFilter}
                onChange={(e) => setSalesmanFilter(e.target.value)}
              >
                <option value="all">All Salesmen / Users</option>
                {availableSalesmen.map(s => (
                  <option key={s} value={s}>Salesman: {s}</option>
                ))}
              </select>

              <select
                className="form-select form-select-sm fw-bold style-cursor"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Order Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="invoiced">Invoiced</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button className="btn-v outline-secondary btn-sm" onClick={fetchOrders} title="Refresh">
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="v-card">
        <div className="v-card-header d-flex justify-content-between align-items-center">
          <span><i className="bi bi-cart-check me-2 text-primary"></i>SALES ORDERS REGISTER</span>
          <span className="text-muted small">REAL-TIME FIELD BOOKING & BACKEND FULFILLMENT</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="spinner-center py-4">
              <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }}></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state-v py-4">
              <i className="bi bi-cart-x text-muted" style={{ fontSize: '2rem' }}></i>
              <h5 className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.88rem' }}>No Sales Orders Found</h5>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Click "Book New Sales Order" to record an order from a shop</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>ORDER NO & DATE</th>
                  <th>SHOP / CUSTOMER NAME</th>
                  <th>CREATED BY (USER / SALESMAN)</th>
                  <th>ITEMS ORDERED</th>
                  <th className="text-end">TOTAL VALUE (₹)</th>
                  <th>STATUS</th>
                  <th className="text-end" style={{ width: 140 }}>BACKEND ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((o, i) => (
                  <tr key={o._id}>
                    <td className="text-muted fw-semibold">{(currentPage - 1) * pageSize + i + 1}</td>
                    <td>
                      <div className="fw-bold text-primary">{o.orderNumber}</div>
                      <small className="text-muted">
                        {new Date(o.orderDate || o.createdAt).toLocaleDateString('en-IN')}
                      </small>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{o.customer}</div>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark" style={{ fontSize: '0.84rem' }}>
                        <i className="bi bi-person-circle me-1.5 text-primary"></i>{o.salesman}
                      </span>
                    </td>
                    <td>
                      <div className="fw-semibold small">
                        {(o.items || []).map(it => `${it.product} (${it.quantity} ${it.unit || 'Pcs'})`).join(', ')}
                      </div>
                    </td>
                    <td className="text-end fw-bold text-dark">
                      ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                      {o.status === 'pending' && <span className="badge bg-warning text-dark fw-bold"><i className="bi bi-clock me-1"></i>Pending</span>}
                      {o.status === 'approved' && <span className="badge bg-info text-white fw-bold"><i className="bi bi-patch-check me-1"></i>Approved</span>}
                      {o.status === 'invoiced' && <span className="badge bg-success text-white fw-bold"><i className="bi bi-check-all me-1"></i>Invoiced</span>}
                      {o.status === 'cancelled' && <span className="badge bg-danger text-white fw-bold"><i className="bi bi-x-circle me-1"></i>Cancelled</span>}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button className="btn-v outline-primary btn-sm px-2" onClick={() => setViewOrder(o)} title="View Order Details">
                          <i className="bi bi-eye"></i>
                        </button>
                        {o.status === 'pending' && (
                          <button className="btn-v success btn-sm px-2" onClick={() => updateOrderStatus(o._id, 'approved')} title="Approve Order">
                            <i className="bi bi-check-lg me-1"></i> Approve
                          </button>
                        )}
                        {o.status === 'approved' && (
                          <button className="btn-v primary btn-sm px-2" onClick={() => updateOrderStatus(o._id, 'invoiced')} title="Mark Invoiced">
                            <i className="bi bi-receipt me-1"></i> Invoice
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

      {/* View Order Modal */}
      {viewOrder && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewOrder(null); }}>
          <div className="modal-box" style={{ maxWidth: 600 }}>
            <div className="modal-box-header d-flex justify-content-between align-items-center bg-primary text-white p-3">
              <div className="fw-bold"><i className="bi bi-cart-check me-2"></i>SALES ORDER DETAILS - {viewOrder.orderNumber}</div>
              <button className="btn-close btn-close-white" onClick={() => setViewOrder(null)}></button>
            </div>
            <div className="modal-box-body p-3">
              <div className="row g-2 mb-3 bg-light p-2 rounded border m-0">
                <div className="col-6"><span className="text-muted small">Customer Shop:</span> <div className="fw-bold">{viewOrder.customer}</div></div>
                <div className="col-6"><span className="text-muted small">Booked By:</span> <div className="fw-bold">{viewOrder.salesman}</div></div>
                <div className="col-6"><span className="text-muted small">Order Date:</span> <div className="fw-bold">{new Date(viewOrder.orderDate || viewOrder.createdAt).toLocaleString('en-IN')}</div></div>
                <div className="col-6"><span className="text-muted small">Status:</span> <div className="fw-bold text-uppercase text-primary">{viewOrder.status}</div></div>
              </div>

              <div className="fw-bold text-dark mb-2">Order Line Items:</div>
              <table className="v-table mb-3">
                <thead>
                  <tr><th>ITEM NAME</th><th className="text-center">QTY</th><th className="text-end">PRICE</th><th className="text-end">TOTAL</th></tr>
                </thead>
                <tbody>
                  {(viewOrder.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{it.product}</td>
                      <td className="text-center">{it.quantity} {it.unit || 'PCS'}</td>
                      <td className="text-end">₹{(it.price || 0).toLocaleString('en-IN')}</td>
                      <td className="text-end fw-bold">₹{(it.total || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {viewOrder.notes && (
                <div className="alert alert-info py-2 small mb-0">
                  <i className="bi bi-sticky me-1"></i> <strong>Salesman Notes:</strong> {viewOrder.notes}
                </div>
              )}
            </div>
            <div className="modal-box-footer p-2 bg-light border-top text-end">
              <button className="btn-v secondary btn-sm" onClick={() => setViewOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Sales Order Booking Modal */}
      {showCreateModal && (
        <CreateOrderModal 
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false);
            fetchOrders();
          }}
          currentUser={user}
        />
      )}
    </div>
  );
}

/* Modal Component for Sales Order Booking with Live Stock & Previous Shop Orders History */
function CreateOrderModal({ onClose, onSave, currentUser }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustName, setSelectedCustName] = useState('');
  const [shopHistory, setShopHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [items, setItems] = useState([
    { product: '', sku: '', quantity: 1, price: 0, unit: 'PCS', total: 0, liveStock: 0 }
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Fetch Products catalog with live stock quantity
    fetch('/api/products', {
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});

    // Fetch Customers Directory
    getCustomers().then(r => {
      const data = r.data || r;
      if (Array.isArray(data) && data.length > 0) {
        setCustomers(data);
        const firstCust = data[0].name || '';
        setSelectedCustName(firstCust);
        fetchShopHistory(firstCust);
      }
    }).catch(() => {});
  }, []);

  // Query Previous Orders for the selected shop
  const fetchShopHistory = (shopName) => {
    if (!shopName) return;
    setLoadingHistory(true);
    const token = localStorage.getItem('token');
    fetch(`/api/orders/customer/${encodeURIComponent(shopName)}`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setShopHistory(data.data.slice(0, 3)); // show last 3 orders
        } else {
          setShopHistory([]);
        }
      })
      .catch(() => setShopHistory([]))
      .finally(() => setLoadingHistory(false));
  };

  const handleCustomerSelect = (name) => {
    setSelectedCustName(name);
    fetchShopHistory(name);
  };

  const handleItemChange = (index, field, val) => {
    const newItems = [...items];
    newItems[index][field] = val;

    if (field === 'quantity' || field === 'price') {
      const q = Number(newItems[index].quantity) || 0;
      const p = Number(newItems[index].price) || 0;
      newItems[index].total = q * p;
    }
    setItems(newItems);
  };

  const handleProductSelect = (index, prodName) => {
    const found = products.find(p => p.name === prodName);
    const newItems = [...items];
    if (found) {
      newItems[index].product = found.name;
      newItems[index].sku = found.sku || '';
      newItems[index].price = found.price || 0;
      newItems[index].unit = found.unit || 'PCS';
      newItems[index].liveStock = found.quantity || 0;
      newItems[index].total = (newItems[index].quantity || 1) * (found.price || 0);
    } else {
      newItems[index].product = prodName;
    }
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { product: '', sku: '', quantity: 1, price: 0, unit: 'PCS', total: 0, liveStock: 0 }]);
  };

  const removeItemRow = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const totalAmount = items.reduce((acc, it) => acc + (it.total || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const orderData = {
      customer: selectedCustName || 'General Shop Customer',
      salesman: currentUser?.name || 'Field Salesman',
      salesmanId: currentUser?.id || '',
      items,
      totalAmount,
      notes
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        onSave();
      } else {
        const d = await res.json();
        setError(d.message || 'Error booking sales order');
      }
    } catch (err) {
      setError(err.message || 'Server error booking sales order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 840 }}>
        <div className="modal-box-header d-flex justify-content-between align-items-center bg-primary text-white p-3">
          <div className="fw-bold">
            <i className="bi bi-cart-plus me-2"></i>BOOK NEW SALES ORDER &mdash; FIELD SALESMAN
          </div>
          <button className="btn-close btn-close-white" onClick={onClose}></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-box-body p-3.5 bg-white" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
            {error && <div className="alert-v danger mb-3"><i className="bi bi-exclamation-circle me-1"></i> {error}</div>}

            <div className="row g-3 mb-3">
              {/* Customer / Shop Selection */}
              <div className="col-md-6">
                <label className="form-label fw-bold text-dark small mb-1">
                  <i className="bi bi-shop me-1 text-primary"></i> Select Customer Shop *
                </label>
                <select
                  className="form-select fw-bold style-cursor"
                  value={selectedCustName}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  required
                >
                  <option value="">-- Select Shop / Customer --</option>
                  {customers.map(c => (
                    <option key={c._id || c.id} value={c.name}>{c.name} ({c.city || 'Local'})</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-dark small mb-1">
                  <i className="bi bi-person-badge me-1 text-success"></i> Salesman Auto-Tagged
                </label>
                <input 
                  className="form-control fw-bold bg-light" 
                  value={`${currentUser?.name || 'Field Salesman'} (${currentUser?.role || 'operator'})`} 
                  readOnly 
                />
              </div>
            </div>

            {/* PREVIOUS ORDERS HISTORY FOR THE SAME SHOP */}
            <div className="border rounded bg-light p-3 mb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="fw-bold text-dark small">
                  <i className="bi bi-history me-1 text-warning"></i> Previous Orders History for: <span className="text-primary">{selectedCustName || 'Selected Shop'}</span>
                </div>
                {loadingHistory && <span className="spinner-border spinner-border-sm text-primary"></span>}
              </div>

              {shopHistory.length === 0 ? (
                <div className="text-muted small italic">No previous orders recorded for this shop. First time order booking!</div>
              ) : (
                <div className="row g-2">
                  {shopHistory.map((hist, idx) => (
                    <div key={idx} className="col-md-4">
                      <div className="bg-white p-2 rounded border shadow-sm style-cursor" onClick={() => {
                        // Pre-fill order items from previous order history!
                        if (hist.items && hist.items.length > 0) {
                          setItems(hist.items.map(it => ({
                            product: it.product,
                            sku: it.sku || '',
                            quantity: it.quantity || 1,
                            price: it.price || 0,
                            unit: it.unit || 'PCS',
                            total: (it.quantity || 1) * (it.price || 0),
                            liveStock: 0
                          })));
                        }
                      }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-primary" style={{ fontSize: '0.75rem' }}>{hist.orderNumber}</span>
                          <span className="badge bg-success bg-opacity-15 text-success" style={{ fontSize: '0.65rem' }}>₹{hist.totalAmount}</span>
                        </div>
                        <div className="text-truncate text-secondary" style={{ fontSize: '0.7rem' }}>
                          {(hist.items || []).map(i => i.product).join(', ')}
                        </div>
                        <div className="text-muted mt-1 d-flex justify-content-between" style={{ fontSize: '0.65rem' }}>
                          <span>{new Date(hist.orderDate || hist.createdAt).toLocaleDateString('en-IN')}</span>
                          <span className="text-primary fw-bold">+ Re-order items</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ORDER ITEMS TABLE WITH LIVE STOCK CHECKING */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-bold text-dark small">
                <i className="bi bi-box-seam me-1 text-success"></i> Order Line Items (Live Stock Availability Enabled)
              </div>
              <button type="button" className="btn-v outline-primary btn-sm py-0.5" onClick={addItemRow}>
                <i className="bi bi-plus-circle me-1"></i> Add Item Row
              </button>
            </div>

            <div className="table-responsive mb-3">
              <table className="v-table">
                <thead>
                  <tr>
                    <th>SELECT PRODUCT (LIVE STOCK QTY)</th>
                    <th style={{ width: 90 }}>QTY</th>
                    <th style={{ width: 100 }}>UNIT</th>
                    <th style={{ width: 110 }}>RATE (₹)</th>
                    <th style={{ width: 120 }}>AMOUNT (₹)</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          list={`order-prod-list-${idx}`}
                          className="form-control form-control-sm fw-bold text-dark"
                          placeholder="Search or pick product..."
                          value={it.product}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          required
                        />
                        <datalist id={`order-prod-list-${idx}`}>
                          {products.map(p => (
                            <option key={p._id || p.sku} value={p.name}>
                              {p.name} [In Stock: {p.quantity || 0} {p.unit || 'Pcs'}] - ₹{p.price}
                            </option>
                          ))}
                        </datalist>

                        {/* Live Stock Quantity Indicator Badge */}
                        {it.product && (
                          <div className="mt-1 d-flex align-items-center gap-2" style={{ fontSize: '0.7rem' }}>
                            <span className={`badge ${it.liveStock > 10 ? 'bg-success' : it.liveStock > 0 ? 'bg-warning text-dark' : 'bg-danger'} fw-bold`}>
                              <i className="bi bi-boxes me-1"></i>LIVE STOCK: {it.liveStock} UNITS
                            </span>
                            {it.quantity > it.liveStock && (
                              <span className="text-danger fw-bold"><i className="bi bi-exclamation-triangle-fill me-1"></i>Overbooking Warning!</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm text-center fw-bold"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          min="1"
                          required
                        />
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm fw-semibold bg-light"
                          value={it.unit || 'PCS'}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm text-end fw-semibold"
                          value={it.price}
                          onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                          required
                        />
                      </td>
                      <td className="text-end fw-bold text-primary">
                        ₹{(it.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <button type="button" className="btn-close style-cursor mt-1" onClick={() => removeItemRow(idx)} title="Remove Row"></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row g-2 mb-2 align-items-center">
              <div className="col-md-7">
                <label className="form-label fw-bold text-dark small mb-1">Salesman Field Notes / Delivery Remarks</label>
                <input
                  className="form-control form-control-sm"
                  placeholder="e.g. Deliver before 5 PM, Shop owner requested 5% discount"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="col-md-5 text-end">
                <div className="small text-muted">Total Sales Order Amount:</div>
                <h3 className="fw-bold text-primary mb-0">₹{totalAmount.toLocaleString('en-IN')}</h3>
              </div>
            </div>
          </div>
          <div className="modal-box-footer d-flex justify-content-end gap-2 p-3 bg-light border-top">
            <button type="button" className="btn-v secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-v primary fw-bold" disabled={saving}>
              {saving ? 'Booking Order...' : 'Book Sales Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
