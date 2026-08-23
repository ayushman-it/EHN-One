const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'stock_report',
  },
  name: {
    type: String,
  },
  title: String,
  category: String,
  description: String,
  startDate: String,
  endDate: String,
  date: String,
  message: String,
  enabled: {
    type: Boolean,
    default: true,
  },
  channel: {
    type: String,
    default: 'whatsapp',
  },
  phone: String,
  frequency: {
    type: String,
    default: 'daily',
  },
  threshold: Number,
  daysBeforeDue: Number,
  time: {
    type: String,
    default: '20:00' // e.g. "20:00" for 8:00 PM
  },
  categories: [String],
  includeInvoice: Boolean,
  messageTemplate: String,
  customMessage: String,
  lastTriggered: Date,
  lastSent: String,
  triggeredCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Automation', automationSchema);
