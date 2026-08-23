import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

/* WhatsApp Business API Configuration */
let whatsappConfig = {
  apiKey: 'EAAX71GdiWggBSVNQf5y7pT71r7SZCC7OU8UDLGvRiDZAABnlo7OAMtayZAsnj5BcTcH7BwPcN6DiJc2EsU3n0uzof31uINkUZBO6hb1kZAog5BElfQzBqZAXpshREnQmZAcVW8nnYe7vOyLajLRG7grw4QD3ivr0J5tQfbBxQDjPNYrR5JXqnw0SrSjI1t5EgIzgwZDZD',
  phoneNumberId: '1221104881094408',
  businessAccountId: '1376259457350653',
  webhookUrl: 'https://admin.kedvasshygieneproducts.com/api/webhooks/meta',
  isConfigured: true,
  verificationStatus: 'verified',
  connectedPhone: '+91 75665 37506 (EHN One)',
};

export const getWhatsAppConfig = () => whatsappConfig;
export const setWhatsAppConfig = (config) => { whatsappConfig = config; };

export default function Automations() {
  const { can } = useAuth();
  
  // Permanent Storage Persistence Hook
  const [reminders, setReminders] = useState(() => {
    try {
      const saved = localStorage.getItem('ehn_scheduled_reminders');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return [];
  });

  const [search, setSearch] = useState('');
  
  // Reminder Form State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'meeting',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    frequency: 'one_time',
    phone: '',
    message: '',
  });

  // Helper to update both React State and localStorage permanently
  const saveRemindersToStorage = (newReminders) => {
    setReminders(newReminders);
    try {
      localStorage.setItem('ehn_scheduled_reminders', JSON.stringify(newReminders));
    } catch (e) {}
  };

  // Auto-Runner: Checks for due scheduled reminders every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHHMM = now.toTimeString().substring(0, 5);

      setReminders((currentReminders) => {
        let updated = false;
        const newReminders = currentReminders.map((r) => {
          if (!r.enabled) return r;
          
          const isDateDue = (r.frequency === 'daily') || (r.date === todayStr);
          const isTimeDue = (r.time === currentHHMM);
          const lastSentToday = r.lastSent === todayStr;

          if (isDateDue && isTimeDue && !lastSentToday) {
            handleSendWhatsAppNow(r);
            updated = true;
            return { ...r, lastSent: todayStr };
          }
          return r;
        });

        if (updated) {
          try {
            localStorage.setItem('ehn_scheduled_reminders', JSON.stringify(newReminders));
          } catch (e) {}
          return newReminders;
        }
        return currentReminders;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (editTask) {
      setTaskForm({
        title: editTask.title || '',
        category: editTask.category || 'meeting',
        date: editTask.date || new Date().toISOString().split('T')[0],
        time: editTask.time || '14:00',
        frequency: editTask.frequency || 'one_time',
        phone: editTask.phone || '',
        message: editTask.message || '',
      });
    } else {
      setTaskForm({
        title: '',
        category: 'meeting',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        frequency: 'one_time',
        phone: '',
        message: 'Namaste,\nThis is a friendly reminder for your scheduled meeting/event.\n\nThank you,\nEHN One Team',
      });
    }
  }, [editTask, showTaskModal]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredReminders = reminders.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.title.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
  });

  const paginatedReminders = filteredReminders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const stats = {
    total: reminders.length,
    active: reminders.filter(r => r.enabled).length,
    sentToday: reminders.filter(r => r.lastSent).length,
  };

  const getCategoryBadge = (cat) => {
    const map = {
      meeting: { color: 'primary', icon: 'bi-calendar-event', label: 'Meeting' },
      call: { color: 'info', icon: 'bi-telephone', label: 'Call Follow-up' },
      stock_alert: { color: 'warning', icon: 'bi-box-seam', label: 'Stock Alert' },
      payment_followup: { color: 'danger', icon: 'bi-cash-coin', label: 'Payment Follow-up' },
      custom: { color: 'secondary', icon: 'bi-alarm', label: 'Custom Reminder' },
    };
    const c = map[cat] || map.custom;
    return <span className={`badge-v ${c.color}`} style={{ fontSize: '0.72rem' }}><i className={`bi ${c.icon} me-1`}></i> {c.label}</span>;
  };

  const handleToggleTask = (id) => {
    const updated = reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    saveRemindersToStorage(updated);
  };

  const handleDeleteTask = (id) => {
    if (window.confirm('Delete this scheduled reminder?')) {
      const updated = reminders.filter(r => r.id !== id);
      saveRemindersToStorage(updated);
    }
  };

  const handleSendWhatsAppNow = async (task) => {
    const cleanPhone = (task.phone || '').replace(/[^\d]/g, '');
    if (!cleanPhone) {
      alert('Please provide a valid recipient phone number.');
      return;
    }
    const encodedMsg = encodeURIComponent(task.message || '');
    const waWebUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings/send-whatsapp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ phone: cleanPhone, message: task.message }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ WhatsApp Alert Sent Successfully via Meta Cloud API!\n\nRecipient: +${cleanPhone}`);
      } else {
        window.open(waWebUrl, '_blank');
      }
    } catch (e) {
      window.open(waWebUrl, '_blank');
    }
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      alert('Please enter a reminder title.');
      return;
    }
    if (!taskForm.phone.trim()) {
      alert('Please enter a mobile number.');
      return;
    }

    if (editTask) {
      const updated = reminders.map(r => r.id === editTask.id ? { ...r, ...taskForm } : r);
      saveRemindersToStorage(updated);
    } else {
      const newTask = {
        id: `REM-${Date.now()}`,
        ...taskForm,
        enabled: true,
        lastSent: null,
      };
      const updated = [newTask, ...reminders];
      saveRemindersToStorage(updated);
    }
    setShowTaskModal(false);
    setEditTask(null);
  };

  if (!can('settings.view')) {
    return (
      <div className="empty-state-v" style={{ paddingTop: 80 }}>
        <i className="bi bi-shield-x" style={{ color: 'var(--danger)' }}></i>
        <h5>Access Denied</h5>
        <p>You don't have permission to access automations register.</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Clean Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold text-dark" style={{ letterSpacing: '-0.3px' }}>WhatsApp Reminders & Automation</h4>
          <p className="text-muted small mb-0">Schedule automated WhatsApp messages for meetings, calls, daily stock alerts & payment follow-ups</p>
        </div>
        <button className="btn btn-success btn-sm fw-semibold rounded-pill px-3 shadow-sm" onClick={() => { setEditTask(null); setShowTaskModal(true); }} style={{ background: '#4CAF50', border: 'none' }}>
          <i className="bi bi-plus-lg me-1"></i> Schedule New Reminder
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-4 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL SCHEDULED REMINDERS</div>
            <div className="tally-stat-value text-primary">{stats.total}</div>
            <div className="tally-stat-sub text-muted">Permanently Saved</div>
          </div>
        </div>
        <div className="col-xl-4 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">ACTIVE LIVE REMINDERS</div>
            <div className="tally-stat-value text-success">{stats.active}</div>
            <div className="tally-stat-sub text-muted">Ready to Dispatch</div>
          </div>
        </div>
        <div className="col-xl-4 col-sm-12">
          <div className="tally-stat-card">
            <div className="tally-stat-label">WHATSAPP SENDER NUMBER</div>
            <div className="tally-stat-value text-success" style={{ fontSize: '1.1rem' }}>
              <i className="bi bi-whatsapp me-1" style={{ color: '#25D366' }}></i> {whatsappConfig.connectedPhone}
            </div>
            <div className="tally-stat-sub text-muted">Connected Business Channel</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="v-card mb-3">
        <div className="v-card-body p-2">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <div className="search-box-v flex-grow-1">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search reminders by title or phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="badge-v secondary fw-bold" style={{ fontSize: '0.75rem' }}>
              {filteredReminders.length} REMINDERS
            </span>
          </div>
        </div>
      </div>

      {/* Scheduled Reminders Register Table */}
      <div className="v-card">
        <div className="v-card-header d-flex justify-content-between align-items-center" style={{ background: '#f4fbf5', borderRadius: '12px 12px 0 0' }}>
          <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>
            <i className="bi bi-alarm me-2" style={{ color: '#1E4D2B' }}></i>
            SCHEDULED REMINDERS REGISTER
          </span>
          <span className="badge px-2.5 py-1" style={{ background: '#DAF2DB', color: '#1E4D2B', fontWeight: 600 }}>EHN ONE</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {filteredReminders.length === 0 ? (
            <div className="p-5 text-center bg-white" style={{ borderRadius: '0 0 12px 12px' }}>
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm" style={{ width: 56, height: 56, background: '#DAF2DB', color: '#1E4D2B' }}>
                <i className="bi bi-alarm-fill" style={{ fontSize: '1.75rem', color: '#4CAF50' }}></i>
              </div>
              <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem' }}>No Reminders Scheduled Yet</h5>
              <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: 420 }}>
                Click "+ Schedule New Reminder" to set up your first meeting, call, or daily stock alert.
              </p>
              <button 
                className="btn btn-success btn-sm fw-semibold rounded-pill px-3.5 py-1.5 shadow-sm d-inline-flex align-items-center gap-1" 
                style={{ background: '#4CAF50', border: 'none', fontSize: '0.82rem' }}
                onClick={() => { setEditTask(null); setShowTaskModal(true); }}
              >
                <i className="bi bi-plus-lg"></i> Schedule Reminder
              </button>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>REMINDER TITLE & MESSAGE</th>
                  <th>CATEGORY</th>
                  <th>SCHEDULED DATE & TIME</th>
                  <th>REPEAT FREQUENCY</th>
                  <th>WHATSAPP NUMBER</th>
                  <th>STATUS</th>
                  <th className="text-end" style={{ width: 140 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReminders.map((r, i) => (
                  <tr key={r.id}>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                      {(currentPage - 1) * pageSize + i + 1}
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{r.title}</div>
                      <small className="text-muted text-truncate d-block" style={{ fontSize: '0.72rem', maxWidth: 280 }}>{r.message.replace(/\n/g, ' ')}</small>
                    </td>
                    <td>{getCategoryBadge(r.category)}</td>
                    <td>
                      <div className="fw-semibold text-dark" style={{ fontSize: '0.82rem' }}>
                        <i className="bi bi-calendar3 me-1 text-primary"></i> {r.date}
                      </div>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-clock me-1 text-success"></i> {r.time} hrs
                      </small>
                    </td>
                    <td>
                      <span className="badge-v secondary text-uppercase">
                        {r.frequency === 'daily' ? '🔄 Daily' : r.frequency === 'weekly' ? '🔁 Weekly' : '📍 One-Time'}
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold text-success" style={{ fontSize: '0.82rem' }}>
                        <i className="bi bi-whatsapp me-1"></i> {r.phone}
                      </span>
                    </td>
                    <td>
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input style-cursor"
                          type="checkbox"
                          checked={r.enabled}
                          onChange={() => handleToggleTask(r.id)}
                          title={r.enabled ? 'Turn Off Reminder' : 'Turn On Reminder'}
                        />
                        <span className={`badge-v ${r.enabled ? 'success' : 'secondary'} ms-1`} style={{ fontSize: '0.68rem' }}>
                          {r.enabled ? 'ACTIVE' : 'OFF'}
                        </span>
                      </div>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button className="btn-v outline-success btn-sm px-2" onClick={() => handleSendWhatsAppNow(r)} title="Send Test Message Now">
                          <i className="bi bi-send"></i>
                        </button>
                        <button className="btn-v outline-primary btn-sm px-2" onClick={() => { setEditTask(r); setShowTaskModal(true); }} title="Edit Reminder">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn-v outline-danger btn-sm px-2" onClick={() => handleDeleteTask(r.id)} title="Delete Reminder">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {filteredReminders.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredReminders.length}
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

      {/* Simple Clean Non-Technical Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTaskModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 580 }}>
            <div className="modal-box-header d-flex align-items-center justify-content-between" style={{ background: '#f4fbf5', borderRadius: '12px 12px 0 0' }}>
              <span className="fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
                <i className="bi bi-whatsapp text-success" style={{ fontSize: '1.1rem' }}></i>
                {editTask ? 'Edit WhatsApp Reminder' : 'Schedule New WhatsApp Reminder'}
              </span>
              <button className="close-btn" onClick={() => setShowTaskModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <form onSubmit={handleSaveTask}>
              <div className="modal-box-body p-3">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Reminder Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Thursday Supplier Meeting, Daily 2 PM Stock Alert"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Category</label>
                    <select
                      className="form-select"
                      value={taskForm.category}
                      onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    >
                      <option value="meeting">🗓️ Meeting Schedule</option>
                      <option value="call">📞 Call Follow-up</option>
                      <option value="stock_alert">📦 Daily Stock Alert</option>
                      <option value="payment_followup">💰 Payment Dues Follow-up</option>
                      <option value="custom">⏰ Custom Reminder</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Repeat Frequency</label>
                    <select
                      className="form-select"
                      value={taskForm.frequency}
                      onChange={(e) => setTaskForm({ ...taskForm, frequency: e.target.value })}
                    >
                      <option value="one_time">📍 One-Time Event</option>
                      <option value="daily">🔄 Daily (Everyday at set time)</option>
                      <option value="weekly">🔁 Weekly (Every week)</option>
                    </select>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={taskForm.date}
                      onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Time (24h)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={taskForm.time}
                      onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">WhatsApp Mobile Number <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. +91 98765 43210"
                    value={taskForm.phone}
                    onChange={(e) => setTaskForm({ ...taskForm, phone: e.target.value })}
                    required
                  />
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>Include country code (e.g. +91 for India)</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Message Text</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={taskForm.message}
                    onChange={(e) => setTaskForm({ ...taskForm, message: e.target.value })}
                    placeholder="Enter plain text message to send on WhatsApp..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-box-footer d-flex justify-content-between align-items-center">
                <button type="button" className="btn-v outline-success btn-sm" onClick={() => handleSendWhatsAppNow(taskForm)}>
                  <i className="bi bi-send me-1"></i> Send Test Message Now
                </button>
                <div className="d-flex gap-2">
                  <button type="button" className="btn-v outline-secondary btn-sm" onClick={() => setShowTaskModal(false)}>Cancel</button>
                  <button type="submit" className="btn-v primary btn-sm">Save Reminder</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
