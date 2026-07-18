const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  location: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pincode: String,
  manager: String,
  phone: String,
  email: String,
  capacity: {
    type: Number,
    required: true,
    min: 0,
  },
  occupied: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active',
  },
  type: {
    type: String,
    enum: ['Distribution Center', 'Storage', 'Logistics Hub'],
    default: 'Storage',
  },
  products: {
    type: Number,
    default: 0,
  },
  establishedDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);
