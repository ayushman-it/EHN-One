import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function EhnAiAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('ehn_ai_chat_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        sender: 'ai',
        text: 'Namaste! I am EHN AI, your ERP & Business Assistant. How can I help you today? You can ask me to audit stock, check sales revenue, setup reminders, or analyze customer dues.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    try {
      localStorage.setItem('ehn_ai_chat_history', JSON.stringify(messages.slice(-30)));
    } catch (e) {}
  }, [messages]);

  const handleSendMessage = async (customPrompt) => {
    const queryText = customPrompt || input;
    if (!queryText || !queryText.trim()) return;

    const userMsg = {
      sender: 'user',
      text: queryText,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const adminPhone = localStorage.getItem('ehn_admin_whatsapp_phone') || '+91 9238695500';
      
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
        // If action is CREATE_REMINDER, auto-save to local storage reminders register!
        if (data.action === 'CREATE_REMINDER' && data.data) {
          try {
            const savedReminders = JSON.parse(localStorage.getItem('ehn_scheduled_reminders') || '[]');
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
            localStorage.setItem('ehn_scheduled_reminders', JSON.stringify([newRem, ...savedReminders]));
          } catch (e) {}
        }

        const aiMsg = {
          sender: 'ai',
          text: data.reply || 'Task processed successfully.',
          action: data.action,
          data: data.data,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: `EHN AI: ${data.message || 'Apologies, I could not process that request. Please try again.'}`,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'EHN AI: Connection error. Please verify network status.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear conversation history?')) {
      const resetMsg = [
        {
          sender: 'ai',
          text: 'Namaste! Conversation cleared. How can I assist you?',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(resetMsg);
      localStorage.setItem('ehn_ai_chat_history', JSON.stringify(resetMsg));
    }
  };

  return (
    <div className="py-2 d-flex flex-column" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Header Bar */}
      <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-white border shadow-sm mb-3">
        <div className="d-flex align-items-center gap-2.5">
          <div className="p-2 rounded-circle" style={{ background: '#DAF2DB', color: '#1E4D2B' }}>
            <i className="bi bi-robot" style={{ fontSize: '1.4rem' }}></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px' }}>EHN AI Assistant</h5>
              <span className="badge px-2 py-0.5" style={{ background: '#DAF2DB', color: '#1E4D2B', fontWeight: 700, fontSize: '0.68rem' }}>
                POWERED BY GROQ AI
              </span>
            </div>
            <small className="text-muted" style={{ fontSize: '0.78rem' }}>Conversational AI assistant for stock audits, sales reports & reminders setup</small>
          </div>
        </div>

        <button className="btn btn-outline-danger btn-sm font-monospace py-1 px-3" onClick={handleClearChat} style={{ fontSize: '0.78rem' }}>
          <i className="bi bi-trash me-1"></i> Clear Chat
        </button>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="card border-0 shadow-sm flex-grow-1 mb-3" style={{ borderRadius: 14, background: '#f8faf9', display: 'flex', flexDirection: 'column' }}>
        <div className="card-body p-3.5 flex-grow-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          {messages.map((m, idx) => (
            <div key={idx} className={`d-flex mb-3 ${m.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
              {m.sender === 'ai' && (
                <div className="me-2 flex-shrink-0 p-2 rounded-circle shadow-sm" style={{ background: '#1E4D2B', color: '#fff', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-cpu-fill" style={{ fontSize: '0.95rem' }}></i>
                </div>
              )}
              
              <div style={{ maxWidth: '75%' }}>
                <div
                  className="p-3 shadow-sm"
                  style={{
                    borderRadius: m.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background: m.sender === 'user' ? '#1E4D2B' : '#ffffff',
                    color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                    fontSize: '0.88rem',
                    lineHeight: '1.45',
                    border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                  {m.action === 'CREATE_REMINDER' && (
                    <div className="mt-2 p-2 rounded border bg-light text-success fw-bold" style={{ fontSize: '0.78rem' }}>
                      <i className="bi bi-check-circle-fill me-1"></i> Reminder automatically saved to Database!
                    </div>
                  )}
                </div>

                <small className={`d-block mt-1 font-monospace ${m.sender === 'user' ? 'text-end text-muted' : 'text-muted'}`} style={{ fontSize: '0.68rem' }}>
                  {m.sender === 'user' ? (user?.name || 'Admin') : 'EHN AI'} • {m.time}
                </small>
              </div>

              {m.sender === 'user' && (
                <div className="ms-2 flex-shrink-0 p-2 rounded-circle shadow-sm" style={{ background: '#0284c7', color: '#fff', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-person-fill" style={{ fontSize: '0.95rem' }}></i>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="d-flex align-items-center gap-2 text-muted p-2" style={{ fontSize: '0.82rem' }}>
              <div className="spinner-border spinner-border-sm text-success" role="status"></div>
              <span>EHN AI is analyzing database & generating response...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips & Form Input Footer */}
        <div className="card-footer bg-white border-top p-3" style={{ borderRadius: '0 0 14px 14px' }}>
          {/* Quick Action Suggestion Chips */}
          <div className="d-flex flex-wrap gap-1.5 align-items-center mb-2.5">
            <small className="text-muted fw-bold me-1" style={{ fontSize: '0.7rem' }}>QUICK ACTIONS:</small>
            <button
              type="button"
              className="btn btn-sm btn-outline-success py-1 px-2.5 rounded-pill font-monospace"
              style={{ fontSize: '0.73rem' }}
              onClick={() => handleSendMessage('Meri meeting hai aaj 5 PM par, 4:30 PM ka reminder set kar do')}
            >
              <i className="bi bi-alarm me-1"></i> Meeting Reminder for 4:30 PM
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary py-1 px-2.5 rounded-pill font-monospace"
              style={{ fontSize: '0.73rem' }}
              onClick={() => handleSendMessage('Stock me kya kya bacha hai detailed status audit batao')}
            >
              <i className="bi bi-box-seam me-1"></i> Audit Stock & Inventory
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-warning py-1 px-2.5 rounded-pill font-monospace text-dark"
              style={{ fontSize: '0.73rem' }}
              onClick={() => handleSendMessage('Today sales revenue report WhatsApp par bhej do')}
            >
              <i className="bi bi-bar-chart-line me-1"></i> Send Today Sales Report
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-1 px-2.5 rounded-pill font-monospace"
              style={{ fontSize: '0.73rem' }}
              onClick={() => handleSendMessage('Customer outstanding credit dues kitna hai batao')}
            >
              <i className="bi bi-cash-coin me-1"></i> Check Customer Dues
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="d-flex gap-2">
            <input
              type="text"
              className="form-control fw-semibold text-dark"
              style={{ borderRadius: 10, padding: '10px 16px', fontSize: '0.88rem' }}
              placeholder='Type anything (e.g. "Meeting aaj 5 PM par hai, 4:30 PM ka reminder set kar do", "Low stock items dikhao")...'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-success fw-bold px-4 d-flex align-items-center gap-1.5 shadow-sm"
              style={{ background: '#1E4D2B', border: 'none', borderRadius: 10, fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-1"></span>
              ) : (
                <>
                  <i className="bi bi-send-fill"></i> Ask EHN AI
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
