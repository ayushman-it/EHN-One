const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, user } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (user) filter.user = user;
    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await AuditLog.countDocuments(filter);
    res.json({ success: true, data: logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/export', authorize('admin'), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(1000);
    res.json({ success: true, data: logs });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const log = new AuditLog({ ...req.body, user: req.user.id });
    await log.save();
    res.status(201).json({ success: true, data: log });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
