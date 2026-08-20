const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { protect } = require('../middleware/auth');

router.use(protect);

const FIELDS = ['name', 'contactPerson', 'email', 'phone', 'address', 'city', 'state', 'pincode', 'status', 'rating'];
function pick(obj, f) { const r = {}; for (const k of f) { if (obj[k] !== undefined) r[k] = obj[k]; } return r; }

router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const s = await Supplier.findById(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: s });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const s = new Supplier(pick(req.body, FIELDS));
    await s.save();
    res.status(201).json({ success: true, data: s });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const s = await Supplier.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS), { new: true, runValidators: true });
    if (!s) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: s });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const s = await Supplier.findByIdAndDelete(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
