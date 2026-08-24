const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unit: {
    type: String,
    default: 'PCS',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customer: {
    type: String,
    required: true,
  },
  customerId: {
    type: String,
    default: '',
  },
  salesman: {
    type: String,
    required: true,
  },
  salesmanId: {
    type: String,
    default: '',
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'invoiced', 'cancelled'],
    default: 'pending',
  },
  notes: {
    type: String,
    default: '',
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);
