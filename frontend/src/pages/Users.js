import React, { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportHelper';
import Pagination from '../components/Pagination';
import DataImportModal from '../components/DataImportModal';

/* Live users database */
let usersDB = [];

/* Audit Log */
let auditLog = [];
let nextAuditId = 1;

const addAuditLog = (action, target, details, performedBy) => {
  auditLog.unshift({
    id: nextAuditId++,
    userId: null,
    userName: performedBy,
    userAvatar: null,
    action,
    target,
    details,
    timestamp: new Date(),
    performedBy,
  });
};

const emptyForm = {
  name: '', email: '', role: 'viewer', phone: '', department: '', password: '',
  avatar: null, avatarPreview: null,
  customPermissions: [],
};

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

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
  const [viewUser, setViewUser] = useState(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && e.key !== 'F2' && !(e.altKey && (e.key === 'a' || e.key === 'A' || e.key === 'c' || e.key === 'C'))) return;

      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('user-search-input')?.focus();
      } else if (e.key === 'F4') {
        if (can('users.manage')) {
          e.preventDefault();
          openAdd();
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        fetchUsers();
      } else if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setShowAuditLog(true);
      } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleExportCSV();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [can]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setUsers(data.data);
          usersDB = data.data;
        }
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };  // Filter logic
  const filteredUsers = users.filter((u) => {
    if (!u) return false;
    const q = search.toLowerCase();
    const matchSearch = !q || 
      (u.name && u.name.toLowerCase().includes(q)) || 
      (u.email && u.email.toLowerCase().includes(q)) || 
      (u.department && typeof u.department === 'string' && u.department.toLowerCase().includes(q));
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    admins: users.filter((u) => u.role === 'admin').length,
    managers: users.filter((u) => u.role === 'manager').length,
    viewers: users.filter((u) => u.role === 'viewer').length,
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(''); setShowModal(true); };
  const openEdit = (u) => {
    setForm({ 
      name: u.name || '', email: u.email || '', role: u.role || 'viewer', phone: u.phone || '', 
      department: u.department || '', password: '', avatar: u.avatar || null, 
      avatarPreview: u.avatar || null, customPermissions: u.customPermissions || [] 
    });
    setEditId(u._id || u.id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
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

      if (editId) {
        addAuditLog('user.updated', form.name, 'Operator details and rights updated', currentUser?.name);
      } else {
        addAuditLog('user.created', form.name, `Created new ${form.role} operator account`, currentUser?.name);
      }

      await fetchUsers();
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (targetUser) => {
    const userId = targetUser?._id || targetUser?.id || targetUser;
    const userName = targetUser?.name || 'Operator';

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      addAuditLog('user.deleted', userName, `Deleted operator account`, currentUser?.name);
      setShowDeleteConfirm(null);
      await fetchUsers();
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  };

  const handleStatusChange = async (targetUser, newStatus) => {
    const userId = targetUser?._id || targetUser?.id || targetUser;
    const userName = targetUser?.name || 'Operator';
    const oldStatus = targetUser?.status || 'active';

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const actions = {
        active: 'user.activated',
        inactive: 'user.deactivated',
        suspended: 'user.suspended',
      };
      addAuditLog(actions[newStatus], userName, `Status changed from ${oldStatus} to ${newStatus}`, currentUser?.name);
      await fetchUsers();
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const getExportData = () => {
    const headers = ['Operator Name', 'Email Address', 'Security Role', 'Account Status', 'Contact Phone', 'Department', 'Last Login Timestamp'];
    const rows = users.map(u => [
      u.name || '',
      u.email || '',
      (u.role || '').toUpperCase(),
      (u.status || '').toUpperCase(),
      u.phone || '',
      u.department || '',
      u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN') : 'Never'
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    exportToCSV('Security_Operators_Register', headers, rows);
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel('Security_Operators_Register', 'Users & Roles', headers, rows);
  };

  const handleExportPDF = () => {
    const { headers, rows } = getExportData();
    exportToPDF(
      'SECURITY & USER ROLES REGISTER',
      { name: 'Kedvass Hygiene Products', address: 'Korba Industrial Area' },
      headers,
      rows,
      { label: 'Total Registered System Operators', value: `${users.length} Operators` }
    );
  };

  const getRoleBadge = (role) => {
    const r = ROLES[role];
    if (!r) return null;
    return <span className={`badge-v ${r.color}`}><i className={`bi ${r.icon} me-1`}></i> {r.label}</span>;
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { color: 'success', icon: 'bi-check-circle', label: 'ACTIVE' },
      inactive: { color: 'secondary', icon: 'bi-dash-circle', label: 'INACTIVE' },
      suspended: { color: 'danger', icon: 'bi-x-circle', label: 'SUSPENDED' },
    };
    const s = map[status] || map.inactive;
    return <span className={`badge-v ${s.color}`} style={{ fontSize: '0.7rem' }}><i className={`bi ${s.icon} me-1`}></i> {s.label}</span>;
  };

  if (!can('users.view')) {
    return (
      <div className="empty-state-v" style={{ paddingTop: 80 }}>
        <i className="bi bi-shield-x" style={{ color: 'var(--danger)' }}></i>
        <h5>Access Denied</h5>
        <p>Only administrators can access user security registers.</p>
      </div>
    );
  }

  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportUsers = async (parsedData) => {
    const newUsers = [];
    for (const row of parsedData.rows) {
      if (!row || row.length === 0 || !row[0]) continue;
      const userObj = {
        id: nextUserId++,
        name: row[0] || 'Imported Operator',
        email: row[1] || `user${Math.floor(100+Math.random()*900)}@ehnone.com`,
        role: (row[2] || 'viewer').toLowerCase(),
        department: row[3] || 'Operations',
        phone: row[4] || '',
        status: 'active',
        avatar: null,
        customPermissions: [],
        createdAt: new Date(),
        createdBy: user?.name || 'Admin'
      };
      newUsers.push(userObj);
    }
    setUsers([...newUsers, ...users]);
    usersDB = [...newUsers, ...usersDB];
  };

  return (
    <div className="py-2">
      {/* Clean Modern Page Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold text-dark" style={{ letterSpacing: '-0.3px' }}>User Security Roles & Access</h4>
          <p className="text-muted small mb-0">Manage operator user accounts, role permissions & security audit logs</p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button className="btn-v outline-secondary btn-sm" onClick={handleExportCSV} title="Export CSV">
            <i className="bi bi-filetype-csv me-1"></i> CSV
          </button>
          <button className="btn-v outline-success btn-sm" onClick={handleExportExcel} title="Export Excel">
            <i className="bi bi-file-earmark-excel me-1"></i> Excel
          </button>
          <button className="btn-v outline-danger btn-sm" onClick={handleExportPDF} title="Export PDF">
            <i className="bi bi-file-earmark-pdf me-1"></i> PDF
          </button>
          <button className="btn-v outline-primary btn-sm style-cursor" onClick={() => setShowImportModal(true)} title="Import Users Excel/CSV">
            <i className="bi bi-file-earmark-arrow-up me-1"></i> Import
          </button>
          <button className="btn-v outline-secondary btn-sm" onClick={() => setShowAuditLog(true)}>
            <i className="bi bi-clock-history me-1"></i> Audit Log
          </button>
          {can('users.manage') && (
            <button className="btn-v primary btn-sm" onClick={openAdd}>
              <i className="bi bi-person-plus me-1"></i> Add User
            </button>
          )}
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="row g-2 mb-3">
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL OPERATORS</div>
            <div className="tally-stat-value">{stats.total}</div>
            <div className="tally-stat-sub text-muted">Registered System Users</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">ACTIVE OPERATORS</div>
            <div className="tally-stat-value text-success">{stats.active}</div>
            <div className="tally-stat-sub text-muted">Authorized Active Logins</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">ADMINISTRATORS</div>
            <div className="tally-stat-value text-danger">{stats.admins}</div>
            <div className="tally-stat-sub text-muted">Full Control Authority</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">MANAGERS & STAFF</div>
            <div className="tally-stat-value text-primary">{stats.managers + stats.viewers}</div>
            <div className="tally-stat-sub text-muted">Operational Staff Users</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="v-card mb-3">
        <div className="v-card-body p-2">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="search-box-v">
                <i className="bi bi-search"></i>
                <input
                  id="user-search-input"
                  type="text"
                  className="form-control"
                  placeholder="Filter operators by name, email, department... [Press F2]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select btn-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All Security Roles</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer / Operator</option>
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select btn-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Account Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="col-md-1 text-end">
              <span className="badge-v secondary fw-bold" style={{ fontSize: '0.7rem' }}>
                {filteredUsers.length} REC
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Density Tally Table */}
      <div className="v-card">
        <div className="v-card-header d-flex justify-content-between align-items-center">
          <span><i className="bi bi-shield-check me-2" style={{ color: 'var(--primary)' }}></i>SECURITY & OPERATOR MASTER REGISTER</span>
          <span className="text-muted small">HIGH-DENSITY ERP VIEW</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {filteredUsers.length === 0 ? (
            <div className="empty-state-v py-4">
              <i className="bi bi-people text-muted" style={{ fontSize: '2rem' }}></i>
              <h5 className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.88rem' }}>No Operators Found</h5>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Try adjusting your search filters or click "[F4] Add Operator Master"</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>OPERATOR NAME</th>
                  <th>EMAIL / USERNAME</th>
                  <th>SECURITY ROLE</th>
                  <th>DEPARTMENT</th>
                  <th>STATUS</th>
                  <th>LAST LOGIN</th>
                  <th className="text-end" style={{ width: 120 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u, i) => (
                  <tr key={u.id}>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                      {(currentPage - 1) * pageSize + i + 1}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                          style={{ width: 28, height: 28, background: 'var(--primary)', fontSize: '0.75rem' }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{u.name}</div>
                          {u.phone && <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>{u.phone}</small>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ color: 'var(--primary)', fontSize: '0.78rem' }}>{u.email}</code>
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td><span className="badge-v secondary">{u.department || 'General'}</span></td>
                    <td>{getStatusBadge(u.status)}</td>
                    <td className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN') : 'Never'}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button className="btn-v outline-secondary btn-sm px-2" onClick={() => setViewUser(u)} title="View Operator Profile">
                          <i className="bi bi-eye"></i>
                        </button>
                        {can('users.manage') && (
                          <>
                            <button className="btn-v outline-primary btn-sm px-2" onClick={() => openEdit(u)} title="Edit Permissions">
                              <i className="bi bi-pencil"></i>
                            </button>
                            {(u._id || u.id) !== (currentUser?._id || currentUser?.id) && (
                              <button className="btn-v outline-danger btn-sm px-2" onClick={() => handleDelete(u)} title="Delete User">
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {filteredUsers.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* Add / Edit Operator Desktop Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 820, width: '95%', borderRadius: 0 }}>
            <div className="modal-box-header d-flex align-items-center justify-content-between px-3.5 py-2.5" style={{ background: '#1E4D2B', color: '#ffffff', borderRadius: 0 }}>
              <div className="d-flex align-items-center gap-2">
                <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-person-plus'}`} style={{ color: '#FFD700' }}></i>
                <span className="fw-bold">{editId ? 'MODIFY OPERATOR SECURITY MASTER' : 'CREATE NEW OPERATOR MASTER'}</span>
              </div>
              <button className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Close"></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-box-body p-3.5 bg-white" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                {error && (
                  <div className="alert alert-danger mb-3 py-2 small fw-bold">
                    <i className="bi bi-exclamation-circle me-1"></i> {error}
                  </div>
                )}

                <div className="form-section-title mb-2 fw-bold text-dark" style={{ fontSize: '0.84rem' }}><i className="bi bi-person-badge me-1 text-success"></i> Operator Identity</div>
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small mb-1">Full Name *</label>
                    <input className="form-control" placeholder="e.g. Ramesh Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small mb-1">Email Address *</label>
                    <input className="form-control" type="email" placeholder="ramesh@ehnone.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editId} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small mb-1">Phone Number</label>
                    <input className="form-control" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small mb-1">Department / Branch</label>
                    <input className="form-control" placeholder="e.g. Billing Desk" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                  </div>
                </div>

                <div className="border-top my-2.5"></div>

                <div className="form-section-title mb-2 fw-bold text-dark" style={{ fontSize: '0.84rem' }}><i className="bi bi-shield-lock me-1 text-success"></i> Security Role & Password</div>
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small mb-1">Assigned Role Level *</label>
                    <select className="form-select fw-bold" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="admin">Administrator (Full Rights Access)</option>
                      <option value="manager">Manager (Custom Menu & Edit Rights)</option>
                      <option value="viewer">Viewer / Operator (Restricted Read Only)</option>
                    </select>
                  </div>
                  {!editId && (
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark small mb-1">Password *</label>
                      <input className="form-control font-monospace fw-bold" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>
                  )}
                </div>

                <div className="border-top my-2.5"></div>

                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}>
                    <i className="bi bi-shield-check me-1 text-success"></i> Menu Access & Edit Rights Matrix
                  </div>
                  {form.role === 'admin' && (
                    <span className="badge bg-success font-monospace" style={{ fontSize: '0.68rem' }}>FULL ADMIN ACCESS</span>
                  )}
                </div>
                          {/* RESPONSIVE TOGGLE SWITCHES PERMISSIONS MATRIX */}
                <div className="border rounded bg-white p-3 mb-2 shadow-sm">
                  {[
                    { group: 'MASTERS & DIRECTORIES', icon: 'bi-folder-symlink', items: [
                      { key: 'products', name: 'All Stock Items', icon: 'bi-box-seam' },
                      { key: 'finishedgoods', name: 'Finished Goods (FG)', icon: 'bi-box-seam-fill' },
                      { key: 'rawmaterials', name: 'Raw Material (RM)', icon: 'bi-bricks' },
                      { key: 'categories', name: 'Stock Groups', icon: 'bi-tag' },
                      { key: 'customers', name: 'Customer Ledgers', icon: 'bi-people' },
                      { key: 'suppliers', name: 'Supplier Directory', icon: 'bi-truck' },
                      { key: 'warehouse', name: 'Godown Masters', icon: 'bi-building' },
                      { key: 'company-firms', name: 'Company Firms Master', icon: 'bi-building-gear' },
                    ]},
                    { group: 'VOUCHERS & TRANSACTIONS', icon: 'bi-boxes', items: [
                      { key: 'orders', name: 'Sales Orders Booking', icon: 'bi-cart-check' },
                      { key: 'invoices', name: 'Sales Billing Voucher', icon: 'bi-receipt' },
                      { key: 'transactions', name: 'Stock Ledger Daybook', icon: 'bi-arrow-left-right' },
                      { key: 'stockin', name: 'Stock In Entry', icon: 'bi-arrow-down-circle' },
                      { key: 'stockout', name: 'Stock Out Entry', icon: 'bi-arrow-up-circle' },
                      { key: 'lowstock', name: 'Low Stock Alerts', icon: 'bi-exclamation-triangle' },
                    ]},
                    { group: 'STATUTORY & SYSTEM UTILITIES', icon: 'bi-shield-gear', items: [
                      { key: 'dashboard', name: 'Gateway Dashboard', icon: 'bi-speedometer2' },
                      { key: 'reports', name: 'Financial Reports', icon: 'bi-bar-chart-line' },
                      { key: 'analytics', name: 'Business Analytics', icon: 'bi-graph-up-arrow' },
                      { key: 'automations', name: 'Bot Automations & Reminders', icon: 'bi-lightning-charge' },
                      { key: 'settings', name: 'System Settings', icon: 'bi-gear' },
                      { key: 'users', name: 'User Security Roles', icon: 'bi-person-lock' },
                    ]}
                  ].map(sec => (
                    <div key={sec.group} className="mb-3">
                      <div className="fw-bold text-uppercase text-secondary mb-2 border-bottom pb-1" style={{ fontSize: '0.74rem', letterSpacing: '0.5px' }}>
                        <i className={`bi ${sec.icon} me-1.5 text-success`}></i> {sec.group}
                      </div>
                      <div className="row g-2">
                        {sec.items.map(item => {
                          const viewKey = `${item.key}.view`;
                          const editKey = `${item.key}.edit`;
                          const hasView = (form.customPermissions || []).includes(viewKey) || form.role === 'admin';
                          const hasEdit = (form.customPermissions || []).includes(editKey) || form.role === 'admin';

                          const togglePerm = (permKey) => {
                            if (form.role === 'admin') return;
                            const current = form.customPermissions || [];
                            const updated = current.includes(permKey)
                              ? current.filter(k => k !== permKey)
                              : [...current, permKey];
                            setForm({ ...form, customPermissions: updated });
                          };

                          return (
                            <div key={item.key} className="col-12 col-md-6">
                              <div className="p-2 border rounded bg-light d-flex align-items-center justify-content-between h-100">
                                <div className="d-flex align-items-center gap-2 me-2 overflow-hidden">
                                  <i className={`bi ${item.icon} text-success me-1 flex-shrink-0`}></i>
                                  <span className="fw-bold text-dark small text-truncate" title={item.name}>{item.name}</span>
                                </div>
                                <div className="d-flex align-items-center gap-3 flex-shrink-0">
                                  {/* View Access Switch */}
                                  <div className="form-check form-switch m-0 d-flex align-items-center gap-1 style-cursor">
                                    <input
                                      className="form-check-input style-cursor m-0"
                                      type="checkbox"
                                      id={`view-${item.key}`}
                                      checked={hasView}
                                      disabled={form.role === 'admin'}
                                      onChange={() => togglePerm(viewKey)}
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label small fw-bold mb-0 style-cursor" htmlFor={`view-${item.key}`} style={{ fontSize: '0.72rem', cursor: 'pointer' }}>
                                      {hasView ? <span className="text-success">View</span> : <span className="text-muted opacity-75">Off</span>}
                                    </label>
                                  </div>

                                  {/* Edit Rights Switch */}
                                  <div className="form-check form-switch m-0 d-flex align-items-center gap-1 style-cursor">
                                    <input
                                      className="form-check-input style-cursor m-0"
                                      type="checkbox"
                                      id={`edit-${item.key}`}
                                      checked={hasEdit}
                                      disabled={form.role === 'admin' || !hasView}
                                      onChange={() => togglePerm(editKey)}
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label small fw-bold mb-0 style-cursor" htmlFor={`edit-${item.key}`} style={{ fontSize: '0.72rem', cursor: 'pointer' }}>
                                      {hasEdit ? <span className="text-warning text-dark">Edit</span> : <span className="text-muted opacity-75">Read</span>}
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-box-footer d-flex justify-content-end gap-2 p-3 bg-light border-top">
                <button type="button" className="btn btn-outline-secondary btn-sm fw-bold px-3" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success btn-sm fw-bold px-3" disabled={saving}>
                  <i className="bi bi-check-circle me-1"></i> {saving ? 'Saving Rights...' : editId ? 'Update Operator Rights' : 'Create Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Window */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 450 }}>
            <div className="modal-box-header text-danger">
              <i className="bi bi-exclamation-triangle me-2"></i> CONFIRM OPERATOR DELETION
            </div>
            <div className="modal-box-body p-3">
              <p className="mb-0">Are you sure you want to revoke access and delete operator <strong>{showDeleteConfirm.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal-box-footer d-flex justify-content-end gap-2">
              <button className="btn-v outline-secondary btn-sm" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn-v danger btn-sm" onClick={() => handleDelete(showDeleteConfirm.id)}>Delete Operator</button>
            </div>
          </div>
        </div>
      )}

      {/* View User Profile Window */}
      {viewUser && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewUser(null); }}>
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-box-header d-flex align-items-center justify-content-between">
              <span>OPERATOR MASTER DETAILS</span>
              <button className="close-btn" onClick={() => setViewUser(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="modal-box-body p-3">
              <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 48, height: 48, background: 'var(--primary)', fontSize: '1.2rem' }}>
                  {viewUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">{viewUser.name}</h6>
                  <div className="text-muted small">{viewUser.email}</div>
                  <div className="mt-1">{getRoleBadge(viewUser.role)}</div>
                </div>
              </div>
              <div className="row g-2 small">
                <div className="col-6"><strong>Department:</strong> {viewUser.department || 'N/A'}</div>
                <div className="col-6"><strong>Phone:</strong> {viewUser.phone || 'N/A'}</div>
                <div className="col-6"><strong>Status:</strong> {getStatusBadge(viewUser.status)}</div>
                <div className="col-6"><strong>Last Login:</strong> {viewUser.lastLogin ? new Date(viewUser.lastLogin).toLocaleString('en-IN') : 'Never'}</div>
              </div>
            </div>
            <div className="modal-box-footer d-flex justify-content-end">
              <button className="btn-v outline-secondary btn-sm" onClick={() => setViewUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditLog && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAuditLog(false); }}>
          <div className="modal-box" style={{ maxWidth: 750 }}>
            <div className="modal-box-header d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-clock-history" style={{ color: 'var(--primary)' }}></i>
                <span>SECURITY AUDIT LOG REGISTER</span>
              </div>
              <button className="close-btn" onClick={() => setShowAuditLog(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="modal-box-body p-0" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <table className="v-table">
                <thead>
                  <tr>
                    <th>TIMESTAMP</th>
                    <th>OPERATOR</th>
                    <th>ACTION</th>
                    <th>TARGET</th>
                    <th>DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((log) => (
                    <tr key={log.id}>
                      <td className="text-muted" style={{ fontSize: '0.72rem' }}>{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                      <td className="fw-semibold">{log.performedBy}</td>
                      <td><span className="badge-v secondary" style={{ fontSize: '0.7rem' }}>{log.action}</span></td>
                      <td className="fw-bold">{log.target}</td>
                      <td className="text-muted" style={{ fontSize: '0.75rem' }}>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-box-footer d-flex justify-content-end">
              <button className="btn-v outline-secondary btn-sm" onClick={() => setShowAuditLog(false)}>Close Register</button>
            </div>
          </div>
        </div>
      )}

      {/* Data Import Modal */}
      <DataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import User Security Accounts Master"
        templateHeaders={['Full Name', 'Email Address', 'Security Role (admin/manager/viewer)', 'Department', 'Phone Number']}
        sampleRows={[
          ['Arjun Sharma', 'admin@ehnone.com', 'admin', 'IT Management', '9876543210'],
          ['Priya Mehta', 'priya@ehnone.com', 'manager', 'Operations & Stock', '9123456789']
        ]}
        onImport={handleImportUsers}
      />
    </div>
  );
}
