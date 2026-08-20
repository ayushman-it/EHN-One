const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', async (req, res) => {
  try {
    const products = await Product.find();
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const lowStockItems = products.filter(p => p.quantity <= p.lowStockThreshold);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const recentTransactions = await Transaction.find().populate('product', 'name sku').sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: { totalProducts, totalStock, lowStockCount: lowStockItems.length, lowStockItems, totalValue, recentTransactions } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/low-stock', async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name').populate('supplier', 'name').populate('warehouse', 'name');
    const lowStockItems = products.filter(p => p.quantity <= p.lowStockThreshold);
    res.json({ success: true, data: lowStockItems, count: lowStockItems.length });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
