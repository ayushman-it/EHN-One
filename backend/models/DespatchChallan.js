const mongoose = require('mongoose');

const despatchChallanSchema = new mongoose.Schema({
  challanNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  orderNo: {
    type: String,
    required: true,
    trim: true,
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  vehicleNo: {
    type: String,
    required: true,
    trim: true,
  },
  driverName: {
    type: String,
    required: true,
    trim: true,
  },
  driverPhone: String,
  bitName: String,
  totalBoxes: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['draft', 'dispatched', 'in_transit', 'delivered'],
    default: 'dispatched',
  },
  dispatchDate: {
    type: Date,
    default: Date.now,
  },
  remarks: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DespatchChallan', despatchChallanSchema);
