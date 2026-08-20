const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: inv });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    if (invoice.items && Array.isArray(invoice.items)) {
      for (const item of invoice.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            product.quantity = Math.max(0, product.quantity - item.quantity);
            await product.save();
            await Transaction.create({ product: product._id, type: 'out', quantity: item.quantity, notes: 'Auto stock deduct for Invoice #' + invoice.invoiceNumber }).catch(() => {});
          }
        }
      }
    }
    res.status(201).json({ success: true, data: invoice });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const inv = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: inv });
  } catch (e) { res.status(400).json({ success: false, message: 'Server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (inv.items && Array.isArray(inv.items)) {
      for (const item of inv.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            product.quantity += item.quantity;
            await product.save();
            await Transaction.create({ product: product._id, type: 'in', quantity: item.quantity, notes: 'Auto stock restore for deleted Invoice #' + inv.invoiceNumber }).catch(() => {});
          }
        }
      }
    }
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Invoice deleted and stock restored' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
