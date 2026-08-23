import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats } from '../services/api';

function Dashboard({ showLowStockOnly = false }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [companyName] = useState(() => {
    try {
      const cached = localStorage.getItem('ehn_company_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed?.company?.name || 'Kedvass Hygiene Products';
      }
    } catch (e) {}
    return 'Kedvass Hygiene Products';
  });

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
      <div className="spinner-center py-5">
        <div className="text-center">
          <div className="spinner-border" style={{ color: 'var(--primary)', width: '2.5rem', height: '2.5rem' }}></div>
          <p className="mt-3 text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Initializing EHN Dashboard…</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state-v py-5">
        <i className="bi bi-exclamation-triangle" style={{ fontSize: '2.5rem', color: 'var(--danger)' }}></i>
        <h5 className="mt-3 fw-bold">Could not load system data</h5>
        <p className="text-muted">Ensure the backend API server is running properly.</p>
        <button className="btn-v primary btn-sm mt-2" onClick={loadStats}>Retry Connection</button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'TOTAL INVENTORY VALUE',
      value: '₹' + (stats.totalValue || 0).toLocaleString('en-IN'),
      icon: 'bi-currency-rupee',
      color: 'primary',
      desc: 'Purchase Valuation Cost'
    },
    {
      label: 'TOTAL STOCK UNITS',
      value: (stats.totalStock || 0).toLocaleString(),
      icon: 'bi-stack',
      color: 'success',
      desc: 'Physical Goods Available'
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
      desc: 'Catalog SKUs Registered'
    },
  ];

  if (showLowStockOnly) {
    return (
      <div className="py-2">
        <div className="tally-header-bar mb-3 shadow-sm">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <span className="badge px-3 py-2 bg-danger text-white rounded-pill">REORDER</span>
              <h5 className="mb-0 fw-bold" style={{ fontSize: '1rem' }}>
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                Critical Low Stock & Reorder Register
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
    <div className="py-2">
      {/* Next-Gen Executive Hero Card Banner */}
      <div className="nextgen-hero-card mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 position-relative" style={{ zIndex: 2 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge px-2.5 py-1" style={{ background: '#4CAF50', color: '#fff', fontSize: '0.72rem', fontWeight: 600 }}>
                EHN ONE GATEWAY & AUTOMATION
              </span>
            </div>
            <h3 className="fw-bold mb-1 text-white" style={{ letterSpacing: '-0.5px' }}>
              Welcome back to {companyName}
            </h3>
            <p className="mb-0 text-white-50" style={{ fontSize: '0.88rem' }}>
              Real-time inventory valuation, automated WhatsApp alerts & executive command hub.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button className="btn btn-light btn-sm fw-semibold rounded-pill px-3 shadow-sm" onClick={loadStats} title="Refresh System Data">
              <i className="bi bi-arrow-clockwise me-1 text-success"></i> Refresh Data
            </button>
            <button className="btn btn-success btn-sm fw-semibold rounded-pill px-3 shadow-sm" onClick={() => navigate('/invoices')} style={{ background: '#4CAF50', border: 'none' }}>
              <i className="bi bi-plus-lg me-1"></i> Create Sales Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Next-Gen KPI Metric Cards Grid */}
      <div className="row g-3 mb-4">
        {statCards.map((s) => (
          <div key={s.label} className="col-xl-3 col-sm-6">
            <div className="nextgen-stat-card">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{s.label}</div>
                  <div className="fw-bold text-dark fs-4 mt-1" style={{ letterSpacing: '-0.5px' }}>{s.value}</div>
                </div>
                <div className={`nextgen-stat-icon ${s.color}`}>
                  <i className={`bi ${s.icon}`}></i>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between text-muted small mt-3 pt-2 border-top border-light">
                <span style={{ fontSize: '0.75rem' }}>{s.desc}</span>
                <span className="fw-semibold text-success" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-graph-up-arrow me-1"></i>Live
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Executive Command Hub - Full Responsive Grid Layout */}
      <div className="v-card mb-4 shadow-sm" style={{ borderRadius: '14px', border: '1px solid rgba(76, 175, 80, 0.18)' }}>
        <div className="v-card-header d-flex justify-content-between align-items-center" style={{ background: '#f4fbf5', borderRadius: '14px 14px 0 0', padding: '14px 20px' }}>
          <div>
            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
              <i className="bi bi-grid-1x2-fill" style={{ color: '#1E4D2B' }}></i>
              EXECUTIVE COMMAND HUB
            </h6>
            <small className="text-muted" style={{ fontSize: '0.72rem' }}>Quick Access ERP Registers & Action Launchers</small>
          </div>
          <span className="badge px-3 py-1.5" style={{ background: '#DAF2DB', color: '#1E4D2B', fontWeight: 700, fontSize: '0.75rem' }}>EHN ONE</span>
        </div>

        <div className="v-card-body p-3">
          <div className="row g-3">
            {/* Sales Billing Voucher */}
            <div className="col-xl-3 col-lg-4 col-sm-6">
              <div className="command-grid-card" onClick={() => navigate('/invoices')}>
                <div className="command-grid-icon" style={{ background: '#DAF2DB', color: '#1E4D2B' }}>
                  <i className="bi bi-receipt"></i>
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>Sales Billing Voucher</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>Create GST Invoices</div>
                </div>
                <i className="bi bi-chevron-right text-muted" style={{ fontSize: '0.78rem' }}></i>
              </div>
            </div>

            {/* Stock Receipt Entry */}
            <div className="col-xl-3 col-lg-4 col-sm-6">
              <div className="command-grid-card" onClick={() => navigate('/stock-in')}>
                <div className="command-grid-icon" style={{ background: '#DAF2DB', color: '#4CAF50' }}>
                  <i className="bi bi-arrow-down-circle"></i>
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>Stock Receipt Entry</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>Record Stock Inward</div>
                </div>
                <i className="bi bi-chevron-right text-muted" style={{ fontSize: '0.78rem' }}></i>
              </div>
            </div>

            {/* Goods Issue Voucher */}
            <div className="col-xl-3 col-lg-4 col-sm-6">
              <div className="command-grid-card" onClick={() => navigate('/stock-out')}>
                <div className="command-grid-icon" style={{ background: '#ffe5e5', color: '#ea5455' }}>
                  <i className="bi bi-arrow-up-circle"></i>
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>Goods Issue Voucher</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>Record Dispatches</div>
                </div>
                <i className="bi bi-chevron-right text-muted" style={{ fontSize: '0.78rem' }}></i>
              </div>
            </div>

            {/* Stock Item Masters */}
            <div className="col-xl-3 col-lg-4 col-sm-6">
              <div className="command-grid-card" onClick={() => navigate('/products')}>
                <div className="command-grid-icon" style={{ background: '#e0f8ff', color: '#00cfe8' }}>
                  <i className="bi bi-box-seam"></i>
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>Stock Item Masters</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>Catalog SKUs & Pricing</div>
                </div>
                <i className="bi bi-chevron-right text-muted" style={{ fontSize: '0.78rem' }}></i>
              </div>
            </div>

            {/* Customer Debtors */}
            <div className="col-xl-3 col-lg-4 col-sm-6">
              <div className="command-grid-card" onClick={() => navigate('/customers')}>
                <div className="command-grid-icon" style={{ background: '#fff4e5', color: '#ff9f43' }}>
                  <i className="bi bi-people"></i>
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>Customer Debtors</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>Client Ledgers</div>
                </div>
                <i className="bi bi-chevron-right text-muted" style={{ fontSize: '0.78rem' }}></i>
              </div>
            </div>

            {/* Supplier Creditors */}
            <div className="col-xl-3 col-lg-4 col-sm-6">
              <div className="command-grid-card" onClick={() => navigate('/suppliers')}>
                <div className="command-grid-icon" style={{ background: '#f1f5f9', color: '#475569' }}>
                  <i className="bi bi-truck"></i>
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>Supplier Creditors</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>Vendor Payables</div>
                </div>
                <i className="bi bi-chevron-right text-muted" style={{ fontSize: '0.78rem' }}></i>
              </div>
            </div>

            {/* Godown Masters */}
            <div className="col-xl-3 col-lg-4 col-sm-6">
              <div className="command-grid-card" onClick={() => navigate('/warehouse')}>
                <div className="command-grid-icon" style={{ background: '#eef2ff', color: '#4338ca' }}>
                  <i className="bi bi-building"></i>
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>Godown Masters</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>Storage Locations</div>
                </div>
                <i className="bi bi-chevron-right text-muted" style={{ fontSize: '0.78rem' }}></i>
              </div>
            </div>

            {/* Financial & GSTR Reports */}
            <div className="col-xl-3 col-lg-4 col-sm-6">
              <div className="command-grid-card" onClick={() => navigate('/reports')}>
                <div className="command-grid-icon" style={{ background: '#DAF2DB', color: '#1E4D2B' }}>
                  <i className="bi bi-bar-chart-line"></i>
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>Financial Reports</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>P&L & GSTR Audit</div>
                </div>
                <i className="bi bi-chevron-right text-muted" style={{ fontSize: '0.78rem' }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next-Gen Split Dashboard View */}
      <div className="row g-3">
        {/* Left Column: Quick Valuation Summary Card */}
        <div className="col-lg-4 col-md-5">
          <div className="v-card shadow-sm h-100" style={{ borderRadius: '14px', border: '1px solid rgba(76, 175, 80, 0.18)' }}>
            <div className="v-card-header" style={{ background: '#f4fbf5', borderRadius: '14px 14px 0 0' }}>
              <i className="bi bi-calculator me-2" style={{ color: '#1E4D2B' }}></i>
              VALUATION BREAKDOWN
            </div>
            <div className="v-card-body p-0">
              <table className="v-table">
                <tbody>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>Out of Stock Items</td>
                    <td className="text-end fw-bold text-danger">
                      {(stats.lowStockItems || []).filter((i) => i.quantity === 0).length} Items
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>Low Stock Warnings</td>
                    <td className="text-end fw-bold text-warning">
                      {(stats.lowStockItems || []).filter((i) => i.quantity > 0).length} Items
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>Active Item Masters</td>
                    <td className="text-end fw-bold">{stats.totalProducts} SKUs</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>Physical Inventory Units</td>
                    <td className="text-end fw-bold text-success">{stats.totalStock.toLocaleString()} Pcs</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>Total Stock Valuation</td>
                    <td className="text-end fw-bold text-success" style={{ fontSize: '0.95rem' }}>
                      ₹{stats.totalValue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Next-Gen Critical Reorder Register Table */}
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
      <div className="v-card mb-4 shadow-sm" style={{ borderRadius: '14px', border: '1px solid rgba(76, 175, 80, 0.18)', background: '#ffffff' }}>
        <div className="v-card-body p-5 text-center">
          <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm" style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #DAF2DB 0%, #c3ebd2 100%)', color: '#1E4D2B' }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: '2.4rem', color: '#4CAF50' }}></i>
          </div>
          <h4 className="fw-bold text-dark mb-2" style={{ letterSpacing: '-0.3px' }}>All Stock Items Optimal</h4>
          <p className="text-muted mb-4 mx-auto" style={{ maxWidth: 480, fontSize: '0.88rem' }}>
            No low stock or out-of-stock alerts. Inventory levels are healthy across all product categories.
          </p>
          <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
            <span className="badge px-3 py-2" style={{ background: '#DAF2DB', color: '#1E4D2B', fontSize: '0.78rem', fontWeight: 600 }}>
              <i className="bi bi-shield-check me-1 text-success"></i> Health Index 100%
            </span>
            <span className="badge px-3 py-2" style={{ background: '#eef2ff', color: '#4338ca', fontSize: '0.78rem', fontWeight: 600 }}>
              <i className="bi bi-box-seam me-1"></i> Stock Reorder Healthy
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="v-card mb-3 shadow-sm" style={{ borderRadius: '14px', border: '1px solid rgba(76, 175, 80, 0.18)' }}>
      <div className="v-card-header d-flex justify-content-between align-items-center" style={{ background: '#f4fbf5', borderRadius: '14px 14px 0 0' }}>
        <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>
          <i className="bi bi-exclamation-diamond-fill me-2 text-danger"></i>
          CRITICAL REORDER ALERTS & LOW STOCK REGISTER
        </span>
        <span className="badge bg-danger text-white rounded-pill px-3 py-1" style={{ fontWeight: 600 }}>{items.length} CRITICAL</span>
      </div>
      <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
        <table className="v-table">
          <thead>
            <tr>
              <th>ITEM NAME</th>
              <th>SKU CODE</th>
              <th>STOCK GROUP</th>
              <th>CURRENT QTY</th>
              <th>MIN THRESHOLD</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td className="fw-bold text-dark">{item.name}</td>
                <td><code style={{ color: '#1E4D2B', background: '#DAF2DB', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem' }}>{item.sku}</code></td>
                <td>{item.category}</td>
                <td className="fw-bold text-danger">{item.quantity}</td>
                <td>{item.lowStockThreshold}</td>
                <td>
                  {item.quantity === 0
                    ? <span className="badge bg-danger text-white px-2 py-1" style={{ fontSize: '0.7rem' }}>OUT OF STOCK</span>
                    : <span className="badge bg-warning text-dark px-2 py-1" style={{ fontSize: '0.7rem' }}>LOW STOCK</span>
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
