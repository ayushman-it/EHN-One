const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyFirm',
  },
  firmDetails: {
    name: String,
    isGstRegistered: Boolean,
    gstin: String,
    address: String,
    state: String,
    phone: String,
    email: String,
    bankName: String,
    bankAccountNo: String,
    ifscCode: String,
    branchName: String,
    logoUrl: String,
  },
  invoiceType: {
    type: String,
    enum: ['tax_invoice', 'bill_of_supply', 'retail_invoice'],
    default: 'tax_invoice',
  },
  customer: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    address: String,
    gst: String,
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    name: String,
    hsn: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
  }],
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'pending', 'overdue'],
    default: 'draft',
  },
  dueDate: Date,
  paidDate: Date,
  notes: String,
  terms: String,
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
