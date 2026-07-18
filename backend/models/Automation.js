const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['low_stock', 'payment_reminder', 'stock_report', 'order_confirmation'],
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
    default: 'immediate',
  },
  threshold: Number,
  daysBeforeDue: Number,
  time: String,
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
