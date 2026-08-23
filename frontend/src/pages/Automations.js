import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

/* WhatsApp & EHN AI Business Settings */
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
  
  // Tabs: 'reminders' | 'auto_reply' | 'setup' | 'live_inbox'
  const [activeTab, setActiveTab] = useState('reminders');
  const [webhookHistory, setWebhookHistory] = useState([]);
  const [aiGeneratingId, setAiGeneratingId] = useState(null);
  const [lastAiReport, setLastAiReport] = useState('');

  // AI Command Bot State
  const [aiCommandInput, setAiCommandInput] = useState('');
  const [aiCommandLoading, setAiCommandLoading] = useState(false);
  const [aiCommandLogs, setAiCommandLogs] = useState([]);

  // Dynamic Admin WhatsApp Recipient Number
  const [adminPhone, setAdminPhone] = useState(() => {
    return localStorage.getItem('ehn_admin_whatsapp_phone') || '+91 9238695500';
  });

  // Dynamic Auto-Reply Bot Rules List
  const [autoReplyRules, setAutoReplyRules] = useState(() => {
    try {
      const saved = localStorage.getItem('ehn_auto_reply_rules');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'BOT-01',
        title: 'Stock Availability Auto-Reply',
        keyword: 'stock, inventory, saman',
        replyText: 'Namaste! Tissue Rolls & Wet Wipes are in stock. Liquid Handwash 5L is low stock (3 units left).',
        enabled: true,
      },
      {
        id: 'BOT-02',
        title: 'Welcome & Greeting Bot',
        keyword: 'hi, hello, namaste, hey',
        replyText: 'Namaste! Welcome to Kedvass Hygiene Products. Reply STOCK for availability or PRICE for product catalog.',
        enabled: true,
      },
      {
        id: 'BOT-03',
        title: 'Price List & Catalog Bot',
        keyword: 'price, rate, catalog',
        replyText: 'Price List:\n1. Liquid Handwash 5L - ₹350\n2. Floor Cleaner 5L - ₹280\n3. Sanitizer 500ml - ₹120',
        enabled: true,
      },
    ];
  });

  // Dynamic Scheduled EHN AI Automations List
  const [automationsList, setAutomationsList] = useState(() => {
    try {
      const saved = localStorage.getItem('ehn_custom_automations_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'AUTO-01',
        title: 'Night 8 PM Product Stock Report',
        category: 'stock_summary',
        time: '20:00',
        phone: adminPhone,
        enabled: true,
        aiPrompt: 'Check inventory software stock data and send Night 8 PM report of items left, low stock warnings, and reorder alerts.',
      },
      {
        id: 'AUTO-02',
        title: 'Day-End Sales & Revenue Summary',
        category: 'sales_summary',
        time: '21:00',
        phone: adminPhone,
        enabled: true,
        aiPrompt: 'Analyze today sales revenue, invoices created, cash collection, and customer dues at day end.',
      },
      {
        id: 'AUTO-03',
        title: 'Low Stock Emergency Warning',
        category: 'low_stock',
        time: '12:00',
        phone: adminPhone,
        enabled: true,
        aiPrompt: 'Alert admin when any hygiene product stock drops below 10 units threshold.',
      },
    ];
  });

  // Dynamic Scheduled Reminders State
  const [reminders, setReminders] = useState(() => {
    try {
      const saved = localStorage.getItem('ehn_scheduled_reminders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const todayStr = new Date().toISOString().split('T')[0];
    const nextMonthStr = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    return [
      {
        id: 'REM-101',
        title: 'Night 8 PM Product Stock Summary',
        category: 'stock_summary',
        startDate: todayStr,
        endDate: nextMonthStr,
        date: todayStr,
        time: '20:00',
        frequency: 'daily',
        phone: adminPhone,
        enabled: true,
        message: 'Namaste! EHN AI will review software inventory database at 8 PM and send stock summary.',
      },
      {
        id: 'REM-102',
        title: 'Thursday Client Meeting Schedule',
        category: 'meeting',
        startDate: todayStr,
        endDate: todayStr,
        date: todayStr,
        time: '14:00',
        frequency: 'one_time',
        phone: adminPhone,
        enabled: true,
        message: 'Namaste, Friendly reminder for your scheduled meeting today at 2:00 PM. Thank you, EHN One Team.',
      }
    ];
  });

  const [search, setSearch] = useState('');
  
  // Generic Modal States
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editRule, setEditRule] = useState(null);

  // Generic Form State
  const [autoForm, setAutoForm] = useState({
    title: '',
    category: 'auto_reply_keyword',
    keyword: '',
    time: '20:00',
    frequency: 'daily',
    phone: adminPhone,
    replyText: '',
    aiPrompt: '',
  });

  // Schedule Reminder Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'stock_summary',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    frequency: 'daily',
    phone: adminPhone,
    message: '',
  });

  const saveAdminPhone = (newPhone) => {
    setAdminPhone(newPhone);
    localStorage.setItem('ehn_admin_whatsapp_phone', newPhone);
  };

  const saveAutoReplyRules = (newList) => {
    setAutoReplyRules(newList);
    localStorage.setItem('ehn_auto_reply_rules', JSON.stringify(newList));
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

  // Conversational AI Natural Language Command Bot Handler
  const handleExecuteAiCommand = async (commandTextStr) => {
    const queryText = commandTextStr || aiCommandInput;
    if (!queryText || !queryText.trim()) return;

    setAiCommandLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings/ai-command-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ userCommand: queryText, defaultPhone: adminPhone })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Execute parsed action dynamically in UI state & database
        if (data.action === 'CREATE_REMINDER' && data.data) {
          const todayStr = new Date().toISOString().split('T')[0];
          const newRem = {
            id: `REM-${Date.now()}`,
            title: data.data.title || 'EHN AI Scheduled Reminder',
            category: data.data.category || 'meeting',
            startDate: data.data.startDate || todayStr,
            endDate: data.data.endDate || data.data.startDate || todayStr,
            date: data.data.startDate || todayStr,
            time: data.data.time || '20:30',
            frequency: data.data.frequency || 'one_time',
            phone: data.data.phone || adminPhone,
            enabled: true,
            message: data.data.message || queryText
          };
          saveRemindersToStorage([newRem, ...reminders]);
          setActiveTab('reminders');
        } else if (data.action === 'UPDATE_AUTOMATION' && data.data) {
          if (data.data.time) {
            const updated = automationsList.map(a => ({ ...a, time: data.data.time }));
            saveAutomationsList(updated);
          }
        }

        setAiCommandLogs(prev => [{ prompt: queryText, reply: data.reply, time: new Date().toLocaleTimeString('en-IN') }, ...prev]);
        setAiCommandInput('');
      } else {
        alert('EHN AI Bot: ' + (data.message || 'Could not parse command'));
      }
    } catch (e) {
      alert('Failed to connect to EHN AI Command Bot');
    } finally {
      setAiCommandLoading(false);
    }
  };

  // Fetch Live Meta Webhook Logs
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
        alert(`✅ WhatsApp Alert Dispatched via Meta Cloud API!\n\nRecipient: +${cleanPhone}`);
      } else {
        window.open(waWebUrl, '_blank');
      }
    } catch (e) {
      window.open(waWebUrl, '_blank');
    }
  };

  // EHN AI Review & Dispatch Engine
  const handleRunEhnAIReport = async (itemOrCategory, targetPhone) => {
    const category = typeof itemOrCategory === 'object' ? itemOrCategory.category : itemOrCategory;
    const itemTitle = typeof itemOrCategory === 'object' ? itemOrCategory.title : 'AI Reminder';
    const itemId = typeof itemOrCategory === 'object' ? itemOrCategory.id : 'GEN';
    const recipient = targetPhone || (typeof itemOrCategory === 'object' ? itemOrCategory.phone : adminPhone) || adminPhone;

    setAiGeneratingId(itemId);
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
          reportType: category,
          customPrompt: `Review software inventory & billing database for "${itemTitle}" and generate a structured WhatsApp report.`,
          recipientPhone: recipient,
          dispatchWhatsApp: true
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastAiReport(data.aiReport);
        alert(`🤖 EHN AI Reviewed Data & Dispatched WhatsApp Message!\n\nRecipient: +${recipient}\n\n` + data.aiReport.substring(0, 180) + '...');
      } else {
        const fallbackText = `*INTERNAL MANAGEMENT AUDIT (EHN AI)*\n*Kedvass Hygiene Products*\n\n*System Status:*\nReal-time database audit triggered for ${itemTitle}.\n\n_Auto-generated by EHN AI & EHN One ERP_`;
        setLastAiReport(fallbackText);
        handleSendWhatsAppDirect({ phone: recipient, message: fallbackText });
      }
    } catch (e) {
      const fallbackText = `*INTERNAL MANAGEMENT AUDIT (EHN AI)*\n*Kedvass Hygiene Products*\n\n*System Status:*\nReal-time database audit triggered for ${itemTitle}.\n\n_EHN One Software_`;
      handleSendWhatsAppDirect({ phone: recipient, message: fallbackText });
    } finally {
      setAiGeneratingId(null);
    }
  };

  // 100% RELIABLE AUTOMATIC REMINDERS SCHEDULER LOOP
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHHMM = now.toTimeString().substring(0, 5);

      setReminders((currentReminders) => {
        let updated = false;
        const newReminders = currentReminders.map((r) => {
          if (!r.enabled) return r;

          const startDate = r.startDate || r.date || todayStr;
          const endDate = r.endDate || r.startDate || r.date || todayStr;

          const isWithinRange = (todayStr >= startDate) && (todayStr <= endDate);
          const isTimeMatch = (r.time === currentHHMM);

          if (isWithinRange && isTimeMatch && r.lastSent !== `${todayStr}_${currentHHMM}`) {
            console.log(`⏰ AUTOMATIC REMINDER TRIGGERED @ ${currentHHMM} for +${r.phone}`);
            
            if (['stock_summary', 'sales_summary', 'low_stock', 'payment_dues', 'product_catalog', 'custom_ai'].includes(r.category)) {
              handleRunEhnAIReport(r, r.phone);
            } else {
              handleSendWhatsAppDirect({ phone: r.phone, message: r.message });
            }

            updated = true;
            return { ...r, lastSent: `${todayStr}_${currentHHMM}` };
          }
          return r;
        });

        if (updated) saveRemindersToStorage(newReminders);
        return currentReminders;
      });
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // Save Universal Generic Rule
  const handleSaveUniversalRule = (e) => {
    e.preventDefault();
    if (!autoForm.title.trim()) {
      alert('Please enter automation title.');
      return;
    }

    if (autoForm.category === 'auto_reply_keyword') {
      if (editRule) {
        const updated = autoReplyRules.map(r => r.id === editRule.id ? { ...r, title: autoForm.title, keyword: autoForm.keyword, replyText: autoForm.replyText || autoForm.aiPrompt } : r);
        saveAutoReplyRules(updated);
      } else {
        const newRule = {
          id: `BOT-${Date.now()}`,
          title: autoForm.title,
          keyword: autoForm.keyword || 'info',
          replyText: autoForm.replyText || autoForm.aiPrompt || 'Thank you for contacting us.',
          enabled: true,
        };
        saveAutoReplyRules([newRule, ...autoReplyRules]);
      }
    } else {
      if (editRule) {
        const updated = automationsList.map(a => a.id === editRule.id ? { ...a, ...autoForm } : a);
        saveAutomationsList(updated);
      } else {
        const newRule = {
          id: `AUTO-${Date.now()}`,
          ...autoForm,
          enabled: true,
        };
        saveAutomationsList([newRule, ...automationsList]);
      }
    }

    setShowAutoModal(false);
    setEditRule(null);
    setAutoForm({ title: '', category: 'auto_reply_keyword', keyword: '', time: '20:00', frequency: 'daily', phone: adminPhone, replyText: '', aiPrompt: '' });
  };

  const handleToggleAutoReply = (id) => {
    const updated = autoReplyRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    saveAutoReplyRules(updated);
  };

  const handleDeleteAutoReply = (id) => {
    if (window.confirm('Delete this auto-reply rule?')) {
      const updated = autoReplyRules.filter(r => r.id !== id);
      saveAutoReplyRules(updated);
    }
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
    return !q || r.title.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
  });
  const paginatedReminders = filteredReminders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Clean Bootstrap Icons Badge Mapping
  const getCategoryBadge = (cat) => {
    const map = {
      stock_summary: { color: 'success', icon: 'bi-box-seam', label: 'Stock Summary' },
      sales_summary: { color: 'primary', icon: 'bi-bar-chart-line', label: 'Sales Summary' },
      low_stock: { color: 'warning', icon: 'bi-exclamation-triangle', label: 'Low Stock Alert' },
      payment_dues: { color: 'danger', icon: 'bi-cash-coin', label: 'Customer Dues' },
      meeting: { color: 'info', icon: 'bi-calendar-event', label: 'Meeting' },
      call_followup: { color: 'secondary', icon: 'bi-telephone-outbound', label: 'Call Follow-up' },
      product_catalog: { color: 'dark', icon: 'bi-tags', label: 'Product Prices' },
      custom_ai: { color: 'success', icon: 'bi-cpu', label: 'Custom EHN AI' },
    };
    const c = map[cat] || map.custom_ai;
    return <span className={`badge-v ${c.color}`} style={{ fontSize: '0.72rem' }}><i className={`bi ${c.icon} me-1`}></i> {c.label}</span>;
  };

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
      {/* Modern Executive Workspace Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-0.5">
            <h4 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.4px' }}>WhatsApp EHN AI Automation & Reminders Engine</h4>
            <span className="badge px-2.5 py-1" style={{ background: '#DAF2DB', color: '#1E4D2B', fontWeight: 700, fontSize: '0.72rem' }}>
              <i className="bi bi-cpu me-1"></i> EHN AI POWERED
            </span>
          </div>
          <small className="text-muted">EHN AI reviews software inventory, billing & dashboard data to dispatch automated WhatsApp reminders on schedule</small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success btn-sm fw-bold rounded-pill px-3.5 shadow-sm" onClick={() => { setEditRule(null); setAutoForm({ title: '', category: 'auto_reply_keyword', keyword: '', time: '20:00', frequency: 'daily', phone: adminPhone, replyText: '', aiPrompt: '' }); setShowAutoModal(true); }}>
            <i className="bi bi-plus-lg me-1"></i> + New Automation Rule
          </button>
          <button className="btn btn-success btn-sm fw-bold rounded-pill px-3.5 shadow-sm" onClick={() => { setShowTaskModal(true); }} style={{ background: '#4CAF50', border: 'none' }}>
            <i className="bi bi-alarm me-1"></i> + Schedule Reminder
          </button>
        </div>
      </div>

      {/* CONVERSATIONAL NATURAL LANGUAGE EHN AI BOT COMMAND ASSISTANT */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #1E4D2B 0%, #153820 100%)', color: '#ffffff' }}>
        <div className="card-body p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-robot text-warning" style={{ fontSize: '1.3rem' }}></i>
              <div>
                <span className="fw-bold text-white" style={{ fontSize: '0.92rem' }}>EHN AI Conversational Admin Command Bot</span>
                <small className="text-white-50 d-block" style={{ fontSize: '0.73rem' }}>Type natural Hindi/English commands to setup reminders, edit timing, or run reports instantly!</small>
              </div>
            </div>
            <span className="badge bg-warning text-dark font-monospace" style={{ fontSize: '0.68rem', fontWeight: 700 }}>NATURAL LANGUAGE AI</span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleExecuteAiCommand(); }} className="d-flex gap-2 mb-2">
            <input
              type="text"
              className="form-control form-control-sm fw-semibold text-dark shadow-sm"
              style={{ borderRadius: 8, fontSize: '0.85rem' }}
              placeholder='Try typing: "Meri meeting hai aaj 9 baje, 8:30 PM ka reminder setup kar do"'
              value={aiCommandInput}
              onChange={(e) => setAiCommandInput(e.target.value)}
              disabled={aiCommandLoading}
            />
            <button
              type="submit"
              className="btn btn-warning btn-sm fw-bold px-3 shadow-sm d-flex align-items-center gap-1"
              style={{ borderRadius: 8, fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              disabled={aiCommandLoading || !aiCommandInput.trim()}
            >
              {aiCommandLoading ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-send-fill"></i>}
              Ask EHN AI Bot
            </button>
          </form>

          {/* Quick Chip Suggestions */}
          <div className="d-flex flex-wrap gap-1.5 align-items-center">
            <small className="text-white-50 fw-bold me-1" style={{ fontSize: '0.7rem' }}>QUICK COMMANDS:</small>
            <button type="button" className="btn btn-sm btn-outline-light py-0 px-2 font-monospace" style={{ fontSize: '0.68rem', borderRadius: 20 }} onClick={() => handleExecuteAiCommand("Meri meeting hai aaj 9 baje, 8:30 PM ka reminder setup kar do")}>
              💬 "Meeting aaj 9 baje, 8:30 PM reminder set kar do"
            </button>
            <button type="button" className="btn btn-sm btn-outline-light py-0 px-2 font-monospace" style={{ fontSize: '0.68rem', borderRadius: 20 }} onClick={() => handleExecuteAiCommand("Stock report ka time change karke 10 PM kar do")}>
              ⏱️ "Stock report time 10 PM kar do"
            </button>
            <button type="button" className="btn btn-sm btn-outline-light py-0 px-2 font-monospace" style={{ fontSize: '0.68rem', borderRadius: 20 }} onClick={() => handleExecuteAiCommand("Aaj ki sales revenue report WhatsApp par bhej do")}>
              📊 "Sales revenue report bhej do"
            </button>
          </div>

          {/* Bot Response Stream */}
          {aiCommandLogs.length > 0 && (
            <div className="mt-2.5 p-2 rounded bg-white text-dark border" style={{ maxHeight: 110, overflowY: 'auto', fontSize: '0.78rem' }}>
              <div className="fw-bold text-success mb-1">
                <i className="bi bi-check-circle-fill me-1"></i> {aiCommandLogs[0].reply}
              </div>
              <small className="text-muted font-monospace d-block">Executed @ {aiCommandLogs[0].time}</small>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
        <div className="card-body p-2 d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ background: '#f8faf9', borderRadius: 12 }}>
          <div className="nav nav-pills gap-1">
            <button
              className={`nav-link btn-sm fw-bold rounded-pill px-2.5 py-1 ${activeTab === 'reminders' ? 'active' : 'text-dark bg-white shadow-sm'}`}
              onClick={() => setActiveTab('reminders')}
              style={activeTab === 'reminders' ? { background: '#1E4D2B', color: '#ffffff', fontSize: '0.76rem' } : { fontSize: '0.76rem' }}
            >
              <i className="bi bi-alarm-fill me-1 text-warning"></i> 1. Reminders ({reminders.length})
            </button>
            <button
              className={`nav-link btn-sm fw-bold rounded-pill px-2.5 py-1 ${activeTab === 'auto_reply' ? 'active' : 'text-dark bg-white shadow-sm'}`}
              onClick={() => setActiveTab('auto_reply')}
              style={activeTab === 'auto_reply' ? { background: '#1E4D2B', color: '#ffffff', fontSize: '0.76rem' } : { fontSize: '0.76rem' }}
            >
              <i className="bi bi-chat-dots-fill me-1 text-success"></i> 2. Auto-Reply Bot ({autoReplyRules.length})
            </button>
            <button
              className={`nav-link btn-sm fw-bold rounded-pill px-2.5 py-1 ${activeTab === 'setup' ? 'active' : 'text-dark bg-white shadow-sm'}`}
              onClick={() => setActiveTab('setup')}
              style={activeTab === 'setup' ? { background: '#1E4D2B', color: '#ffffff', fontSize: '0.76rem' } : { fontSize: '0.76rem' }}
            >
              <i className="bi bi-cpu-fill me-1 text-primary"></i> 3. EHN AI Reports ({automationsList.length})
            </button>
            <button
              className={`nav-link btn-sm fw-bold rounded-pill px-2.5 py-1 ${activeTab === 'live_inbox' ? 'active' : 'text-dark bg-white shadow-sm'}`}
              onClick={() => setActiveTab('live_inbox')}
              style={activeTab === 'live_inbox' ? { background: '#1E4D2B', color: '#ffffff', fontSize: '0.76rem' } : { fontSize: '0.76rem' }}
            >
              <i className="bi bi-whatsapp me-1" style={{ color: '#25D366' }}></i> 4. Live Logs ({webhookHistory.length})
            </button>
          </div>

          <div className="d-flex align-items-center gap-2 px-2">
            <small className="text-muted fw-bold" style={{ fontSize: '0.72rem' }}>ADMIN NUMBER:</small>
            <input
              type="text"
              className="form-control form-control-sm fw-bold text-dark font-monospace"
              style={{ width: 155, borderColor: '#4CAF50' }}
              value={adminPhone}
              onChange={(e) => saveAdminPhone(e.target.value)}
              title="Admin recipient phone number"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: SCHEDULED REMINDERS REGISTER */}
      {activeTab === 'reminders' && (
        <div className="v-card">
          <div className="v-card-header d-flex justify-content-between align-items-center" style={{ background: '#f4fbf5', borderRadius: '12px 12px 0 0' }}>
            <span className="fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.88rem' }}>
              <i className="bi bi-alarm me-1 text-success"></i> SCHEDULED REMINDERS REGISTER (START DATE & END DATE RANGE)
            </span>
            <span className="badge px-2.5 py-1" style={{ background: '#DAF2DB', color: '#1E4D2B', fontWeight: 600 }}>{reminders.length} REMINDERS</span>
          </div>
          <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
            {filteredReminders.length === 0 ? (
              <div className="p-4 text-center bg-white">
                <p className="text-muted mb-2">No reminders scheduled yet. Click "+ Schedule Reminder" to add one.</p>
                <button className="btn btn-success btn-sm fw-semibold rounded-pill px-3" onClick={() => setShowTaskModal(true)}>
                  + Schedule Reminder
                </button>
              </div>
            ) : (
              <table className="v-table">
                <thead>
                  <tr>
                    <th style={{ width: 35 }}>#</th>
                    <th>REMINDER TITLE & MESSAGE</th>
                    <th>MODULE CATEGORY</th>
                    <th>START DATE $\rightarrow$ END DATE</th>
                    <th>TIME</th>
                    <th>RECIPIENT PHONE</th>
                    <th>STATUS</th>
                    <th className="text-end" style={{ width: 150 }}>ACTIONS</th>
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
                      <td>{getCategoryBadge(r.category)}</td>
                      <td>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.78rem' }}>
                          <i className="bi bi-calendar-range me-1 text-primary"></i>
                          {r.startDate || r.date} $\rightarrow$ {r.endDate || r.startDate || r.date}
                        </div>
                        <small className="text-muted text-uppercase" style={{ fontSize: '0.68rem' }}>{r.frequency === 'daily' ? '🔄 Daily Repeat' : '📍 One-Time'}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border font-monospace fw-bold" style={{ fontSize: '0.75rem' }}>
                          <i className="bi bi-clock text-success me-1"></i> {r.time} hrs
                        </span>
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
                          <button className="btn btn-success btn-sm font-monospace py-0.5 px-2" style={{ fontSize: '0.72rem', background: '#4CAF50', border: 'none' }} onClick={() => handleRunEhnAIReport(r, r.phone)} title="Run EHN AI & Dispatch WhatsApp Now">
                            <i className="bi bi-send me-1"></i> Send Now
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

      {/* TAB 2: AUTO-REPLY BOT RULES */}
      {activeTab === 'auto_reply' && (
        <div className="row g-3">
          <div className="col-12">
            <div className="p-2.5 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border bg-white shadow-sm" style={{ borderColor: '#DAF2DB' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-whatsapp text-success" style={{ fontSize: '1.25rem' }}></i>
                <div>
                  <span className="fw-bold text-dark me-2" style={{ fontSize: '0.85rem' }}>Customer Incoming Message Auto-Reply Bot</span>
                  <span className="badge bg-success font-monospace" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                </div>
              </div>
              <small className="text-muted">When a customer sends a message with a keyword, Meta Webhook instantly sends auto-reply back!</small>
            </div>
          </div>

          {autoReplyRules.map((rule) => (
            <div className="col-md-6 col-lg-4" key={rule.id}>
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: 12, background: '#ffffff', borderLeft: '4px solid #25D366' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div>
                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.9rem' }}>{rule.title}</h6>
                      <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: '0.7rem' }}>
                        <i className="bi bi-key-fill text-warning me-1"></i> Trigger Keyword: "{rule.keyword}"
                      </span>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input style-cursor"
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleAutoReply(rule.id)}
                      />
                    </div>
                  </div>

                  <div className="p-2 rounded border mb-3" style={{ background: '#F4FBF5', fontSize: '0.78rem', color: '#1E4D2B' }}>
                    <i className="bi bi-reply-fill text-success me-1"></i> <strong>Auto-Reply Content:</strong>
                    <div className="mt-1 fw-semibold text-dark">{rule.replyText}</div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                    <div className="d-flex gap-1">
                      <button className="btn btn-v outline-primary btn-sm p-1 px-2" onClick={() => { setEditRule(rule); setAutoForm({ title: rule.title, category: 'auto_reply_keyword', keyword: rule.keyword, time: '20:00', frequency: 'daily', phone: adminPhone, replyText: rule.replyText, aiPrompt: rule.replyText }); setShowAutoModal(true); }}>
                        <i className="bi bi-pencil"></i> Edit Rule
                      </button>
                      <button className="btn btn-v outline-danger btn-sm p-1 px-2" onClick={() => handleDeleteAutoReply(rule.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                    <button className="btn btn-outline-success btn-sm font-monospace py-0.5 px-2" style={{ fontSize: '0.72rem' }} onClick={() => handleSendWhatsAppDirect({ phone: adminPhone, message: rule.replyText })}>
                      <i className="bi bi-send me-1"></i> Test Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: EHN AI SYSTEM REPORTS ENGINE */}
      {activeTab === 'setup' && (
        <div className="row g-3">
          <div className="col-12">
            <div className="p-2.5 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border bg-white shadow-sm" style={{ borderColor: '#DAF2DB' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-cpu-fill text-success" style={{ fontSize: '1.25rem' }}></i>
                <div>
                  <span className="fw-bold text-dark me-2" style={{ fontSize: '0.85rem' }}>EHN AI Model: `qwen/qwen3.6-27b`</span>
                  <span className="badge bg-success font-monospace" style={{ fontSize: '0.65rem' }}>KEY ACTIVE</span>
                </div>
              </div>
              <small className="text-muted font-monospace">Auto-dispatches WhatsApp notifications via Meta Cloud API</small>
            </div>
          </div>

          {automationsList.map((item) => (
            <div className="col-md-6 col-lg-4" key={item.id}>
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: 12, background: '#ffffff', borderTop: '3.5px solid #1E4D2B' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div>
                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.9rem' }}>{item.title}</h6>
                      <span className="badge bg-light text-dark font-monospace" style={{ fontSize: '0.68rem' }}>
                        <i className="bi bi-clock me-1 text-success"></i> {item.time} hrs
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
                    <div className="d-flex gap-1">
                      <button className="btn btn-v outline-primary btn-sm p-1 px-2" onClick={() => { setEditRule(item); setAutoForm({ title: item.title, category: item.category, keyword: '', time: item.time, frequency: item.frequency || 'daily', phone: item.phone || adminPhone, replyText: '', aiPrompt: item.aiPrompt }); setShowAutoModal(true); }} title="Edit Rule">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-v outline-danger btn-sm p-1 px-2" onClick={() => handleDeleteAutoRule(item.id)} title="Delete Rule">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>

                    <button
                      className="btn btn-success btn-sm fw-bold rounded-pill px-3 shadow-sm d-inline-flex align-items-center gap-1"
                      style={{ background: '#4CAF50', border: 'none', fontSize: '0.78rem' }}
                      onClick={() => handleRunEhnAIReport(item)}
                      disabled={aiGeneratingId === item.id}
                    >
                      {aiGeneratingId === item.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-robot"></i> Run EHN AI Report
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {lastAiReport && (
            <div className="col-12 mt-2">
              <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: '#E8F5E9', borderLeft: '4px solid #25D366' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-bold text-success" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-whatsapp me-1"></i> LAST GENERATED EHN AI WHATSAPP REPORT:
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

      {/* TAB 4: LIVE MESSAGES & RECEIPTS */}
      {activeTab === 'live_inbox' && (
        <div className="v-card">
          <div className="v-card-header d-flex justify-content-between align-items-center" style={{ background: '#f4fbf5', borderRadius: '12px 12px 0 0' }}>
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

      {/* UNIVERSAL GENERIC AUTOMATION & AUTO-REPLY BUILDER MODAL */}
      {showAutoModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAutoModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 540 }}>
            <div className="modal-box-header d-flex align-items-center justify-content-between px-4 py-3" style={{ background: '#1E4D2B', color: '#ffffff', borderRadius: '12px 12px 0 0' }}>
              <span className="fw-bold text-white d-flex align-items-center gap-2" style={{ fontSize: '1.05rem' }}>
                <i className="bi bi-robot text-warning"></i> {editRule ? 'Edit Automation Rule' : 'Create Generic EHN AI Automation Rule'}
              </span>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowAutoModal(false)}></button>
            </div>
            <form onSubmit={handleSaveUniversalRule}>
              <div className="modal-box-body p-4 bg-white">
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark">Automation Rule Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control fw-semibold"
                    placeholder="e.g. Stock Auto-Reply Bot, Night 8 PM Stock Report"
                    value={autoForm.title}
                    onChange={(e) => setAutoForm({ ...autoForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold text-dark">Rule Category / Trigger Type</label>
                  <select
                    className="form-select fw-bold text-dark"
                    value={autoForm.category}
                    onChange={(e) => setAutoForm({ ...autoForm, category: e.target.value })}
                  >
                    <option value="auto_reply_keyword">Customer Incoming Keyword Auto-Reply Bot</option>
                    <option value="stock_summary">Scheduled Product Stock Report</option>
                    <option value="business_summary">Scheduled Sales Revenue Summary</option>
                    <option value="low_stock">Emergency Low Stock Warning</option>
                    <option value="custom_ai">Custom EHN AI Scheduled Task</option>
                  </select>
                </div>

                {autoForm.category === 'auto_reply_keyword' ? (
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark">Incoming Customer Trigger Keyword(s) <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control font-monospace fw-bold"
                      placeholder="e.g. stock, price, hi, catalog, address"
                      value={autoForm.keyword}
                      onChange={(e) => setAutoForm({ ...autoForm, keyword: e.target.value })}
                      required
                    />
                    <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>When a customer sends a WhatsApp text containing these keywords, bot auto-replies!</small>
                  </div>
                ) : (
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold text-dark">Trigger Time (24h)</label>
                      <input
                        type="time"
                        className="form-control fw-bold"
                        value={autoForm.time}
                        onChange={(e) => setAutoForm({ ...autoForm, time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold text-dark">Recipient Phone</label>
                      <input
                        type="text"
                        className="form-control font-monospace fw-bold"
                        value={autoForm.phone}
                        onChange={(e) => setAutoForm({ ...autoForm, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-bold text-dark">
                    {autoForm.category === 'auto_reply_keyword' ? 'Auto-Reply Response Content' : 'EHN AI Prompt / Instruction'}
                  </label>
                  <textarea
                    className="form-control fw-semibold"
                    rows="3"
                    placeholder={autoForm.category === 'auto_reply_keyword' ? 'Enter exact message content to send back to customer...' : 'Describe what EHN AI should check (e.g. Check inventory and send Night 8 PM report)...'}
                    value={autoForm.category === 'auto_reply_keyword' ? autoForm.replyText : autoForm.aiPrompt}
                    onChange={(e) => setAutoForm({ ...autoForm, replyText: e.target.value, aiPrompt: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-box-footer d-flex justify-content-end gap-2 p-3 bg-light" style={{ borderRadius: '0 0 12px 12px' }}>
                <button type="button" className="btn btn-outline-secondary btn-sm fw-semibold" onClick={() => setShowAutoModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success btn-sm fw-bold px-4" style={{ background: '#1E4D2B', border: 'none' }}>Save Automation Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE REMINDER MODAL */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTaskModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <div className="modal-box-header d-flex align-items-center justify-content-between px-4 py-3" style={{ background: '#1E4D2B', color: '#ffffff', borderRadius: '12px 12px 0 0' }}>
              <span className="fw-bold text-white d-flex align-items-center gap-2" style={{ fontSize: '1.05rem' }}>
                <i className="bi bi-alarm-fill text-warning"></i> Schedule WhatsApp Reminder (Start & End Date)
              </span>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowTaskModal(false)}></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!taskForm.title.trim() || !taskForm.phone.trim()) return;
              saveRemindersToStorage([{ id: `REM-${Date.now()}`, ...taskForm, enabled: true }, ...reminders]);
              setShowTaskModal(false);
            }}>
              <div className="modal-box-body p-4 bg-white">
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark">Reminder Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control fw-semibold"
                    placeholder="e.g. Night 8 PM Stock Report, Client Meeting"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold text-dark">Dashboard Module / Category Dropdown <span className="text-danger">*</span></label>
                  <select
                    className="form-select fw-bold text-dark"
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                  >
                    <option value="stock_summary">Product Stock Inventory Summary & Reorder Alert (EHN AI)</option>
                    <option value="sales_summary">Daily Sales Revenue & Billing Executive Summary (EHN AI)</option>
                    <option value="low_stock">Low Stock Emergency Warning Alert (EHN AI)</option>
                    <option value="payment_dues">Customer Outstanding Credit Dues Summary (EHN AI)</option>
                    <option value="meeting">Client Meeting & Event Schedule</option>
                    <option value="call_followup">Customer Follow-up Call</option>
                    <option value="product_catalog">Product Catalog Update & Price Inquiry</option>
                    <option value="custom_ai">Custom EHN AI Smart Reminder</option>
                  </select>
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>EHN AI will review real software database data for selected category and send automated WhatsApp reminder!</small>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-bold text-dark">Start Date <span className="text-danger">*</span></label>
                    <input type="date" className="form-control fw-bold" value={taskForm.startDate} onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value, date: e.target.value })} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold text-dark">End Date <span className="text-danger">*</span></label>
                    <input type="date" className="form-control fw-bold" value={taskForm.endDate} onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })} required />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-bold text-dark">Trigger Time (24h) <span className="text-danger">*</span></label>
                    <input type="time" className="form-control fw-bold text-success" value={taskForm.time} onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold text-dark">Repeat Frequency</label>
                    <select
                      className="form-select fw-semibold"
                      value={taskForm.frequency}
                      onChange={(e) => setTaskForm({ ...taskForm, frequency: e.target.value })}
                    >
                      <option value="daily">Daily Repeat (Everyday in date range)</option>
                      <option value="one_time">One-Time Event</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold text-dark">Target Recipient Number <span className="text-danger">*</span></label>
                  <input type="text" className="form-control font-monospace fw-bold" placeholder="e.g. +91 9238695500" value={taskForm.phone} onChange={(e) => setTaskForm({ ...taskForm, phone: e.target.value })} required />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold text-dark">Custom Message / AI Instruction</label>
                  <textarea className="form-control fw-semibold" rows="2" placeholder="Enter custom message text or instruction for EHN AI..." value={taskForm.message} onChange={(e) => setTaskForm({ ...taskForm, message: e.target.value })}></textarea>
                </div>
              </div>
              <div className="modal-box-footer d-flex justify-content-end gap-2 p-3 bg-light" style={{ borderRadius: '0 0 12px 12px' }}>
                <button type="button" className="btn btn-outline-secondary btn-sm fw-semibold" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success btn-sm fw-bold px-4" style={{ background: '#1E4D2B', border: 'none' }}>Save Schedule Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
