import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats } from '../services/api';

function Dashboard({ showLowStockOnly = false }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(() => {
    setLoading(true);
    getStats()
      .then((res) => {
        const data = res.data || res;
        setStats(data);
      })
      .catch(() => {
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'F2') {
        e.preventDefault();
        navigate('/transactions');
      } else if (e.key === 'F4') {
        e.preventDefault();
        navigate('/invoices');
      } else if (e.key === 'F5') {
        e.preventDefault();
        loadStats();
      } else if (e.key === 'F7') {
        e.preventDefault();
        navigate('/transactions');
      } else if (e.altKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        navigate('/invoices');
      } else if (e.altKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        navigate('/stock-in');
      } else if (e.altKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        navigate('/stock-out');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, loadStats]);

  if (loading) {
    return (
      <div className="spinner-center">
        <div className="text-center">
          <div className="spinner-border" style={{ color: 'var(--primary)', width: '2.2rem', height: '2.2rem' }}></div>
          <p className="mt-2 text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>Loading EHN One Gateway…</p>
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
      label: 'TOTAL INVENTORY VALUE',
      value: '₹' + (stats.totalValue || 0).toLocaleString('en-IN'),
      icon: 'bi-currency-rupee',
      color: 'primary',
      desc: 'Valuation at Purchase Cost'
    },
    {
      label: 'TOTAL STOCK UNITS',
      value: (stats.totalStock || 0).toLocaleString(),
      icon: 'bi-stack',
      color: 'success',
      desc: 'Physical Goods Quantity'
    },
    {
      label: 'LOW STOCK WARNINGS',
      value: stats.lowStockCount || 0,
      icon: 'bi-exclamation-triangle-fill',
      color: 'danger',
      desc: 'Requires Reorder Action'
    },
    {
      label: 'ACTIVE PRODUCT MASTERS',
      value: (stats.totalProducts || 0).toLocaleString(),
      icon: 'bi-box-seam',
      color: 'info',
      desc: 'Catalog Master SKUs'
    },
  ];

  if (showLowStockOnly) {
    return (
      <div>
        <div className="tally-header-bar mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <span className="tally-header-badge bg-danger text-white">REORDER</span>
              <h5 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.95rem' }}>
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                Critical Low Stock & Out-of-Stock Register
              </h5>
            </div>
            <button className="btn-v primary btn-sm" onClick={() => navigate('/')}>
              <i className="bi bi-arrow-left me-1"></i> Back to Gateway
            </button>
          </div>
        </div>
        <LowStockTable items={stats.lowStockItems} />
      </div>
    );
  }

  return (
    <div>
      {/* Gateway of Tally Top Header Banner */}
      <div className="tally-header-bar mb-3 shadow-sm">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="tally-header-badge" style={{ background: 'var(--primary)', color: '#fff' }}>GATEWAY</span>
            <div>
              <h5 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                EHN ONE GATEWAY &mdash; EXECUTIVE BUSINESS OVERVIEW
              </h5>
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                F.Y. 2026-2027 | Live Company Session | Kedvass Hygiene Products
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn-v outline-primary btn-sm" onClick={loadStats} title="Refresh System Data">
              <i className="bi bi-arrow-clockwise me-1"></i> [F5] Refresh
            </button>
            <button className="btn-v primary btn-sm" onClick={() => navigate('/invoices')}>
              <i className="bi bi-plus-square me-1"></i> [Alt+I] New Invoice
            </button>
          </div>
        </div>

        {/* F1-F8 Quick Software Action Toolbar */}
        <div className="tally-toolbar mt-2 pt-2 border-top d-flex gap-2 flex-wrap">
          <button className="tally-shortcut-btn" onClick={() => navigate('/transactions')}>
            <span className="key">[F2]</span> Period Ledger
          </button>
          <button className="tally-shortcut-btn" onClick={() => navigate('/invoices')}>
            <span className="key">[F4]</span> Billing Vouchers
          </button>
          <button className="tally-shortcut-btn" onClick={() => navigate('/reports')}>
            <span className="key">[F5]</span> Stock Valuation
          </button>
          <button className="tally-shortcut-btn" onClick={() => navigate('/transactions')}>
            <span className="key">[F7]</span> Daybook Audit
          </button>
          <button className="tally-shortcut-btn" onClick={() => navigate('/stock-in')}>
            <span className="key">[Alt+G]</span> Stock In Entry
          </button>
          <button className="tally-shortcut-btn" onClick={() => navigate('/stock-out')}>
            <span className="key">[Alt+O]</span> Stock Out Entry
          </button>
        </div>
      </div>

      {/* Tally Metric Cards Grid */}
      <div className="row g-2 mb-3">
        {statCards.map((s) => (
          <div key={s.label} className="col-xl-3 col-sm-6">
            <div className="tally-stat-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="tally-stat-label">{s.label}</div>
                  <div className="tally-stat-value">{s.value}</div>
                </div>
                <div className={`tally-stat-icon ${s.color}`}>
                  <i className={`bi ${s.icon}`}></i>
                </div>
              </div>
              <div className="tally-stat-sub text-muted">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gateway Split View: Left Command Menu + Right Ledger Table */}
      <div className="row g-3">
        {/* Left Gateway Command Panel */}
        <div className="col-lg-4 col-md-5">
          <div className="v-card mb-3">
            <div className="v-card-header bg-slate d-flex justify-content-between align-items-center">
              <span><i className="bi bi-menu-button-wide me-2" style={{ color: 'var(--primary)' }}></i>GATEWAY COMMANDS</span>
              <span className="badge-v primary" style={{ fontSize: '0.65rem' }}>EHN ONE ERP</span>
            </div>
            <div className="v-card-body p-2">
              <div className="tally-command-group mb-2">
                <div className="tally-command-title">VOUCHER TRANSACTIONS</div>
                <button className="tally-command-btn" onClick={() => navigate('/invoices')}>
                  <span><i className="bi bi-receipt me-2 text-primary"></i>Sales Invoice Voucher</span>
                  <kbd>Alt+I</kbd>
                </button>
                <button className="tally-command-btn" onClick={() => navigate('/stock-in')}>
                  <span><i className="bi bi-arrow-down-circle me-2 text-success"></i>Stock Receipt Entry</span>
                  <kbd>Alt+G</kbd>
                </button>
                <button className="tally-command-btn" onClick={() => navigate('/stock-out')}>
                  <span><i className="bi bi-arrow-up-circle me-2 text-danger"></i>Goods Issue Voucher</span>
                  <kbd>Alt+O</kbd>
                </button>
              </div>

              <div className="tally-command-group mb-2">
                <div className="tally-command-title">MASTERS MANAGEMENT</div>
                <button className="tally-command-btn" onClick={() => navigate('/products')}>
                  <span><i className="bi bi-box-seam me-2 text-info"></i>Stock Item Masters</span>
                  <kbd>Alt+P</kbd>
                </button>
                <button className="tally-command-btn" onClick={() => navigate('/customers')}>
                  <span><i className="bi bi-people me-2 text-warning"></i>Customer Sundry Debtors</span>
                  <kbd>Alt+C</kbd>
                </button>
                <button className="tally-command-btn" onClick={() => navigate('/suppliers')}>
                  <span><i className="bi bi-truck me-2 text-secondary"></i>Supplier Sundry Creditors</span>
                  <kbd>Alt+S</kbd>
                </button>
              </div>

              <div className="tally-command-group">
                <div className="tally-command-title">REPORTS & EXPORTS</div>
                <button className="tally-command-btn" onClick={() => navigate('/reports')}>
                  <span><i className="bi bi-bar-chart-line me-2 text-primary"></i>GSTR & Stock Reports</span>
                  <kbd>F5</kbd>
                </button>
                <button className="tally-command-btn" onClick={() => navigate('/reports')}>
                  <span><i className="bi bi-filetype-xml me-2 text-danger"></i>Export EHN One XML</span>
                  <kbd>Alt+E</kbd>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Financial Summary Card */}
          <div className="v-card">
            <div className="v-card-header">
              <i className="bi bi-calculator me-2" style={{ color: 'var(--primary)' }}></i>
              VALUATION & REGISTER SUMMARY
            </div>
            <div className="v-card-body p-0">
              <table className="v-table">
                <tbody>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>Critical Out of Stock</td>
                    <td className="text-end fw-bold text-danger">
                      {(stats.lowStockItems || []).filter((i) => i.quantity === 0).length} Items
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>Low Stock Warning</td>
                    <td className="text-end fw-bold text-warning">
                      {(stats.lowStockItems || []).filter((i) => i.quantity > 0).length} Items
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>Total Item Masters</td>
                    <td className="text-end fw-bold">{stats.totalProducts} Masters</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>Total Inventory Units</td>
                    <td className="text-end fw-bold">{stats.totalStock.toLocaleString()} Pcs</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>Net Inventory Valuation</td>
                    <td className="text-end fw-bold text-primary">
                      ₹{stats.totalValue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Low Stock Register Table */}
        <div className="col-lg-8 col-md-7">
          <LowStockTable items={stats.lowStockItems || []} />
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
          <div className="empty-state-v" style={{ padding: '30px 20px' }}>
            <i className="bi bi-check-circle-fill" style={{ color: 'var(--success)' }}></i>
            <h5 className="fw-bold text-uppercase" style={{ fontSize: '0.9rem' }}>ALL STOCK ITEM MASTERS OPTIMAL</h5>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>No low stock alerts recorded. Inventory stock levels are fully maintained.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="v-card mb-3">
      <div className="v-card-header d-flex justify-content-between align-items-center">
        <span>
          <i className="bi bi-exclamation-diamond-fill me-2" style={{ color: 'var(--danger)' }}></i>
          CRITICAL REORDER REGISTER (LOW STOCK ALERTS)
        </span>
        <span className="badge-v danger">{items.length} CRITICAL</span>
      </div>
      <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
        <table className="v-table">
          <thead>
            <tr>
              <th>ITEM NAME</th>
              <th>SKU / CODE</th>
              <th>CATEGORY</th>
              <th>CURRENT STOCK</th>
              <th>MIN THRESHOLD</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td className="fw-bold">{item.name}</td>
                <td><code style={{ color: 'var(--primary)', fontSize: '0.78rem' }}>{item.sku}</code></td>
                <td>{item.category}</td>
                <td className="fw-bold text-danger">{item.quantity}</td>
                <td>{item.lowStockThreshold}</td>
                <td>
                  {item.quantity === 0
                    ? <span className="badge-v danger">OUT OF STOCK</span>
                    : <span className="badge-v warning">LOW STOCK</span>
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
