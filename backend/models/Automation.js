const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['low_stock', 'payment_reminder', 'stock_report', 'order_confirmation', 'today_summary', 'supplier_payable'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  enabled: {
    type: Boolean,
    default: true,
  },
  channel: {
    type: String,
    enum: ['whatsapp', 'email', 'both'],
    default: 'whatsapp',
  },
  phone: String,
  frequency: {
    type: String,
    enum: ['immediate', 'daily', 'weekly', 'monthly'],
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
  triggeredCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Automation', automationSchema);
