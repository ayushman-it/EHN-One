const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const t = new Ticket({ ...req.body, createdBy: req.user.id });
    await t.save();
    res.status(201).json({ success: true, data: t });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const t = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!t) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: t });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const t = await Ticket.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
