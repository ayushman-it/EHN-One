import React, { useState, useRef, useEffect } from 'react';
import * as api from '../services/api';

const NotificationDropdown = () => {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.getNotifications();
      setNotifications(response.data || response);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Keep existing notifications on error
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await api.markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Clear all notifications?')) {
      try {
        setLoading(true);
        await api.clearAllNotifications();
        setNotifications([]);
        setNotifOpen(false);
      } catch (error) {
        console.error('Failed to clear notifications:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  return (
    <div className="notification-dropdown-wrapper" ref={notifRef}>
      <button 
        className="navbar-icon-btn" 
        onClick={() => setNotifOpen(!notifOpen)}
        aria-label="Notifications"
      >
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount}</span>
        )}
      </button>

      {notifOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-dropdown-header">
            <div>
              <h6 className="mb-0">Notifications</h6>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </span>
            </div>
            {notifications.length > 0 && (
              <div className="d-flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    className="btn-v-text primary" 
                    onClick={handleMarkAllAsRead}
                    disabled={loading}
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    {loading ? 'Marking...' : 'Mark all read'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="notification-dropdown-body">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <i className="bi bi-bell-slash"></i>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item${!notification.read ? ' unread' : ''}`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className={`notification-icon ${notification.color}`}>
                    <i className={`bi ${notification.icon}`}></i>
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      <i className="bi bi-clock"></i> {notification.time}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="notification-unread-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-dropdown-footer">
              <button 
                className="btn-v-text danger" 
                onClick={handleClearAll}
                disabled={loading}
              >
                <i className="bi bi-trash"></i> {loading ? 'Clearing...' : 'Clear All'}
              </button>
              <button className="btn-v-text primary">
                View All Notifications <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
