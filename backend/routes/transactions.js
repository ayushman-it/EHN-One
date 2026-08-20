const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('product', 'name sku').sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/in', async (req, res) => {
  try {
    const { productId, quantity, notes } = req.body;
    if (!productId || !quantity) return res.status(400).json({ message: 'productId and quantity required' });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.quantity += Number(quantity);
    await product.save();
    const transaction = await Transaction.create({ product: productId, type: 'in', quantity: Number(quantity), notes });
    res.status(201).json(transaction);
  } catch (err) { res.status(400).json({ message: 'Server error' }); }
});

router.post('/out', async (req, res) => {
  try {
    const { productId, quantity, notes } = req.body;
    if (!productId || !quantity) return res.status(400).json({ message: 'productId and quantity required' });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.quantity < quantity) return res.status(400).json({ error: 'Insufficient stock' });
    product.quantity -= Number(quantity);
    await product.save();
    const transaction = await Transaction.create({ product: productId, type: 'out', quantity: Number(quantity), notes });
    res.status(201).json(transaction);
  } catch (err) { res.status(400).json({ message: 'Server error' }); }
});

router.get('/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalStock = await Product.aggregate([{ $group: { _id: null, total: { $sum: '$quantity' } } }]);
    const lowStock = await Product.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } });
    const totalValue = await Product.aggregate([{ $group: { _id: null, total: { $sum: { $multiply: ['$price', '$quantity'] } } } }]);
    res.json({ totalProducts, totalStock: totalStock[0]?.total || 0, lowStockCount: lowStock.length, lowStockItems: lowStock, totalValue: totalValue[0]?.total || 0 });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
