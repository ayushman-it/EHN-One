import React, { useEffect, useState, useCallback } from 'react';
import { getStats } from '../services/api';

function Dashboard({ showLowStockOnly = false }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(() => {
    setLoading(true);
    getStats()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading) {
    return (
      <div className="spinner-center">
        <div className="text-center">
          <div className="spinner-border" style={{ color: 'var(--primary)', width: '2.5rem', height: '2.5rem' }}></div>
          <p className="mt-3 text-muted" style={{ fontSize: '0.85rem' }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state-v">
        <i className="bi bi-exclamation-triangle"></i>
        <h5>Could not load data</h5>
        <p>Make sure the backend server is running on port 5000</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Products',
      value: stats.totalProducts.toLocaleString(),
      icon: 'bi-box-seam',
      color: 'primary',
      change: null,
    },
    {
      label: 'Total Stock Units',
      value: stats.totalStock.toLocaleString(),
      icon: 'bi-stack',
      color: 'success',
      change: null,
    },
    {
      label: 'Low Stock Alerts',
      value: stats.lowStockCount,
      icon: 'bi-exclamation-triangle',
      color: 'danger',
      change: null,
    },
    {
      label: 'Inventory Value',
      value: '₹' + stats.totalValue.toLocaleString('en-IN'),
      icon: 'bi-currency-rupee',
      color: 'warning',
      change: null,
    },
  ];

  if (showLowStockOnly) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-top">
            <h1 className="page-title">
              <i className="bi bi-exclamation-triangle me-2" style={{ color: 'var(--danger)' }}></i>
              Low Stock Alerts
            </h1>
          </div>
          <p className="page-subtitle">Products that have reached or crossed their low stock threshold</p>
        </div>
        <LowStockTable items={stats.lowStockItems} />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, Admin. Here's your inventory overview.</p>
          </div>
          <button className="btn-v primary" onClick={loadStats}>
            <i className="bi bi-arrow-clockwise"></i>
            <span className="d-none d-sm-inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {statCards.map((s) => (
          <div key={s.label} className="col-xl-3 col-sm-6">
            <div className="stat-card">
              <div className={`stat-card-icon ${s.color}`}>
                <i className={`bi ${s.icon}`}></i>
              </div>
              <div className="stat-card-body">
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value">{s.value}</div>
                {s.change && (
                  <div className={`stat-card-change ${s.change > 0 ? 'up' : 'down'}`}>
                    <i className={`bi bi-arrow-${s.change > 0 ? 'up' : 'down'}-short`}></i>
                    {Math.abs(s.change)}% vs last month
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Table */}
      <LowStockTable items={stats.lowStockItems} />

      {/* Summary Row */}
      <div className="row g-3 mt-1">
        <div className="col-md-6">
          <div className="v-card">
            <div className="v-card-header">
              <i className="bi bi-info-circle"></i>
              Quick Stats
            </div>
            <div className="v-card-body">
              <table className="v-table">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>Out of Stock Items</td>
                    <td className="text-end fw-bold" style={{ color: 'var(--danger)' }}>
                      {stats.lowStockItems.filter((i) => i.quantity === 0).length}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>Low Stock Items</td>
                    <td className="text-end fw-bold" style={{ color: 'var(--warning)' }}>
                      {stats.lowStockItems.filter((i) => i.quantity > 0).length}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>Total Products</td>
                    <td className="text-end fw-bold">{stats.totalProducts}</td>
                  </tr>
                  <tr>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>Total Stock Units</td>
                    <td className="text-end fw-bold">{stats.totalStock.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>Total Inventory Value</td>
                    <td className="text-end fw-bold" style={{ color: 'var(--primary)' }}>
                      ₹{stats.totalValue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="v-card h-100">
            <div className="v-card-header">
              <i className="bi bi-lightbulb"></i>
              Tips
            </div>
            <div className="v-card-body">
              <ul style={{ paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '2' }}>
                <li>Go to <strong>Products</strong> to add or update inventory items.</li>
                <li>Use <strong>Stock In</strong> to record incoming goods.</li>
                <li>Use <strong>Stock Out</strong> to record dispatched items.</li>
                <li>Set <strong>Low Stock Threshold</strong> per product to get alerts.</li>
                <li>Check <strong>Low Stock Alerts</strong> regularly to avoid stockouts.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LowStockTable({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="v-card mb-4">
        <div className="v-card-body">
          <div className="empty-state-v" style={{ padding: '40px 20px' }}>
            <i className="bi bi-check-circle" style={{ color: 'var(--success)' }}></i>
            <h5>All Good!</h5>
            <p>No low stock alerts. Your inventory is well stocked.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="v-card mb-4">
      <div className="v-card-header">
        <i className="bi bi-exclamation-diamond" style={{ color: 'var(--danger)' }}></i>
        Low Stock Alerts
        <span className="badge-v danger ms-auto">{items.length}</span>
      </div>
      <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
        <table className="v-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Threshold</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td className="fw-semibold">{item.name}</td>
                <td><code style={{ color: 'var(--primary)', fontSize: '0.82rem' }}>{item.sku}</code></td>
                <td>{item.category}</td>
                <td className="fw-bold" style={{ color: 'var(--danger)' }}>{item.quantity}</td>
                <td>{item.lowStockThreshold}</td>
                <td>
                  {item.quantity === 0
                    ? <span className="badge-v danger">Out of Stock</span>
                    : <span className="badge-v warning">Low Stock</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
