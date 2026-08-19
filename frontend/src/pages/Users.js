import React, { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';

/* Mock users database */
let usersDB = [
  { id: 1, name: 'Arjun Sharma',  email: 'admin@inventrack.com',   role: 'admin',   status: 'active',   phone: '+91 98765 43210', department: 'IT', avatar: null, customPermissions: [], lastLogin: new Date('2024-06-18T09:30:00'), createdAt: new Date('2024-01-01'), createdBy: 'System' },
  { id: 2, name: 'Priya Mehta',   email: 'manager@inventrack.com', role: 'manager', status: 'active',   phone: '+91 98765 43211', department: 'Operations', avatar: null, customPermissions: [], lastLogin: new Date('2024-06-18T08:15:00'), createdAt: new Date('2024-01-15'), createdBy: 'Arjun Sharma' },
  { id: 3, name: 'Rahul Verma',   email: 'viewer@inventrack.com',  role: 'viewer',  status: 'active',   phone: '+91 98765 43212', department: 'Finance', avatar: null, customPermissions: [], lastLogin: new Date('2024-06-17T16:45:00'), createdAt: new Date('2024-02-01'), createdBy: 'Arjun Sharma' },
  { id: 4, name: 'Sneha Patel',   email: 'sneha@inventrack.com',   role: 'manager', status: 'active',   phone: '+91 98765 43213', department: 'Warehouse', avatar: null, customPermissions: [], lastLogin: new Date('2024-06-16T14:20:00'), createdAt: new Date('2024-02-10'), createdBy: 'Arjun Sharma' },
  { id: 5, name: 'Amit Kumar',    email: 'amit@inventrack.com',    role: 'viewer',  status: 'inactive', phone: '+91 98765 43214', department: 'Sales', avatar: null, customPermissions: [], lastLogin: new Date('2024-05-20T11:00:00'), createdAt: new Date('2024-03-01'), createdBy: 'Priya Mehta' },
  { id: 6, name: 'Neha Singh',    email: 'neha@inventrack.com',    role: 'manager', status: 'suspended', phone: '+91 98765 43215', department: 'Procurement', avatar: null, customPermissions: [], lastLogin: new Date('2024-04-15T10:30:00'), createdAt: new Date('2024-03-15'), createdBy: 'Arjun Sharma' },
];

let nextUserId = 7;

/* Audit Log */
let auditLog = [
  { id: 1, userId: 2, userName: 'Priya Mehta', userAvatar: null, action: 'user.created', target: 'Sneha Patel', details: 'Created manager account', timestamp: new Date('2024-02-10T10:00:00'), performedBy: 'Arjun Sharma' },
  { id: 2, userId: 1, userName: 'Arjun Sharma', userAvatar: null, action: 'user.role_changed', target: 'Priya Mehta', details: 'Role changed from viewer to manager', timestamp: new Date('2024-03-01T14:30:00'), performedBy: 'Arjun Sharma' },
  { id: 3, userId: 1, userName: 'Arjun Sharma', userAvatar: null, action: 'user.suspended', target: 'Neha Singh', details: 'Account suspended due to policy violation', timestamp: new Date('2024-04-15T16:00:00'), performedBy: 'Arjun Sharma' },
  { id: 4, userId: 2, userName: 'Priya Mehta', userAvatar: null, action: 'user.deactivated', target: 'Amit Kumar', details: 'Account deactivated - resigned', timestamp: new Date('2024-05-20T11:30:00'), performedBy: 'Priya Mehta' },
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
  customPermissions: [], // For granular permission control
};

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

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
    await delay(400);

    try {
      if (editId) {
        // Update
        const idx = users.findIndex((u) => u.id === editId);
        if (idx === -1) throw new Error('User not found');
        const oldRole = users[idx].role;
        users[idx] = { ...users[idx], ...form, email: users[idx].email }; // email can't change
        usersDB = [...users];
        
        // Audit log
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
        
        // Audit log
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
    const user = users.find((u) => u.id === id);
    await delay(300);
    const filtered = users.filter((u) => u.id !== id);
    setUsers(filtered);
    usersDB = filtered;
    setShowDeleteConfirm(null);
    
    // Audit log
    if (user) {
      addAuditLog('user.deleted', user.name, `Deleted ${user.role} account`, currentUser?.name);
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
      
      // Audit log
      const actions = {
        active: 'user.activated',
        inactive: 'user.deactivated',
        suspended: 'user.suspended',
      };
      addAuditLog(actions[newStatus], users[idx].name, `Status changed from ${oldStatus} to ${newStatus}`, currentUser?.name);
    }
  };

  const getRoleBadge = (role) => {
    const r = ROLES[role];
    if (!r) return null;
    return <span className={`badge-v ${r.color}`}><i className={`bi ${r.icon}`}></i> {r.label}</span>;
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { color: 'success', icon: 'bi-check-circle', label: 'Active' },
      inactive: { color: 'secondary', icon: 'bi-dash-circle', label: 'Inactive' },
      suspended: { color: 'danger', icon: 'bi-x-circle', label: 'Suspended' },
    };
    const s = map[status] || map.inactive;
    return <span className={`badge-v ${s.color}`}><i className={`bi ${s.icon}`}></i> {s.label}</span>;
  };

  if (!can('users.view')) {
    return (
      <div className="empty-state-v" style={{ paddingTop: 80 }}>
        <i className="bi bi-shield-x" style={{ color: 'var(--danger)' }}></i>
        <h5>Access Denied</h5>
        <p>Only administrators can manage users.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">
              <i className="bi bi-people me-2" style={{ color: 'var(--primary)' }}></i>
              User Management
            </h1>
            <p className="page-subtitle">Manage system users, roles, and permissions</p>
          </div>
          {can('users.manage') && (
            <div className="d-flex gap-2">
              <button className="btn-v light" onClick={() => setShowAuditLog(true)}>
                <i className="bi bi-clock-history"></i>
                <span className="d-none d-sm-inline">Audit Log</span>
              </button>
              <button className="btn-v primary" onClick={openAdd}>
                <i className="bi bi-person-plus"></i>
                <span>Add User</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon primary">
              <i className="bi bi-people"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Total Users</div>
              <div className="stat-card-value">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon success">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Active Users</div>
              <div className="stat-card-value">{stats.active}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon danger">
              <i className="bi bi-shield-lock"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Administrators</div>
              <div className="stat-card-value">{stats.admins}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon warning">
              <i className="bi bi-person-badge"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Managers</div>
              <div className="stat-card-value">{stats.managers}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="v-card mb-4">
        <div className="v-card-body" style={{ padding: '16px 24px' }}>
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <div className="search-box-v">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, department…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>Role</label>
              <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn-v light w-100"
                onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
                style={{ justifyContent: 'center' }}
              >
                <i className="bi bi-x-lg"></i> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="v-card">
        <div className="v-card-header">
          <i className="bi bi-table"></i>
          All Users
          <span className="badge-v secondary ms-auto">{filteredUsers.length}</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {filteredUsers.length === 0 ? (
            <div className="empty-state-v">
              <i className="bi bi-inbox"></i>
              <h5>No Users Found</h5>
              <p>{search || roleFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting filters' : 'No users in the system'}</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className={`user-avatar role-avatar-${u.role}`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold">{u.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <i className="bi bi-envelope me-1"></i>{u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>{u.department}</td>
                    <td>{getStatusBadge(u.status)}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn-v outline-primary icon-only"
                          onClick={() => setViewUser(u)}
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        {can('users.manage') && (
                          <>
                            <button
                              className="btn-v outline-primary icon-only"
                              onClick={() => openEdit(u)}
                              title="Edit"
                              disabled={u.id === currentUser?.id}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            {u.id !== currentUser?.id && (
                              <button
                                className="btn-v outline-danger icon-only"
                                onClick={() => setShowDeleteConfirm(u)}
                                title="Delete"
                              >
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

      {/* Add/Edit Modal */}
      {showModal && (
        <UserFormModal
          form={form}
          setForm={setForm}
          editId={editId}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
          saving={saving}
          error={error}
        />
      )}

      {/* View Details Modal */}
      {viewUser && <UserDetailsModal user={viewUser} onClose={() => setViewUser(null)} onStatusChange={handleStatusChange} canManage={can('users.manage')} />}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          user={showDeleteConfirm}
          onConfirm={() => handleDelete(showDeleteConfirm.id)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      {/* Audit Log Modal */}
      {showAuditLog && <AuditLogModal auditLog={auditLog} onClose={() => setShowAuditLog(false)} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   USER FORM MODAL (Add / Edit)
═══════════════════════════════════════════════════════════ */
function UserFormModal({ form, setForm, editId, onSubmit, onClose, saving, error }) {
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, avatar: file, avatarPreview: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setForm({ ...form, avatar: null, avatarPreview: null });
  };

  // Available permissions grouped by module
  const allPermissions = {
    'Dashboard': ['dashboard.view'],
    'Products': ['products.view', 'products.add', 'products.edit', 'products.delete'],
    'Transactions': ['transactions.view', 'transactions.stockin', 'transactions.stockout'],
    'Inventory': ['lowstock.view'],
    'Catalogue': ['categories.view', 'suppliers.view', 'warehouse.view'],
    'Reports': ['reports.view', 'analytics.view'],
    'Administration': ['settings.view', 'users.view', 'users.manage'],
  };

  // Get role's default permissions
  const rolePermissions = ROLES[form.role]?.permissions || [];

  const togglePermission = (perm) => {
    const current = form.customPermissions || [];
    if (current.includes(perm)) {
      setForm({ ...form, customPermissions: current.filter((p) => p !== perm) });
    } else {
      setForm({ ...form, customPermissions: [...current, perm] });
    }
  };

  const isPermissionActive = (perm) => {
    return rolePermissions.includes(perm) || (form.customPermissions || []).includes(perm);
  };

  const isPermissionFromRole = (perm) => {
    return rolePermissions.includes(perm);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 800 }}>
        <div className="modal-box-header">
          <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-person-plus'}`} style={{ color: 'var(--primary)' }}></i>
          {editId ? 'Edit User' : 'Add New User'}
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-box-body">
            {error && (
              <div className="alert-v danger">
                <i className="bi bi-exclamation-circle"></i> {error}
              </div>
            )}

            {/* Avatar Upload Section */}
            <div className="avatar-upload-section">
              <div className="avatar-upload-preview">
                {form.avatarPreview ? (
                  <div className="avatar-preview-img" style={{ backgroundImage: `url(${form.avatarPreview})` }}>
                    <button type="button" className="avatar-remove-btn" onClick={removeAvatar} title="Remove">
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                ) : (
                  <div className={`avatar-preview-placeholder role-avatar-${form.role}`}>
                    <i className="bi bi-person"></i>
                  </div>
                )}
              </div>
              <div className="avatar-upload-info">
                <div className="avatar-upload-title">Profile Picture</div>
                <div className="avatar-upload-desc">Upload a profile image (JPG, PNG • Max 2MB)</div>
                <label className="btn-v light mt-2" style={{ cursor: 'pointer' }}>
                  <i className="bi bi-upload"></i>
                  <span>Choose Image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Basic Info */}
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email Address *</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={!!editId}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="">Select Department</option>
                  <option value="IT">IT</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Sales">Sales</option>
                  <option value="Procurement">Procurement</option>
                  <option value="HR">HR</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Role *</label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value, customPermissions: [] })}
                  required
                >
                  <option value="viewer">👁️ Viewer — Read-only access</option>
                  <option value="manager">📋 Manager — Can manage inventory</option>
                  <option value="admin">🛡️ Administrator — Full access</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">{editId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder={editId ? 'Leave blank to keep current' : 'Enter password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editId}
                />
              </div>

              {/* Permission Customization */}
              <div className="col-12">
                <div className="permission-section">
                  <div className="permission-section-header">
                    <div>
                      <i className="bi bi-shield-check" style={{ color: 'var(--primary)' }}></i>
                      <span className="permission-section-title">Access Permissions</span>
                    </div>
                    <span className="badge-v primary">{Object.keys(allPermissions).reduce((sum, module) => sum + allPermissions[module].filter(isPermissionActive).length, 0)} active</span>
                  </div>
                  <div className="permission-section-desc">
                    Base permissions from <strong>{ROLES[form.role]?.label}</strong> role. 
                    Click to add/remove additional permissions.
                  </div>

                  <div className="permissions-modules">
                    {Object.entries(allPermissions).map(([module, perms]) => (
                      <div key={module} className="permission-module">
                        <div className="permission-module-title">
                          <i className="bi bi-folder"></i>
                          {module}
                          <span className="permission-module-count">
                            {perms.filter(isPermissionActive).length}/{perms.length}
                          </span>
                        </div>
                        <div className="permission-items">
                          {perms.map((perm) => {
                            const isActive = isPermissionActive(perm);
                            const fromRole = isPermissionFromRole(perm);
                            return (
                              <button
                                key={perm}
                                type="button"
                                className={`permission-item-btn ${isActive ? 'active' : ''} ${fromRole ? 'from-role' : ''}`}
                                onClick={() => !fromRole && togglePermission(perm)}
                                disabled={fromRole}
                                title={fromRole ? 'Included in role' : 'Click to toggle'}
                              >
                                <i className={`bi ${isActive ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                                <span>{perm.split('.')[1]}</span>
                                {fromRole && <i className="bi bi-lock-fill permission-lock"></i>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-box-footer">
            <button className="btn-v light" type="button" onClick={onClose}>Cancel</button>
            <button className="btn-v primary" type="submit" disabled={saving}>
              {saving ? (
                <><span className="spinner-border spinner-border-sm me-1"></span>Saving…</>
              ) : (
                <>{editId ? 'Update User' : 'Create User'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   USER DETAILS MODAL (View)
═══════════════════════════════════════════════════════════ */
function UserDetailsModal({ user, onClose, onStatusChange, canManage }) {
  const roleInfo = ROLES[user.role];

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 650 }}>
        <div className="modal-box-header">
          <i className="bi bi-person-circle" style={{ color: 'var(--primary)' }}></i>
          User Details
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-box-body">
          {/* User Header */}
          <div className="user-detail-header">
            <div className={`user-detail-avatar role-avatar-${user.role}`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-grow-1">
              <h4 className="user-detail-name">{user.name}</h4>
              <div className="user-detail-email">
                <i className="bi bi-envelope"></i> {user.email}
              </div>
              <div className="d-flex gap-2 mt-2">
                {roleInfo && (
                  <span className={`badge-v ${roleInfo.color}`}>
                    <i className={`bi ${roleInfo.icon}`}></i> {roleInfo.label}
                  </span>
                )}
                {user.status === 'active' && <span className="badge-v success"><i className="bi bi-check-circle"></i> Active</span>}
                {user.status === 'inactive' && <span className="badge-v secondary"><i className="bi bi-dash-circle"></i> Inactive</span>}
                {user.status === 'suspended' && <span className="badge-v danger"><i className="bi bi-x-circle"></i> Suspended</span>}
              </div>
            </div>
          </div>

          <div className="user-detail-divider"></div>

          {/* User Info Grid */}
          <div className="user-detail-grid">
            <div className="user-detail-item">
              <div className="user-detail-label">
                <i className="bi bi-telephone"></i> Phone
              </div>
              <div className="user-detail-value">{user.phone || '—'}</div>
            </div>
            <div className="user-detail-item">
              <div className="user-detail-label">
                <i className="bi bi-building"></i> Department
              </div>
              <div className="user-detail-value">{user.department || '—'}</div>
            </div>
            <div className="user-detail-item">
              <div className="user-detail-label">
                <i className="bi bi-calendar-check"></i> Last Login
              </div>
              <div className="user-detail-value">
                {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Never'}
              </div>
            </div>
            <div className="user-detail-item">
              <div className="user-detail-label">
                <i className="bi bi-calendar-plus"></i> Created At
              </div>
              <div className="user-detail-value">
                {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="user-detail-divider"></div>
          <div className="user-detail-section">
            <div className="user-detail-section-title">
              <i className="bi bi-shield-check"></i> Permissions
            </div>
            <div className="permissions-grid">
              {roleInfo?.permissions.map((perm) => (
                <div key={perm} className="permission-item">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>{perm.replace(/\./g, ' › ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Actions */}
          {canManage && (
            <>
              <div className="user-detail-divider"></div>
              <div className="user-detail-section">
                <div className="user-detail-section-title">
                  <i className="bi bi-sliders"></i> Quick Actions
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  {user.status !== 'active' && (
                    <button
                      className="btn-v success"
                      onClick={() => { onStatusChange(user.id, 'active'); onClose(); }}
                    >
                      <i className="bi bi-check-circle"></i> Activate User
                    </button>
                  )}
                  {user.status !== 'suspended' && (
                    <button
                      className="btn-v danger"
                      onClick={() => { onStatusChange(user.id, 'suspended'); onClose(); }}
                    >
                      <i className="bi bi-x-circle"></i> Suspend User
                    </button>
                  )}
                  {user.status !== 'inactive' && (
                    <button
                      className="btn-v light"
                      onClick={() => { onStatusChange(user.id, 'inactive'); onClose(); }}
                    >
                      <i className="bi bi-dash-circle"></i> Deactivate
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="modal-box-footer">
          <button className="btn-v light" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DELETE CONFIRMATION MODAL
═══════════════════════════════════════════════════════════ */
function DeleteConfirmModal({ user, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-box-header" style={{ background: 'rgba(234,84,85,0.08)' }}>
          <i className="bi bi-trash" style={{ color: 'var(--danger)' }}></i>
          Delete User
          <button className="close-btn" onClick={onCancel}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-box-body">
          <div className="text-center mb-3">
            <div className={`user-avatar role-avatar-${user.role}`} style={{ width: 60, height: 60, fontSize: '1.5rem', margin: '0 auto 12px' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h5 style={{ marginBottom: 6 }}>{user.name}</h5>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{user.email}</p>
          </div>
          <div className="alert-v danger" style={{ fontSize: '0.88rem' }}>
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>
              <strong>Warning:</strong> This action cannot be undone. All user data and access will be permanently removed.
            </div>
          </div>
        </div>
        <div className="modal-box-footer">
          <button className="btn-v light" onClick={onCancel}>Cancel</button>
          <button className="btn-v danger" onClick={onConfirm}>
            <i className="bi bi-trash"></i> Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUDIT LOG MODAL
═══════════════════════════════════════════════════════════ */
function AuditLogModal({ auditLog, onClose }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'table'

  const getActionIcon = (action) => {
    const map = {
      'user.created': { icon: 'bi-person-plus', color: 'success' },
      'user.updated': { icon: 'bi-pencil', color: 'primary' },
      'user.deleted': { icon: 'bi-trash', color: 'danger' },
      'user.role_changed': { icon: 'bi-shield-check', color: 'warning' },
      'user.activated': { icon: 'bi-check-circle', color: 'success' },
      'user.deactivated': { icon: 'bi-dash-circle', color: 'secondary' },
      'user.suspended': { icon: 'bi-x-circle', color: 'danger' },
      'security.login': { icon: 'bi-shield-lock', color: 'info' },
      'invoice.delete': { icon: 'bi-receipt-cutoff', color: 'danger' },
      'settings.update': { icon: 'bi-gear', color: 'primary' },
    };
    return map[action] || { icon: 'bi-info-circle', color: 'primary' };
  };

  const getActionLabel = (action) => {
    const map = {
      'user.created': 'User Created',
      'user.updated': 'User Updated',
      'user.deleted': 'User Deleted',
      'user.role_changed': 'Role Changed',
      'user.activated': 'User Activated',
      'user.deactivated': 'User Deactivated',
      'user.suspended': 'User Suspended',
      'security.login': 'Security Login',
      'invoice.delete': 'Invoice Deleted',
      'settings.update': 'Settings Updated',
    };
    return map[action] || action;
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Filter audit log entries
  const filteredLogs = auditLog.filter(l => {
    const matchCat = categoryFilter === 'ALL' || (l.category || 'USER') === categoryFilter;
    const matchSev = severityFilter === 'ALL' || (l.severity || 'INFO') === severityFilter;
    const matchSearch = !search || 
      (l.action && l.action.toLowerCase().includes(search.toLowerCase())) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase())) ||
      (l.target && l.target.toLowerCase().includes(search.toLowerCase())) ||
      (l.performedBy && l.performedBy.toLowerCase().includes(search.toLowerCase()));

    return matchCat && matchSev && matchSearch;
  });

  // Export to CSV
  const exportCSV = () => {
    let csv = 'Timestamp,Action,Performed By,Target Entity,Details\n';
    filteredLogs.forEach(l => {
      csv += `"${new Date(l.timestamp).toISOString()}","${l.action || ''}","${l.performedBy || 'System'}","${(l.target || '').replace(/"/g, '""')}","${(l.details || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Security_Audit_Logs_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Audit Report
  const handlePrintAudit = () => {
    const win = window.open('', '_blank', 'width=900,height=800');
    if (!win) return alert('Pop-up blocked! Allow pop-ups to print audit log report.');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Security_Audit_Report_${new Date().toISOString().split('T')[0]}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; font-size: 12px; color: #1e293b; }
          .header { border-bottom: 2px solid #7367f0; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; }
          .title { font-size: 18px; font-weight: bold; color: #7367f0; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f8fafc; padding: 8px; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">EHN One - Security Audit Logs Report</div>
            <div>Generated on: ${new Date().toLocaleString('en-IN')}</div>
          </div>
          <div>Total Logged Events: ${filteredLogs.length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Performer User</th>
              <th>Action</th>
              <th>Target Entity</th>
              <th>Details & Description</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLogs.map(l => `
              <tr>
                <td>${new Date(l.timestamp).toLocaleString('en-IN')}</td>
                <td><strong>${l.performedBy || 'System'}</strong></td>
                <td>${l.action}</td>
                <td>${l.target || '-'}</td>
                <td>${l.details || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>window.onload = function() { window.focus(); window.print(); };</script>
      </body>
      </html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 880, width: '94%' }}>
        
        {/* Header */}
        <div className="modal-box-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shield-check" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}></i>
            <div>
              <div className="fw-bold" style={{ fontSize: '1.05rem' }}>Security Audit Logs Explorer</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time user actions, role changes, and system audit trail</div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn-v outline-primary btn-sm" onClick={exportCSV} title="Export Audit Log CSV">
              <i className="bi bi-download me-1"></i> Export CSV
            </button>
            <button className="btn-v primary btn-sm" onClick={handlePrintAudit} title="Print Audit Report">
              <i className="bi bi-printer me-1"></i> Print Report
            </button>
            <button className="close-btn ms-2" onClick={onClose}><i className="bi bi-x-lg"></i></button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-light p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: 360 }}>
            <div className="search-box-v w-100">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search audit actions, user, details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <select className="form-select form-select-sm" style={{ width: 130 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="ALL">All Modules</option>
              <option value="USER">User & Roles</option>
              <option value="AUTH">Authentication</option>
              <option value="INVOICE">Invoices</option>
              <option value="PRODUCT">Products</option>
              <option value="SETTINGS">Settings</option>
            </select>

            <select className="form-select form-select-sm" style={{ width: 130 }} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
              <option value="ALL">All Severity</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="SECURITY">Security</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <div className="btn-group btn-group-sm">
              <button className={`btn ${viewMode === 'timeline' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('timeline')}>
                <i className="bi bi-clock-history"></i>
              </button>
              <button className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('table')}>
                <i className="bi bi-table"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-box-body p-0" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {filteredLogs.length === 0 ? (
            <div className="empty-state-v" style={{ padding: '40px 20px' }}>
              <i className="bi bi-shield-x"></i>
              <h5>No Audit Logs Found</h5>
              <p>Try matching another search keyword or filter</p>
            </div>
          ) : viewMode === 'timeline' ? (
            <div className="audit-log-timeline p-3">
              {filteredLogs.map((log, idx) => {
                const actionInfo = getActionIcon(log.action);
                return (
                  <div key={log.id || idx} className="audit-log-item">
                    <div className="audit-log-icon-wrap">
                      <div className={`audit-log-icon ${actionInfo.color}`}>
                        <i className={`bi ${actionInfo.icon}`}></i>
                      </div>
                      <div className="audit-log-line"></div>
                    </div>
                    <div className="audit-log-content">
                      <div className="audit-log-header">
                        <div className="d-flex align-items-center gap-2">
                          <div className="audit-log-avatar">
                            {(log.performedBy || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="audit-log-user">{log.performedBy || 'System Admin'}</div>
                            <div className="audit-log-time">{formatTimestamp(log.timestamp)}</div>
                          </div>
                        </div>
                        <span className={`badge-v ${actionInfo.color}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                      <div className="audit-log-details">
                        <div className="audit-log-target">
                          <i className="bi bi-person me-1"></i> {log.target}
                        </div>
                        <div className="audit-log-desc">{log.details}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Performer</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l, idx) => (
                  <tr key={l.id || idx}>
                    <td style={{ fontSize: '0.78rem' }}>{new Date(l.timestamp).toLocaleString('en-IN')}</td>
                    <td className="fw-semibold" style={{ color: 'var(--primary)' }}>{l.performedBy || 'Admin'}</td>
                    <td><span className="badge-v primary" style={{ fontSize: '0.72rem' }}>{l.action}</span></td>
                    <td className="fw-semibold">{l.target || '-'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-box-footer">
          <button className="btn-v light" onClick={onClose}>Close Explorer</button>
        </div>
      </div>
    </div>
  );
}
