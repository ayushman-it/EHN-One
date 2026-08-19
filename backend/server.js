require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Start Automated WhatsApp Scheduler
const { startScheduler } = require('./services/whatsappScheduler');
startScheduler();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/tally', require('./routes/tallyIntegration'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/users', require('./routes/users'));
app.use('/api/automations', require('./routes/automations'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/tickets', require('./routes/tickets'));

// Welcome Route
app.get('/', (req, res) => {
  res.json({
    message: '🎉 EHN One - Inventory Management API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      suppliers: '/api/suppliers',
      customers: '/api/customers',
      tally: '/api/tally',
      warehouses: '/api/warehouses',
      transactions: '/api/transactions',
      invoices: '/api/invoices',
      users: '/api/users',
      automations: '/api/automations',
      settings: '/api/settings',
      dashboard: '/api/dashboard',
      notifications: '/api/notifications',
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   🚀 EHN One API Server Running            ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   📡 Port: ${PORT}                            ║`);
  console.log(`║   🌐 URL: http://localhost:${PORT}           ║`);
  console.log('║   📦 Database: MongoDB Atlas               ║');
  console.log('║   ✅ Status: Active                        ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
