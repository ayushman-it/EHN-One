const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

router.use(protect);

const ALLOWED_FIELDS = ['name', 'sku', 'description', 'category', 'supplier', 'warehouse', 'quantity', 'price', 'lowStockThreshold', 'status'];

function pick(obj, fields) {
  const result = {};
  for (const f of fields) { if (obj[f] !== undefined) result[f] = obj[f]; }
  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };
    if (category) filter.category = category;
    const products = await Product.find(filter).sort({ updatedAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const product = await Product.create(pick(req.body, ALLOWED_FIELDS));
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, pick(req.body, ALLOWED_FIELDS), { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
