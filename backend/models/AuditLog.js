const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['AUTH', 'USER', 'INVOICE', 'PRODUCT', 'SUPPLIER', 'CUSTOMER', 'SETTINGS', 'SYSTEM'],
    default: 'USER',
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'SECURITY', 'CRITICAL'],
    default: 'INFO',
  },
  user: {
    id: String,
    name: { type: String, default: 'System' },
    email: String,
    role: String,
  },
  target: {
    type: String,
    default: 'System',
  },
  details: String,
  ipAddress: {
    type: String,
    default: '127.0.0.1',
  },
  deviceInfo: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
