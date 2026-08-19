const express = require('express');
const router = express.Router();
const Automation = require('../models/Automation');
const { executeAutomationJob } = require('../services/whatsappScheduler');

// Get all automations
router.get('/', async (req, res) => {
  try {
    const automations = await Automation.find().sort({ createdAt: -1 });
    res.json({ success: true, count: automations.length, data: automations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single automation
router.get('/:id', async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id);
    if (!automation) {
      return res.status(404).json({ success: false, message: 'Automation not found' });
    }
    res.json({ success: true, data: automation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create automation
router.post('/', async (req, res) => {
  try {
    const automation = new Automation(req.body);
    await automation.save();
    res.status(201).json({ success: true, message: 'Automation created', data: automation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update automation
router.put('/:id', async (req, res) => {
  try {
    const automation = await Automation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!automation) {
      return res.status(404).json({ success: false, message: 'Automation not found' });
    }
    res.json({ success: true, message: 'Automation updated', data: automation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete automation
router.delete('/:id', async (req, res) => {
  try {
    const automation = await Automation.findByIdAndDelete(req.params.id);
    if (!automation) {
      return res.status(404).json({ success: false, message: 'Automation not found' });
    }
    res.json({ success: true, message: 'Automation deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/automations/:id/trigger - Trigger automation job on demand (Run Now)
router.post('/:id/trigger', async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id);
    if (!automation) {
      return res.status(404).json({ success: false, message: 'Automation job not found' });
    }

    const result = await executeAutomationJob(automation);
    res.json({ success: true, message: `Automation "${automation.name}" executed successfully!`, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
