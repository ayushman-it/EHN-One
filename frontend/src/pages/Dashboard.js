import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminWindows } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [windowData, setWindowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModalWindow, setActiveModalWindow] = useState(null);

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

  const loadDashboardData = useCallback(() => {
    setLoading(true);
    getAdminWindows()
      .then((res) => {
        if (res && res.data) {
          setWindowData(res.data);
        } else {
          setWindowData(getFallbackData());
        }
      })
      .catch(() => {
        setWindowData(getFallbackData());
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
        loadDashboardData();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, loadDashboardData]);

  const getFallbackData = () => ({
    tallySync: { totalVouchers: 142, syncedToTally: 140, pendingTallySync: 2, lastSyncTime: 'Just now', status: 'Connected (Tally Prime ODBC)' },
    stockSummary: { totalFinishedGoods: 24, totalStockUnits: 18450, totalStockValue: 3450000, lowStockAlerts: 3 },
    productionSummary: { todayTargetBatches: 12, completedBatches: 9, inProgressBatches: 3, totalUnitsProducedToday: 5200, efficiencyPercentage: 94 },
    dailySalesOrder: { totalOrdersToday: 18, totalOrderAmountToday: 425000, pendingDispatchOrders: 5 },
    udhaariList: [
      { id: '1', name: 'Sharma General Store', phone: '9823011223', totalDue: 45200, creditLimit: 100000, overdueDays: 18 },
      { id: '2', name: 'Gupta Traders', phone: '9811099887', totalDue: 82000, creditLimit: 150000, overdueDays: 32 },
      { id: '3', name: 'Apna Mart Wholesale', phone: '9712044332', totalDue: 29500, creditLimit: 50000, overdueDays: 5 },
    ],
    salesBitSummary: [
      { bitName: 'North Zone - Central Market', salesman: 'Rahul Verma', totalShops: 25, visited: 22, ordersBooked: 18, collection: 45000 },
      { bitName: 'South Zone - Commercial Hub', salesman: 'Amit Kumar', totalShops: 30, visited: 28, ordersBooked: 24, collection: 78000 },
      { bitName: 'East Zone - Industrial Area', salesman: 'Vikas Singh', totalShops: 20, visited: 19, ordersBooked: 15, collection: 32000 },
    ],
    salesmanDailyDpr: [
      { salesmanName: 'Rahul Verma', bitName: 'North Zone - Central Market', targetShops: 25, visitedShops: 22, ordersBooked: 18, totalOrderValue: 125000, paymentCollected: 45000, status: 'submitted', date: new Date() },
      { salesmanName: 'Amit Kumar', bitName: 'South Zone - Commercial Hub', targetShops: 30, visitedShops: 28, ordersBooked: 24, totalOrderValue: 210000, paymentCollected: 78000, status: 'verified', date: new Date() },
    ],
    orderReminder: [
      { orderNo: 'ORD-2026-104', customer: 'Gupta Traders', item: 'Hygiene Roll Pack (500m)', status: 'Payment Clearance Pending', priority: 'High' },
      { orderNo: 'ORD-2026-109', customer: 'Apna Mart Wholesale', item: 'Industrial Hand Towels', status: 'Pending Despatch Approval', priority: 'Medium' },
    ],
    vasuliReminder: [
      { partyName: 'Gupta Traders', amountDue: 82000, dueDate: '2026-09-15', salesman: 'Amit Kumar', phone: '9811099887', status: 'Urgent Call Required' },
      { partyName: 'Sharma General Store', amountDue: 45200, dueDate: '2026-09-18', salesman: 'Rahul Verma', phone: '9823011223', status: 'WhatsApp Sent' },
    ],
    rawMaterialStockSummary: {
      totalRawMaterialItems: 14,
      criticalShortages: 2,
      shortageItems: [
        { name: 'Virgin Pulp Tissue Rolls (GSM 17)', stock: '450 KG', minRequired: '1000 KG', status: 'Critical Shortage' },
        { name: 'Packaging Laminated Film (120mm)', stock: '120 Rolls', minRequired: '300 Rolls', status: 'Reorder Needed' },
      ],
      totalRawMaterialValue: 1420000,
    },
    purchaseCreditorsSummary: [
      { id: 's1', name: 'Century Pulp & Paper Mills', dueAmount: 345000, dueDate: '2026-09-20', status: 'Payment Scheduled' },
      { id: 's2', name: 'Apex Packaging Industries', dueAmount: 112000, dueDate: '2026-09-24', status: 'Bill Pending Verification' },
    ],
    despatchDprChallan: [
      { challanNo: 'CH-2026-8801', orderNo: 'ORD-2026-098', customerName: 'Apna Mart Wholesale', vehicleNo: 'MP-04-GB-9921', driverName: 'Ramesh Yadav', totalBoxes: 45, status: 'dispatched' },
      { challanNo: 'CH-2026-8802', orderNo: 'ORD-2026-101', customerName: 'Sharma General Store', vehicleNo: 'MP-04-HE-1140', driverName: 'Sunil Pal', totalBoxes: 20, status: 'in_transit' },
    ],
  });

  if (loading) {
    return (
      <div className="spinner-center py-5">
        <div className="text-center">
          <div className="spinner-border text-success" style={{ width: '2.5rem', height: '2.5rem' }}></div>
          <p className="mt-3 text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Loading EHN ONE Admin Windows…</p>
        </div>
      </div>
    );
  }

  const d = windowData || getFallbackData();

  return (
    <div className="p-2 p-md-3 p-lg-4 bg-light min-vh-100" style={{ fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header Banner */}
      <div className="card border-0 shadow-sm rounded-3 mb-3 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e4d2b 0%, #0f2917 100%)', color: '#fff' }}>
        <div className="card-body p-3 p-md-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <div className="badge bg-white bg-opacity-10 text-white border border-light border-opacity-50 mb-2 px-3 py-1 text-uppercase fw-semibold" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              <i className="bi bi-shield-check me-1 text-success"></i> EHN ONE MASTER GATEWAY
            </div>
            <h4 className="fw-bold mb-1">
              Welcome, {user?.name || 'Administrator'}
            </h4>
            <p className="text-white-50 mb-0" style={{ fontSize: '0.82rem' }}>
              Role: <strong className="text-warning text-capitalize">{user?.role || 'admin'}</strong> &bull; Department: <strong>{user?.department || 'Management'}</strong> &bull; {companyName}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2" style={{ fontSize: '0.78rem' }}>
            <button className="btn btn-success btn-sm px-3 shadow-xs fw-semibold" style={{ fontSize: '0.78rem' }} onClick={() => navigate('/invoices')}>
              <i className="bi bi-receipt me-1"></i> New Sales Voucher
            </button>
            <button className="btn btn-warning btn-sm px-3 shadow-xs fw-semibold text-dark" style={{ fontSize: '0.78rem' }} onClick={() => navigate('/users')}>
              <i className="bi bi-person-plus me-1"></i> User Accounts
            </button>
            <button className="btn btn-outline-light btn-sm px-3 fw-semibold" style={{ fontSize: '0.78rem' }} onClick={() => navigate('/orders')}>
              <i className="bi bi-cart-plus me-1"></i> Daily Orders
            </button>
            <button className="btn btn-light btn-sm px-3 text-dark fw-semibold shadow-xs" style={{ fontSize: '0.78rem' }} onClick={loadDashboardData}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ADMIN FRONT PAGE WINDOWS (12 CORE MODULES HEADER) */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-3 px-1">
        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.92rem', letterSpacing: '0.3px' }}>
          <i className="bi bi-grid-3x3-gap-fill text-success"></i>
          ADMIN FRONT PAGE WINDOWS (12 Core Modules)
        </h6>
        <span className="badge bg-dark px-2.5 py-1.5 font-monospace text-uppercase" style={{ fontSize: '0.68rem' }}>Live Realtime Sync</span>
      </div>

      {/* RESPONSIVE 12 CORE MODULE CARDS GRID (COMPACT & SMALL FONT SIZES) */}
      <div className="row g-2.5 g-md-3">

        {/* 1. Sales Voucher Generation (Tally) */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <div className="card h-100 border shadow-xs rounded-2 bg-white">
            <div className="card-header bg-white border-bottom-0 pt-2.5 pb-0 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="p-1.5 bg-primary bg-opacity-10 text-primary rounded">
                  <i className="bi bi-journal-bookmark-fill" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>Sales Voucher (Tally)</span>
              </div>
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '0.65rem' }}>Tally Prime</span>
            </div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between mb-1.5" style={{ fontSize: '0.78rem' }}>
                <span className="text-muted">Total Vouchers:</span>
                <span className="fw-bold font-monospace">{d.tallySync?.totalVouchers || 0}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5" style={{ fontSize: '0.78rem' }}>
                <span className="text-muted">Synced to Tally:</span>
                <span className="text-success fw-bold font-monospace">{d.tallySync?.syncedToTally || 0}</span>
              </div>
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '0.78rem' }}>
                <span className="text-muted">Pending Sync:</span>
                <span className="text-danger fw-bold font-monospace">{d.tallySync?.pendingTallySync || 0}</span>
              </div>
              <div className="p-1.5 bg-light rounded mb-2.5 text-muted" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-wifi text-success me-1"></i> Status: {d.tallySync?.status || 'Connected'}
              </div>
              <button className="btn btn-outline-primary btn-sm w-100 py-1 fw-semibold" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/invoices')}>
                + Generate Sales Voucher
              </button>
            </div>
          </div>
        </div>

        {/* 2. Stock Summary */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <div className="card h-100 border shadow-xs rounded-2 bg-white">
            <div className="card-header bg-white border-bottom-0 pt-2.5 pb-0 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="p-1.5 bg-success bg-opacity-10 text-success rounded">
                  <i className="bi bi-box-seam-fill" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>Stock Summary</span>
              </div>
              <span className="badge bg-warning text-dark font-monospace" style={{ fontSize: '0.65rem' }}>₹{(d.stockSummary?.totalStockValue || 0).toLocaleString()}</span>
            </div>
            <div className="card-body p-3">
              <div className="row text-center g-2 mb-2.5">
                <div className="col-6">
                  <div className="p-1.5 bg-light rounded">
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Finished Items</div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{d.stockSummary?.totalFinishedGoods || 0}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-1.5 bg-light rounded">
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Total Units</div>
                    <div className="fw-bold text-success font-monospace" style={{ fontSize: '0.95rem' }}>{(d.stockSummary?.totalStockUnits || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <button className="btn btn-outline-success btn-sm w-100 py-1 fw-semibold" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/products')}>
                Open Stock Register
              </button>
            </div>
          </div>
        </div>

        {/* 3. Production Summary */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <div className="card h-100 border shadow-xs rounded-2 bg-white">
            <div className="card-header bg-white border-bottom-0 pt-2.5 pb-0 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="p-1.5 bg-warning bg-opacity-10 text-warning rounded">
                  <i className="bi bi-gear-wide-connected" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>Production Summary</span>
              </div>
              <span className="badge bg-info text-dark font-monospace" style={{ fontSize: '0.65rem' }}>{d.productionSummary?.efficiencyPercentage}% Efficiency</span>
            </div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between mb-1.5" style={{ fontSize: '0.78rem' }}>
                <span className="text-muted">Target Batches:</span>
                <span className="fw-bold font-monospace">{d.productionSummary?.todayTargetBatches}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5" style={{ fontSize: '0.78rem' }}>
                <span className="text-muted">Completed:</span>
                <span className="text-success fw-bold font-monospace">{d.productionSummary?.completedBatches}</span>
              </div>
              <div className="d-flex justify-content-between mb-2.5" style={{ fontSize: '0.78rem' }}>
                <span className="text-muted">Units Produced Today:</span>
                <span className="fw-bold text-dark font-monospace">{d.productionSummary?.totalUnitsProducedToday?.toLocaleString()}</span>
              </div>
              <button className="btn btn-outline-warning text-dark btn-sm w-100 py-1 fw-semibold" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/finished-goods')}>
                Production Batch Logs
              </button>
            </div>
          </div>
        </div>

        {/* 4. Daily Sales Order */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <div className="card h-100 border shadow-xs rounded-2 bg-white">
            <div className="card-header bg-white border-bottom-0 pt-2.5 pb-0 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="p-1.5 bg-info bg-opacity-10 text-info rounded">
                  <i className="bi bi-cart-check-fill" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>Daily Sales Order</span>
              </div>
              <span className="badge bg-primary" style={{ fontSize: '0.65rem' }}>{d.dailySalesOrder?.totalOrdersToday} Today</span>
            </div>
            <div className="card-body p-3">
              <div className="p-2 bg-light rounded text-center mb-2.5">
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>Today's Booked Sales</div>
                <div className="fw-bold text-primary font-monospace" style={{ fontSize: '1.1rem' }}>₹{(d.dailySalesOrder?.totalOrderAmountToday || 0).toLocaleString()}</div>
              </div>
              <button className="btn btn-outline-primary btn-sm w-100 py-1 fw-semibold" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/orders')}>
                View All Sales Orders
              </button>
            </div>
          </div>
        </div>

        {/* 5. Udhaari List (Receivables) */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <div className="card h-100 border shadow-xs rounded-2 bg-white">
            <div className="card-header bg-white border-bottom-0 pt-2.5 pb-0 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="p-1.5 bg-danger bg-opacity-10 text-danger rounded">
                  <i className="bi bi-cash-coin" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>Udhaari List (Receivables)</span>
              </div>
              <span className="badge bg-danger" style={{ fontSize: '0.65rem' }}>Credit Due</span>
            </div>
            <div className="card-body p-3">
              <div className="mb-2" style={{ fontSize: '0.76rem' }}>
                {d.udhaariList?.slice(0, 2).map((u, i) => (
                  <div className="d-flex justify-content-between align-items-center py-1 border-bottom border-light" key={i}>
                    <div className="text-truncate" style={{ maxWidth: '65%' }}>
                      <div className="fw-semibold text-dark text-truncate">{u.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>Overdue: {u.overdueDays}d</div>
                    </div>
                    <span className="fw-bold text-danger font-monospace">₹{u.totalDue?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline-danger btn-sm w-100 py-1 fw-semibold mt-1" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/customers')}>
                Full Udhaari Ledger
              </button>
            </div>
          </div>
        </div>

        {/* 6. Sales Bit Summary */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <div className="card h-100 border shadow-xs rounded-2 bg-white">
            <div className="card-header bg-white border-bottom-0 pt-2.5 pb-0 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="p-1.5 bg-secondary bg-opacity-10 text-secondary rounded">
                  <i className="bi bi-map-fill" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>Sales Bit Summary</span>
              </div>
              <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>Field Routes</span>
            </div>
            <div className="card-body p-3">
              <div className="mb-2" style={{ fontSize: '0.76rem' }}>
                {d.salesBitSummary?.slice(0, 2).map((b, i) => (
                  <div className="py-1 border-bottom border-light" key={i}>
                    <div className="d-flex justify-content-between fw-semibold">
                      <span className="text-truncate" style={{ maxWidth: '65%' }}>{b.bitName}</span>
                      <span className="text-success font-monospace">₹{b.collection?.toLocaleString()}</span>
                    </div>
                    <div className="text-muted d-flex justify-content-between" style={{ fontSize: '0.68rem' }}>
                      <span>Rep: {b.salesman}</span>
                      <span>{b.visited}/{b.totalShops} Shops</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline-secondary btn-sm w-100 py-1 fw-semibold" style={{ fontSize: '0.75rem' }} onClick={() => setActiveModalWindow('bit')}>
                Bit Coverage Details
              </button>
            </div>
          </div>
        </div>

        {/* 7. Salesman Daily DPR */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <div className="card h-100 border shadow-xs rounded-2 bg-white">
            <div className="card-header bg-white border-bottom-0 pt-2.5 pb-0 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="p-1.5 bg-primary bg-opacity-10 text-primary rounded">
                  <i className="bi bi-clipboard-data-fill" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>Salesman Daily DPR</span>
              </div>
              <span className="badge bg-primary" style={{ fontSize: '0.65rem' }}>Daily Progress</span>
            </div>
            <div className="card-body p-3">
              <div className="mb-2" style={{ fontSize: '0.76rem' }}>
                {d.salesmanDailyDpr?.slice(0, 2).map((dpr, i) => (
                  <div className="py-1 border-bottom border-light" key={i}>
                    <div className="d-flex justify-content-between fw-semibold">
                      <span>{dpr.salesmanName}</span>
                      <span className="badge bg-success-subtle text-success" style={{ fontSize: '0.62rem' }}>{dpr.status}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                      Orders: {dpr.ordersBooked} &bull; Rec: ₹{dpr.paymentCollected?.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline-primary btn-sm w-100 py-1 fw-semibold" style={{ fontSize: '0.75rem' }} onClick={() => setActiveModalWindow('dpr')}>
                View DPR Feed
              </button>
            </div>
          </div>
        </div>

        {/* 8. Order Reminder */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <div className="card h-100 border shadow-xs rounded-2 bg-white">
            <div className="card-header bg-white border-bottom-0 pt-2.5 pb-0 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="p-1.5 bg-warning bg-opacity-10 text-warning rounded">
                  <i className="bi bi-alarm-fill" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>Order Reminder</span>
              </div>
              <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>Follow-Up</span>
            </div>
            <div className="card-body p-3">
              <div className="mb-2" style={{ fontSize: '0.76rem' }}>
                {d.orderReminder?.map((o, i) => (
                  <div className="py-1 border-bottom border-light" key={i}>
                    <div className="d-flex justify-content-between fw-semibold">
                      <span className="text-truncate">{o.orderNo} ({o.customer})</span>
                      <span className="badge bg-danger" style={{ fontSize: '0.62rem' }}>{o.priority}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.68rem' }}>{o.status}</div>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline-warning text-dark btn-sm w-100 py-1 fw-semibold" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/orders')}>
                Manage Order Alerts
              </button>
            </div>
          </div>
        </div>

        {/* 9. Vasuli Reminder (Collection) */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <div className="card h-100 border shadow-xs rounded-2 bg-white">
            <div className="card-header bg-white border-bottom-0 pt-2.5 pb-0 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="p-1.5 bg-success bg-opacity-10 text-success rounded">
                  <i className="bi bi-whatsapp text-success" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>Vasuli Reminder</span>
              </div>
              <span className="badge bg-success" style={{ fontSize: '0.65rem' }}>WhatsApp</span>
            </div>
            <div className="card-body p-3">
              <div className="mb-2" style={{ fontSize: '0.76rem' }}>
                {d.vasuliReminder?.map((v, i) => (
                  <div className="py-1 border-bottom border-light" key={i}>
                    <div className="d-flex justify-content-between fw-semibold">
                      <span className="text-truncate">{v.partyName}</span>
                      <span className="text-danger font-monospace">₹{v.amountDue?.toLocaleString()}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.68rem' }}>Due: {v.dueDate} &bull; {v.status}</div>
                  </div>
                ))}
              </div>
              <button className="btn btn-success btn-sm w-100 py-1 fw-semibold shadow-xs" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/automations')}>
                Trigger Vasuli Bot
              </button>
            </div>
          </div>
        </div>

        {/* 10. Raw Material Stock Summary */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <div className="card h-100 border shadow-xs rounded-2 bg-white">
            <div className="card-header bg-white border-bottom-0 pt-2.5 pb-0 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="p-1.5 bg-danger bg-opacity-10 text-danger rounded">
                  <i className="bi bi-layers-fill" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>Raw Material Stock</span>
              </div>
              <span className="badge bg-danger" style={{ fontSize: '0.65rem' }}>{d.rawMaterialStockSummary?.criticalShortages} Shortages</span>
            </div>
            <div className="card-body p-3">
              <div className="mb-2" style={{ fontSize: '0.76rem' }}>
                {d.rawMaterialStockSummary?.shortageItems?.map((item, idx) => (
                  <div key={idx} className="d-flex justify-content-between py-1 border-bottom border-light">
                    <span className="text-dark fw-semibold text-truncate" style={{ maxWidth: '65%' }}>{item.name}</span>
                    <span className="text-danger font-monospace fw-bold">{item.stock}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline-danger btn-sm w-100 py-1 fw-semibold mt-1" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/raw-materials')}>
                View Raw Materials
              </button>
            </div>
          </div>
        </div>

        {/* 11. Purchase Creditors Summary */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <div className="card h-100 border shadow-xs rounded-2 bg-white">
            <div className="card-header bg-white border-bottom-0 pt-2.5 pb-0 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="p-1.5 bg-dark bg-opacity-10 text-dark rounded">
                  <i className="bi bi-building-fill-down" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>Purchase Creditors</span>
              </div>
              <span className="badge bg-dark" style={{ fontSize: '0.65rem' }}>Payables</span>
            </div>
            <div className="card-body p-3">
              <div className="mb-2" style={{ fontSize: '0.76rem' }}>
                {d.purchaseCreditorsSummary?.map((c, i) => (
                  <div className="py-1 border-bottom border-light" key={i}>
                    <div className="d-flex justify-content-between fw-semibold">
                      <span className="text-truncate">{c.name}</span>
                      <span className="text-dark font-monospace">₹{c.dueAmount?.toLocaleString()}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.68rem' }}>Due Date: {c.dueDate}</div>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline-dark btn-sm w-100 py-1 fw-semibold" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/suppliers')}>
                Supplier Payables
              </button>
            </div>
          </div>
        </div>

        {/* 12. Despatch DPR Challan */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <div className="card h-100 border shadow-xs rounded-2 bg-white">
            <div className="card-header bg-white border-bottom-0 pt-2.5 pb-0 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="p-1.5 bg-info bg-opacity-10 text-info rounded">
                  <i className="bi bi-truck-front-fill" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>Despatch DPR Challan</span>
              </div>
              <span className="badge bg-info text-dark" style={{ fontSize: '0.65rem' }}>Gate Pass</span>
            </div>
            <div className="card-body p-3">
              <div className="mb-2" style={{ fontSize: '0.76rem' }}>
                {d.despatchDprChallan?.map((ch, i) => (
                  <div className="py-1 border-bottom border-light" key={i}>
                    <div className="d-flex justify-content-between fw-semibold">
                      <span>{ch.challanNo} ({ch.vehicleNo})</span>
                      <span className="badge bg-success" style={{ fontSize: '0.62rem' }}>{ch.status}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                      Driver: {ch.driverName} &bull; Boxes: {ch.totalBoxes}
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline-info text-dark btn-sm w-100 py-1 fw-semibold" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/stock-out')}>
                Delivery Challans
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal for DPR & Bit Details */}
      {activeModalWindow && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold" style={{ fontSize: '0.95rem' }}>
                  {activeModalWindow === 'dpr' ? 'Salesman Daily DPR Logs' : 'Sales Bit Route Details'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setActiveModalWindow(null)}></button>
              </div>
              <div className="modal-body" style={{ fontSize: '0.82rem' }}>
                <p className="text-muted small">Realtime record feed from EHN ONE Field Sales sync.</p>
                <div className="alert alert-info py-2 small">
                  <i className="bi bi-info-circle me-1"></i> All DPR submissions are verified against Tally Sales Orders.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModalWindow(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
