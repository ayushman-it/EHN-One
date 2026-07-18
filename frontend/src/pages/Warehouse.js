import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* Mock Warehouses Database */
let warehousesDB = [
  { 
    id: 'WH-001', 
    name: 'Main Distribution Center', 
    code: 'MDC-DEL',
    location: 'Sector 63, Noida, Delhi NCR',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '201301',
    manager: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh@ehnone.com',
    capacity: 50000,
    occupied: 35000,
    status: 'active',
    type: 'Distribution Center',
    products: 145,
    establishedDate: new Date('2022-01-15'),
  },
  { 
    id: 'WH-002', 
    name: 'Mumbai Central Warehouse', 
    code: 'MCW-MUM',
    location: 'Andheri MIDC, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400093',
    manager: 'Priya Mehta',
    phone: '+91 98765 43211',
    email: 'priya@ehnone.com',
    capacity: 35000,
    occupied: 28000,
    status: 'active',
    type: 'Storage',
    products: 98,
    establishedDate: new Date('2022-06-20'),
  },
  { 
    id: 'WH-003', 
    name: 'Bangalore Tech Hub', 
    code: 'BTH-BLR',
    location: 'Whitefield Industrial Area, Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560066',
    manager: 'Amit Singh',
    phone: '+91 98765 43212',
    email: 'amit@ehnone.com',
    capacity: 25000,
    occupied: 18000,
    status: 'active',
    type: 'Distribution Center',
    products: 76,
    establishedDate: new Date('2022-09-10'),
  },
  { 
    id: 'WH-004', 
    name: 'Pune Storage Facility', 
    code: 'PSF-PUN',
    location: 'Hinjewadi Phase 2, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411057',
    manager: 'Sneha Patel',
    phone: '+91 98765 43213',
    email: 'sneha@ehnone.com',
    capacity: 15000,
    occupied: 12000,
    status: 'maintenance',
    type: 'Storage',
    products: 54,
    establishedDate: new Date('2023-02-05'),
  },
  { 
    id: 'WH-005', 
    name: 'Hyderabad Logistics Center', 
    code: 'HLC-HYD',
    location: 'Genome Valley, Shamirpet, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500078',
    manager: 'Vikram Reddy',
    phone: '+91 98765 43214',
    email: 'vikram@ehnone.com',
    capacity: 40000,
    occupied: 25000,
    status: 'active',
    type: 'Logistics Hub',
    products: 112,
    establishedDate: new Date('2022-11-12'),
  },
];

let nextWarehouseNum = 6;

export default function Warehouse() {
  const { can } = useAuth();
  const [warehouses, setWarehouses] = useState(warehousesDB);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewWarehouse, setViewWarehouse] = useState(null);
  const [editWarehouse, setEditWarehouse] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter logic
  const filteredWarehouses = warehouses.filter((wh) => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      wh.name.toLowerCase().includes(q) || 
      wh.code.toLowerCase().includes(q) ||
      wh.city.toLowerCase().includes(q) ||
      wh.manager.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || wh.status === statusFilter;
    const matchType = typeFilter === 'all' || wh.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // Stats
  const stats = {
    total: warehouses.length,
    active: warehouses.filter((w) => w.status === 'active').length,
    totalCapacity: warehouses.reduce((sum, w) => sum + w.capacity, 0),
    totalOccupied: warehouses.reduce((sum, w) => sum + w.occupied, 0),
    totalProducts: warehouses.reduce((sum, w) => sum + w.products, 0),
  };
  stats.utilization = ((stats.totalOccupied / stats.totalCapacity) * 100).toFixed(1);

  const types = ['All', 'Distribution Center', 'Storage', 'Logistics Hub'];

  const getStatusBadge = (status) => {
    const map = {
      active: { color: 'success', icon: 'bi-check-circle', label: 'Active' },
      inactive: { color: 'secondary', icon: 'bi-dash-circle', label: 'Inactive' },
      maintenance: { color: 'warning', icon: 'bi-tools', label: 'Maintenance' },
    };
    const s = map[status] || map.active;
    return <span className={`badge-v ${s.color}`}><i className={`bi ${s.icon}`}></i> {s.label}</span>;
  };

  const getUtilizationBar = (capacity, occupied) => {
    const percentage = (occupied / capacity) * 100;
    let color = 'var(--success)';
    if (percentage > 90) color = 'var(--danger)';
    else if (percentage > 75) color = 'var(--warning)';
    
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {occupied.toLocaleString()} / {capacity.toLocaleString()} sq.ft
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color }}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div style={{ height: 6, background: 'rgba(75,70,92,0.12)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ width: `${percentage}%`, height: '100%', background: color, transition: 'width 0.3s' }}></div>
        </div>
      </div>
    );
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this warehouse? This action cannot be undone.')) {
      setWarehouses(warehouses.filter((w) => w.id !== id));
      warehousesDB = warehouses.filter((w) => w.id !== id);
    }
  };

  const handleCreate = (newWarehouse) => {
    const warehouse = {
      ...newWarehouse,
      id: `WH-${String(nextWarehouseNum++).padStart(3, '0')}`,
      products: 0,
      establishedDate: new Date(),
    };
    setWarehouses([warehouse, ...warehouses]);
    warehousesDB = [warehouse, ...warehouses];
  };

  const handleUpdate = (updatedWarehouse) => {
    setWarehouses(warehouses.map((w) => w.id === updatedWarehouse.id ? updatedWarehouse : w));
    warehousesDB = warehouses.map((w) => w.id === updatedWarehouse.id ? updatedWarehouse : w);
  };

  if (!can('warehouse.view')) {
    return (
      <div className="empty-state-v" style={{ paddingTop: 80 }}>
        <i className="bi bi-shield-x" style={{ color: 'var(--danger)' }}></i>
        <h5>Access Denied</h5>
        <p>You don't have permission to view warehouses.</p>
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
              <i className="bi bi-building me-2" style={{ color: 'var(--primary)' }}></i>
              Warehouse Management
            </h1>
            <p className="page-subtitle">Manage warehouse locations and capacity</p>
          </div>
          {can('warehouse.add') && (
            <button className="btn-v primary" onClick={() => setShowCreateModal(true)}>
              <i className="bi bi-plus-lg"></i>
              <span>Add Warehouse</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon primary">
              <i className="bi bi-building"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Total Warehouses</div>
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
              <div className="stat-card-label">Active Facilities</div>
              <div className="stat-card-value">{stats.active}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon warning">
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Total Products</div>
              <div className="stat-card-value">{stats.totalProducts}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon info">
              <i className="bi bi-pie-chart"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Space Utilization</div>
              <div className="stat-card-value">{stats.utilization}%</div>
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
                  placeholder="Search warehouses, cities, managers…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>Type</label>
              <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                {types.filter(t => t !== 'All').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn-v light w-100" onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }} style={{ justifyContent: 'center' }}>
                <i className="bi bi-x-lg"></i> Clear
              </button>
            </div>
            <div className="col-md-2">
              <button className="btn-v light w-100" style={{ justifyContent: 'center' }} title="Export">
                <i className="bi bi-download"></i> Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Warehouses Table */}
      <div className="v-card">
        <div className="v-card-header">
          <i className="bi bi-table"></i>
          All Warehouses
          <span className="badge-v secondary ms-auto">{filteredWarehouses.length}</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {filteredWarehouses.length === 0 ? (
            <div className="empty-state-v">
              <i className="bi bi-inbox"></i>
              <h5>No Warehouses Found</h5>
              <p>{search || statusFilter !== 'all' || typeFilter !== 'all' ? 'Try adjusting filters' : 'Click "Add Warehouse" to get started'}</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th>Warehouse</th>
                  <th>Location</th>
                  <th>Manager</th>
                  <th>Type</th>
                  <th>Capacity Utilization</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWarehouses.map((wh) => (
                  <tr key={wh.id}>
                    <td>
                      <div className="fw-bold" style={{ color: 'var(--primary)' }}>{wh.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {wh.code}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold">{wh.city}, {wh.state}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {wh.pincode}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold">{wh.manager}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {wh.phone}
                      </div>
                    </td>
                    <td>
                      <span className="badge-v light" style={{ fontSize: '0.8rem' }}>
                        {wh.type}
                      </span>
                    </td>
                    <td style={{ minWidth: 180 }}>
                      {getUtilizationBar(wh.capacity, wh.occupied)}
                    </td>
                    <td className="fw-semibold">{wh.products}</td>
                    <td>{getStatusBadge(wh.status)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn-v outline-primary icon-only" onClick={() => setViewWarehouse(wh)} title="View">
                          <i className="bi bi-eye"></i>
                        </button>
                        {can('warehouse.edit') && (
                          <button className="btn-v outline-primary icon-only" onClick={() => setEditWarehouse(wh)} title="Edit">
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {can('warehouse.delete') && (
                          <button className="btn-v outline-danger icon-only" onClick={() => handleDelete(wh.id)} title="Delete">
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

      {/* View Warehouse Modal */}
      {viewWarehouse && <ViewWarehouseModal warehouse={viewWarehouse} onClose={() => setViewWarehouse(null)} />}

      {/* Create/Edit Warehouse Modal */}
      {showCreateModal && <WarehouseFormModal onClose={() => setShowCreateModal(false)} onSave={handleCreate} />}
      {editWarehouse && <WarehouseFormModal warehouse={editWarehouse} onClose={() => setEditWarehouse(null)} onSave={handleUpdate} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW WAREHOUSE MODAL
═══════════════════════════════════════════════════════════ */
function ViewWarehouseModal({ warehouse, onClose }) {
  const utilization = ((warehouse.occupied / warehouse.capacity) * 100).toFixed(1);
  
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 700 }}>
        <div className="modal-box-header">
          <i className="bi bi-building" style={{ color: 'var(--primary)' }}></i>
          Warehouse Details
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-box-body">
          {/* Summary Card */}
          <div className="row g-3 mb-3">
            <div className="col-12">
              <div className="v-card" style={{ background: 'rgba(115,103,240,0.04)', border: '1px solid rgba(115,103,240,0.2)' }}>
                <div className="v-card-body" style={{ padding: '20px' }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="mb-1" style={{ color: 'var(--primary)' }}>{warehouse.name}</h5>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{warehouse.code}</div>
                    </div>
                    <span className={`badge-v ${warehouse.status === 'active' ? 'success' : warehouse.status === 'maintenance' ? 'warning' : 'secondary'}`}>
                      {warehouse.status === 'active' ? 'Active' : warehouse.status === 'maintenance' ? 'Maintenance' : 'Inactive'}
                    </span>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Type</div>
                      <div className="fw-bold" style={{ fontSize: '1rem', marginTop: '4px' }}>{warehouse.type}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Products</div>
                      <div className="fw-bold" style={{ fontSize: '1.2rem', marginTop: '4px' }}>{warehouse.products}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Utilization</div>
                      <div className="fw-bold" style={{ fontSize: '1.2rem', marginTop: '4px', color: utilization > 90 ? 'var(--danger)' : utilization > 75 ? 'var(--warning)' : 'var(--success)' }}>
                        {utilization}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="form-section-title mb-2">
            <i className="bi bi-geo-alt"></i> Location Information
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label">Address</label>
              <div className="info-box">{warehouse.location}</div>
            </div>
            <div className="col-md-4">
              <label className="form-label">City</label>
              <div className="info-box">{warehouse.city}</div>
            </div>
            <div className="col-md-4">
              <label className="form-label">State</label>
              <div className="info-box">{warehouse.state}</div>
            </div>
            <div className="col-md-4">
              <label className="form-label">Pincode</label>
              <div className="info-box">{warehouse.pincode}</div>
            </div>
          </div>

          {/* Manager Information */}
          <div className="form-section-title mb-2">
            <i className="bi bi-person-circle"></i> Manager Information
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">Manager Name</label>
              <div className="info-box">{warehouse.manager}</div>
            </div>
            <div className="col-md-4">
              <label className="form-label">Phone</label>
              <div className="info-box">{warehouse.phone}</div>
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <div className="info-box">{warehouse.email}</div>
            </div>
          </div>

          {/* Capacity Information */}
          <div className="form-section-title mb-2">
            <i className="bi bi-pie-chart"></i> Capacity Information
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">Total Capacity</label>
              <div className="info-box">{warehouse.capacity.toLocaleString()} sq.ft</div>
            </div>
            <div className="col-md-4">
              <label className="form-label">Occupied Space</label>
              <div className="info-box">{warehouse.occupied.toLocaleString()} sq.ft</div>
            </div>
            <div className="col-md-4">
              <label className="form-label">Available Space</label>
              <div className="info-box" style={{ color: 'var(--success)', fontWeight: 600 }}>
                {(warehouse.capacity - warehouse.occupied).toLocaleString()} sq.ft
              </div>
            </div>
            <div className="col-12">
              <label className="form-label">Established Date</label>
              <div className="info-box">
                {new Date(warehouse.establishedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-box-footer">
          <button className="btn-v light" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WAREHOUSE FORM MODAL (Create/Edit)
═══════════════════════════════════════════════════════════ */
function WarehouseFormModal({ warehouse, onClose, onSave }) {
  const [form, setForm] = useState(warehouse || {
    name: '',
    code: '',
    location: '',
    city: '',
    state: '',
    pincode: '',
    manager: '',
    phone: '',
    email: '',
    capacity: 10000,
    occupied: 0,
    status: 'active',
    type: 'Storage',
  });
  const [error, setError] = useState('');

  const types = ['Distribution Center', 'Storage', 'Logistics Hub'];
  const states = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Gujarat', 'Rajasthan', 'Uttar Pradesh'];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.code || !form.city || !form.state || !form.manager || !form.phone || !form.email) {
      setError('Please fill all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (form.occupied > form.capacity) {
      setError('Occupied space cannot exceed total capacity');
      return;
    }

    onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 800 }}>
        <div className="modal-box-header">
          <i className="bi bi-building" style={{ color: 'var(--primary)' }}></i>
          {warehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-box-body">
            {error && (
              <div className="alert-v danger mb-3">
                <i className="bi bi-exclamation-circle"></i> {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="form-section-title mb-2">
              <i className="bi bi-building"></i> Basic Information
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Warehouse Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Main Distribution Center"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Warehouse Code *</label>
                <input
                  className="form-control"
                  placeholder="e.g. MDC-DEL"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Type *</label>
                <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Location */}
            <div className="form-section-title mb-2">
              <i className="bi bi-geo-alt"></i> Location Details
            </div>
            <div className="row g-3 mb-3">
              <div className="col-12">
                <label className="form-label">Address *</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Full address"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                ></textarea>
              </div>
              <div className="col-md-4">
                <label className="form-label">City *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Mumbai"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">State *</label>
                <select className="form-select" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required>
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Pincode *</label>
                <input
                  className="form-control"
                  placeholder="e.g. 400001"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Manager Info */}
            <div className="form-section-title mb-2">
              <i className="bi bi-person-circle"></i> Manager Information
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label">Manager Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Rajesh Kumar"
                  value={form.manager}
                  onChange={(e) => setForm({ ...form, manager: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Phone *</label>
                <input
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Email *</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="manager@ehnone.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Capacity */}
            <div className="form-section-title mb-2">
              <i className="bi bi-pie-chart"></i> Capacity Information
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Total Capacity (sq.ft) *</label>
                <input
                  className="form-control"
                  type="number"
                  min="1000"
                  step="100"
                  placeholder="e.g. 50000"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Occupied Space (sq.ft)</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g. 35000"
                  value={form.occupied}
                  onChange={(e) => setForm({ ...form, occupied: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="col-12">
                <div className="alert-v info" style={{ fontSize: '0.85rem', padding: '10px 16px' }}>
                  <i className="bi bi-info-circle"></i> Available Space: {(form.capacity - form.occupied).toLocaleString()} sq.ft 
                  ({(((form.capacity - form.occupied) / form.capacity) * 100).toFixed(1)}% free)
                </div>
              </div>
            </div>
          </div>
          <div className="modal-box-footer">
            <button className="btn-v light" type="button" onClick={onClose}>Cancel</button>
            <button className="btn-v primary" type="submit">
              <i className="bi bi-check-circle"></i> {warehouse ? 'Update' : 'Create'} Warehouse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
