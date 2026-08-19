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

/* Mock users */
export const MOCK_USERS = [
  { id: 1, name: 'Arjun Sharma',  email: 'admin@ehnsystem.com',   password: 'admin123',   role: 'admin'   },
  { id: 2, name: 'Priya Mehta',   email: 'manager@ehnsystem.com', password: 'manager123', role: 'manager' },
  { id: 3, name: 'Rahul Verma',   email: 'viewer@ehnsystem.com',  password: 'viewer123',  role: 'viewer'  },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('inv_user')); } catch { return null; }
  });

  const login = async (email, password) => {
    try {
      // Call backend API
      const response = await authAPI.login(email, password);
      
      // Extract user data from response
      const userData = response.data || response;
      const session = {
        id: userData._id || userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      };

      // Store token if provided
      if (userData.token) {
        sessionStorage.setItem('inv_token', userData.token);
      }

      sessionStorage.setItem('inv_user', JSON.stringify(session));
      setUser(session);
      return session;
    } catch (error) {
      // If backend is not available, fall back to mock users for development
      console.warn('Backend login failed, using mock authentication:', error.message);
      const found = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!found) throw new Error('Invalid email or password');
      const session = { id: found.id, name: found.name, email: found.email, role: found.role };
      sessionStorage.setItem('inv_user', JSON.stringify(session));
      setUser(session);
      return session;
    }
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
    <AuthContext.Provider value={{ user, login, logout, can, hasRole, roleInfo: user ? ROLES[user.role] : null }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
