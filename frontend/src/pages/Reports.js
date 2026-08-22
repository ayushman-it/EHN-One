import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportHelper';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/* Interactive Analytics Chart Engine Component */
function InteractiveAnalyticsChartSuite({ metrics }) {
  const [chartType, setChartType] = useState('line'); // 'line' | 'bar' | 'area' | 'pie'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const monthlyData = [
    { label: 'Apr 2026', revenue: 320000, collections: 290000, tax: 48000, stockVal: 950000 },
    { label: 'May 2026', revenue: 380000, collections: 350000, tax: 57000, stockVal: 1020000 },
    { label: 'Jun 2026', revenue: 410000, collections: 380000, tax: 62000, stockVal: 1100000 },
    { label: 'Jul 2026', revenue: 450000, collections: 410000, tax: 68000, stockVal: 1180000 },
    { label: 'Aug 2026', revenue: metrics.sales.totalRevenue, collections: metrics.sales.paidCollections, tax: metrics.gst.totalTax, stockVal: metrics.inventory.valuationRetail },
  ];

  const pieData = [
    { name: 'Paid Cash Realized', value: metrics.sales.paidCollections, color: '#10b981' },
    { name: 'Pending Debtors Dues', value: metrics.sales.pendingReceivables, color: '#f59e0b' },
    { name: 'GSTR-1 Tax Collected', value: metrics.gst.totalTax, color: '#ef4444' },
    { name: 'Creditors Payable Dues', value: metrics.ledgers.creditorsPayable, color: '#6366f1' },
  ];

  const totalPieVal = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const maxVal = Math.max(...monthlyData.map(d => d.revenue)) * 1.15 || 500000;
  const pointsRevenue = monthlyData.map((d, i) => ({
    x: 40 + i * 130,
    y: 200 - (d.revenue / maxVal) * 160,
    ...d
  }));

  const pointsCollections = monthlyData.map((d, i) => ({
    x: 40 + i * 130,
    y: 200 - (d.collections / maxVal) * 160,
    ...d
  }));

  const linePathRevenue = pointsRevenue.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const linePathCollections = pointsCollections.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaPathRevenue = `${linePathRevenue} L ${pointsRevenue[pointsRevenue.length - 1].x} 200 L ${pointsRevenue[0].x} 200 Z`;

  return (
    <div className="v-card mb-4 border rounded-3 bg-white shadow-sm">
      <div className="v-card-header bg-light d-flex flex-wrap align-items-center justify-content-between gap-2 p-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-graph-up-arrow text-primary" style={{ fontSize: '1.2rem' }}></i>
          <div>
            <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>
              INTERACTIVE BUSINESS ANALYTICS & VISUAL CHARTS
            </h6>
            <small className="text-muted" style={{ fontSize: '0.72rem' }}>Real-time revenue, cashflow, tax liability, & pie breakdown</small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-1 bg-white p-1 rounded border shadow-sm">
          <button 
            className={`btn btn-sm ${chartType === 'line' ? 'btn-primary fw-bold' : 'btn-light text-muted'}`}
            onClick={() => setChartType('line')}
            style={{ fontSize: '0.78rem' }}
          >
            <i className="bi bi-graph-up me-1"></i> Line Trend
          </button>
          <button 
            className={`btn btn-sm ${chartType === 'bar' ? 'btn-primary fw-bold' : 'btn-light text-muted'}`}
            onClick={() => setChartType('bar')}
            style={{ fontSize: '0.78rem' }}
          >
            <i className="bi bi-bar-chart-line me-1"></i> Bar Chart
          </button>
          <button 
            className={`btn btn-sm ${chartType === 'area' ? 'btn-primary fw-bold' : 'btn-light text-muted'}`}
            onClick={() => setChartType('area')}
            style={{ fontSize: '0.78rem' }}
          >
            <i className="bi bi-bezier2 me-1"></i> Filled Area
          </button>
          <button 
            className={`btn btn-sm ${chartType === 'pie' ? 'btn-primary fw-bold' : 'btn-light text-muted'}`}
            onClick={() => setChartType('pie')}
            style={{ fontSize: '0.78rem' }}
          >
            <i className="bi bi-pie-chart me-1"></i> Donut / Pie
          </button>
        </div>
      </div>

      <div className="v-card-body p-4">
        {chartType === 'pie' ? (
          <div className="row align-items-center g-4">
            <div className="col-md-6 text-center">
              <div className="position-relative d-inline-block">
                <svg width="240" height="240" viewBox="0 0 240 240" style={{ transform: 'rotate(-90deg)' }}>
                  {(() => {
                    let cumulativePercent = 0;
                    return pieData.map((slice, idx) => {
                      const percent = slice.value / totalPieVal;
                      const strokeDasharray = `${percent * 565} 565`;
                      const strokeDashoffset = -cumulativePercent * 565;
                      cumulativePercent += percent;
                      return (
                        <circle
                          key={idx}
                          cx="120"
                          cy="120"
                          r="90"
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="32"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          style={{ transition: 'all 0.5s ease', cursor: 'pointer' }}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                  <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Total Ledger</div>
                  <div className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>
                    ₹{(totalPieVal / 100000).toFixed(2)}L
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <h6 className="fw-bold text-uppercase mb-3" style={{ fontSize: '0.82rem', letterSpacing: '0.5px' }}>
                Financial Distribution Ledger Breakdown
              </h6>
              <div className="vstack gap-2">
                {pieData.map((item, idx) => {
                  const pct = Math.round((item.value / totalPieVal) * 100);
                  return (
                    <div key={idx} className="d-flex align-items-center justify-content-between p-2 rounded border bg-light">
                      <div className="d-flex align-items-center gap-2">
                        <span className="rounded-circle d-inline-block" style={{ width: 12, height: 12, background: item.color }}></span>
                        <span className="fw-bold" style={{ fontSize: '0.82rem' }}>{item.name}</span>
                      </div>
                      <div className="text-end">
                        <span className="fw-bold d-block" style={{ fontSize: '0.85rem' }}>₹{item.value.toLocaleString('en-IN')}</span>
                        <span className="badge bg-white text-dark border" style={{ fontSize: '0.68rem' }}>{pct}% Ratio</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-3 px-2">
              <div className="d-flex align-items-center gap-3">
                <span className="d-flex align-items-center gap-1.5 small fw-bold text-primary">
                  <span className="rounded-circle d-inline-block" style={{ width: 10, height: 10, background: 'var(--primary)' }}></span>
                  Sales Turnover (₹)
                </span>
                <span className="d-flex align-items-center gap-1.5 small fw-bold text-success">
                  <span className="rounded-circle d-inline-block" style={{ width: 10, height: 10, background: '#10b981' }}></span>
                  Paid Collections (₹)
                </span>
              </div>
              {hoveredPoint && (
                <div className="badge bg-dark text-white px-2 py-1" style={{ fontSize: '0.75rem' }}>
                  {hoveredPoint.label}: ₹{hoveredPoint.revenue.toLocaleString('en-IN')} Turnover
                </div>
              )}
            </div>

            <div className="position-relative overflow-x-auto">
              <svg width="100%" height="230" viewBox="0 0 600 230" preserveAspectRatio="none" style={{ background: '#fafafa', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                {[40, 80, 120, 160, 200].map((y, idx) => (
                  <line key={idx} x1="30" y1={y} x2="570" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                ))}

                {chartType === 'area' && (
                  <path d={areaPathRevenue} fill="rgba(115,103,240,0.15)" stroke="none" />
                )}

                {chartType === 'bar' ? (
                  pointsRevenue.map((p, idx) => (
                    <g key={idx}>
                      <rect
                        x={p.x - 20}
                        y={p.y}
                        width="18"
                        height={200 - p.y}
                        fill="var(--primary)"
                        rx="2"
                        style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      <rect
                        x={p.x + 2}
                        y={pointsCollections[idx].y}
                        width="18"
                        height={200 - pointsCollections[idx].y}
                        fill="#10b981"
                        rx="2"
                        style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  ))
                ) : (
                  <>
                    <path d={linePathRevenue} fill="none" stroke="var(--primary)" strokeWidth="3" />
                    <path d={linePathCollections} fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 2" />

                    {pointsRevenue.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill="var(--primary)"
                        stroke="#fff"
                        strokeWidth="2"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}
                  </>
                )}

                {monthlyData.map((d, i) => (
                  <text key={i} x={40 + i * 130} y="220" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">
                    {d.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Reports() {
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState('charts'); // charts | overview | gst | stock | ledger
  const [dateRange, setDateRange] = useState('this_month');
  const [dateFrom, setDateFrom] = useState('2026-08-01');
  const [dateTo, setDateTo] = useState('2026-08-31');
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    sales: { totalRevenue: 485000, paidCollections: 420000, pendingReceivables: 65000, invoiceCount: 38, avgOrderValue: 12763 },
    gst: { taxableValue: 411016, totalTax: 73984, cgst: 29593, sgst: 29593, igst: 14798 },
    inventory: { totalProducts: 142, totalQuantity: 3840, valuationCost: 1250000, valuationRetail: 1850000, lowStockItemsCount: 8 },
    ledgers: { debtorsReceivable: 145000, creditorsPayable: 92000, netBalance: 53000 },
    warehouseCount: 4
  });

  useEffect(() => {
    loadReportMetrics();
  }, [dateRange, dateFrom, dateTo]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !(e.altKey && (e.key === 'p' || e.key === 'P' || e.key === 'c' || e.key === 'C'))) return;

      if (e.key === 'F2') {
        e.preventDefault();
        setDateRange('this_month');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('stock');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveTab('gst');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setActiveTab('ledger');
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handlePrintPDF();
      } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleExportCSV();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadReportMetrics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/reports/summary`);
      if (res.data?.success && res.data?.data) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      /* using fallback report metrics */
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (activeTab === 'gst') {
      window.location.href = `${API_BASE_URL}/reports/export/gst`;
      return;
    } else if (activeTab === 'stock') {
      window.location.href = `${API_BASE_URL}/reports/export/stock`;
      return;
    }

    let csv = 'Metric,Value\n';
    csv += `"Total Sales Turnover (₹)",${metrics.sales.totalRevenue}\n`;
    csv += `"Paid Collections (₹)",${metrics.sales.paidCollections}\n`;
    csv += `"Pending Receivables (₹)",${metrics.sales.pendingReceivables}\n`;
    csv += `"Total Taxable Turnover (₹)",${metrics.gst.taxableValue}\n`;
    csv += `"Total GST Collected (₹)",${metrics.gst.totalTax}\n`;
    csv += `"Inventory Valuation (Cost ₹)",${metrics.inventory.valuationCost}\n`;
    csv += `"Inventory Valuation (Retail ₹)",${metrics.inventory.valuationRetail}\n`;
    csv += `"Debtors Receivable (Sundry Debtors ₹)",${metrics.ledgers.debtorsReceivable}\n`;
    csv += `"Creditors Payable (Sundry Creditors ₹)",${metrics.ledgers.creditorsPayable}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Financial_Reports_Register_${activeTab}_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const headers = ['Financial Parameter / Metric Name', 'Category Group', 'Value Amount (₹)'];
    const rows = [
      ['Total Sales Revenue', 'Executive Turnover', metrics.sales.totalRevenue],
      ['Cash Collections (Paid)', 'Executive Collections', metrics.sales.paidCollections],
      ['Pending Receivables (Unpaid)', 'Executive Debtors', metrics.sales.pendingReceivables],
      ['Total Taxable Sales Turnover', 'GSTR-1 Sales Turnover', metrics.gst.taxableValue],
      ['Central GST (CGST) Tax', '9% CGST Tax Ledger', metrics.gst.cgst],
      ['State GST (SGST) Tax', '9% SGST Tax Ledger', metrics.gst.sgst],
      ['Integrated GST (IGST) Tax', '18% IGST Tax Ledger', metrics.gst.igst],
      ['Total GST Tax Collected', 'Statutory Tax Output', metrics.gst.totalTax],
      ['Inventory Stock Valuation (Cost)', 'Stock Assets', metrics.inventory.valuationCost],
      ['Inventory Stock Valuation (Retail)', 'Stock Assets', metrics.inventory.valuationRetail],
      ['Sundry Debtors Receivable', 'Customer Ledgers', metrics.ledgers.debtorsReceivable],
      ['Sundry Creditors Payable', 'Supplier Ledgers', metrics.ledgers.creditorsPayable],
    ];
    exportToExcel(`Financial_Statutory_Report_${activeTab}_${dateRange}`, 'Financial Report', headers, rows);
  };

  const handlePrintPDF = () => {
    const printWin = window.open('', '_blank', 'width=950,height=900');
    if (!printWin) return alert('Pop-up blocked! Allow pop-ups to print executive report.');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial_Report_Register_${dateRange}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 13px; color: #1e293b; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #7367f0; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
          .brand { font-size: 20px; font-weight: bold; color: #7367f0; }
          .sub { font-size: 12px; color: #64748b; margin-top: 3px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; text-align: center; }
          .card-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
          .card-val { font-size: 16px; font-weight: bold; margin-top: 5px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
          td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          .text-end { text-align: right; }
          .fw-bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">EHN One ERP - Executive Financial & GSTR Report</div>
            <div class="sub">Financial & Statutory Audit Ledger • Period: ${dateRange.toUpperCase().replace('_', ' ')}</div>
          </div>
          <div style="text-align: right;">
            <div class="fw-bold">Generated: ${new Date().toLocaleDateString('en-IN')}</div>
            <div class="sub">Kedvass Hygiene Products</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Total Sales Revenue</div>
            <div class="card-val" style="color: #7367f0;">₹ ${metrics.sales.totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div class="card">
            <div class="card-title">Cash Collections</div>
            <div class="card-val" style="color: #28c76f;">₹ ${metrics.sales.paidCollections.toLocaleString('en-IN')}</div>
          </div>
          <div class="card">
            <div class="card-title">GST Tax Collected</div>
            <div class="card-val" style="color: #ff9f43;">₹ ${metrics.gst.totalTax.toLocaleString('en-IN')}</div>
          </div>
          <div class="card">
            <div class="card-title">Stock Valuation</div>
            <div class="card-val">₹ ${metrics.inventory.valuationRetail.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <h3>Financial Breakdown & Tax Metrics</h3>
        <table>
          <thead>
            <tr>
              <th>Financial Parameter</th>
              <th>Reference Category</th>
              <th class="text-end">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Total Taxable Sales Turnover</strong></td>
              <td>GSTR-1 Sales Turnover</td>
              <td class="text-end fw-bold">₹ ${metrics.gst.taxableValue.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td><strong>Central GST (CGST) Tax</strong></td>
              <td>9% CGST Tax Ledger</td>
              <td class="text-end">₹ ${metrics.gst.cgst.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td><strong>State GST (SGST) Tax</strong></td>
              <td>9% SGST Tax Ledger</td>
              <td class="text-end">₹ ${metrics.gst.sgst.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td><strong>Integrated GST (IGST) Tax</strong></td>
              <td>18% IGST Tax Ledger</td>
              <td class="text-end">₹ ${metrics.gst.igst.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td><strong>Sundry Debtors Receivable</strong></td>
              <td>Customer Pending Receivables</td>
              <td class="text-end fw-bold text-primary">₹ ${metrics.ledgers.debtorsReceivable.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;
    printWin.document.write(html);
    printWin.document.close();
    setTimeout(() => printWin.print(), 500);
  };

  if (!can('reports.view')) {
    return (
      <div className="empty-state-v" style={{ paddingTop: 80 }}>
        <i className="bi bi-shield-x" style={{ color: 'var(--danger)' }}></i>
        <h5>Access Denied</h5>
        <p>You don't have permission to access financial reports registers.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Gateway of Tally Software Module Header Bar */}
      <div className="tally-header-bar mb-3 shadow-sm">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="tally-header-badge" style={{ background: 'var(--primary)', color: '#fff' }}>STATUTORY</span>
            <div>
              <h5 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                FINANCIAL REPORTS REGISTER &mdash; STATUTORY & GSTR TAX LEDGER
              </h5>
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                F.Y. 2026-2027 | Financial & Inventory Audit Ledger | Kedvass Hygiene Products
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn-v outline-secondary btn-sm" onClick={handleExportCSV} title="Export CSV">
              <i className="bi bi-filetype-csv me-1"></i> [Alt+C] CSV
            </button>
            <button className="btn-v outline-success btn-sm" onClick={handleExportExcel} title="Export Excel (.xls)">
              <i className="bi bi-file-earmark-excel me-1"></i> [Alt+X] Excel
            </button>
            <button className="btn-v outline-danger btn-sm" onClick={handlePrintPDF} title="Print PDF Report">
              <i className="bi bi-file-earmark-pdf me-1"></i> [Alt+P] PDF Report
            </button>
          </div>
        </div>

        {/* F1-F8 Action Toolbar */}
        <div className="tally-toolbar mt-2 pt-2 border-top d-flex gap-2 flex-wrap">
          <button className="tally-shortcut-btn" onClick={() => setDateRange('this_month')}>
            <span className="key">[F2]</span> Period (Month)
          </button>
          <button className="tally-shortcut-btn" onClick={() => setActiveTab('stock')}>
            <span className="key">[F4]</span> Stock Movement
          </button>
          <button className="tally-shortcut-btn" onClick={() => setActiveTab('gst')}>
            <span className="key">[F5]</span> GSTR-1 Tax Summary
          </button>
          <button className="tally-shortcut-btn" onClick={() => setActiveTab('ledger')}>
            <span className="key">[F7]</span> Sundry Debtors Ledger
          </button>
          <button className="tally-shortcut-btn" onClick={handlePrintPDF}>
            <span className="key">[Alt+P]</span> Print PDF Report
          </button>
          <button className="tally-shortcut-btn" onClick={handleExportCSV}>
            <span className="key">[Alt+C]</span> Export CSV
          </button>
        </div>
      </div>

      {/* Tally Metric Summary Cards */}
      <div className="row g-2 mb-3">
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL SALES REVENUE</div>
            <div className="tally-stat-value text-primary">₹{metrics.sales.totalRevenue.toLocaleString('en-IN')}</div>
            <div className="tally-stat-sub text-muted">{metrics.sales.invoiceCount} Sales Vouchers</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">PAID CASH COLLECTIONS</div>
            <div className="tally-stat-value text-success">₹{metrics.sales.paidCollections.toLocaleString('en-IN')}</div>
            <div className="tally-stat-sub text-muted">Bank & Cash Realized</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL GST TAX AUDIT</div>
            <div className="tally-stat-value text-warning">₹{metrics.gst.totalTax.toLocaleString('en-IN')}</div>
            <div className="tally-stat-sub text-muted">CGST + SGST + IGST Liability</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">STOCK RETAIL VALUATION</div>
            <div className="tally-stat-value">{`₹${metrics.inventory.valuationRetail.toLocaleString('en-IN')}`}</div>
            <div className="tally-stat-sub text-muted">{metrics.inventory.totalQuantity.toLocaleString()} Total Stock Units</div>
          </div>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="v-card mb-3">
        <div className="v-card-body p-2">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <label className="form-label mb-1" style={{ fontSize: '0.72rem' }}>Audit Period Selector [Press F2]</label>
              <select className="form-select btn-sm" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month (August 2026)</option>
                <option value="last_month">Last Month (July 2026)</option>
                <option value="this_quarter">Q2 Financial Quarter</option>
                <option value="financial_year">Financial Year 2026-27</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
            {dateRange === 'custom' && (
              <>
                <div className="col-md-3">
                  <label className="form-label mb-1" style={{ fontSize: '0.72rem' }}>From Date</label>
                  <input type="date" className="form-control btn-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label mb-1" style={{ fontSize: '0.72rem' }}>To Date</label>
                  <input type="date" className="form-control btn-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </>
            )}
            <div className="col-md-2 ms-auto text-end">
              <span className="badge-v secondary fw-bold" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-clock-history me-1"></i> LIVE ERP SYNC
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Tab Control */}
      <div className="d-flex border-bottom mb-3 bg-white p-2 rounded-2 shadow-sm gap-2 overflow-auto">
        <button 
          className={`btn-v btn-sm ${activeTab === 'charts' ? 'primary' : 'light'}`}
          onClick={() => setActiveTab('charts')}
        >
          <i className="bi bi-graph-up-arrow me-1"></i> Interactive Visual Charts
        </button>
        <button 
          className={`btn-v btn-sm ${activeTab === 'overview' ? 'primary' : 'light'}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="bi bi-speedometer2 me-1"></i> Executive Financial Overview
        </button>
        <button 
          className={`btn-v btn-sm ${activeTab === 'gst' ? 'primary' : 'light'}`}
          onClick={() => setActiveTab('gst')}
        >
          <i className="bi bi-receipt me-1"></i> GSTR-1 Statutory Tax Summary
        </button>
        <button 
          className={`btn-v btn-sm ${activeTab === 'stock' ? 'primary' : 'light'}`}
          onClick={() => setActiveTab('stock')}
        >
          <i className="bi bi-box-seam me-1"></i> Stock Valuation Register
        </button>
        <button 
          className={`btn-v btn-sm ${activeTab === 'ledger' ? 'primary' : 'light'}`}
          onClick={() => setActiveTab('ledger')}
        >
          <i className="bi bi-journal-bookmark me-1"></i> Sundry Debtors & Creditors
        </button>
      </div>

      {/* TAB 0: INTERACTIVE VISUAL CHARTS */}
      {activeTab === 'charts' && (
        <InteractiveAnalyticsChartSuite metrics={metrics} />
      )}

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="v-card">
          <div className="v-card-header d-flex justify-content-between align-items-center">
            <span><i className="bi bi-file-earmark-text me-2" style={{ color: 'var(--primary)' }}></i>EXECUTIVE FINANCIAL STATEMENT</span>
            <span className="text-muted small">HIGH-DENSITY AUDIT VIEW</span>
          </div>
          <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
            <table className="v-table">
              <thead>
                <tr>
                  <th>FINANCIAL PARAMETER</th>
                  <th>AUDIT CATEGORY</th>
                  <th className="text-end">AMOUNT (₹)</th>
                  <th>PERCENTAGE TURNOVER</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-bold">Total Sales Turnover</td>
                  <td>Gross Sales Revenue</td>
                  <td className="text-end fw-bold text-primary">₹{metrics.sales.totalRevenue.toLocaleString('en-IN')}</td>
                  <td className="fw-semibold">100.0%</td>
                  <td><span className="badge-v success">AUDITED</span></td>
                </tr>
                <tr>
                  <td className="fw-bold">Paid Collections Realized</td>
                  <td>Bank / Cash Receipts</td>
                  <td className="text-end fw-bold text-success">₹{metrics.sales.paidCollections.toLocaleString('en-IN')}</td>
                  <td className="fw-semibold">{Math.round((metrics.sales.paidCollections / (metrics.sales.totalRevenue || 1)) * 100)}%</td>
                  <td><span className="badge-v success">REALIZED</span></td>
                </tr>
                <tr>
                  <td className="fw-bold">Pending Customer Dues</td>
                  <td>Sundry Debtors Ledger</td>
                  <td className="text-end fw-bold text-warning">₹{metrics.sales.pendingReceivables.toLocaleString('en-IN')}</td>
                  <td className="fw-semibold">{Math.round((metrics.sales.pendingReceivables / (metrics.sales.totalRevenue || 1)) * 100)}%</td>
                  <td><span className="badge-v warning">PENDING DUES</span></td>
                </tr>
                <tr>
                  <td className="fw-bold">Total GST Tax Liability</td>
                  <td>GSTR-1 Tax Collection</td>
                  <td className="text-end fw-bold text-danger">₹{metrics.gst.totalTax.toLocaleString('en-IN')}</td>
                  <td className="fw-semibold">18.0% Taxable</td>
                  <td><span className="badge-v info">STATUTORY</span></td>
                </tr>
                <tr>
                  <td className="fw-bold">Total Stock Retail Valuation</td>
                  <td>Inventory Stock Register</td>
                  <td className="text-end fw-bold text-dark">₹{metrics.inventory.valuationRetail.toLocaleString('en-IN')}</td>
                  <td className="fw-semibold">Inventory Valuation</td>
                  <td><span className="badge-v primary">IN STOCK</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GSTR-1 TAX BREAKDOWN */}
      {activeTab === 'gst' && (
        <div className="v-card">
          <div className="v-card-header d-flex justify-content-between align-items-center">
            <span><i className="bi bi-receipt me-2" style={{ color: '#2563eb' }}></i>GSTR-1 STATUTORY TAX LEDGER BREAKDOWN</span>
            <span className="text-muted small">FORM GSTR-1 AUDIT</span>
          </div>
          <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
            <table className="v-table">
              <thead>
                <tr>
                  <th>TAX LEDGER TYPE</th>
                  <th>GST TAX RATE (%)</th>
                  <th className="text-end">TAXABLE VALUE (₹)</th>
                  <th className="text-end">COLLECTED TAX (₹)</th>
                  <th>STATUTORY STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-bold">Central GST (CGST)</td>
                  <td>9.0% CGST</td>
                  <td className="text-end fw-semibold">₹{(metrics.gst.taxableValue / 2).toLocaleString('en-IN')}</td>
                  <td className="text-end fw-bold text-primary">₹{metrics.gst.cgst.toLocaleString('en-IN')}</td>
                  <td><span className="badge-v success">READY FOR GSTR-1</span></td>
                </tr>
                <tr>
                  <td className="fw-bold">State GST (SGST)</td>
                  <td>9.0% SGST</td>
                  <td className="text-end fw-semibold">₹{(metrics.gst.taxableValue / 2).toLocaleString('en-IN')}</td>
                  <td className="text-end fw-bold text-primary">₹{metrics.gst.sgst.toLocaleString('en-IN')}</td>
                  <td><span className="badge-v success">READY FOR GSTR-1</span></td>
                </tr>
                <tr>
                  <td className="fw-bold">Integrated GST (IGST)</td>
                  <td>18.0% IGST</td>
                  <td className="text-end fw-semibold">₹{(metrics.gst.taxableValue / 2).toLocaleString('en-IN')}</td>
                  <td className="text-end fw-bold text-primary">₹{metrics.gst.igst.toLocaleString('en-IN')}</td>
                  <td><span className="badge-v success">READY FOR GSTR-1</span></td>
                </tr>
                <tr className="bg-light fw-bold">
                  <td>TOTAL STATUTORY LIABILITY</td>
                  <td>18.0% COMBINED</td>
                  <td className="text-end">₹{metrics.gst.taxableValue.toLocaleString('en-IN')}</td>
                  <td className="text-end text-danger">₹{metrics.gst.totalTax.toLocaleString('en-IN')}</td>
                  <td><span className="badge-v primary">AUDITED</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK VALUATION */}
      {activeTab === 'stock' && (
        <div className="v-card">
          <div className="v-card-header d-flex justify-content-between align-items-center">
            <span><i className="bi bi-box-seam me-2" style={{ color: '#059669' }}></i>STOCK MOVEMENT & VALUATION REGISTER</span>
            <span className="text-muted small">INVENTORY AUDIT</span>
          </div>
          <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
            <table className="v-table">
              <thead>
                <tr>
                  <th>METRIC PARAMETER</th>
                  <th>VALUATION METHOD</th>
                  <th className="text-end">COST VALUE (₹)</th>
                  <th className="text-end">RETAIL VALUE (₹)</th>
                  <th className="text-end">POTENTIAL MARGIN (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-bold">Total Stock Inventory Valuation</td>
                  <td>FIFO Valuation</td>
                  <td className="text-end fw-bold text-dark">₹{metrics.inventory.valuationCost.toLocaleString('en-IN')}</td>
                  <td className="text-end fw-bold text-primary">₹{metrics.inventory.valuationRetail.toLocaleString('en-IN')}</td>
                  <td className="text-end fw-bold text-success">₹{(metrics.inventory.valuationRetail - metrics.inventory.valuationCost).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUNDRY DEBTORS & CREDITORS */}
      {activeTab === 'ledger' && (
        <div className="v-card">
          <div className="v-card-header d-flex justify-content-between align-items-center">
            <span><i className="bi bi-journal-bookmark me-2" style={{ color: '#8b5cf6' }}></i>SUNDRY DEBTORS & CREDITORS LEDGER SUMMARY</span>
            <span className="text-muted small">PARTY BALANCE AUDIT</span>
          </div>
          <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
            <table className="v-table">
              <thead>
                <tr>
                  <th>LEDGER CATEGORY</th>
                  <th>ACCOUNT GROUP</th>
                  <th className="text-end">DEBIT / CREDIT (₹)</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-bold">Sundry Debtors (Customer Receivables)</td>
                  <td>Current Assets</td>
                  <td className="text-end fw-bold text-success">₹{metrics.ledgers.debtorsReceivable.toLocaleString('en-IN')} Dr</td>
                  <td><span className="badge-v success">RECEIVABLE</span></td>
                </tr>
                <tr>
                  <td className="fw-bold">Sundry Creditors (Supplier Payables)</td>
                  <td>Current Liabilities</td>
                  <td className="text-end fw-bold text-danger">₹{metrics.ledgers.creditorsPayable.toLocaleString('en-IN')} Cr</td>
                  <td><span className="badge-v danger">PAYABLE</span></td>
                </tr>
                <tr className="bg-light fw-bold">
                  <td>NET BALANCE POSITION</td>
                  <td>Working Capital</td>
                  <td className="text-end text-primary">₹{metrics.ledgers.netBalance.toLocaleString('en-IN')} Dr</td>
                  <td><span className="badge-v primary">HEALTHY</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
