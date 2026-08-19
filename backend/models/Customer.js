const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  contactPerson: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    default: '',
  },
  state: {
    type: String,
    default: 'Delhi',
  },
  pincode: {
    type: String,
    default: '',
  },
  country: {
    type: String,
    default: 'India',
  },
  group: {
    type: String,
    default: 'Sundry Debtors',
  },
  maintainBillByBill: {
    type: Boolean,
    default: true,
  },
  defaultCreditPeriod: {
    type: Number,
    default: 30, // in days
  },
  creditLimit: {
    type: Number,
    default: 0,
  },
  gstRegistrationType: {
    type: String,
    enum: ['Regular', 'Composition', 'Unregistered', 'Consumer'],
    default: 'Unregistered',
  },
  gstin: {
    type: String,
    default: '',
    trim: true,
    uppercase: true,
  },
  pan: {
    type: String,
    default: '',
    trim: true,
    uppercase: true,
  },
  bankDetails: {
    accountNo: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    bankName: { type: String, default: '' },
    branch: { type: String, default: '' },
  },
  openingBalance: {
    type: Number,
    default: 0,
  },
  openingBalanceType: {
    type: String,
    enum: ['Dr', 'Cr'],
    default: 'Dr',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
