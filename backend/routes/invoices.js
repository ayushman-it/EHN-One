const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create invoice & Auto-Deduct Stock
router.post('/', async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();

    // Auto-deduct stock for each item in invoice
    if (invoice.items && Array.isArray(invoice.items)) {
      for (const item of invoice.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            product.quantity = Math.max(0, product.quantity - item.quantity);
            await product.save();

            // Create stock out transaction record
            await Transaction.create({
              product: product._id,
              type: 'out',
              quantity: item.quantity,
              notes: `Auto stock deduct for Invoice #${invoice.invoiceNumber}`,
            }).catch(() => {}); // silent fail if transaction logging fails
          }
        }
      }
    }

    res.status(201).json({ success: true, message: 'Invoice created and stock updated automatically', data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice updated', data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete invoice & Auto-Restore Stock
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Auto-restore stock for items
    if (invoice.items && Array.isArray(invoice.items)) {
      for (const item of invoice.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            product.quantity += item.quantity;
            await product.save();

            // Create stock in transaction record
            await Transaction.create({
              product: product._id,
              type: 'in',
              quantity: item.quantity,
              notes: `Auto stock restore for deleted Invoice #${invoice.invoiceNumber}`,
            }).catch(() => {});
          }
        }
      }
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Invoice deleted and stock restored automatically' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
