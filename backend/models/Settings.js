const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  tallyInvoice: {
    printHsn: { type: Boolean, default: true },
    showGstBreakdown: { type: Boolean, default: true },
    invoicePrefix: { type: String, default: 'INV-2026-' },
    termsAndConditions: { type: String, default: '1. Goods once sold will not be taken back.\n2. Subject to Jurisdiction.' },
    bankName: { type: String, default: 'HDFC Bank Ltd.' },
    bankAccountNo: String,
    ifscCode: String,
    validateCustomerGstin: { type: Boolean, default: true },
  },
  tallyInventory: {
    allowNegativeStock: { type: String, default: 'warning' },
    autoReorderAlert: { type: Boolean, default: true },
    defaultUqcUnit: { type: String, default: 'PCS-PIECES' },
    valuationMethod: { type: String, default: 'FIFO' },
  },
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
