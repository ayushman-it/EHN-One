const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

router.use(protect);

function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};
    if (status) query.status = status;
    if (search) {
      const safe = escapeRegex(search);
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { phone: { $regex: safe, $options: 'i' } },
        { gstin: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } }
      ];
    }
    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const CUSTOMER_FIELDS = ['name', 'phone', 'email', 'gstin', 'address', 'city', 'state', 'pincode', 'openingBalance', 'status'];
function pick(obj, fields) { const r = {}; for (const f of fields) { if (obj[f] !== undefined) r[f] = obj[f]; } return r; }

router.post('/', async (req, res) => {
  try {
    const customer = new Customer(pick(req.body, CUSTOMER_FIELDS));
    await customer.save();
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, pick(req.body, CUSTOMER_FIELDS), { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
