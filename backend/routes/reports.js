const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/summary', async (req, res) => {
  try {
    const products = await Product.find();
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const transactions = await Transaction.countDocuments();
    const invoices = await Invoice.countDocuments();
    res.json({ success: true, data: { totalProducts, totalStock, totalValue, transactions, invoices } });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/gst', authorize('admin'), async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/stock', async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name').populate('warehouse', 'name');
    res.json({ success: true, data: products });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
