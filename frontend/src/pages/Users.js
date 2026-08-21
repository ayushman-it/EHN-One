import React, { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportHelper';

/* Mock users database */
let usersDB = [
  { id: 1, name: 'Arjun Sharma',  email: 'admin@inventrack.com',   role: 'admin',   status: 'active',   phone: '+91 98765 43210', department: 'IT Management', avatar: null, customPermissions: [], lastLogin: new Date('2026-08-21T09:30:00'), createdAt: new Date('2026-01-01'), createdBy: 'System' },
  { id: 2, name: 'Priya Mehta',   email: 'manager@inventrack.com', role: 'manager', status: 'active',   phone: '+91 98765 43211', department: 'Operations & Stock', avatar: null, customPermissions: [], lastLogin: new Date('2026-08-21T08:15:00'), createdAt: new Date('2026-01-15'), createdBy: 'Arjun Sharma' },
  { id: 3, name: 'Rahul Verma',   email: 'viewer@inventrack.com',  role: 'viewer',  status: 'active',   phone: '+91 98765 43212', department: 'Accounts & Billing', avatar: null, customPermissions: [], lastLogin: new Date('2026-08-20T16:45:00'), createdAt: new Date('2026-02-01'), createdBy: 'Arjun Sharma' },
  { id: 4, name: 'Sneha Patel',   email: 'sneha@inventrack.com',   role: 'manager', status: 'active',   phone: '+91 98765 43213', department: 'Warehouse Godown', avatar: null, customPermissions: [], lastLogin: new Date('2026-08-19T14:20:00'), createdAt: new Date('2026-02-10'), createdBy: 'Arjun Sharma' },
  { id: 5, name: 'Amit Kumar',    email: 'amit@inventrack.com',    role: 'viewer',  status: 'inactive', phone: '+91 98765 43214', department: 'Sales Desk', avatar: null, customPermissions: [], lastLogin: new Date('2026-07-20T11:00:00'), createdAt: new Date('2026-03-01'), createdBy: 'Priya Mehta' },
  { id: 6, name: 'Neha Singh',    email: 'neha@inventrack.com',    role: 'manager', status: 'suspended', phone: '+91 98765 43215', department: 'Procurement', avatar: null, customPermissions: [], lastLogin: new Date('2026-06-15T10:30:00'), createdAt: new Date('2026-03-15'), createdBy: 'Arjun Sharma' },
];

let nextUserId = 7;

/* Audit Log */
let auditLog = [
  { id: 1, userId: 2, userName: 'Priya Mehta', userAvatar: null, action: 'user.created', target: 'Sneha Patel', details: 'Created manager account', timestamp: new Date('2026-02-10T10:00:00'), performedBy: 'Arjun Sharma' },
  { id: 2, userId: 1, userName: 'Arjun Sharma', userAvatar: null, action: 'user.role_changed', target: 'Priya Mehta', details: 'Role changed from viewer to manager', timestamp: new Date('2026-03-01T14:30:00'), performedBy: 'Arjun Sharma' },
  { id: 3, userId: 1, userName: 'Arjun Sharma', userAvatar: null, action: 'user.suspended', target: 'Neha Singh', details: 'Account suspended due to policy violation', timestamp: new Date('2026-04-15T16:00:00'), performedBy: 'Arjun Sharma' },
  { id: 4, userId: 2, userName: 'Priya Mehta', userAvatar: null, action: 'user.deactivated', target: 'Amit Kumar', details: 'Account deactivated - resigned', timestamp: new Date('2026-05-20T11:30:00'), performedBy: 'Priya Mehta' },
];

let nextAuditId = 5;

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
  const [users, setUsers] = useState(usersDB);
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
        setUsers([...usersDB]);
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

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    admins: users.filter((u) => u.role === 'admin').length,
    managers: users.filter((u) => u.role === 'manager').length,
    viewers: users.filter((u) => u.role === 'viewer').length,
  };

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(''); setShowModal(true); };
  const openEdit = (u) => {
    setForm({ 
      name: u.name, email: u.email, role: u.role, phone: u.phone, 
      department: u.department, password: '', avatar: u.avatar, 
      avatarPreview: u.avatar, customPermissions: u.customPermissions || [] 
    });
    setEditId(u.id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    await delay(300);

    try {
      if (editId) {
        // Update
        const idx = users.findIndex((u) => u.id === editId);
        if (idx === -1) throw new Error('User not found');
        const oldRole = users[idx].role;
        users[idx] = { ...users[idx], ...form, email: users[idx].email };
        usersDB = [...users];
        
        if (oldRole !== form.role) {
          addAuditLog('user.role_changed', users[idx].name, `Role changed from ${oldRole} to ${form.role}`, currentUser?.name);
        } else {
          addAuditLog('user.updated', users[idx].name, 'User details updated', currentUser?.name);
        }
      } else {
        // Create
        const exists = users.find((u) => u.email.toLowerCase() === form.email.toLowerCase());
        if (exists) throw new Error('Email already exists');
        const newUser = {
          id: nextUserId++,
          ...form,
          status: 'active',
          lastLogin: null,
          createdAt: new Date(),
          createdBy: currentUser?.name,
        };
        users.unshift(newUser);
        usersDB = [...users];
        addAuditLog('user.created', newUser.name, `Created new ${newUser.role} account`, currentUser?.name);
      }
      setUsers([...users]);
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const uObj = users.find((u) => u.id === id);
    await delay(200);
    const filtered = users.filter((u) => u.id !== id);
    setUsers(filtered);
    usersDB = filtered;
    setShowDeleteConfirm(null);
    if (uObj) {
      addAuditLog('user.deleted', uObj.name, `Deleted ${uObj.role} account`, currentUser?.name);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    await delay(200);
    const idx = users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const oldStatus = users[idx].status;
      users[idx].status = newStatus;
      setUsers([...users]);
      usersDB = [...users];
      
      const actions = {
        active: 'user.activated',
        inactive: 'user.deactivated',
        suspended: 'user.suspended',
      };
      addAuditLog(actions[newStatus], users[idx].name, `Status changed from ${oldStatus} to ${newStatus}`, currentUser?.name);
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

  return (
    <div>
      {/* Gateway of Tally Software Header Bar */}
      <div className="tally-header-bar mb-3 shadow-sm">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="tally-header-badge" style={{ background: 'var(--primary)', color: '#fff' }}>SECURITY</span>
            <div>
              <h5 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                SECURITY & USER ROLES REGISTER &mdash; OPERATOR MASTERS
              </h5>
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                F.Y. 2026-2027 | System Operator Management | EHN One ERP
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn-v outline-secondary btn-sm" onClick={() => setShowAuditLog(true)}>
              <i className="bi bi-clock-history me-1"></i> [Alt+A] Audit Log
            </button>
            <button className="btn-v outline-secondary btn-sm" onClick={handleExportCSV} title="Export CSV">
              <i className="bi bi-filetype-csv me-1"></i> [Alt+C] CSV
            </button>
            <button className="btn-v outline-success btn-sm" onClick={handleExportExcel} title="Export Excel (.xls)">
              <i className="bi bi-file-earmark-excel me-1"></i> [Alt+X] Excel
            </button>
            <button className="btn-v outline-danger btn-sm" onClick={handleExportPDF} title="Export PDF">
              <i className="bi bi-file-earmark-pdf me-1"></i> [Alt+P] PDF
            </button>
            {can('users.manage') && (
              <button className="btn-v primary btn-sm" onClick={openAdd}>
                <i className="bi bi-person-plus me-1"></i> [F4] Add Operator Master
              </button>
            )}
          </div>
        </div>

        {/* F1-F8 Action Toolbar */}
        <div className="tally-toolbar mt-2 pt-2 border-top d-flex gap-2 flex-wrap">
          <button className="tally-shortcut-btn" onClick={() => document.getElementById('user-search-input')?.focus()}>
            <span className="key">[F2]</span> Search Operator
          </button>
          {can('users.manage') && (
            <button className="tally-shortcut-btn" onClick={openAdd}>
              <span className="key">[F4]</span> New Operator
            </button>
          )}
          <button className="tally-shortcut-btn" onClick={() => setUsers([...usersDB])}>
            <span className="key">[F5]</span> Refresh Register
          </button>
          <button className="tally-shortcut-btn" onClick={() => setShowAuditLog(true)}>
            <span className="key">[Alt+A]</span> Security Audit Log
          </button>
          <button className="tally-shortcut-btn" onClick={handleExportCSV}>
            <span className="key">[Alt+C]</span> Export CSV
          </button>
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
                {filteredUsers.map((u, i) => (
                  <tr key={u.id}>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>{i + 1}</td>
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
                            <button className="btn-v outline-primary btn-sm px-2" onClick={() => openEdit(u)} title="Edit Master">
                              <i className="bi bi-pencil"></i>
                            </button>
                            {u.id !== currentUser?.id && (
                              <button className="btn-v outline-danger btn-sm px-2" onClick={() => setShowDeleteConfirm(u)} title="Delete Master">
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
        </div>
      </div>

      {/* Add / Edit Operator Desktop Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 650 }}>
            <div className="modal-box-header d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-person-plus'}`} style={{ color: 'var(--primary)' }}></i>
                <span>{editId ? 'MODIFY OPERATOR SECURITY MASTER' : 'CREATE NEW OPERATOR MASTER'}</span>
              </div>
              <button className="close-btn" onClick={() => setShowModal(false)} aria-label="Close">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-box-body p-3" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
                {error && (
                  <div className="alert-v danger mb-3">
                    <i className="bi bi-exclamation-circle me-1"></i> {error}
                  </div>
                )}

                <div className="form-section-title mb-2"><i className="bi bi-person-badge me-1"></i> Operator Identity</div>
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" placeholder="e.g. Ramesh Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email Address *</label>
                    <input className="form-control" type="email" placeholder="ramesh@ehnone.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editId} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input className="form-control" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Department / Branch</label>
                    <input className="form-control" placeholder="e.g. Billing Desk" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                  </div>
                </div>

                <div className="form-divider mb-3"></div>

                <div className="form-section-title mb-2"><i className="bi bi-shield-lock me-1"></i> Security Role Level</div>
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Assigned Role Level *</label>
                    <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="admin">Administrator (Full Rights)</option>
                      <option value="manager">Manager (Operations & Stock)</option>
                      <option value="viewer">Viewer / Billing Operator</option>
                    </select>
                  </div>
                  {!editId && (
                    <div className="col-md-6">
                      <label className="form-label">Initial Password *</label>
                      <input className="form-control" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-box-footer d-flex justify-content-end gap-2">
                <button type="button" className="btn-v outline-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-v primary btn-sm" disabled={saving}>
                  <i className="bi bi-check-circle me-1"></i> {saving ? 'Saving...' : editId ? 'Update Operator' : 'Create Operator'}
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
    </div>
  );
}
