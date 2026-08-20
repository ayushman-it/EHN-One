const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.use(protect);

let notifications = [
  { id: 1, type: 'low_stock', title: 'Low Stock Alert', message: 'Stock below minimum threshold', time: '5 minutes ago', read: false, icon: 'bi-box-seam', color: 'warning', createdAt: new Date() },
];

router.get('/', async (req, res) => {
  try {
    res.json({ success: true, data: notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), count: notifications.length });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.put('/:id/read', async (req, res) => {
  try {
    const notif = notifications.find(n => n.id === parseInt(req.params.id));
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    notif.read = true;
    res.json({ success: true, data: notif });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.put('/mark-all-read', async (req, res) => {
  try {
    notifications = notifications.map(n => ({ ...n, read: true }));
    res.json({ success: true, data: notifications });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.delete('/clear-all', async (req, res) => {
  try {
    notifications = [];
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
