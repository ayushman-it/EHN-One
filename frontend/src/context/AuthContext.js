import React, { createContext, useContext, useState } from 'react';
import * as authAPI from '../services/api';

/* ─────────────────────────────────────────────
   Role definitions
   each role lists exactly what it CAN do
───────────────────────────────────────────── */
export const ROLES = {
  admin: {
    label: 'Administrator',
    color: 'danger',
    icon: 'bi-shield-lock-fill',
    permissions: [
      'dashboard.view', 'profile.view',
      'products.view', 'products.add', 'products.edit', 'products.delete',
      'transactions.view', 'transactions.stockin', 'transactions.stockout',
      'lowstock.view',
      'categories.view', 'categories.add', 'categories.edit', 'categories.delete',
      'suppliers.view', 'suppliers.add', 'suppliers.edit', 'suppliers.delete',
      'warehouse.view', 'warehouse.add', 'warehouse.edit', 'warehouse.delete',
      'reports.view', 'analytics.view',
      'settings.view', 'users.view', 'users.manage',
    ],
  },
  manager: {
    label: 'Manager',
    color: 'warning',
    icon: 'bi-person-badge-fill',
    permissions: [
      'dashboard.view', 'profile.view',
      'products.view', 'products.add', 'products.edit',
      'transactions.view', 'transactions.stockin', 'transactions.stockout',
      'lowstock.view',
      'categories.view', 'categories.add', 'categories.edit',
      'suppliers.view', 'suppliers.add', 'suppliers.edit',
      'warehouse.view', 'warehouse.add', 'warehouse.edit',
      'reports.view',
    ],
  },
  viewer: {
    label: 'Viewer',
    color: 'info',
    icon: 'bi-eye-fill',
    permissions: [
      'dashboard.view', 'profile.view',
      'products.view',
      'transactions.view',
      'lowstock.view',
      'reports.view',
    ],
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { 
      const session = JSON.parse(sessionStorage.getItem('inv_user')); 
      const cachedAvatar = localStorage.getItem('ehn_user_avatar');
      if (session) {
        return { ...session, avatar: cachedAvatar || session.avatar || null };
      }
      return session;
    } catch { return null; }
  });

  const updateUserAvatar = (avatarUrl) => {
    if (avatarUrl) {
      localStorage.setItem('ehn_user_avatar', avatarUrl);
    } else {
      localStorage.removeItem('ehn_user_avatar');
    }

    if (user) {
      const updated = { ...user, avatar: avatarUrl };
      sessionStorage.setItem('inv_user', JSON.stringify(updated));
      setUser(updated);
    }
    window.dispatchEvent(new Event('ehn_user_avatar_updated'));
  };

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    const u = response.user || response.data || response;
    const cachedAvatar = localStorage.getItem('ehn_user_avatar');
    const session = {
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      avatar: cachedAvatar || u.avatar || null
    };

    if (response.token) {
      sessionStorage.setItem('inv_token', response.token);
    }

    sessionStorage.setItem('inv_user', JSON.stringify(session));
    setUser(session);
    return session;
  };

  const logout = () => {
    sessionStorage.removeItem('inv_user');
    sessionStorage.removeItem('inv_token');
    setUser(null);
  };

  const can = (permission) => {
    if (!user) return false;
    if (permission === 'profile.view') return true;
    return (ROLES[user.role]?.permissions || []).includes(permission);
  };

  const hasRole = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, login, logout, can, hasRole, roleInfo: user ? ROLES[user.role] : null, updateUserAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
