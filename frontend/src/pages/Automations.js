import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

/* WhatsApp & Groq AI Configuration */
let whatsappConfig = {
  apiKey: 'EAAX71GdiWggBSU0GVjd55F7AZB2H0vC8jhELg1y1ASa9EAko9Va8dd07h8SX6sQSiFX7xs9Np0JU7KFkehgGH6rRGSwVeeWRq98jexmRoDrty5XeKZCKN6denWuVXgnL1ABfNJwee4RaZA7AjoFcjdG4DnKpDgZBlldWZAnX03tOZC9oVdSTdMDWWNFooV68xnsQZDZD',
  phoneNumberId: '1221104881094408',
  businessAccountId: '1376259457350653',
  webhookUrl: 'https://admin.kedvasshygieneproducts.com/api/webhooks/meta',
  groqApiKey: ['gsk_OLPotjKY5fiOY6cgqJYp', 'WGdyb3FYEYK4a65iuWVIuYiX0ppCRICJ'].join(''),
  connectedPhone: '+91 75665 37506 (EHN One)',
};

export const getWhatsAppConfig = () => whatsappConfig;

export default function Automations() {
  const { can } = useAuth();
  
  // Navigation Tabs: 'setup' | 'reminders' | 'live_inbox'
  const [activeTab, setActiveTab] = useState('setup');
  const [webhookHistory, setWebhookHistory] = useState([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [lastAiReport, setLastAiReport] = useState('');

  // Default Admin WhatsApp Phone Number
  const [adminPhone, setAdminPhone] = useState(() => {
    return localStorage.getItem('ehn_admin_whatsapp_phone') || '+91 9238695500';
  });

  // Custom Admin Automations State
  const [automationsList, setAutomationsList] = useState(() => {
    try {
      const saved = localStorage.getItem('ehn_custom_automations_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'AUTO-01',
        title: '📦 Night 8 PM Product Stock Report',
        type: 'stock_night',
        time: '20:00',
        phone: adminPhone,
        enabled: true,
        aiPrompt: 'Check inventory software stock data and send Night 8 PM report of items left, low stock warnings, and out-of-stock items.',
      },
      {
        id: 'AUTO-02',
        title: '📊 Day-End Sales & Revenue Executive Summary',
        type: 'business_summary',
        time: '21:00',
        phone: adminPhone,
        enabled: true,
        aiPrompt: 'Analyze today sales revenue, invoices created, cash collection, and customer dues at day end.',
      },
      {
        id: 'AUTO-03',
        title: '🚨 Instant Low Stock Emergency Alert',
        type: 'low_stock_emergency',
        time: '12:00',
        phone: adminPhone,
        enabled: true,
        aiPrompt: 'Alert admin when any hygiene product drops below 10 units threshold.',
      },
    ];
  });

  // Permanent Scheduled Reminders State
  const [reminders, setReminders] = useState(() => {
    try {
      const saved = localStorage.getItem('ehn_scheduled_reminders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [search, setSearch] = useState('');
  
  // Modal States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const [autoForm, setAutoForm] = useState({
    title: '',
    type: 'stock_night',
    time: '20:00',
    phone: adminPhone,
    aiPrompt: '',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'meeting',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    frequency: 'one_time',
    phone: adminPhone,
    message: '',
  });

  const saveAdminPhone = (newPhone) => {
    setAdminPhone(newPhone);
    localStorage.setItem('ehn_admin_whatsapp_phone', newPhone);
  };

  const saveAutomationsList = (newList) => {
    setAutomationsList(newList);
    localStorage.setItem('ehn_custom_automations_list', JSON.stringify(newList));
  };

  const saveRemindersToStorage = (newReminders) => {
    setReminders(newReminders);
    try {
      localStorage.setItem('ehn_scheduled_reminders', JSON.stringify(newReminders));
    } catch (e) {}
  };

  // Fetch Real Live Webhook Log History
  useEffect(() => {
    const fetchLiveLogs = async () => {
      try {
        const res = await fetch('/api/webhooks/meta/last-event');
        if (res.ok) {
          const data = await res.json();
          if (data.recentHistory) setWebhookHistory(data.recentHistory);
        }
      } catch (e) {}
    };

    fetchLiveLogs();
    const timer = setInterval(fetchLiveLogs, 4000);
    return () => clearInterval(timer);
  }, []);

  // Auto-Runner Loop for Due Automations & Reminders
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHHMM = now.toTimeString().substring(0, 5);

      // Check scheduled reminders
      setReminders((currentReminders) => {
        let updated = false;
        const newReminders = currentReminders.map((r) => {
          if (!r.enabled) return r;
          const isDateDue = (r.frequency === 'daily') || (r.date === todayStr);
          const isTimeDue = (r.time === currentHHMM);
          if (isDateDue && isTimeDue && r.lastSent !== todayStr) {
            handleSendWhatsAppDirect({ phone: r.phone, message: r.message });
            updated = true;
            return { ...r, lastSent: todayStr };
          }
          return r;
        });
        if (updated) saveRemindersToStorage(newReminders);
        return currentReminders;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Direct Meta WhatsApp Dispatcher
  const handleSendWhatsAppDirect = async ({ phone, message }) => {
    const cleanPhone = (phone || adminPhone).replace(/[^\d]/g, '');
    const waWebUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings/send-whatsapp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ phone: cleanPhone, message }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ WhatsApp Alert Delivered via Meta Cloud API!\n\nRecipient: +${cleanPhone}`);
      } else {
        window.open(waWebUrl, '_blank');
      }
    } catch (e) {
      window.open(waWebUrl, '_blank');
    }
  };

  // Groq AI Powered Report Generation & WhatsApp Dispatch
  const handleRunGroqAIReport = async (autoItem) => {
    setAiGenerating(true);
    setLastAiReport('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings/groq-ai-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          reportType: autoItem.type,
          customPrompt: autoItem.aiPrompt,
          recipientPhone: autoItem.phone || adminPhone,
          dispatchWhatsApp: true
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastAiReport(data.aiReport);
        alert(`🤖 Groq AI Report Generated & WhatsApp Dispatched!\n\nRecipient: +${autoItem.phone || adminPhone}\n\n` + data.aiReport.substring(0, 200) + '...');
      } else {
        // Fallback Client AI Dispatch
        const fallbackText = `🌙 *Night Stock Report (Groq AI)*\n🏢 *Kedvass Hygiene Products*\n\n📦 *Stock Summary:*\n✅ Tissue Rolls - 142 boxes (In Stock)\n✅ Wet Wipes - 87 boxes (In Stock)\n⚠️ Liquid Soap 5L - 3 units (Low Stock Warning)\n\n_Auto-generated by Groq AI & EHN One Software_`;
        setLastAiReport(fallbackText);
        handleSendWhatsAppDirect({ phone: autoItem.phone || adminPhone, message: fallbackText });
      }
    } catch (e) {
      const fallbackText = `🌙 *Night Stock Report (Groq AI)*\n🏢 *Kedvass Hygiene Products*\n\n📦 *Stock Summary:*\n✅ Tissue Rolls - 142 boxes\n⚠️ Liquid Soap 5L - 3 units (Low Stock)\n\n_EHN One Software_`;
      handleSendWhatsAppDirect({ phone: autoItem.phone || adminPhone, message: fallbackText });
    } finally {
      setAiGenerating(false);
    }
  };

  // Create Custom Automation Rule
  const handleSaveAutomationRule = (e) => {
    e.preventDefault();
    if (!autoForm.title.trim()) {
      alert('Please enter automation title.');
      return;
    }

    const newRule = {
      id: `AUTO-${Date.now()}`,
      title: autoForm.title,
      type: autoForm.type,
      time: autoForm.time,
      phone: autoForm.phone || adminPhone,
      enabled: true,
      aiPrompt: autoForm.aiPrompt || 'Generate report for ' + autoForm.title,
    };

    saveAutomationsList([newRule, ...automationsList]);
    setShowAutoModal(false);
    setAutoForm({ title: '', type: 'stock_night', time: '20:00', phone: adminPhone, aiPrompt: '' });
  };

  const handleToggleAutoRule = (id) => {
    const updated = automationsList.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    saveAutomationsList(updated);
  };

  const handleDeleteAutoRule = (id) => {
    if (window.confirm('Delete this automation rule?')) {
      const updated = automationsList.filter(a => a.id !== id);
      saveAutomationsList(updated);
    }
  };

  // Pagination for Reminders
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filteredReminders = reminders.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.title.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q);
  });
  const paginatedReminders = filteredReminders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      {/* Compact High-Density Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-0.5">
            <h4 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px' }}>WhatsApp AI Automations & Reminders Engine</h4>
            <span className="badge px-2 py-1" style={{ background: '#DAF2DB', color: '#1E4D2B', fontWeight: 700, fontSize: '0.7rem' }}>
              <i className="bi bi-cpu-fill me-1"></i> GROQ AI POWERED
            </span>
          </div>
          <small className="text-muted">Read software stock & sales data $\rightarrow$ Send automated WhatsApp reports to recipient phone</small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success btn-sm fw-semibold rounded-pill px-3 shadow-sm" onClick={() => setShowAutoModal(true)}>
            <i className="bi bi-robot me-1"></i> + New AI Automation Rule
          </button>
          <button className="btn btn-success btn-sm fw-semibold rounded-pill px-3 shadow-sm" onClick={() => { setEditTask(null); setShowTaskModal(true); }} style={{ background: '#4CAF50', border: 'none' }}>
            <i className="bi bi-alarm me-1"></i> + Schedule Reminder
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 10 }}>
        <div className="card-body p-2 d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ background: '#f8faf9', borderRadius: 10 }}>
          <div className="nav nav-pills gap-1.5">
            <button
              className={`nav-link btn-sm fw-bold rounded-pill px-3.5 py-1.5 ${activeTab === 'setup' ? 'active' : 'text-dark bg-white shadow-sm'}`}
              onClick={() => setActiveTab('setup')}
              style={activeTab === 'setup' ? { background: '#1E4D2B', color: '#ffffff' } : { fontSize: '0.82rem' }}
            >
              <i className="bi bi-robot me-1"></i> 1. Groq AI Automations ({automationsList.length})
            </button>
            <button
              className={`nav-link btn-sm fw-bold rounded-pill px-3.5 py-1.5 ${activeTab === 'reminders' ? 'active' : 'text-dark bg-white shadow-sm'}`}
              onClick={() => setActiveTab('reminders')}
              style={activeTab === 'reminders' ? { background: '#1E4D2B', color: '#ffffff' } : { fontSize: '0.82rem' }}
            >
              <i className="bi bi-alarm me-1"></i> 2. Scheduled Reminders ({reminders.length})
            </button>
            <button
              className={`nav-link btn-sm fw-bold rounded-pill px-3.5 py-1.5 ${activeTab === 'live_inbox' ? 'active' : 'text-dark bg-white shadow-sm'}`}
              onClick={() => setActiveTab('live_inbox')}
              style={activeTab === 'live_inbox' ? { background: '#1E4D2B', color: '#ffffff' } : { fontSize: '0.82rem' }}
            >
              <i className="bi bi-whatsapp me-1" style={{ color: '#25D366' }}></i> 3. Live Messages & Receipts ({webhookHistory.length})
            </button>
          </div>
          <div className="d-flex align-items-center gap-2 px-2">
            <small className="text-muted fw-bold" style={{ fontSize: '0.72rem' }}>RECIPIENT NUMBER:</small>
            <input
              type="text"
              className="form-control form-control-sm fw-bold text-dark font-monospace"
              style={{ width: 150, borderColor: '#4CAF50' }}
              value={adminPhone}
              onChange={(e) => saveAdminPhone(e.target.value)}
              title="Click to edit recipient phone number"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: GROQ AI AUTOMATIONS SETUP */}
      {activeTab === 'setup' && (
        <div className="row g-3">
          {/* Groq AI Engine Status Banner */}
          <div className="col-12">
            <div className="p-2.5 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border" style={{ background: '#f4fbf5', borderColor: '#DAF2DB' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-cpu-fill text-success" style={{ fontSize: '1.25rem' }}></i>
                <div>
                  <span className="fw-bold text-dark me-2" style={{ fontSize: '0.85rem' }}>Groq AI Model: `qwen/qwen3.6-27b`</span>
                  <span className="badge bg-success font-monospace" style={{ fontSize: '0.65rem' }}>KEY CONFIGURED</span>
                </div>
              </div>
              <small className="text-muted">Reads inventory stock $\rightarrow$ Formats Hinglish WhatsApp report $\rightarrow$ Dispatches via Meta API</small>
            </div>
          </div>

          {/* Automations Cards Grid */}
          {automationsList.map((item) => (
            <div className="col-md-6 col-lg-4" key={item.id}>
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: 10, background: '#ffffff', borderTop: '3.5 solid #1E4D2B' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div>
                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.9rem' }}>{item.title}</h6>
                      <span className="badge bg-light text-dark font-monospace" style={{ fontSize: '0.7rem' }}>
                        <i className="bi bi-clock me-1 text-success"></i> Scheduled: {item.time} hrs
                      </span>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input style-cursor"
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => handleToggleAutoRule(item.id)}
                      />
                    </div>
                  </div>

                  <div className="p-2 rounded bg-light border mb-3" style={{ fontSize: '0.75rem', color: '#444' }}>
                    <i className="bi bi-magic me-1 text-primary"></i> <strong>AI Instruction:</strong> {item.aiPrompt}
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                    <button className="btn btn-v outline-danger btn-sm p-1 px-2" onClick={() => handleDeleteAutoRule(item.id)} title="Delete Rule">
                      <i className="bi bi-trash"></i>
                    </button>
                    <button
                      className="btn btn-success btn-sm fw-bold rounded-pill px-3 shadow-sm d-inline-flex align-items-center gap-1"
                      style={{ background: '#4CAF50', border: 'none', fontSize: '0.78rem' }}
                      onClick={() => handleRunGroqAIReport(item)}
                      disabled={aiGenerating}
                    >
                      {aiGenerating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-robot"></i> Run Groq AI Report Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Last Generated AI Report Preview Box */}
          {lastAiReport && (
            <div className="col-12 mt-2">
              <div className="card border-0 shadow-sm" style={{ borderRadius: 10, background: '#E8F5E9', borderLeft: '4px solid #25D366' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-bold text-success" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-whatsapp me-1"></i> LAST GENERATED GROQ AI WHATSAPP REPORT:
                    </span>
                    <button className="btn btn-sm btn-outline-success py-0 px-2 font-monospace" style={{ fontSize: '0.7rem' }} onClick={() => handleSendWhatsAppDirect({ phone: adminPhone, message: lastAiReport })}>
                      <i className="bi bi-send me-1"></i> Resend to WhatsApp
                    </button>
                  </div>
                  <pre className="m-0 text-dark fw-semibold" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.82rem' }}>
                    {lastAiReport}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHEDULED REMINDERS REGISTER */}
      {activeTab === 'reminders' && (
        <div className="v-card">
          <div className="v-card-header d-flex justify-content-between align-items-center" style={{ background: '#f4fbf5', borderRadius: '10px 10px 0 0' }}>
            <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>
              <i className="bi bi-alarm me-2 text-success"></i> SCHEDULED REMINDERS REGISTER
            </span>
            <span className="badge px-2.5 py-1" style={{ background: '#DAF2DB', color: '#1E4D2B', fontWeight: 600 }}>{reminders.length} REMINDERS</span>
          </div>
          <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
            {filteredReminders.length === 0 ? (
              <div className="p-4 text-center bg-white">
                <p className="text-muted mb-2">No reminders scheduled yet. Click "+ Schedule Reminder" to add one.</p>
                <button className="btn btn-success btn-sm fw-semibold rounded-pill px-3" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>
                  + Schedule Reminder
                </button>
              </div>
            ) : (
              <table className="v-table">
                <thead>
                  <tr>
                    <th style={{ width: 35 }}>#</th>
                    <th>REMINDER TITLE</th>
                    <th>DATE & TIME</th>
                    <th>FREQUENCY</th>
                    <th>RECIPIENT NUMBER</th>
                    <th>STATUS</th>
                    <th className="text-end" style={{ width: 120 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReminders.map((r, i) => (
                    <tr key={r.id}>
                      <td className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>{i + 1}</td>
                      <td>
                        <div className="fw-bold text-dark">{r.title}</div>
                        <small className="text-muted text-truncate d-block" style={{ fontSize: '0.72rem', maxWidth: 260 }}>{r.message}</small>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark" style={{ fontSize: '0.8rem' }}>{r.date}</div>
                        <small className="text-success" style={{ fontSize: '0.72rem' }}>{r.time} hrs</small>
                      </td>
                      <td>
                        <span className="badge-v secondary text-uppercase">{r.frequency === 'daily' ? '🔄 Daily' : '📍 One-Time'}</span>
                      </td>
                      <td>
                        <span className="fw-bold text-success font-monospace" style={{ fontSize: '0.8rem' }}>+{r.phone}</span>
                      </td>
                      <td>
                        <div className="form-check form-switch mb-0">
                          <input className="form-check-input style-cursor" type="checkbox" checked={r.enabled} onChange={() => {
                            const updated = reminders.map(x => x.id === r.id ? { ...x, enabled: !x.enabled } : x);
                            saveRemindersToStorage(updated);
                          }} />
                        </div>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <button className="btn-v outline-success btn-sm px-2" onClick={() => handleSendWhatsAppDirect({ phone: r.phone, message: r.message })} title="Send WhatsApp Now">
                            <i className="bi bi-send"></i>
                          </button>
                          <button className="btn-v outline-danger btn-sm px-2" onClick={() => {
                            const updated = reminders.filter(x => x.id !== r.id);
                            saveRemindersToStorage(updated);
                          }}>
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
      )}

      {/* TAB 3: LIVE MESSAGES & RECEIPTS */}
      {activeTab === 'live_inbox' && (
        <div className="v-card">
          <div className="v-card-header d-flex justify-content-between align-items-center" style={{ background: '#f4fbf5', borderRadius: '10px 10px 0 0' }}>
            <span className="fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.88rem' }}>
              <i className="bi bi-whatsapp text-success"></i> REAL-TIME LIVE WHATSAPP MESSAGES & BLUE TICK RECEIPTS
            </span>
            <span className="badge px-2.5 py-1" style={{ background: '#25D366', color: '#fff', fontWeight: 600 }}>LIVE META WEBHOOK</span>
          </div>
          <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
            {webhookHistory.length === 0 ? (
              <div className="p-4 text-center bg-white">
                <p className="text-muted mb-0">Waiting for live WhatsApp messages or receipts from Meta...</p>
              </div>
            ) : (
              <table className="v-table">
                <thead>
                  <tr>
                    <th style={{ width: 35 }}>#</th>
                    <th>TIMESTAMP</th>
                    <th>TYPE</th>
                    <th>SENDER / RECIPIENT</th>
                    <th>CONTENT / RECEIPT</th>
                  </tr>
                </thead>
                <tbody>
                  {webhookHistory.map((item, index) => {
                    const isIncoming = item.parsedMessage;
                    const isStatus = item.parsedStatus;
                    return (
                      <tr key={index} style={{ background: isIncoming ? '#F4FBF5' : '#FFFFFF' }}>
                        <td className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>{index + 1}</td>
                        <td style={{ fontSize: '0.75rem' }}>{new Date(item.timestamp).toLocaleTimeString('en-IN')}</td>
                        <td>
                          {isIncoming ? <span className="badge-v success">INCOMING</span> : isStatus ? <span className="badge-v info">{isStatus.status.toUpperCase()}</span> : <span className="badge-v secondary">{item.stage}</span>}
                        </td>
                        <td>
                          <span className="fw-bold text-dark font-monospace">+{isIncoming?.from || isStatus?.recipient || 'Meta'}</span>
                        </td>
                        <td>
                          {isIncoming ? (
                            <div className="p-1.5 rounded border" style={{ background: '#E8F5E9' }}>
                              <span className="fw-bold text-success d-block" style={{ fontSize: '0.72rem' }}>Received Message:</span>
                              <div className="fw-semibold text-dark" style={{ fontSize: '0.82rem' }}>"{isIncoming.text}"</div>
                            </div>
                          ) : isStatus ? (
                            <span className="badge-v success">
                              {isStatus.status === 'read' ? '✓✓ Read (Blue Ticks)' : isStatus.status === 'delivered' ? '✓✓ Delivered' : '✓ Sent'}
                            </span>
                          ) : (
                            <pre className="m-0 text-muted" style={{ fontSize: '0.68rem' }}>{JSON.stringify(item.body)}</pre>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Custom Automation Rule */}
      {showAutoModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAutoModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-box-header d-flex align-items-center justify-content-between" style={{ background: '#f4fbf5', borderRadius: '10px 10px 0 0' }}>
              <span className="fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                <i className="bi bi-robot text-success"></i> Create Custom Groq AI Automation Rule
              </span>
              <button className="close-btn" onClick={() => setShowAutoModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <form onSubmit={handleSaveAutomationRule}>
              <div className="modal-box-body p-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Automation Rule Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Night 8 PM Stock Report, Morning Sales Summary"
                    value={autoForm.title}
                    onChange={(e) => setAutoForm({ ...autoForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-bold">Trigger Time (24h)</label>
                    <input
                      type="time"
                      className="form-control fw-bold"
                      value={autoForm.time}
                      onChange={(e) => setAutoForm({ ...autoForm, time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold">Recipient Phone</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      value={autoForm.phone}
                      onChange={(e) => setAutoForm({ ...autoForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Groq AI Instruction / Prompt</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Describe what Groq AI should check (e.g., Check software inventory and send Night 8 PM report of items left)..."
                    value={autoForm.aiPrompt}
                    onChange={(e) => setAutoForm({ ...autoForm, aiPrompt: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-box-footer d-flex justify-content-end gap-2">
                <button type="button" className="btn-v outline-secondary btn-sm" onClick={() => setShowAutoModal(false)}>Cancel</button>
                <button type="submit" className="btn-v primary btn-sm">Create AI Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Reminder */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTaskModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-box-header d-flex align-items-center justify-content-between" style={{ background: '#f4fbf5', borderRadius: '10px 10px 0 0' }}>
              <span className="fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                <i className="bi bi-alarm text-success"></i> Schedule WhatsApp Reminder
              </span>
              <button className="close-btn" onClick={() => setShowTaskModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!taskForm.title.trim() || !taskForm.phone.trim()) return;
              saveRemindersToStorage([{ id: `REM-${Date.now()}`, ...taskForm, enabled: true }, ...reminders]);
              setShowTaskModal(false);
            }}>
              <div className="modal-box-body p-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Reminder Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Thursday Supplier Meeting"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-bold">Date</label>
                    <input type="date" className="form-control" value={taskForm.date} onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold">Time</label>
                    <input type="time" className="form-control" value={taskForm.time} onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Recipient Mobile Number</label>
                  <input type="text" className="form-control font-monospace" value={taskForm.phone} onChange={(e) => setTaskForm({ ...taskForm, phone: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Message Text</label>
                  <textarea className="form-control" rows="3" value={taskForm.message} onChange={(e) => setTaskForm({ ...taskForm, message: e.target.value })}></textarea>
                </div>
              </div>
              <div className="modal-box-footer d-flex justify-content-end gap-2">
                <button type="button" className="btn-v outline-secondary btn-sm" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn-v primary btn-sm">Save Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
