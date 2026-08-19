import React, { useState, useEffect } from 'react';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, exportTallyLedgers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LedgerStatementModal from '../components/LedgerStatementModal';
import { sendCustomerPaymentReminderWhatsApp } from '../utils/whatsappHelper';

const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function Customers() {
  const { can } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedLedgerParty, setSelectedLedgerParty] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  const initialForm = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    state: 'Delhi',
    pincode: '',
    country: 'India',
    group: 'Sundry Debtors',
    maintainBillByBill: true,
    defaultCreditPeriod: 30,
    creditLimit: 0,
    gstRegistrationType: 'Regular',
    gstin: '',
    pan: '',
    bankDetails: {
      accountNo: '',
      ifsc: '',
      bankName: '',
      branch: ''
    },
    openingBalance: 0,
    openingBalanceType: 'Dr',
    status: 'active'
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await getCustomers(search);
      setCustomers(res.data || []);
    } catch (err) {
      showAlert('danger', err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), 4000);
  };

  const handleOpenModal = (cust = null) => {
    if (cust) {
      setEditingCustomer(cust);
      setFormData({
        ...initialForm,
        ...cust,
        bankDetails: { ...initialForm.bankDetails, ...(cust.bankDetails || {}) }
      });
    } else {
      setEditingCustomer(null);
      setFormData(initialForm);
    }
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name.trim() || !formData.phone.trim()) {
        showAlert('warning', 'Please provide Customer Name and Phone Number');
        return;
      }

      if (editingCustomer) {
        await updateCustomer(editingCustomer._id, formData);
        showAlert('success', 'Customer (Sundry Debtor) updated successfully!');
      } else {
        await addCustomer(formData);
        showAlert('success', 'Customer (Sundry Debtor) added successfully!');
      }
      handleCloseModal();
      loadCustomers();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to save customer');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"?`)) {
      try {
        await deleteCustomer(id);
        showAlert('success', 'Customer deleted successfully');
        loadCustomers();
      } catch (err) {
        showAlert('danger', err.message || 'Failed to delete customer');
      }
    }
  };

  // Filtered List
  const filteredCustomers = customers.filter(c => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchState = stateFilter === 'all' || c.state === stateFilter;
    return matchStatus && matchState;
  });

  // Metrics
  const totalReceivables = customers.reduce((sum, c) => sum + (Number(c.openingBalance) || 0), 0);
  const activeCount = customers.filter(c => c.status === 'active').length;

  const getStatusBadge = (status) => {
    if (status === 'active') return <span className="badge-v success"><i className="bi bi-check-circle"></i> Active</span>;
    return <span className="badge-v secondary"><i className="bi bi-dash-circle"></i> Inactive</span>;
  };

  return (
    <div>
      {/* Alert Banner */}
      {alertMsg.text && (
        <div className={`alert-v ${alertMsg.type} mb-3`}>
          <i className={`bi bi-${alertMsg.type === 'success' ? 'check-circle' : 'exclamation-triangle'}`}></i>
          {alertMsg.text}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title d-flex align-items-center gap-2">
              <i className="bi bi-people" style={{ color: 'var(--primary)' }}></i>
              Customers Master (Sundry Debtors)
            </h1>
            <p className="page-subtitle">Manage client ledgers, GSTIN details, credit periods, bill-by-bill tracking, and Tally Prime sync</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn-v outline-success" onClick={exportTallyLedgers} title="Export Tally XML">
              <i className="bi bi-file-earmark-code-fill"></i>
              <span>Export Tally XML</span>
            </button>
            {can('products.add') && (
              <button className="btn-v primary" onClick={() => handleOpenModal()}>
                <i className="bi bi-person-plus-fill"></i>
                <span>Add Customer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-4 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon primary">
              <i className="bi bi-people"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Total Debtors</div>
              <div className="stat-card-value">{customers.length}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon success">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Active Debtors</div>
              <div className="stat-card-value">{activeCount}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon info">
              <i className="bi bi-currency-rupee"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Opening Receivables</div>
              <div className="stat-card-value">₹{totalReceivables.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="v-card mb-4">
        <div className="v-card-body" style={{ padding: '16px 24px' }}>
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <div className="search-box-v">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search customers, GSTIN, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>State</label>
              <select className="form-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                <option value="all">All States</option>
                {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-2">
              <button 
                className="btn-v light w-100" 
                onClick={() => { setSearch(''); setStatusFilter('all'); setStateFilter('all'); }} 
                style={{ justifyContent: 'center' }}
              >
                <i className="bi bi-x-lg"></i> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="v-card">
        <div className="v-card-header">
          <i className="bi bi-journal-bookmark"></i>
          Sundry Debtors List
          <span className="badge-v secondary ms-auto">{filteredCustomers.length}</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="spinner-center">
              <div className="spinner-border" style={{ color: 'var(--primary)' }}></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="empty-state-v">
              <i className="bi bi-inbox"></i>
              <h5>No Customers Found</h5>
              <p>{search ? 'Try a different search term' : 'Click "Add Customer" to get started'}</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Contact Person</th>
                  <th>State & GSTIN</th>
                  <th>Credit Period</th>
                  <th>Bank Details</th>
                  <th>Opening Bal.</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="fw-bold" style={{ color: 'var(--primary)' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {c.email || 'No Email'}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold">{c.contactPerson || '-'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {c.phone}
                      </div>
                    </td>
                    <td>
                      <span className="badge-v light me-1" style={{ fontSize: '0.75rem' }}>
                        {c.state || 'Delhi'}
                      </span>
                      {c.gstin ? (
                        <span className="badge-v success" style={{ fontSize: '0.72rem' }}>{c.gstin}</span>
                      ) : (
                        <span className="badge-v secondary" style={{ fontSize: '0.72rem' }}>Unregistered</span>
                      )}
                    </td>
                    <td>
                      <span className="fw-bold text-info">{c.defaultCreditPeriod || 30} Days</span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Bill-by-Bill: {c.maintainBillByBill ? 'Yes' : 'No'}
                      </div>
                    </td>
                    <td>
                      {c.bankDetails?.accountNo ? (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <i className="bi bi-bank me-1"></i>{c.bankDetails.bankName || 'Bank'}: {c.bankDetails.accountNo}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td className="fw-bold">
                      ₹{(Number(c.openingBalance) || 0).toLocaleString('en-IN')}{' '}
                      <small className="text-muted">({c.openingBalanceType || 'Dr'})</small>
                    </td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button 
                          className="btn-v outline-primary" 
                          onClick={() => setSelectedLedgerParty(c)} 
                          title="View Account Ledger Statement"
                        >
                          <i className="bi bi-journal-bookmark-fill me-1"></i> Ledger
                        </button>
                        <button 
                          className="btn-v outline-primary icon-only" 
                          onClick={() => handleOpenModal(c)} 
                          title="Edit Customer"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn-v outline-danger icon-only" 
                          onClick={() => handleDelete(c._id, c.name)} 
                          title="Delete Customer"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className="modal-box" style={{ maxWidth: 750 }}>
            <div className="modal-box-header">
              <i className="bi bi-person-circle" style={{ color: 'var(--primary)' }}></i>
              {editingCustomer ? 'Edit Customer Master' : 'Add New Customer (Sundry Debtor)'}
              <button className="close-btn" onClick={handleCloseModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Tab Controls */}
            <div className="d-flex border-bottom px-3 pt-2 bg-light">
              <button 
                type="button"
                className={`btn btn-sm me-2 rounded-top ${activeTab === 'basic' ? 'btn-primary fw-semibold' : 'btn-light text-muted'}`}
                onClick={() => setActiveTab('basic')}
              >
                <i className="bi bi-info-circle me-1"></i> Basic Details
              </button>
              <button 
                type="button"
                className={`btn btn-sm me-2 rounded-top ${activeTab === 'tally' ? 'btn-primary fw-semibold' : 'btn-light text-muted'}`}
                onClick={() => setActiveTab('tally')}
              >
                <i className="bi bi-journal-text me-1"></i> Tally & Credit
              </button>
              <button 
                type="button"
                className={`btn btn-sm rounded-top ${activeTab === 'gst' ? 'btn-primary fw-semibold' : 'btn-light text-muted'}`}
                onClick={() => setActiveTab('gst')}
              >
                <i className="bi bi-receipt me-1"></i> GST & Banking
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-box-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
                
                {/* TAB 1: Basic Details */}
                {activeTab === 'basic' && (
                  <div>
                    <div className="form-section-title mb-2"><i className="bi bi-building"></i> Customer Identification</div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Customer Name *</label>
                        <input
                          className="form-control"
                          placeholder="e.g. Sharma Electronics"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Contact Person</label>
                        <input
                          className="form-control"
                          placeholder="e.g. Rahul Sharma"
                          value={formData.contactPerson}
                          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone Number *</label>
                        <input
                          className="form-control"
                          placeholder="e.g. 9876543210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email Address</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="rahul@sharmaelec.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Mailing Address</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Full Street / Shop / Building Address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        ></textarea>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">State *</label>
                        <select
                          className="form-select"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Pincode</label>
                        <input
                          className="form-control"
                          placeholder="110001"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Country</label>
                        <input
                          className="form-control"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Tally & Credit Settings */}
                {activeTab === 'tally' && (
                  <div>
                    <div className="form-section-title mb-2"><i className="bi bi-journal-text"></i> Tally Ledger & Credit Config</div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Under Account Group</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value="Sundry Debtors"
                          disabled
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Default Credit Period (Days)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.defaultCreditPeriod}
                          onChange={(e) => setFormData({ ...formData, defaultCreditPeriod: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Credit Limit (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0 for No Limit"
                          value={formData.creditLimit}
                          onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-md-6 d-flex align-items-center">
                        <div className="form-check form-switch mt-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="billByBill"
                            checked={formData.maintainBillByBill}
                            onChange={(e) => setFormData({ ...formData, maintainBillByBill: e.target.checked })}
                          />
                          <label className="form-check-label fw-semibold" htmlFor="billByBill">
                            Maintain Balances Bill-by-Bill
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="form-divider"></div>

                    <div className="form-section-title mb-2"><i className="bi bi-cash-stack"></i> Opening Balance</div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Opening Balance (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.openingBalance}
                          onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Balance Type</label>
                        <select
                          className="form-select"
                          value={formData.openingBalanceType}
                          onChange={(e) => setFormData({ ...formData, openingBalanceType: e.target.value })}
                        >
                          <option value="Dr">Debit (Dr - Receivable)</option>
                          <option value="Cr">Credit (Cr - Advance Received)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: GST & Banking */}
                {activeTab === 'gst' && (
                  <div>
                    <div className="form-section-title mb-2"><i className="bi bi-receipt"></i> Tax & GST Registration</div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">GST Registration Type</label>
                        <select
                          className="form-select"
                          value={formData.gstRegistrationType}
                          onChange={(e) => setFormData({ ...formData, gstRegistrationType: e.target.value })}
                        >
                          <option value="Regular">Regular Registered</option>
                          <option value="Composition">Composition Scheme</option>
                          <option value="Unregistered">Unregistered</option>
                          <option value="Consumer">Consumer</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">GSTIN / UIN</label>
                        <input
                          className="form-control text-uppercase"
                          placeholder="e.g. 07AAAAA0000A1Z5"
                          value={formData.gstin}
                          onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                          maxLength="15"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">PAN Number</label>
                        <input
                          className="form-control text-uppercase"
                          placeholder="e.g. AAAAA0000A"
                          value={formData.pan}
                          onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                          maxLength="10"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-divider"></div>

                    <div className="form-section-title mb-2"><i className="bi bi-bank"></i> Bank Details for Refunds/Direct Settlement</div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Bank Name</label>
                        <input
                          className="form-control"
                          placeholder="State Bank of India"
                          value={formData.bankDetails?.bankName}
                          onChange={(e) => setFormData({
                            ...formData,
                            bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                          })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Account Number</label>
                        <input
                          className="form-control"
                          placeholder="Account Number"
                          value={formData.bankDetails?.accountNo}
                          onChange={(e) => setFormData({
                            ...formData,
                            bankDetails: { ...formData.bankDetails, accountNo: e.target.value }
                          })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">IFSC Code</label>
                        <input
                          className="form-control text-uppercase"
                          placeholder="SBIN0001234"
                          value={formData.bankDetails?.ifsc}
                          onChange={(e) => setFormData({
                            ...formData,
                            bankDetails: { ...formData.bankDetails, ifsc: e.target.value.toUpperCase() }
                          })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Branch Name</label>
                        <input
                          className="form-control"
                          placeholder="Branch City / Area"
                          value={formData.bankDetails?.branch}
                          onChange={(e) => setFormData({
                            ...formData,
                            bankDetails: { ...formData.bankDetails, branch: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
              <div className="modal-box-footer">
                <button type="button" className="btn-v light" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-v primary">
                  <i className="bi bi-check-circle"></i> {editingCustomer ? 'Update' : 'Save'} Customer Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Statement Modal */}
      {selectedLedgerParty && (
        <LedgerStatementModal
          party={selectedLedgerParty}
          partyType="Debtor"
          onClose={() => setSelectedLedgerParty(null)}
        />
      )}
    </div>
  );
}
