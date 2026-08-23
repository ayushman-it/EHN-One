import React, { useState, useEffect } from 'react';

export default function DocumentCustomizer() {
  const [activeTab, setActiveTab] = useState('branding');
  const [savedAlert, setSavedAlert] = useState(false);

  // Load customizer settings from localStorage or defaults
  const [config, setConfig] = useState(() => {
    try {
      const cached = localStorage.getItem('ehn_document_template_settings');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      title: 'TAX INVOICE',
      subtitle: 'Original for Recipient',
      showLogo: true,
      logoWidth: 64,
      primaryColor: '#1E4D2B',
      leafColor: '#4CAF50',
      mintColor: '#DAF2DB',
      watermarkText: 'KEDVASS HYGIENE OFFICIAL',
      showWatermark: true,
      showGstin: true,
      showBankDetails: true,
      bankName: 'HDFC Bank Ltd',
      accountNo: '50200012345678',
      ifscCode: 'HDFC0001234',
      branch: 'Central Industrial Estate Branch',
      terms: '1. Goods once sold will not be taken back.\n2. Interest @18% p.a. charged on delayed payments.\n3. Subject to State Jurisdiction.',
      signatureTitle: 'Authorized Signatory',
      excelColumns: {
        sku: true,
        hsn: true,
        gstRate: true,
        category: true,
        valuation: true,
        warehouse: true
      }
    };
  });

  const handleSave = () => {
    localStorage.setItem('ehn_document_template_settings', JSON.stringify(config));
    window.dispatchEvent(new Event('ehn_document_settings_updated'));
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="py-2">
      {/* Page Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold text-dark" style={{ letterSpacing: '-0.3px' }}>Document & Invoice Customizer</h4>
          <p className="text-muted small mb-0">Customize PDF invoices, GST vouchers, print headers, watermarks & Excel export templates</p>
        </div>
        <button className="btn-v primary btn-sm" onClick={handleSave}>
          <i className="bi bi-check-circle me-1"></i> Save Document Template
        </button>
      </div>

      {savedAlert && (
        <div className="alert-v success mb-4">
          <i className="bi bi-check-circle-fill"></i>
          <div>
            <strong>Document Settings Saved!</strong>
            <p className="mb-0 small">PDF invoices, print templates, and Excel exports are now synchronized.</p>
          </div>
        </div>
      )}

      {/* Main Split Layout: Settings Tabs on Left, Live Interactive A4 Preview on Right */}
      <div className="row g-4">
        {/* Left Settings Panel */}
        <div className="col-lg-5 col-md-6">
          <div className="v-card shadow-sm mb-4" style={{ borderRadius: '14px', border: '1px solid rgba(76, 175, 80, 0.18)' }}>
            <div className="v-card-header p-2 bg-light border-bottom">
              <div className="nav nav-pills nav-fill gap-1" style={{ fontSize: '0.78rem' }}>
                <button
                  className={`nav-link py-1.5 px-2 ${activeTab === 'branding' ? 'active bg-success text-white' : 'text-dark'}`}
                  onClick={() => setActiveTab('branding')}
                  style={{ background: activeTab === 'branding' ? '#1E4D2B' : 'transparent', fontWeight: 600 }}
                >
                  <i className="bi bi-palette me-1"></i> Branding & Header
                </button>
                <button
                  className={`nav-link py-1.5 px-2 ${activeTab === 'content' ? 'active bg-success text-white' : 'text-dark'}`}
                  onClick={() => setActiveTab('content')}
                  style={{ background: activeTab === 'content' ? '#1E4D2B' : 'transparent', fontWeight: 600 }}
                >
                  <i className="bi bi-file-text me-1"></i> Terms & Bank
                </button>
                <button
                  className={`nav-link py-1.5 px-2 ${activeTab === 'excel' ? 'active bg-success text-white' : 'text-dark'}`}
                  onClick={() => setActiveTab('excel')}
                  style={{ background: activeTab === 'excel' ? '#1E4D2B' : 'transparent', fontWeight: 600 }}
                >
                  <i className="bi bi-file-earmark-excel me-1"></i> Excel Columns
                </button>
              </div>
            </div>

            <div className="v-card-body p-3">
              {activeTab === 'branding' && (
                <div className="vstack gap-3">
                  <div>
                    <label className="form-label fw-bold small">Invoice Header Title</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={config.title}
                      onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label fw-bold small">Sub-header Label</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={config.subtitle}
                      onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                    />
                  </div>

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="showLogoSwitch"
                      checked={config.showLogo}
                      onChange={(e) => setConfig({ ...config, showLogo: e.target.checked })}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="showLogoSwitch">Display Company Logo on Header</label>
                  </div>

                  <div>
                    <label className="form-label fw-bold small">Logo Display Size ({config.logoWidth}px)</label>
                    <input
                      type="range"
                      className="form-range"
                      min="40"
                      max="120"
                      value={config.logoWidth}
                      onChange={(e) => setConfig({ ...config, logoWidth: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="showWatermarkSwitch"
                      checked={config.showWatermark}
                      onChange={(e) => setConfig({ ...config, showWatermark: e.target.checked })}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="showWatermarkSwitch">Display Background Watermark</label>
                  </div>

                  {config.showWatermark && (
                    <div>
                      <label className="form-label fw-bold small">Watermark Text</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={config.watermarkText}
                        onChange={(e) => setConfig({ ...config, watermarkText: e.target.value })}
                      />
                    </div>
                  )}

                  <div>
                    <label className="form-label fw-bold small">Header Accent Color</label>
                    <div className="d-flex gap-2">
                      {['#1E4D2B', '#4CAF50', '#0f2917', '#2563eb', '#dc2626'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="rounded-circle border-0 style-cursor"
                          style={{ width: 28, height: 28, background: c, outline: config.primaryColor === c ? '3px solid #4CAF50' : 'none' }}
                          onClick={() => setConfig({ ...config, primaryColor: c })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="vstack gap-3">
                  <div>
                    <label className="form-label fw-bold small">Bank Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={config.bankName}
                      onChange={(e) => setConfig({ ...config, bankName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label fw-bold small">Account Number</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={config.accountNo}
                      onChange={(e) => setConfig({ ...config, accountNo: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label fw-bold small">IFSC Code</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={config.ifscCode}
                      onChange={(e) => setConfig({ ...config, ifscCode: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label fw-bold small">Terms & Conditions</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={3}
                      value={config.terms}
                      onChange={(e) => setConfig({ ...config, terms: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label fw-bold small">Signature Block Label</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={config.signatureTitle}
                      onChange={(e) => setConfig({ ...config, signatureTitle: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'excel' && (
                <div className="vstack gap-2">
                  <div className="fw-bold small mb-2 text-dark">Configure Columns for Excel (.xlsx) Exports:</div>

                  {Object.keys(config.excelColumns).map((colKey) => (
                    <div key={colKey} className="form-check form-switch p-2 bg-light rounded">
                      <input
                        className="form-check-input ms-0 me-2"
                        type="checkbox"
                        id={`excelCol_${colKey}`}
                        checked={config.excelColumns[colKey]}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            excelColumns: { ...config.excelColumns, [colKey]: e.target.checked }
                          })
                        }
                      />
                      <label className="form-check-label small fw-semibold text-capitalize" htmlFor={`excelCol_${colKey}`}>
                        Include {colKey.replace(/([A-Z])/g, ' $1')} Column
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Live Real-Time Interactive Preview Panel */}
        <div className="col-lg-7 col-md-6">
          <div className="v-card shadow-sm p-4 bg-white position-relative overflow-hidden" style={{ borderRadius: '16px', border: '1px solid rgba(76, 175, 80, 0.25)', minHeight: 520 }}>
            {/* Watermark Overlay */}
            {config.showWatermark && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-30deg)',
                  fontSize: '2.4rem',
                  fontWeight: 900,
                  color: 'rgba(76, 175, 80, 0.06)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  letterSpacing: '3px'
                }}
              >
                {config.watermarkText}
              </div>
            )}

            {/* Live Invoice Preview Header */}
            <div className="d-flex justify-content-between align-items-start pb-3 mb-3 border-bottom" style={{ borderColor: config.primaryColor }}>
              <div className="d-flex align-items-center gap-3">
                {config.showLogo && (
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                    style={{ width: config.logoWidth, height: config.logoWidth, background: config.primaryColor, border: '2px solid #4CAF50' }}
                  >
                    EHN
                  </div>
                )}
                <div>
                  <h5 className="fw-bold mb-0 text-dark">Kedvass Hygiene Products</h5>
                  <div className="small text-muted">GSTIN: 07AAAAA0000A1Z5 | Reg. Office: Industrial Estate</div>
                </div>
              </div>
              <div className="text-end">
                <span className="badge px-3 py-1.5 text-white fw-bold text-uppercase" style={{ background: config.primaryColor, borderRadius: '6px' }}>
                  {config.title}
                </span>
                <div className="small text-muted mt-1">{config.subtitle}</div>
              </div>
            </div>

            {/* Sample Table */}
            <table className="table table-sm table-bordered mt-3" style={{ fontSize: '0.8rem' }}>
              <thead style={{ background: '#f4fbf5', color: config.primaryColor }}>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  {config.excelColumns.hsn && <th>HSN</th>}
                  <th>Qty</th>
                  <th>Rate</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td className="fw-bold">Hand Sanitizer 500ml</td>
                  {config.excelColumns.hsn && <td>380894</td>}
                  <td>50 Pcs</td>
                  <td>₹120.00</td>
                  <td className="text-end fw-bold">₹6,000.00</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td className="fw-bold">Disinfectant Surface Wipes</td>
                  {config.excelColumns.hsn && <td>340111</td>}
                  <td>20 Pcs</td>
                  <td>₹250.00</td>
                  <td className="text-end fw-bold">₹5,000.00</td>
                </tr>
              </tbody>
            </table>

            {/* Terms & Bank Footer */}
            <div className="row mt-4 pt-3 border-top" style={{ fontSize: '0.75rem' }}>
              <div className="col-7">
                <div className="fw-bold text-dark mb-1">Bank Details:</div>
                <div>{config.bankName} | A/C: {config.accountNo}</div>
                <div>IFSC: {config.ifscCode}</div>

                <div className="fw-bold text-dark mt-2 mb-1">Terms & Conditions:</div>
                <div className="text-muted" style={{ whiteSpace: 'pre-line' }}>{config.terms}</div>
              </div>
              <div className="col-5 text-end d-flex flex-column justify-content-between">
                <div>Total Taxable: <strong>₹11,000.00</strong></div>
                <div className="mt-4 pt-3 border-top border-dark text-dark fw-bold">
                  {config.signatureTitle}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
