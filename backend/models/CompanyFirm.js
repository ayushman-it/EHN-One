const mongoose = require('mongoose');

const companyFirmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  isGstRegistered: {
    type: Boolean,
    default: true,
  },
  gstin: {
    type: String,
    trim: true,
  },
  invoicePrefix: {
    type: String,
    default: 'INV-2026-',
    trim: true,
  },
  currentInvoiceSequence: {
    type: Number,
    default: 100,
  },
  address: String,
  state: {
    type: String,
    default: '23-Madhya Pradesh',
  },
  phone: String,
  email: String,
  bankName: String,
  bankAccountNo: String,
  ifscCode: String,
  branchName: String,
  termsAndConditions: {
    type: String,
    default: '1. Goods once sold will not be taken back.\n2. Subject to Jurisdiction.',
  },
  logoUrl: String,
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('CompanyFirm', companyFirmSchema);
