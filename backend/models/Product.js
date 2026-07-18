const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String, // Changed to String to accept category names directly
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  cost: {
    type: Number,
    default: 0,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  minStock: {
    type: Number,
    default: 10,
    min: 0,
  },
  lowStockThreshold: { // Add this field for frontend compatibility
    type: Number,
    default: 10,
    min: 0,
  },
  unit: {
    type: String,
    default: 'pcs',
  },
  supplier: {
    type: String, // Changed to String for frontend compatibility
  },
  warehouse: {
    type: String, // Changed to String for frontend compatibility
  },
  barcode: String,
  image: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active',
  },
  tags: [String],
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  const threshold = this.lowStockThreshold || this.minStock || 10;
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= threshold) return 'low_stock';
  return 'in_stock';
});

module.exports = mongoose.model('Product', productSchema);
