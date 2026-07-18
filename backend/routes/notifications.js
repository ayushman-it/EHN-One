const express = require('express');
const router = express.Router();

// Mock notifications data for now
let notifications = [
  {
    id: 1,
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: 'Samsung Galaxy S23 stock is below minimum threshold',
    time: '5 minutes ago',
    read: false,
    icon: 'bi-box-seam',
    color: 'warning',
    createdAt: new Date(),
  },
  {
    id: 2,
    type: 'payment',
    title: 'Payment Received',
    message: 'Payment of ₹45,500 received for Invoice #INV-2024-001',
    time: '1 hour ago',
    read: false,
    icon: 'bi-cash-coin',
    color: 'success',
    createdAt: new Date(),
  },
  {
    id: 3,
    type: 'order',
    title: 'New Order Placed',
    message: 'Order #ORD-2024-089 has been placed by Rajesh Kumar',
    time: '2 hours ago',
    read: true,
    icon: 'bi-cart-check',
    color: 'info',
    createdAt: new Date(),
  },
];

// @route   GET /api/notifications
// @desc    Get all notifications
// @access  Public
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      count: notifications.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Public
router.put('/:id/read', async (req, res) => {
  try {
    const notif = notifications.find(n => n.id === parseInt(req.params.id));
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    notif.read = true;
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notif,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Public
router.put('/mark-all-read', async (req, res) => {
  try {
    notifications = notifications.map(n => ({ ...n, read: true }));
    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Clear all notifications
// @access  Public
router.delete('/clear-all', async (req, res) => {
  try {
    notifications = [];
    res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router;
