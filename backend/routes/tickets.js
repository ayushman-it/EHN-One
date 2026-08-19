const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// Initial seed tickets if empty
const initialTickets = [
  {
    ticketNo: 'TCK-1001',
    subject: 'Barcode Scanner disconnects intermittently',
    category: 'Hardware / Scanner',
    priority: 'High',
    description: 'USB barcode scanner unmounts while scanning products during high volume billing.',
    phone: '+91 98765 43210',
    raisedBy: { name: 'Rahul Verma', email: 'rahul@ehnone.com', role: 'Staff' },
    assignedTo: { name: 'Arjun Sharma', role: 'Administrator' },
    status: 'In Progress',
    resolutionNotes: 'Updated USB COM driver. Monitoring port connection.'
  },
  {
    ticketNo: 'TCK-1002',
    subject: 'Need permission for Stock Out module',
    category: 'User Permissions',
    priority: 'Medium',
    description: 'Please enable Stock Out permission for warehouse staff user account.',
    phone: '+91 98765 11111',
    raisedBy: { name: 'Priya Mehta', email: 'priya@ehnone.com', role: 'Accountant' },
    assignedTo: { name: 'Unassigned', role: '' },
    status: 'Open',
    resolutionNotes: ''
  }
];

// GET /api/tickets - Fetch tickets
router.get('/', async (req, res) => {
  try {
    let tickets = await Ticket.find().sort({ createdAt: -1 });

    if (tickets.length === 0) {
      await Ticket.insertMany(initialTickets);
      tickets = await Ticket.find().sort({ createdAt: -1 });
    }

    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tickets - Create support ticket
router.post('/', async (req, res) => {
  try {
    const count = await Ticket.countDocuments();
    const ticketNo = `TCK-${1001 + count}`;

    const ticket = new Ticket({
      ticketNo,
      subject: req.body.subject,
      category: req.body.category || 'General Query',
      priority: req.body.priority || 'Medium',
      description: req.body.description,
      phone: req.body.phone,
      raisedBy: req.body.raisedBy || { name: 'User', role: 'Staff' },
      assignedTo: { name: 'Unassigned', role: '' },
      status: 'Open'
    });

    await ticket.save();
    res.status(201).json({ success: true, message: 'Ticket created successfully!', data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/tickets/:id - Admin Update Ticket (Assign, Status, Resolution)
router.put('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.json({ success: true, message: 'Ticket updated successfully', data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/tickets/:id - Delete ticket
router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
