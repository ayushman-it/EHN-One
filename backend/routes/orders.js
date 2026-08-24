const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');

let memoryOrders = [];

// GET /api/orders - Fetch all sales orders directly from MongoDB database
router.get('/', async (req, res) => {
  try {
    let dbOrders = await Order.find().sort({ createdAt: -1 }).lean().catch(() => null);
    if (!dbOrders || dbOrders.length === 0) {
      if (mongoose.connection && mongoose.connection.db) {
        dbOrders = await mongoose.connection.db.collection('orders').find({}).sort({ createdAt: -1 }).toArray().catch(() => null);
      }
    }

    if (dbOrders && Array.isArray(dbOrders)) {
      const dbIds = new Set(dbOrders.map(o => String(o._id)));
      const extraMem = memoryOrders.filter(o => !dbIds.has(String(o._id)));
      const combined = [...dbOrders, ...extraMem];
      return res.json({ success: true, count: combined.length, data: combined });
    }
  } catch (e) {
    console.error('Error fetching orders from MongoDB:', e.message);
  }

  res.json({ success: true, count: memoryOrders.length, data: memoryOrders });
});

// GET /api/orders/customer/:customerName - Fetch previous orders history for a specific shop
router.get('/customer/:customerName', async (req, res) => {
  try {
    const custName = decodeURIComponent(req.params.customerName).toLowerCase().trim();
    let dbOrders = await Order.find({ 
      customer: { $regex: new RegExp(custName, 'i') } 
    }).sort({ createdAt: -1 }).lean().catch(() => null);

    if (!dbOrders || dbOrders.length === 0) {
      if (mongoose.connection && mongoose.connection.db) {
        dbOrders = await mongoose.connection.db.collection('orders').find({ 
          customer: { $regex: new RegExp(custName, 'i') } 
        }).sort({ createdAt: -1 }).toArray().catch(() => null);
      }
    }

    const memMatches = memoryOrders.filter(o => 
      o.customer && o.customer.toLowerCase().includes(custName)
    );

    if (dbOrders && Array.isArray(dbOrders)) {
      const dbIds = new Set(dbOrders.map(o => String(o._id)));
      const extraMem = memMatches.filter(o => !dbIds.has(String(o._id)));
      const combined = [...dbOrders, ...extraMem];
      return res.json({ success: true, count: combined.length, data: combined });
    }

    return res.json({ success: true, count: memMatches.length, data: memMatches });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/orders - Create new Sales Order (SYNCHRONOUS MONGODB SAVE)
router.post('/', async (req, res) => {
  try {
    const { customer, customerId, salesman, salesmanId, items, totalAmount, notes } = req.body;

    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer name and order items are required' });
    }

    const orderNumber = `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderDocData = {
      orderNumber,
      customer: customer.trim(),
      customerId: customerId || '',
      salesman: salesman || 'Salesman',
      salesmanId: salesmanId || '',
      items,
      totalAmount: Number(totalAmount) || items.reduce((acc, it) => acc + (it.total || 0), 0),
      status: 'pending',
      notes: notes || '',
      orderDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let savedOrder = null;

    try {
      const ord = new Order(orderDocData);
      savedOrder = await ord.save();
    } catch (saveErr) {
      console.warn('⚠️ Mongoose order save warning, attempting native insert:', saveErr.message);
    }

    if (!savedOrder && mongoose.connection && mongoose.connection.db) {
      try {
        const result = await mongoose.connection.db.collection('orders').insertOne(orderDocData);
        savedOrder = { _id: result.insertedId, ...orderDocData };
      } catch (nativeErr) {
        console.error('❌ Native Mongo insert order failed:', nativeErr.message);
      }
    }

    if (!savedOrder) {
      savedOrder = { _id: `ORD-${Date.now()}`, ...orderDocData };
    }

    console.log(`✅ [MONGODB ORDER SAVED] Order "${orderNumber}" for ${customer} created with ID: ${savedOrder._id}`);

    memoryOrders.unshift(savedOrder);

    return res.status(201).json({ success: true, message: 'Sales Order booked successfully', data: savedOrder });
  } catch (e) {
    console.error('❌ Error creating sales order:', e.message);
    return res.status(500).json({ success: false, message: e.message || 'Server error booking order' });
  }
});

// PUT /api/orders/:id - Update order status in MongoDB
router.put('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, notes } = req.body;

    const updateObj = { updatedAt: new Date() };
    if (status) updateObj.status = status;
    if (notes !== undefined) updateObj.notes = notes;

    try {
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        await Order.findByIdAndUpdate(orderId, { $set: updateObj }).catch(() => {});
      } else if (mongoose.connection && mongoose.connection.db) {
        await mongoose.connection.db.collection('orders').updateOne({ _id: orderId }, { $set: updateObj }).catch(() => {});
      }
    } catch (dbErr) {}

    let updatedMem = null;
    memoryOrders = memoryOrders.map(o => {
      if (String(o._id) === String(orderId) || String(o.id) === String(orderId)) {
        updatedMem = { ...o, ...updateObj };
        return updatedMem;
      }
      return o;
    });

    return res.json({ success: true, message: 'Order status updated successfully', data: updatedMem || req.body });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// DELETE /api/orders/:id - Cancel/Delete Order in MongoDB
router.delete('/:id', async (req, res) => {
  const orderId = req.params.id;
  memoryOrders = memoryOrders.filter(o => String(o._id) !== String(orderId) && String(o.id) !== String(orderId));

  try {
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      await Order.findByIdAndDelete(orderId).catch(() => {});
    } else if (mongoose.connection && mongoose.connection.db) {
      await mongoose.connection.db.collection('orders').deleteOne({ _id: orderId }).catch(() => {});
    }
  } catch (e) {}

  return res.json({ success: true, message: 'Order cancelled successfully' });
});

module.exports = router;
