/* ============================================================
   EHN One - Hybrid API (Backend + LocalStorage Fallback)
   ============================================================ */

import axios from 'axios';

// Base API URL - uses relative path in production (proxied by nginx), absolute in dev
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

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
  try {
    return await api.post('/auth/login', { email, password });
  } catch (error) {
    const em = (email || '').toLowerCase();
    if (em === 'admin@ehnsystem.com' || em === 'admin@kedvasshygieneproducts.com') {
      return {
        success: true,
        token: 'demo-admin-jwt-token',
        user: { id: 'usr_admin', name: 'Arjun Sharma', email: em, role: 'admin', department: 'Management' }
      };
    } else if (em === 'manager@ehnsystem.com') {
      return {
        success: true,
        token: 'demo-manager-jwt-token',
        user: { id: 'usr_manager', name: 'Priya Mehta', email: em, role: 'manager', department: 'Operations' }
      };
    } else if (em === 'viewer@ehnsystem.com') {
      return {
        success: true,
        token: 'demo-viewer-jwt-token',
        user: { id: 'usr_viewer', name: 'Rahul Verma', email: em, role: 'viewer', department: 'Sales' }
      };
    }
    throw error;
  }
};

export const register = async (userData) => {
  return api.post('/auth/register', userData);
};

export const changePassword = async (currentPassword, newPassword) => {
  return api.put('/auth/change-password', { currentPassword, newPassword });
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
   CUSTOMERS API (Sundry Debtors)
   ═══════════════════════════════════════════════════════════ */

export const getCustomers = async (search) => {
  try {
    const params = search ? { search } : {};
    return await api.get('/customers', { params });
  } catch (error) {
    await delay();
    const defaultCusts = [
      {
        _id: 'cust-1',
        name: 'Sharma Electronics',
        contactPerson: 'Rahul Sharma',
        phone: '9876543210',
        email: 'rahul@sharmaelec.com',
        address: '102 Connaught Place',
        state: 'Delhi',
        pincode: '110001',
        country: 'India',
        group: 'Sundry Debtors',
        maintainBillByBill: true,
        defaultCreditPeriod: 30,
        creditLimit: 100000,
        gstRegistrationType: 'Regular',
        gstin: '07AAAAA0000A1Z5',
        pan: 'AAAAA0000A',
        bankDetails: { accountNo: '987654321012', ifsc: 'SBIN0001234', bankName: 'SBI', branch: 'CP Delhi' },
        openingBalance: 15000,
        openingBalanceType: 'Dr',
        status: 'active'
      },
      {
        _id: 'cust-2',
        name: 'Verma Digital Store',
        contactPerson: 'Amit Verma',
        phone: '9811223344',
        email: 'info@vermadigital.in',
        address: '45 MG Road',
        state: 'Haryana',
        pincode: '122001',
        country: 'India',
        group: 'Sundry Debtors',
        maintainBillByBill: true,
        defaultCreditPeriod: 15,
        creditLimit: 50000,
        gstRegistrationType: 'Regular',
        gstin: '06BBBBA1111B1Z2',
        pan: 'BBBBA1111B',
        bankDetails: { accountNo: '456789012345', ifsc: 'HDFC0000123', bankName: 'HDFC Bank', branch: 'Gurugram' },
        openingBalance: 8500,
        openingBalanceType: 'Dr',
        status: 'active'
      }
    ];
    const customers = getFromStorage('customers', defaultCusts);
    let filtered = customers;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.gstin && c.gstin.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }
    return { success: true, data: filtered };
  }
};

export const getCustomer = async (id) => {
  try {
    return await api.get(`/customers/${id}`);
  } catch (error) {
    await delay();
    const customers = getFromStorage('customers', []);
    const customer = customers.find(c => c._id === id);
    if (!customer) throw new Error('Customer not found');
    return { success: true, data: customer };
  }
};

export const addCustomer = async (data) => {
  try {
    return await api.post('/customers', data);
  } catch (error) {
    await delay();
    const customers = getFromStorage('customers', []);
    const newCust = {
      ...data,
      _id: 'cust-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    customers.unshift(newCust);
    saveToStorage('customers', customers);
    return { success: true, data: newCust };
  }
};

export const updateCustomer = async (id, data) => {
  try {
    return await api.put(`/customers/${id}`, data);
  } catch (error) {
    await delay();
    const customers = getFromStorage('customers', []);
    const index = customers.findIndex(c => c._id === id);
    if (index === -1) throw new Error('Customer not found');
    customers[index] = { ...customers[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage('customers', customers);
    return { success: true, data: customers[index] };
  }
};

export const deleteCustomer = async (id) => {
  try {
    return await api.delete(`/customers/${id}`);
  } catch (error) {
    await delay();
    const customers = getFromStorage('customers', []);
    const filtered = customers.filter(c => c._id !== id);
    saveToStorage('customers', filtered);
    return { success: true, message: 'Customer deleted' };
  }
};

/* ═══════════════════════════════════════════════════════════
   TALLY EXPORT API
   ═══════════════════════════════════════════════════════════ */

export const exportTallyLedgers = () => {
  window.open(`${API_BASE_URL}/tally/export/ledgers`, '_blank');
};

export const exportTallyItems = () => {
  window.open(`${API_BASE_URL}/tally/export/items`, '_blank');
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
  try {
    return await api.post('/invoices', data);
  } catch (error) {
    await delay();
    const invoices = getFromStorage('invoices', []);
    const products = getFromStorage('products', []);
    const newInv = {
      ...data,
      _id: 'inv-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Auto deduct stock in fallback mode
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(item => {
        const prod = products.find(p => p._id === item.product || p.name === item.product || p.name === item.name);
        if (prod) {
          prod.quantity = Math.max(0, (prod.quantity || 0) - (Number(item.quantity) || 0));
        }
      });
      saveToStorage('products', products);
    }

    invoices.unshift(newInv);
    saveToStorage('invoices', invoices);
    return { success: true, data: newInv };
  }
};

export const updateInvoice = async (id, data) => {
  try {
    return await api.put(`/invoices/${id}`, data);
  } catch (error) {
    await delay();
    const invoices = getFromStorage('invoices', []);
    const index = invoices.findIndex(i => i._id === id || i.id === id);
    if (index === -1) throw new Error('Invoice not found');
    invoices[index] = { ...invoices[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage('invoices', invoices);
    return { success: true, data: invoices[index] };
  }
};

export const deleteInvoice = async (id) => {
  try {
    return await api.delete(`/invoices/${id}`);
  } catch (error) {
    await delay();
    const invoices = getFromStorage('invoices', []);
    const products = getFromStorage('products', []);
    const invToDelete = invoices.find(i => i._id === id || i.id === id);

    // Auto restore stock in fallback mode
    if (invToDelete && invToDelete.items && Array.isArray(invToDelete.items)) {
      invToDelete.items.forEach(item => {
        const prod = products.find(p => p._id === item.product || p.name === item.product || p.name === item.name);
        if (prod) {
          prod.quantity = (prod.quantity || 0) + (Number(item.quantity) || 0);
        }
      });
      saveToStorage('products', products);
    }

    const filtered = invoices.filter(i => i._id !== id && i.id !== id);
    saveToStorage('invoices', filtered);
    return { success: true, message: 'Invoice deleted' };
  }
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
