const express = require('express');
const router = express.Router();
const Automation = require('../models/Automation');
const { executeAutomationJob } = require('../services/whatsappScheduler');

// GET all automations & reminders
router.get('/', async (req, res) => {
  try {
    const automations = await Automation.find().sort({ createdAt: -1 });
    res.json({ success: true, count: automations.length, data: automations });
  } catch (e) { 
    res.status(500).json({ success: false, message: e.message }); 
  }
});

// GET single automation by ID
router.get('/:id', async (req, res) => {
  try {
    const a = await Automation.findById(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Automation not found' });
    res.json({ success: true, data: a });
  } catch (e) { 
    res.status(500).json({ success: false, message: e.message }); 
  }
});

// POST create or upsert automation/reminder
router.post('/', async (req, res) => {
  try {
    const { title, name, time, phone, category, startDate, endDate, message, customMessage, enabled, frequency } = req.body;

    const itemTitle = title || name || 'EHN One Scheduled Reminder';
    const itemPhone = (phone || '919238695500').replace(/^[+]+/, '');

    // Check if automation with same title and time exists
    let a = await Automation.findOne({ 
      $or: [
        { title: itemTitle, time: time },
        { name: itemTitle, time: time }
      ]
    });

    if (a) {
      a.title = itemTitle;
      a.name = itemTitle;
      a.time = time || a.time;
      a.phone = itemPhone;
      a.category = category || a.category;
      a.startDate = startDate || a.startDate;
      a.endDate = endDate || a.endDate;
      a.message = message || customMessage || a.message;
      a.customMessage = message || customMessage || a.customMessage;
      a.enabled = enabled !== undefined ? enabled : true;
      a.frequency = frequency || a.frequency;
      await a.save();
      console.log(`⏰ [AUTOMATION SAVED/UPDATED]: "${itemTitle}" @ ${time} for +${itemPhone}`);
      return res.status(200).json({ success: true, data: a });
    }

    a = new Automation({
      title: itemTitle,
      name: itemTitle,
      time: time || '20:00',
      phone: itemPhone,
      category: category || 'meeting',
      type: category || 'meeting',
      startDate: startDate,
      endDate: endDate,
      message: message || customMessage || 'Friendly reminder',
      customMessage: message || customMessage || 'Friendly reminder',
      enabled: enabled !== undefined ? enabled : true,
      frequency: frequency || 'daily'
    });

    await a.save();
    console.log(`⏰ [NEW AUTOMATION CREATED]: "${itemTitle}" @ ${time} for +${itemPhone}`);
    res.status(201).json({ success: true, data: a });
  } catch (e) { 
    console.error('Error saving automation:', e);
    res.status(400).json({ success: false, message: e.message }); 
  }
});

// PUT update automation
router.put('/:id', async (req, res) => {
  try {
    const a = await Automation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!a) return res.status(404).json({ success: false, message: 'Automation not found' });
    res.json({ success: true, data: a });
  } catch (e) { 
    res.status(400).json({ success: false, message: e.message }); 
  }
});

// DELETE automation
router.delete('/:id', async (req, res) => {
  try {
    const a = await Automation.findByIdAndDelete(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Automation not found' });
    res.json({ success: true, message: 'Automation deleted' });
  } catch (e) { 
    res.status(500).json({ success: false, message: e.message }); 
  }
});

// POST trigger automation manually
router.post('/:id/trigger', async (req, res) => {
  try {
    const a = await Automation.findById(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Automation not found' });
    const result = await executeAutomationJob(a);
    res.json({ success: true, message: 'Automation executed', data: result });
  } catch (e) { 
    res.status(500).json({ success: false, message: e.message }); 
  }
});

module.exports = router;
