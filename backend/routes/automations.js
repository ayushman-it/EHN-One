const express = require('express');
const router = express.Router();
const Automation = require('../models/Automation');
const { executeAutomationJob } = require('../services/whatsappScheduler');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const automations = await Automation.find().sort({ createdAt: -1 });
    res.json({ success: true, count: automations.length, data: automations });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const a = await Automation.findById(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Automation not found' });
    res.json({ success: true, data: a });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const a = new Automation(req.body);
    await a.save();
    res.status(201).json({ success: true, data: a });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const a = await Automation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!a) return res.status(404).json({ success: false, message: 'Automation not found' });
    res.json({ success: true, data: a });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const a = await Automation.findByIdAndDelete(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Automation not found' });
    res.json({ success: true, message: 'Automation deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/:id/trigger', async (req, res) => {
  try {
    const a = await Automation.findById(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Automation not found' });
    const result = await executeAutomationJob(a);
    res.json({ success: true, message: 'Automation executed', data: result });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
