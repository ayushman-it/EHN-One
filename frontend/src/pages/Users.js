import React, { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { exportToCSV, exportToExcel } from '../utils/exportHelper';
import Pagination from '../components/Pagination';

const ALL_PERMISSIONS = [
  { key: 'dashboard.view', label: 'View Dashboard' },
  { key: 'products.view', label: 'View Stock Items' },
  { key: 'products.add', label: 'Add Stock Items' },
  { key: 'products.edit', label: 'Edit Stock Items' },
  { key: 'invoices.view', label: 'Sales Billing & Vouchers' },
  { key: 'orders.view', label: 'Daily Sales Orders' },
  { key: 'transactions.view', label: 'Stock Daybook' },
  { key: 'transactions.stockin', label: 'Stock In Entry' },
  { key: 'transactions.stockout', label: 'Stock Out Entry' },
  { key: 'customers.view', label: 'Customer Udhaari Ledgers' },
  { key: 'suppliers.view', label: 'Supplier Creditor Directory' },
  { key: 'warehouse.view', label: 'Godowns & Warehouses' },
  { key: 'dpr.view', label: 'Salesman Daily DPR' },
  { key: 'challan.view', label: 'Despatch Delivery Challans' },
  { key: 'reports.view', label: 'Financial Reports & Analytics' },
  { key: 'automations.view', label: 'WhatsApp Automations' },
  { key: 'users.manage', label: 'Manage Users & Security Roles' },
];

const DEFAULT_DEPARTMENTS = {
  admin: 'Executive Administration',
  production: 'Production & Manufacturing',
  sales: 'Sales & Field Operations',
  despatch: 'Warehouse & Logistics',
  billing: 'Finance & Tally Accounting',
  manager: 'Operations & Management',
  viewer: 'General Viewer',
};

const emptyForm = {
  name: '', email: '', role: 'sales', phone: '', department: 'Sales & Field Operations', password: '',
  status: 'active', customPermissions: ['dashboard.view', 'products.view', 'orders.view'],
};

export default function Users() {
  const { can, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getAuthToken = () => {
    return sessionStorage.getItem('inv_token') || localStorage.getItem('inv_token') || localStorage.getItem('token') || '';
  };

  const fetchUsers = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/users', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setUsers(data.data);
        }
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleSelect = (selectedRole) => {
    const defaultDept = DEFAULT_DEPARTMENTS[selectedRole] || 'Operations';
    const roleDefaultPerms = ROLES[selectedRole]?.permissions || ['dashboard.view'];
    setForm(prev => ({
      ...prev,
      role: selectedRole,
      department: defaultDept,
      customPermissions: roleDefaultPerms,
    }));
  };

  const handlePermissionToggle = (permKey) => {
    setForm(prev => {
      const current = prev.customPermissions || [];
      const updated = current.includes(permKey)
        ? current.filter(k => k !== permKey)
        : [...current, permKey];
      return { ...prev, customPermissions: updated };
    });
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setError('');
    setSuccessMsg('');
    setShowModal(true);
  };

  const openEdit = (u) => {
    setForm({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'sales',
      phone: u.phone || '',
      department: u.department || DEFAULT_DEPARTMENTS[u.role] || 'Operations',
      password: '',
      status: u.status || 'active',
      customPermissions: u.customPermissions || ROLES[u.role]?.permissions || ['dashboard.view'],
    });
    setEditId(u._id || u.id);
    setError('');
    setSuccessMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = getAuthToken();
      const url = editId ? `/api/users/${editId}` : '/api/users';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error saving user');
      }

      setSuccessMsg(editId ? 'User account updated successfully!' : 'New user account created successfully!');
      await fetchUsers();
      setTimeout(() => {
        setShowModal(false);
      }, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (targetUser) => {
    const userId = targetUser?._id || targetUser?.id;
    try {
      const token = getAuthToken();
      await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      setShowDeleteConfirm(null);
      await fetchUsers();
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  };

  const handleStatusChange = async (targetUser, newStatus) => {
    const userId = targetUser?._id || targetUser?.id;
    try {
      const token = getAuthToken();
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status: newStatus })
      });
      await fetchUsers();
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!u) return false;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q));
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const roleBadges = {
    admin: { label: 'Admin', color: 'danger', icon: 'bi-shield-lock-fill' },
    production: { label: 'Production', color: 'warning', icon: 'bi-gear-wide-connected' },
    sales: { label: 'Sales Team', color: 'primary', icon: 'bi-bag-check-fill' },
    despatch: { label: 'Despatch', color: 'purple', icon: 'bi-truck' },
    billing: { label: 'Billing/Accounts', color: 'success', icon: 'bi-receipt-cutoff' },
    manager: { label: 'Managerial', color: 'info', icon: 'bi-briefcase-fill' },
    viewer: { label: 'Viewer', color: 'secondary', icon: 'bi-eye-fill' },
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Status', 'Phone'];
    const rows = users.map(u => [u.name, u.email, u.role, u.department, u.status, u.phone]);
    exportToCSV('EHN_Users_List', headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Status', 'Phone'];
    const rows = users.map(u => [u.name, u.email, u.role, u.department, u.status, u.phone]);
    exportToExcel('EHN_Users_List', 'Users', headers, rows);
  };

  return (
    <div className="p-3 p-md-4 bg-light min-vh-100" style={{ fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      
      {/* Header Toolbar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 bg-white p-3 rounded-2 shadow-xs border">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-person-gear text-success"></i> User & Security Roles Management
          </h4>
          <p className="text-muted mb-0 small">
            Admin Control Panel: Create accounts for <strong>Admin, Production, Sales, Despatch, Billing, Manager</strong> & customize permissions.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleExportCSV}>
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> Export CSV
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={handleExportExcel}>
            <i className="bi bi-file-earmark-excel me-1"></i> Excel
          </button>
          <button className="btn btn-success btn-sm shadow-xs fw-semibold px-3" onClick={openAdd}>
            <i className="bi bi-person-plus-fill me-1"></i> + Create New User Account
          </button>
        </div>
      </div>

      {/* Role Counts Summary Bar */}
      <div className="row g-2 mb-3">
        {Object.keys(roleBadges).filter(r => r !== 'viewer').map((roleKey, idx) => {
          const rInfo = roleBadges[roleKey];
          const count = users.filter(u => u.role === roleKey).length;
          return (
            <div className="col-6 col-sm-4 col-md-2" key={idx}>
              <div className={`card border-0 shadow-xs text-center py-2 px-1 bg-white border-start border-3 border-${rInfo.color}`}>
                <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>{rInfo.label}</div>
                <div className="fw-bold fs-5 text-dark">{count}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="card border-0 shadow-xs rounded-2 mb-3 bg-white">
        <div className="card-body p-2 d-flex flex-wrap gap-2 align-items-center">
          <div className="input-group input-group-sm flex-grow-1" style={{ maxWidth: 300 }}>
            <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search user name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="form-select form-select-sm" style={{ width: 160 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles (6 Roles)</option>
            <option value="admin">Admin</option>
            <option value="production">Production Team</option>
            <option value="sales">Sales Team</option>
            <option value="despatch">Despatch Team</option>
            <option value="billing">Accounting / Billing</option>
            <option value="manager">Managerial Team</option>
          </select>

          <select className="form-select form-select-sm" style={{ width: 140 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <span className="ms-auto text-muted small">Showing {filteredUsers.length} Users</span>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="card border-0 shadow-xs rounded-2 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead className="table-dark">
              <tr>
                <th className="py-2">User Details</th>
                <th className="py-2">Role & Badge</th>
                <th className="py-2">Department</th>
                <th className="py-2">Phone</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    <i className="bi bi-people fs-3 d-block mb-2"></i> No user accounts found. Click <strong>+ Create New User Account</strong> to add users.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, i) => {
                  const rInfo = roleBadges[u.role] || roleBadges.viewer;
                  return (
                    <tr key={i}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className={`rounded-circle bg-${rInfo.color} text-white d-flex align-items-center justify-content-center fw-bold`} style={{ width: 34, height: 34, fontSize: '0.85rem' }}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{u.name}</div>
                            <div className="text-muted small">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${rInfo.color} text-white px-2 py-1`}>
                          <i className={`bi ${rInfo.icon} me-1`}></i> {rInfo.label}
                        </span>
                      </td>
                      <td><span className="text-dark fw-semibold">{u.department || 'Operations'}</span></td>
                      <td><span className="text-muted">{u.phone || '—'}</span></td>
                      <td>
                        <span className={`badge bg-${u.status === 'active' ? 'success' : 'secondary'} bg-opacity-25 text-${u.status === 'active' ? 'success' : 'secondary'} border`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-outline-primary btn-xs me-1 py-1 px-2" onClick={() => openEdit(u)} title="Edit User">
                          <i className="bi bi-pencil-square"></i> Edit
                        </button>
                        {u.status === 'active' ? (
                          <button className="btn btn-outline-warning btn-xs me-1 py-1 px-2 text-dark" onClick={() => handleStatusChange(u, 'inactive')} title="Deactivate">
                            Deactivate
                          </button>
                        ) : (
                          <button className="btn btn-outline-success btn-xs me-1 py-1 px-2" onClick={() => handleStatusChange(u, 'active')} title="Activate">
                            Activate
                          </button>
                        )}
                        <button className="btn btn-outline-danger btn-xs py-1 px-2" onClick={() => setShowDeleteConfirm(u)} title="Delete User">
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-2 border-top">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredUsers.length / pageSize) || 1}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-2 shadow-lg border-0">
              <div className="modal-header bg-dark text-white py-2 px-3">
                <h6 className="modal-title fw-bold">
                  <i className="bi bi-person-plus-fill text-success me-2"></i>
                  {editId ? 'Edit Operator Account' : 'Create New Department User Account'}
                </h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-3" style={{ fontSize: '0.83rem' }}>
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}

                  {/* Role Selector Cards */}
                  <label className="form-label fw-bold mb-1">1. Select Department Role Profile</label>
                  <div className="row g-2 mb-3">
                    {Object.keys(roleBadges).filter(r => r !== 'viewer').map((roleKey, idx) => {
                      const rInfo = roleBadges[roleKey];
                      const isSelected = form.role === roleKey;
                      return (
                        <div className="col-4 col-md-2" key={idx}>
                          <div
                            className={`p-2 text-center rounded border cursor-pointer ${isSelected ? `border-2 border-${rInfo.color} bg-${rInfo.color} bg-opacity-10 fw-bold` : 'bg-light text-muted'}`}
                            onClick={() => handleRoleSelect(roleKey)}
                            style={{ fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            <i className={`bi ${rInfo.icon} fs-5 d-block mb-1 text-${rInfo.color}`}></i>
                            <div>{rInfo.label}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Basic User Inputs */}
                  <label className="form-label fw-bold mb-1">2. User Credentials & Details</label>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small text-muted mb-1">Full Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Rahul Sharma"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-muted mb-1">Email Address (Login ID) *</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="rahul@kedvasshygieneproducts.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small text-muted mb-1">Password {editId ? '(Leave blank to keep current)' : '*'}</label>
                      <input
                        type="password"
                        className="form-control form-control-sm"
                        placeholder={editId ? '••••••••' : 'Min 6 chars'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required={!editId}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small text-muted mb-1">Department</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small text-muted mb-1">Contact Phone</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Module Permission Checkboxes */}
                  <label className="form-label fw-bold mb-1">3. Granular Module Rights & Permissions</label>
                  <p className="text-muted small mb-2">Check allowed pages and actions for this account:</p>
                  <div className="row g-2 p-2 bg-light rounded border" style={{ maxHeight: 180, overflowY: 'auto' }}>
                    {ALL_PERMISSIONS.map((perm, idx) => {
                      const isChecked = (form.customPermissions || []).includes(perm.key);
                      return (
                        <div className="col-md-6" key={idx}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`perm-${idx}`}
                              checked={isChecked}
                              onChange={() => handlePermissionToggle(perm.key)}
                            />
                            <label className="form-check-label text-dark" htmlFor={`perm-${idx}`} style={{ fontSize: '0.78rem' }}>
                              {perm.label} <code className="text-muted ms-1">({perm.key})</code>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="modal-footer py-2 px-3">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success btn-sm px-4 fw-semibold" disabled={saving}>
                    {saving ? 'Saving Account...' : (editId ? 'Save Changes' : 'Create User Account')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content text-center p-3">
              <i className="bi bi-exclamation-triangle text-danger fs-1 mb-2"></i>
              <h6 className="fw-bold">Delete Account?</h6>
              <p className="text-muted small">Are you sure you want to delete user account <strong>{showDeleteConfirm.name}</strong>?</p>
              <div className="d-flex justify-content-center gap-2 mt-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(showDeleteConfirm)}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
