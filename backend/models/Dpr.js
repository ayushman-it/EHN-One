const mongoose = require('mongoose');

const dprSchema = new mongoose.Schema({
  salesmanName: {
    type: String,
    required: true,
    trim: true,
  },
  salesmanEmail: {
    type: String,
    required: true,
    trim: true,
  },
  bitName: {
    type: String,
    required: true,
    trim: true,
  },
  targetShops: {
    type: Number,
    default: 0,
  },
  visitedShops: {
    type: Number,
    default: 0,
  },
  ordersBooked: {
    type: Number,
    default: 0,
  },
  totalOrderValue: {
    type: Number,
    default: 0,
  },
  paymentCollected: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['submitted', 'verified', 'pending'],
    default: 'submitted',
  },
  remarks: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Dpr', dprSchema);
