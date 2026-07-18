const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  whatsapp: {
    apiKey: String,
    phoneNumberId: String,
    businessAccountId: String,
    webhookUrl: String,
    webhookVerifyToken: String,
    isConfigured: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending',
    },
    lastTested: Date,
  },
  company: {
    name: { type: String, default: 'EHN One' },
    email: String,
    phone: String,
    address: String,
    gst: String,
    logo: String,
  },
  email: {
    smtpHost: String,
    smtpPort: { type: String, default: '587' },
    smtpUser: String,
    smtpPassword: String,
    fromEmail: String,
    fromName: { type: String, default: 'EHN One' },
    isConfigured: { type: Boolean, default: false },
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    whatsappNotifications: { type: Boolean, default: true },
    lowStockAlert: { type: Boolean, default: true },
    paymentReminder: { type: Boolean, default: true },
    dailyReport: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
