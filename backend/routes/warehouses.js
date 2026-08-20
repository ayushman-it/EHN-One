const express = require('express');
const router = express.Router();
const Warehouse = require('../models/Warehouse');
const { protect } = require('../middleware/auth');

router.use(protect);

const FIELDS = ['name', 'code', 'location', 'city', 'state', 'pincode', 'manager', 'phone', 'email', 'capacity', 'status', 'type'];
function pick(obj, f) { const r = {}; for (const k of f) { if (obj[k] !== undefined) r[k] = obj[k]; } return r; }

router.get('/', async (req, res) => {
  try {
    const w = await Warehouse.find().sort({ createdAt: -1 });
    res.json({ success: true, count: w.length, data: w });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const w = await Warehouse.findById(req.params.id);
    if (!w) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, data: w });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const w = new Warehouse(pick(req.body, FIELDS));
    await w.save();
    res.status(201).json({ success: true, data: w });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const w = await Warehouse.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS), { new: true, runValidators: true });
    if (!w) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, data: w });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const w = await Warehouse.findByIdAndDelete(req.params.id);
    if (!w) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, message: 'Warehouse deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
