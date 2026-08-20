const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

router.use(protect);

const FIELDS = ['name', 'slug', 'description', 'parent', 'icon', 'color', 'status'];
function pick(obj, f) { const r = {}; for (const k of f) { if (obj[k] !== undefined) r[k] = obj[k]; } return r; }

router.get('/', async (req, res) => {
  try {
    const c = await Category.find().populate('parent', 'name slug');
    res.json({ success: true, count: c.length, data: c });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const c = await Category.findById(req.params.id).populate('parent');
    if (!c) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: c });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const c = new Category(pick(req.body, FIELDS));
    await c.save();
    res.status(201).json({ success: true, data: c });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const c = await Category.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS), { new: true, runValidators: true });
    if (!c) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: c });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const children = await Category.find({ parent: req.params.id });
    if (children.length > 0) return res.status(400).json({ success: false, message: 'Cannot delete category with subcategories' });
    const c = await Category.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
