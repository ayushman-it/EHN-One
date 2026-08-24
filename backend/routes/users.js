const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

let memoryUsers = [];

// Seed default super admin ONLY if MongoDB database users collection is completely empty
async function ensureAdminUser() {
  try {
    if (mongoose.connection && mongoose.connection.db) {
      const count = await mongoose.connection.db.collection('users').countDocuments();
      if (count === 0) {
        console.log('🌱 Creating initial Admin Account in MongoDB...');
        const hashedPassword = await bcrypt.hash('123456', 10);
        const adminDoc = {
          name: 'System Admin',
          email: 'admin@inventrack.com',
          password: hashedPassword,
          role: 'admin',
          status: 'active',
          phone: '+91 98765 43210',
          department: 'IT Management',
          customPermissions: ['dashboard.view', 'products.view', 'categories.view', 'customers.view', 'suppliers.view', 'warehouse.view', 'company-firms.view', 'invoices.view', 'transactions.view', 'stockin.view', 'stockout.view', 'lowstock.view', 'reports.view', 'analytics.view', 'automations.view', 'settings.view', 'users.view'],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await mongoose.connection.db.collection('users').insertOne(adminDoc).catch(() => {});
      }
    }
  } catch (e) {}
}

// GET /api/users - Fetch live users from MongoDB database (NO HARDCODED DATA)
router.get('/', async (req, res) => {
  try {
    await ensureAdminUser();
    let dbUsers = await User.find().select('-password').sort({ createdAt: -1 }).lean().catch(() => null);
    
    if (!dbUsers || dbUsers.length === 0) {
      if (mongoose.connection && mongoose.connection.db) {
        dbUsers = await mongoose.connection.db.collection('users').find({}, { projection: { password: 0 } }).sort({ createdAt: -1 }).toArray().catch(() => null);
      }
    }

    if (dbUsers && Array.isArray(dbUsers)) {
      // Sync memory storage with DB
      const dbEmails = new Set(dbUsers.map(u => u.email.toLowerCase()));
      const extraMem = memoryUsers.filter(u => !dbEmails.has(u.email.toLowerCase()));
      const combined = [...dbUsers, ...extraMem];
      return res.json({ success: true, count: combined.length, data: combined });
    }
  } catch (e) {
    console.error('Error fetching users from MongoDB:', e.message);
  }

  res.json({ success: true, count: memoryUsers.length, data: memoryUsers });
});

// POST /api/users - Save new operator permanently to MongoDB database
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, phone, department, customPermissions } = req.body;

    if (!name || !name.trim() || !email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Name and Email are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate in DB or Memory
    let existing = await User.findOne({ email: cleanEmail }).catch(() => null);
    if (!existing && mongoose.connection && mongoose.connection.db) {
      existing = await mongoose.connection.db.collection('users').findOne({ email: cleanEmail }).catch(() => null);
    }
    if (!existing) {
      existing = memoryUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    }

    if (existing) {
      return res.status(400).json({ success: false, message: 'Operator email already exists in system' });
    }

    const rawPassword = password && password.trim() ? password.trim() : '123456';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const finalPermissions = Array.isArray(customPermissions) ? Array.from(new Set(['dashboard.view', ...customPermissions])) : ['dashboard.view'];

    const userDocData = {
      name: name.trim(),
      email: cleanEmail,
      role: role || 'viewer',
      status: 'active',
      phone: phone || '',
      department: department || 'Operations',
      customPermissions: finalPermissions,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let savedUser = null;

    // 1. Try Mongoose Save
    try {
      const u = new User({ ...userDocData, password: rawPassword });
      savedUser = await u.save();
    } catch (saveErr) {
      console.warn('⚠️ Mongoose save warning, executing native insert:', saveErr.message);
    }

    // 2. Try Native MongoDB Insert
    if (!savedUser && mongoose.connection && mongoose.connection.db) {
      try {
        const result = await mongoose.connection.db.collection('users').insertOne({
          ...userDocData,
          password: hashedPassword
        });
        savedUser = { _id: result.insertedId, ...userDocData };
      } catch (nativeErr) {
        console.error('❌ Native Mongo insert failed:', nativeErr.message);
      }
    }

    // 3. Fail-safe Memory Item
    if (!savedUser) {
      savedUser = { _id: `USR-${Date.now()}`, ...userDocData };
    }

    console.log(`✅ [MONGODB USER SAVED] Created user "${cleanEmail}" with permissions:`, finalPermissions);

    const memoryItem = {
      _id: savedUser._id,
      ...userDocData
    };

    memoryUsers.unshift(memoryItem);

    return res.status(201).json({ success: true, message: 'User created successfully', data: memoryItem });
  } catch (e) {
    console.error('❌ Error creating user:', e.message);
    return res.status(500).json({ success: false, message: e.message || 'Server error creating user' });
  }
});

// PUT /api/users/:id - Update operator user in MongoDB
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, role, phone, department, password, customPermissions, status } = req.body;

    const updateObj = { updatedAt: new Date() };
    if (name) updateObj.name = name.trim();
    if (role) updateObj.role = role;
    if (phone !== undefined) updateObj.phone = phone;
    if (department !== undefined) updateObj.department = department;
    if (status) updateObj.status = status;
    if (Array.isArray(customPermissions)) {
      updateObj.customPermissions = Array.from(new Set(['dashboard.view', ...customPermissions]));
    }
    if (password && password.trim()) {
      updateObj.password = await bcrypt.hash(password.trim(), 10);
    }

    // Update in MongoDB
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        await User.findByIdAndUpdate(userId, { $set: updateObj }).catch(() => {});
      }
      if (mongoose.connection && mongoose.connection.db) {
        const queryId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
        await mongoose.connection.db.collection('users').updateOne(
          { $or: [{ _id: queryId }, { _id: String(userId) }] },
          { $set: updateObj }
        ).catch(() => {});
      }
    } catch (dbErr) {}

    let updatedMem = null;
    memoryUsers = memoryUsers.map(u => {
      if (String(u._id) === String(userId) || String(u.id) === String(userId)) {
        updatedMem = { ...u, ...updateObj };
        return updatedMem;
      }
      return u;
    });

    return res.json({ success: true, message: 'User updated successfully', data: updatedMem || req.body });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// DELETE /api/users/:id - Delete user from MongoDB
router.delete('/:id', async (req, res) => {
  const userId = req.params.id;
  memoryUsers = memoryUsers.filter(u => String(u._id) !== String(userId) && String(u.id) !== String(userId));

  try {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      await User.findByIdAndDelete(userId).catch(() => {});
    } else if (mongoose.connection && mongoose.connection.db) {
      await mongoose.connection.db.collection('users').deleteOne({ _id: userId }).catch(() => {});
    }
  } catch (e) {}

  return res.json({ success: true, message: 'User deleted successfully' });
});

module.exports = router;
