const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNo: {
    type: String,
    required: true,
    unique: true,
  },
  subject: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Inventory Bug', 'Billing & Invoice', 'Hardware / Scanner', 'User Permissions', 'Feature Request', 'General Query'],
    default: 'General Query',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
  },
  description: {
    type: String,
    required: true,
  },
  phone: String,
  raisedBy: {
    id: String,
    name: { type: String, required: true },
    email: String,
    role: String,
  },
  assignedTo: {
    id: String,
    name: { type: String, default: 'Unassigned' },
    role: String,
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
  },
  resolutionNotes: String,
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
