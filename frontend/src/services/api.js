/* ============================================================
   EHN One - Hybrid API (Backend + LocalStorage Fallback)
   ============================================================ */

import axios from 'axios';

// Base API URL - change for production
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Check if backend is available
let backendAvailable = true;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 seconds
});

// Request interceptor - add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('inv_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      backendAvailable = false;
    }
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || error.response.data?.error || 'Something went wrong';
      throw new Error(message);
    } else if (error.request) {
      // Request made but no response - backend not available
      backendAvailable = false;
      throw new Error('Backend not available. Using local storage.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// LocalStorage helpers
const getFromStorage = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

/* ═══════════════════════════════════════════════════════════
   AUTHENTICATION API
   ═══════════════════════════════════════════════════════════ */

export const login = async (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const register = async (userData) => {
  return api.post('/auth/register', userData);
};

/* ═══════════════════════════════════════════════════════════
   PRODUCTS API
   ═══════════════════════════════════════════════════════════ */

export const getProducts = async (search, category) => {
  try {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    const response = await api.get('/products', { params });
    return response;
  } catch (error) {
    // Fallback to localStorage
    await delay();
    const products = getFromStorage('products', []);
    let filtered = products;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    return { data: filtered };
  }
};

export const getProduct = async (id) => {
  try {
    return await api.get(`/products/${id}`);
  } catch (error) {
    await delay();
    const products = getFromStorage('products', []);
    const product = products.find(p => p._id === id);
    if (!product) throw new Error('Product not found');
    return { data: product };
  }
};

export const addProduct = async (data) => {
  try {
    return await api.post('/products', data);
  } catch (error) {
    await delay();
    const products = getFromStorage('products', []);
    const newProduct = {
      ...data,
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.unshift(newProduct);
    saveToStorage('products', products);
    return { data: newProduct };
  }
};

export const updateProduct = async (id, data) => {
  try {
    return await api.put(`/products/${id}`, data);
  } catch (error) {
    await delay();
    const products = getFromStorage('products', []);
    const index = products.findIndex(p => p._id === id);
    if (index === -1) throw new Error('Product not found');
    products[index] = { ...products[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage('products', products);
    return { data: products[index] };
  }
};

export const deleteProduct = async (id) => {
  try {
    return await api.delete(`/products/${id}`);
  } catch (error) {
    await delay();
    const products = getFromStorage('products', []);
    const filtered = products.filter(p => p._id !== id);
    saveToStorage('products', filtered);
    return { data: { message: 'Deleted' } };
  }
};

/* ═══════════════════════════════════════════════════════════
   CATEGORIES API
   ═══════════════════════════════════════════════════════════ */

export const getCategories = async () => {
  return api.get('/categories');
};

export const getCategory = async (id) => {
  return api.get(`/categories/${id}`);
};

export const addCategory = async (data) => {
  return api.post('/categories', data);
};

export const updateCategory = async (id, data) => {
  return api.put(`/categories/${id}`, data);
};

export const deleteCategory = async (id) => {
  return api.delete(`/categories/${id}`);
};

/* ═══════════════════════════════════════════════════════════
   SUPPLIERS API
   ═══════════════════════════════════════════════════════════ */

export const getSuppliers = async () => {
  return api.get('/suppliers');
};

export const getSupplier = async (id) => {
  return api.get(`/suppliers/${id}`);
};

export const addSupplier = async (data) => {
  return api.post('/suppliers', data);
};

export const updateSupplier = async (id, data) => {
  return api.put(`/suppliers/${id}`, data);
};

export const deleteSupplier = async (id) => {
  return api.delete(`/suppliers/${id}`);
};

/* ═══════════════════════════════════════════════════════════
   WAREHOUSES API
   ═══════════════════════════════════════════════════════════ */

export const getWarehouses = async () => {
  return api.get('/warehouses');
};

export const getWarehouse = async (id) => {
  return api.get(`/warehouses/${id}`);
};

export const addWarehouse = async (data) => {
  return api.post('/warehouses', data);
};

export const updateWarehouse = async (id, data) => {
  return api.put(`/warehouses/${id}`, data);
};

export const deleteWarehouse = async (id) => {
  return api.delete(`/warehouses/${id}`);
};

/* ═══════════════════════════════════════════════════════════
   TRANSACTIONS API
   ═══════════════════════════════════════════════════════════ */

export const getTransactions = async (type) => {
  const params = type ? { type } : {};
  return api.get('/transactions', { params });
};

export const getTransaction = async (id) => {
  return api.get(`/transactions/${id}`);
};

export const stockIn = async (data) => {
  return api.post('/transactions/stock-in', data);
};

export const stockOut = async (data) => {
  return api.post('/transactions/stock-out', data);
};

/* ═══════════════════════════════════════════════════════════
   INVOICES API
   ═══════════════════════════════════════════════════════════ */

export const getInvoices = async () => {
  return api.get('/invoices');
};

export const getInvoice = async (id) => {
  return api.get(`/invoices/${id}`);
};

export const addInvoice = async (data) => {
  return api.post('/invoices', data);
};

export const updateInvoice = async (id, data) => {
  return api.put(`/invoices/${id}`, data);
};

export const deleteInvoice = async (id) => {
  return api.delete(`/invoices/${id}`);
};

/* ═══════════════════════════════════════════════════════════
   USERS API
   ═══════════════════════════════════════════════════════════ */

export const getUsers = async () => {
  return api.get('/users');
};

export const getUser = async (id) => {
  return api.get(`/users/${id}`);
};

export const addUser = async (data) => {
  return api.post('/users', data);
};

export const updateUser = async (id, data) => {
  return api.put(`/users/${id}`, data);
};

export const deleteUser = async (id) => {
  return api.delete(`/users/${id}`);
};

/* ═══════════════════════════════════════════════════════════
   AUTOMATIONS API
   ═══════════════════════════════════════════════════════════ */

export const getAutomations = async () => {
  return api.get('/automations');
};

export const getAutomation = async (id) => {
  return api.get(`/automations/${id}`);
};

export const addAutomation = async (data) => {
  return api.post('/automations', data);
};

export const updateAutomation = async (id, data) => {
  return api.put(`/automations/${id}`, data);
};

export const deleteAutomation = async (id) => {
  return api.delete(`/automations/${id}`);
};

/* ═══════════════════════════════════════════════════════════
   SETTINGS API
   ═══════════════════════════════════════════════════════════ */

export const getSettings = async () => {
  return api.get('/settings');
};

export const updateSettings = async (data) => {
  return api.put('/settings', data);
};

export const testWhatsAppConnection = async () => {
  return api.post('/settings/test-whatsapp');
};

export const testEmailConnection = async () => {
  return api.post('/settings/test-email');
};

/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS API
   ═══════════════════════════════════════════════════════════ */

export const getNotifications = async () => {
  return api.get('/notifications');
};

export const markNotificationAsRead = async (id) => {
  return api.put(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async () => {
  return api.put('/notifications/mark-all-read');
};

export const clearAllNotifications = async () => {
  return api.delete('/notifications/clear-all');
};

/* ═══════════════════════════════════════════════════════════
   DASHBOARD STATS API
   ═══════════════════════════════════════════════════════════ */

export const getStats = async () => {
  try {
    return await api.get('/dashboard/stats');
  } catch (error) {
    await delay();
    const products = getFromStorage('products', []);
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const lowStockItems = products.filter(p => p.quantity <= (p.lowStockThreshold || 10));
    const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);
    
    return {
      data: {
        totalProducts,
        totalStock,
        lowStockCount: lowStockItems.length,
        lowStockItems,
        totalValue,
      }
    };
  }
};

export const getLowStockProducts = async () => {
  return api.get('/dashboard/low-stock');
};

export default api;
