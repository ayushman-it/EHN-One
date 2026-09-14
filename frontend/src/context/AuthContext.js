import React, { createContext, useContext, useState } from 'react';
import * as authAPI from '../services/api';

/* ─────────────────────────────────────────────
   Role definitions for all 6 EHN ONE roles
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
      'lowstock.view', 'categories.view', 'suppliers.view', 'warehouse.view',
      'reports.view', 'analytics.view', 'settings.view', 'users.view', 'users.manage',
      'orders.view', 'invoices.view', 'dpr.view', 'challan.view', 'tally.view'
    ],
  },
  production: {
    label: 'Production Team',
    color: 'warning',
    icon: 'bi-gear-wide-connected',
    permissions: [
      'dashboard.view', 'profile.view',
      'products.view', 'products.edit',
      'transactions.view', 'transactions.stockin', 'transactions.stockout',
      'warehouse.view', 'lowstock.view', 'reports.view'
    ],
  },
  sales: {
    label: 'Sales Team',
    color: 'primary',
    icon: 'bi-bag-check-fill',
    permissions: [
      'dashboard.view', 'profile.view',
      'products.view', 'customers.view', 'orders.view',
      'dpr.view', 'lowstock.view'
    ],
  },
  despatch: {
    label: 'Despatch Team',
    color: 'purple',
    icon: 'bi-truck',
    permissions: [
      'dashboard.view', 'profile.view',
      'orders.view', 'challan.view', 'transactions.stockout',
      'warehouse.view'
    ],
  },
  billing: {
    label: 'Accounting/Billing',
    color: 'success',
    icon: 'bi-receipt-cutoff',
    permissions: [
      'dashboard.view', 'profile.view',
      'invoices.view', 'orders.view', 'tally.view',
      'suppliers.view', 'customers.view', 'reports.view'
    ],
  },
  manager: {
    label: 'Managerial Team',
    color: 'info',
    icon: 'bi-briefcase-fill',
    permissions: [
      'dashboard.view', 'profile.view',
      'products.view', 'transactions.view', 'lowstock.view',
      'categories.view', 'suppliers.view', 'warehouse.view',
      'reports.view', 'analytics.view', 'orders.view', 'invoices.view'
    ],
  },
  viewer: {
    label: 'Viewer',
    color: 'secondary',
    icon: 'bi-eye-fill',
    permissions: [
      'dashboard.view', 'profile.view',
      'products.view', 'transactions.view',
      'lowstock.view', 'reports.view'
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
      customPermissions: Array.isArray(u.customPermissions) ? u.customPermissions : [],
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
    if (!permission || permission === 'profile.view' || permission === 'dashboard.view') return true;
    if (user.role === 'admin') return true;

    if (Array.isArray(user.customPermissions) && user.customPermissions.length > 0) {
      const baseKey = permission.split('.')[0];
      return (
        user.customPermissions.includes(permission) ||
        user.customPermissions.includes(baseKey) ||
        user.customPermissions.includes(`${baseKey}.view`) ||
        user.customPermissions.includes(`${baseKey}.edit`)
      );
    }

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
