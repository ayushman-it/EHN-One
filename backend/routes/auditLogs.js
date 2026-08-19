const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

// Initial seed data if database is empty
const initialLogs = [
  {
    action: 'user.created',
    category: 'USER',
    severity: 'INFO',
    user: { name: 'Arjun Sharma', role: 'Administrator' },
    target: 'Sneha Patel (Manager)',
    details: 'Created new Manager user account with Finance department access',
    ipAddress: '192.168.1.45',
    timestamp: new Date('2026-08-14T09:30:00')
  },
  {
    action: 'security.login',
    category: 'AUTH',
    severity: 'SECURITY',
    user: { name: 'Priya Mehta', role: 'Accountant' },
    target: 'Auth Portal',
    details: 'User logged in successfully via Web Browser',
    ipAddress: '103.24.12.89',
    timestamp: new Date('2026-08-14T08:15:00')
  },
  {
    action: 'invoice.delete',
    category: 'INVOICE',
    severity: 'WARNING',
    user: { name: 'Arjun Sharma', role: 'Administrator' },
    target: 'Invoice #INV-2026-004',
    details: 'Deleted draft invoice and restored 15 Pcs product stock',
    ipAddress: '192.168.1.45',
    timestamp: new Date('2026-08-13T18:20:00')
  },
  {
    action: 'user.role_changed',
    category: 'USER',
    severity: 'SECURITY',
    user: { name: 'Arjun Sharma', role: 'Administrator' },
    target: 'Rahul Verma',
    details: 'Updated user role from Staff to Manager',
    ipAddress: '192.168.1.45',
    timestamp: new Date('2026-08-13T14:10:00')
  },
  {
    action: 'settings.update',
    category: 'SETTINGS',
    severity: 'INFO',
    user: { name: 'Arjun Sharma', role: 'Administrator' },
    target: 'WhatsApp API Config',
    details: 'Updated Meta Business API key & phone number ID',
    ipAddress: '192.168.1.45',
    timestamp: new Date('2026-08-12T11:05:00')
  }
];

// GET /api/audit-logs - Query audit logs with filters
router.get('/', async (req, res) => {
  try {
    const { category, severity, search, limit = 100 } = req.query;
    
    let logs = await AuditLog.find().sort({ timestamp: -1 }).limit(Number(limit));

    if (logs.length === 0) {
      // Seed default audit logs
      await AuditLog.insertMany(initialLogs);
      logs = await AuditLog.find().sort({ timestamp: -1 });
    }

    // Apply Filters
    let filtered = logs;
    if (category && category !== 'ALL') {
      filtered = filtered.filter(l => l.category === category);
    }
    if (severity && severity !== 'ALL') {
      filtered = filtered.filter(l => l.severity === severity);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l => 
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.target && l.target.toLowerCase().includes(q)) ||
        (l.user?.name && l.user.name.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/audit-logs - Record new audit log entry
router.post('/', async (req, res) => {
  try {
    const auditLog = new AuditLog({
      action: req.body.action || 'system.event',
      category: req.body.category || 'USER',
      severity: req.body.severity || 'INFO',
      user: req.body.user || { name: 'Admin', role: 'Administrator' },
      target: req.body.target || 'System',
      details: req.body.details || '',
      ipAddress: req.ip || req.body.ipAddress || '127.0.0.1',
      deviceInfo: req.headers['user-agent'] || ''
    });

    await auditLog.save();
    res.status(201).json({ success: true, data: auditLog });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/audit-logs/export - Export Audit Log Report to CSV
router.get('/export', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    
    let csv = 'Timestamp,Category,Severity,Action,Performer Name,Role,Target Entity,Details,IP Address\n';
    
    logs.forEach(l => {
      const ts = new Date(l.timestamp).toISOString();
      const cat = l.category || 'USER';
      const sev = l.severity || 'INFO';
      const act = `"${(l.action || '').replace(/"/g, '""')}"`;
      const name = `"${(l.user?.name || 'System').replace(/"/g, '""')}"`;
      const role = `"${(l.user?.role || 'User').replace(/"/g, '""')}"`;
      const tgt = `"${(l.target || '').replace(/"/g, '""')}"`;
      const det = `"${(l.details || '').replace(/"/g, '""')}"`;
      const ip = l.ipAddress || '127.0.0.1';

      csv += `${ts},${cat},${sev},${act},${name},${role},${tgt},${det},${ip}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=EHN_One_Security_Audit_Logs.csv');
    res.status(200).send(csv);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
