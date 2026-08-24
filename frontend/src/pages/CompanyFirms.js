import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function CompanyFirms() {
  const { can } = useAuth();
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editFirm, setEditFirm] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    isGstRegistered: true,
    gstin: '',
    invoicePrefix: 'INV/2026/',
    address: '',
    state: '23-Madhya Pradesh',
    phone: '',
    email: '',
    bankName: '',
    bankAccountNo: '',
    ifscCode: '',
    branchName: '',
    termsAndConditions: '1. Goods once sold will not be taken back.\n2. Subject to Jurisdiction.',
    isDefault: false,
  });

  const fetchFirms = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/company-firms', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setFirms(data.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirms();
  }, []);

  const handleOpenModal = (firm = null) => {
    if (firm) {
      setEditFirm(firm);
      setForm({
        name: firm.name || '',
        isGstRegistered: firm.isGstRegistered !== false,
        gstin: firm.gstin || '',
        invoicePrefix: firm.invoicePrefix || 'INV/',
        address: firm.address || '',
        state: firm.state || '23-Madhya Pradesh',
        phone: firm.phone || '',
        email: firm.email || '',
        bankName: firm.bankName || '',
        bankAccountNo: firm.bankAccountNo || '',
        ifscCode: firm.ifscCode || '',
        branchName: firm.branchName || '',
        termsAndConditions: firm.termsAndConditions || '1. Goods once sold will not be taken back.\n2. Subject to Jurisdiction.',
        isDefault: !!firm.isDefault,
      });
    } else {
      setEditFirm(null);
      setForm({
        name: '',
        isGstRegistered: true,
        gstin: '',
        invoicePrefix: 'KHP/26-27/',
        address: '',
        state: '23-Madhya Pradesh',
        phone: '',
        email: '',
        bankName: '',
        bankAccountNo: '',
        ifscCode: '',
        branchName: '',
        termsAndConditions: '1. Goods once sold will not be taken back.\n2. Subject to Jurisdiction.',
        isDefault: firms.length === 0,
      });
    }
    setShowModal(true);
  };

  const handleSaveFirm = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Please enter firm name.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editFirm ? `/api/company-firms/${editFirm._id}` : '/api/company-firms';
      const method = editFirm ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        fetchFirms();
      } else {
        alert(data.message || 'Failed to save firm.');
      }
    } catch (err) {
      alert('Server connection error.');
    }
  };

  const handleDeleteFirm = async (id) => {
    if (!window.confirm('Delete this business firm?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/company-firms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        fetchFirms();
      }
    } catch (e) {}
  };

  const filteredFirms = firms.filter(f => 
    !search || f.name.toLowerCase().includes(search.toLowerCase()) || (f.gstin || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!can('settings.view')) {
    return (
      <div className="empty-state-v" style={{ paddingTop: 80 }}>
        <i className="bi bi-shield-x text-danger"></i>
        <h5>Access Denied</h5>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-0.5">
            <h5 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px' }}>Company & Business Firms Master</h5>
            <span className="badge px-2 py-0.5" style={{ background: '#DAF2DB', color: '#1E4D2B', fontWeight: 700, fontSize: '0.68rem' }}>
              TALLY MULTI-FIRM ENGINE
            </span>
          </div>
          <small className="text-muted" style={{ fontSize: '0.78rem' }}>Manage multiple business firms with separate GSTIN, Invoice Series, & Bank Accounts</small>
        </div>
        <button className="btn btn-success btn-sm fw-bold rounded-0 px-3.5 shadow-sm" style={{ background: '#1E4D2B', border: 'none', fontSize: '0.78rem' }} onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-lg me-1"></i> Add Business Firm
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 0 }}>
        <div className="card-body p-2 d-flex align-items-center justify-content-between bg-white">
          <div className="search-box-v" style={{ maxWidth: 360, width: '100%' }}>
            <i className="bi bi-search"></i>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search firm name or GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <small className="text-muted fw-bold font-monospace" style={{ fontSize: '0.75rem' }}>TOTAL FIRMS: {firms.length}</small>
        </div>
      </div>

      {/* Firms Register Table */}
      <div className="v-card" style={{ borderRadius: 0 }}>
        <div className="v-card-header d-flex justify-content-between align-items-center" style={{ background: '#f4fbf5', borderRadius: 0 }}>
          <span className="fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.88rem' }}>
            <i className="bi bi-building text-success"></i> REGISTERED BUSINESS FIRMS REGISTER
          </span>
          <span className="badge px-2.5 py-1" style={{ background: '#DAF2DB', color: '#1E4D2B', fontWeight: 600 }}>{firms.length} FIRMS</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner-border spinner-border-sm text-success me-2" role="status"></div>
              <span>Loading registered firms...</span>
            </div>
          ) : filteredFirms.length === 0 ? (
            <div className="p-4 text-center bg-white">
              <p className="text-muted mb-2">No business firms registered yet.</p>
              <button className="btn btn-success btn-sm rounded-0 px-3" onClick={() => handleOpenModal()}>
                + Add First Firm
              </button>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th style={{ width: 35 }}>#</th>
                  <th>FIRM LEGAL NAME</th>
                  <th>GST REGISTRATION STATUS</th>
                  <th>INVOICE PREFIX & SERIES</th>
                  <th>BANK ACCOUNT DETAILS</th>
                  <th>REGISTERED ADDRESS</th>
                  <th className="text-end" style={{ width: 120 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredFirms.map((f, i) => (
                  <tr key={f._id}>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>{i + 1}</td>
                    <td>
                      <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                        {f.name}
                        {f.isDefault && (
                          <span className="badge bg-success font-monospace" style={{ fontSize: '0.62rem' }}>PRIMARY DEFAULT</span>
                        )}
                      </div>
                      <small className="text-muted" style={{ fontSize: '0.72rem' }}>{f.email || f.phone || 'No contact email'}</small>
                    </td>
                    <td>
                      {f.isGstRegistered ? (
                        <div>
                          <span className="badge bg-success font-monospace" style={{ fontSize: '0.72rem' }}>
                            <i className="bi bi-patch-check me-1"></i> GST REGISTERED
                          </span>
                          <div className="fw-bold font-monospace text-dark mt-0.5" style={{ fontSize: '0.75rem' }}>{f.gstin}</div>
                        </div>
                      ) : (
                        <div>
                          <span className="badge bg-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
                            <i className="bi bi-x-circle me-1"></i> NON-GST / EXEMPT
                          </span>
                          <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Bill of Supply Mode</small>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace fw-bold" style={{ fontSize: '0.78rem' }}>
                        {f.invoicePrefix}
                      </span>
                      <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.68rem' }}>Next Seq: #{f.currentInvoiceSequence || 101}</small>
                    </td>
                    <td>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.78rem' }}>{f.bankName || 'Not Set'}</div>
                      <small className="text-muted font-monospace d-block" style={{ fontSize: '0.7rem' }}>
                        {f.bankAccountNo ? `A/C: ${f.bankAccountNo} (${f.ifscCode})` : 'No Bank Details'}
                      </small>
                    </td>
                    <td>
                      <small className="text-muted text-truncate d-block" style={{ fontSize: '0.72rem', maxWidth: 220 }}>
                        {f.address || 'Address not specified'}
                      </small>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button className="btn btn-v outline-primary btn-sm p-1 px-2" onClick={() => handleOpenModal(f)} title="Edit Firm">
                          <i className="bi bi-pencil"></i>
                        </button>
                        {!f.isDefault && (
                          <button className="btn btn-v outline-danger btn-sm p-1 px-2" onClick={() => handleDeleteFirm(f._id)} title="Delete Firm">
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

      {/* CREATE / EDIT FIRM MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 620, borderRadius: 0 }}>
            <div className="modal-box-header d-flex align-items-center justify-content-between px-3.5 py-2.5" style={{ background: '#1E4D2B', color: '#ffffff', borderRadius: 0 }}>
              <span className="fw-bold text-white d-flex align-items-center gap-2" style={{ fontSize: '0.98rem' }}>
                <i className="bi bi-building text-warning me-1"></i> {editFirm ? 'Edit Business Firm' : 'Add Business Firm'}
              </span>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
            </div>
            <form onSubmit={handleSaveFirm}>
              <div className="modal-box-body p-3.5 bg-white">
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark" style={{ fontSize: '0.82rem' }}>Firm Legal Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control fw-semibold"
                    placeholder="e.g. Kedvass Hygiene Products, Kedvass Traders"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                {/* GST Registration Status Toggle */}
                <div className="p-3 rounded border mb-3" style={{ background: form.isGstRegistered ? '#F4FBF5' : '#F8FAFC', borderColor: form.isGstRegistered ? '#4CAF50' : '#CBD5E1' }}>
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input style-cursor"
                      type="checkbox"
                      id="gstToggle"
                      checked={form.isGstRegistered}
                      onChange={(e) => setForm({ ...form, isGstRegistered: e.target.checked })}
                    />
                    <label className="form-check-label fw-bold text-dark style-cursor" htmlFor="gstToggle" style={{ fontSize: '0.85rem' }}>
                      {form.isGstRegistered ? 'GST Registered Firm (Tax Invoice Mode)' : 'Non-GST / Exempt Firm (Bill of Supply Mode)'}
                    </label>
                  </div>

                  {form.isGstRegistered ? (
                    <div>
                      <label className="form-label fw-bold text-dark" style={{ fontSize: '0.8rem' }}>GSTIN Number <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control font-monospace fw-bold text-uppercase"
                        placeholder="e.g. 23AAAAA0000A1Z5"
                        value={form.gstin}
                        onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                        required={form.isGstRegistered}
                      />
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>Tax invoices will auto-calculate CGST/SGST/IGST breakdown and print GSTIN.</small>
                    </div>
                  ) : (
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                      Invoices created under this firm will automatically hide GSTIN, set Tax Rate = 0%, and render as "Bill of Supply / Retail Invoice".
                    </small>
                  )}
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-bold text-dark" style={{ fontSize: '0.82rem' }}>Invoice Series Prefix <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control font-monospace fw-bold"
                      placeholder="e.g. KHP/26-27/, KTR/"
                      value={form.invoicePrefix}
                      onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold text-dark" style={{ fontSize: '0.82rem' }}>State & Code</label>
                    <input
                      type="text"
                      className="form-control fw-bold"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold text-dark" style={{ fontSize: '0.82rem' }}>Registered Office Address</label>
                  <textarea
                    className="form-control fw-semibold"
                    rows="2"
                    placeholder="Enter full office address to print on invoice headers..."
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  ></textarea>
                </div>

                {/* Bank Account Details */}
                <div className="border p-2.5 rounded bg-light mb-3">
                  <span className="fw-bold text-dark d-block mb-2" style={{ fontSize: '0.8rem' }}>Firm Bank Account Details (Printed on Invoices):</span>
                  <div className="row g-2">
                    <div className="col-6">
                      <input type="text" className="form-control form-control-sm fw-semibold" placeholder="Bank Name (e.g. HDFC Bank)" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <input type="text" className="form-control form-control-sm font-monospace fw-bold" placeholder="Account Number" value={form.bankAccountNo} onChange={(e) => setForm({ ...form, bankAccountNo: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <input type="text" className="form-control form-control-sm font-monospace fw-bold text-uppercase" placeholder="IFSC Code" value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="col-6">
                      <input type="text" className="form-control form-control-sm fw-semibold" placeholder="Branch Name" value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input style-cursor"
                    type="checkbox"
                    id="defaultFirmToggle"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  <label className="form-check-label fw-bold text-dark style-cursor" htmlFor="defaultFirmToggle" style={{ fontSize: '0.82rem' }}>
                    Set as Primary Default Firm for Billing
                  </label>
                </div>
              </div>
              <div className="modal-box-footer d-flex justify-content-end gap-2 p-3 bg-light" style={{ borderRadius: 0 }}>
                <button type="button" className="btn btn-outline-secondary btn-sm fw-semibold" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success btn-sm fw-bold px-4" style={{ background: '#1E4D2B', border: 'none' }}>Save Business Firm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
