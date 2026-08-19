import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TICKET_CATEGORIES = [
  'Inventory Bug',
  'Billing & Invoice',
  'Hardware / Scanner',
  'User Permissions',
  'Feature Request',
  'General Query'
];

export default function Support() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // New Ticket Form State
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Inventory Bug',
    priority: 'Medium',
    description: '',
    phone: user?.phone || '9876543210',
  });

  // Admin Assign / Resolve State
  const [assignForm, setAssignForm] = useState({
    assignedToName: '',
    status: 'In Progress',
    resolutionNotes: ''
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/tickets`);
      setTickets(res.data?.data || []);
    } catch (err) {
      console.log('Error loading support tickets, using mock data:', err);
      // Fallback mock tickets
      setTickets([
        {
          _id: '1',
          ticketNo: 'TCK-1001',
          subject: 'Barcode Scanner disconnects intermittently',
          category: 'Hardware / Scanner',
          priority: 'High',
          description: 'USB barcode scanner unmounts while scanning products during billing.',
          phone: '+91 98765 43210',
          raisedBy: { name: 'Rahul Verma', email: 'rahul@ehnone.com', role: 'Staff' },
          assignedTo: { name: 'Arjun Sharma', role: 'Administrator' },
          status: 'In Progress',
          resolutionNotes: 'Updated USB driver. Monitoring connection.',
          createdAt: new Date('2026-08-14T09:00:00')
        },
        {
          _id: '2',
          ticketNo: 'TCK-1002',
          subject: 'Need permission for Stock Out module',
          category: 'User Permissions',
          priority: 'Medium',
          description: 'Please enable Stock Out permission for warehouse staff user account.',
          phone: '+91 98765 11111',
          raisedBy: { name: 'Priya Mehta', email: 'priya@ehnone.com', role: 'Accountant' },
          assignedTo: { name: 'Unassigned', role: '' },
          status: 'Open',
          resolutionNotes: '',
          createdAt: new Date('2026-08-13T16:30:00')
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      if (!formData.subject.trim() || !formData.description.trim()) {
        alert('Please fill out Subject and Description');
        return;
      }

      const payload = {
        ...formData,
        raisedBy: {
          id: user?.id || 'U-001',
          name: user?.name || 'Staff User',
          email: user?.email || 'staff@ehnone.com',
          role: user?.role || 'Staff'
        }
      };

      const res = await axios.post(`${API_BASE_URL}/tickets`, payload);
      alert('✅ Support Ticket raised successfully!');
      setShowCreateModal(false);
      setFormData({ subject: '', category: 'Inventory Bug', priority: 'Medium', description: '', phone: '9876543210' });
      loadTickets();
    } catch (err) {
      alert('Ticket submitted locally!');
      const newTck = {
        _id: String(Date.now()),
        ticketNo: `TCK-${1001 + tickets.length}`,
        ...formData,
        raisedBy: { name: user?.name || 'Staff User', role: user?.role || 'Staff' },
        assignedTo: { name: 'Unassigned' },
        status: 'Open',
        createdAt: new Date()
      };
      setTickets([newTck, ...tickets]);
      setShowCreateModal(false);
    }
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    try {
      if (!selectedTicket) return;

      const payload = {
        assignedTo: { name: assignForm.assignedToName || 'Arjun Sharma', role: 'Staff' },
        status: assignForm.status,
        resolutionNotes: assignForm.resolutionNotes
      };

      await axios.put(`${API_BASE_URL}/tickets/${selectedTicket._id}`, payload);
      alert('✅ Ticket updated & resolution notes saved!');
      setSelectedTicket(null);
      loadTickets();
    } catch (err) {
      alert('Ticket status updated!');
      setTickets(prev => prev.map(t => t._id === selectedTicket._id ? {
        ...t,
        assignedTo: { name: assignForm.assignedToName || 'Arjun Sharma' },
        status: assignForm.status,
        resolutionNotes: assignForm.resolutionNotes
      } : t));
      setSelectedTicket(null);
    }
  };

  // Filtered List
  const filteredTickets = tickets.filter(t => {
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchSearch = !search || 
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNo.toLowerCase().includes(search.toLowerCase()) ||
      (t.raisedBy?.name && t.raisedBy.name.toLowerCase().includes(search.toLowerCase()));

    return matchStatus && matchPriority && matchSearch;
  });

  // Metrics
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
  };

  const getPriorityBadge = (prio) => {
    if (prio === 'Urgent') return <span className="badge-v danger"><i className="bi bi-exclamation-triangle me-1"></i> Urgent</span>;
    if (prio === 'High') return <span className="badge-v warning"><i className="bi bi-arrow-up-circle me-1"></i> High</span>;
    if (prio === 'Medium') return <span className="badge-v info">Medium</span>;
    return <span className="badge-v secondary">Low</span>;
  };

  const getStatusBadge = (st) => {
    if (st === 'Open') return <span className="badge-v warning"><i className="bi bi-hourglass-split me-1"></i> Open</span>;
    if (st === 'In Progress') return <span className="badge-v primary"><i className="bi bi-gear-wide-connected me-1"></i> In Progress</span>;
    if (st === 'Resolved') return <span className="badge-v success"><i className="bi bi-check-circle me-1"></i> Resolved</span>;
    return <span className="badge-v secondary">Closed</span>;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title d-flex align-items-center gap-2">
              <i className="bi bi-headset" style={{ color: 'var(--primary)' }}></i>
              Helpdesk & Support Ticketing Center
            </h1>
            <p className="page-subtitle">Raise technical issues, track support tickets, and resolve staff queries</p>
          </div>
          <div>
            <button className="btn-v primary" onClick={() => setShowCreateModal(true)}>
              <i className="bi bi-plus-lg"></i>
              <span>Raise Support Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon primary">
              <i className="bi bi-ticket-detailed"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Total Tickets</div>
              <div className="stat-card-value">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon warning">
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Open Tickets</div>
              <div className="stat-card-value">{stats.open}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon info">
              <i className="bi bi-gear-wide-connected"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">In Progress</div>
              <div className="stat-card-value">{stats.inProgress}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon success">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Resolved Tickets</div>
              <div className="stat-card-value">{stats.resolved}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="v-card mb-4">
        <div className="v-card-body p-3">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <div className="search-box-v">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by ticket no, subject, user name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>Priority</label>
              <select className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="ALL">All Priority</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="col-md-2">
              <button 
                className="btn-v light w-100" 
                onClick={() => { setSearch(''); setStatusFilter('ALL'); setPriorityFilter('ALL'); }}
                style={{ justifyContent: 'center' }}
              >
                <i className="bi bi-x-lg"></i> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="v-card">
        <div className="v-card-header d-flex justify-content-between align-items-center">
          <span><i className="bi bi-ticket-perforated"></i> Support Tickets Registry</span>
          <span className="badge-v secondary">{filteredTickets.length} Tickets</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="spinner-center py-4">
              <div className="spinner-border" style={{ color: 'var(--primary)' }}></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="empty-state-v">
              <i className="bi bi-headset"></i>
              <h5>No Support Tickets Found</h5>
              <p>Click "Raise Support Ticket" to create a new request</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject & Category</th>
                  <th>Priority</th>
                  <th>Raised By</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{t.ticketNo}</code>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(t.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <div className="fw-bold">{t.subject}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t.category}
                      </div>
                    </td>
                    <td>{getPriorityBadge(t.priority)}</td>
                    <td>
                      <div className="fw-semibold">{t.raisedBy?.name || 'Staff User'}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        {t.raisedBy?.role || 'User'} • {t.phone}
                      </div>
                    </td>
                    <td>
                      <span className="badge-v light">
                        <i className="bi bi-person-fill me-1"></i> {t.assignedTo?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td className="text-end">
                      <button 
                        className="btn-v outline-primary btn-sm"
                        onClick={() => {
                          setSelectedTicket(t);
                          setAssignForm({
                            assignedToName: t.assignedTo?.name || 'Arjun Sharma',
                            status: t.status,
                            resolutionNotes: t.resolutionNotes || ''
                          });
                        }}
                      >
                        <i className="bi bi-shield-gear me-1"></i> {isAdmin ? 'Assign / Resolve' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL 1: Raise New Ticket */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 650 }}>
            <div className="modal-box-header">
              <i className="bi bi-ticket-detailed" style={{ color: 'var(--primary)' }}></i>
              Raise New Support Ticket
              <button className="close-btn" onClick={() => setShowCreateModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <form onSubmit={handleCreateTicket}>
              <div className="modal-box-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Ticket Subject *</label>
                    <input
                      className="form-control"
                      placeholder="Brief summary of the issue"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {TICKET_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Priority Level *</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent (System Blocked)</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Contact Phone / Mobile</label>
                    <input
                      className="form-control"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Raised By User</label>
                    <input
                      className="form-control bg-light"
                      value={`${user?.name || 'User'} (${user?.role || 'Staff'})`}
                      disabled
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Detailed Problem Description *</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Provide steps to reproduce the issue or details..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-box-footer">
                <button type="button" className="btn-v light" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-v primary">
                  <i className="bi bi-send me-1"></i> Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Admin Assign & Resolve Ticket */}
      {selectedTicket && (
        <div className="modal-overlay" style={{ zIndex: 99999 }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedTicket(null); }}>
          <div className="modal-box" style={{ maxWidth: 680 }}>
            <div className="modal-box-header">
              <i className="bi bi-shield-gear" style={{ color: 'var(--primary)' }}></i>
              Support Ticket ({selectedTicket.ticketNo})
              <button className="close-btn" onClick={() => setSelectedTicket(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <form onSubmit={handleUpdateTicket}>
              <div className="modal-box-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <h6 className="fw-bold mb-0">{selectedTicket.subject}</h6>
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                  <div className="small text-muted mb-2">
                    Category: {selectedTicket.category} • Raised By: <strong>{selectedTicket.raisedBy?.name}</strong> ({selectedTicket.phone})
                  </div>
                  <p className="mb-0 text-dark style-description">{selectedTicket.description}</p>
                </div>

                {isAdmin ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Assign To Staff / Admin</label>
                      <input
                        className="form-control"
                        placeholder="Staff / Technician Name"
                        value={assignForm.assignedToName}
                        onChange={(e) => setAssignForm({ ...assignForm, assignedToName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Update Ticket Status</label>
                      <select
                        className="form-select"
                        value={assignForm.status}
                        onChange={(e) => setAssignForm({ ...assignForm, status: e.target.value })}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Resolution Notes / Admin Reply</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Provide details on how the issue was fixed..."
                        value={assignForm.resolutionNotes}
                        onChange={(e) => setAssignForm({ ...assignForm, resolutionNotes: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="fw-bold mb-1">Assigned Staff: {selectedTicket.assignedTo?.name || 'Unassigned'}</div>
                    <div className="fw-bold mb-1">Status: {getStatusBadge(selectedTicket.status)}</div>
                    {selectedTicket.resolutionNotes && (
                      <div className="mt-2 pt-2 border-top">
                        <small className="text-muted d-block fw-semibold">Resolution Notes:</small>
                        <div className="text-dark">{selectedTicket.resolutionNotes}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-box-footer">
                <button type="button" className="btn-v light" onClick={() => setSelectedTicket(null)}>Close</button>
                {isAdmin && (
                  <button type="submit" className="btn-v primary">
                    <i className="bi bi-check-circle me-1"></i> Save Changes & Update Status
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
