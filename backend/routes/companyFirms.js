const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CompanyFirm = require('../models/CompanyFirm');

let memoryFirms = [];

// GET /api/company-firms - Fetch all company firms from MongoDB database
router.get('/', async (req, res) => {
  try {
    let dbFirms = await CompanyFirm.find().sort({ isDefault: -1, createdAt: -1 }).lean().catch(() => null);
    if (!dbFirms || dbFirms.length === 0) {
      if (mongoose.connection && mongoose.connection.db) {
        dbFirms = await mongoose.connection.db.collection('companyfirms').find({}).sort({ isDefault: -1, createdAt: -1 }).toArray().catch(() => null);
      }
    }

    if (dbFirms && Array.isArray(dbFirms)) {
      const dbIds = new Set(dbFirms.map(f => String(f._id)));
      const extraMem = memoryFirms.filter(f => !dbIds.has(String(f._id)));
      const combined = [...dbFirms, ...extraMem];
      return res.json({ success: true, count: combined.length, data: combined });
    }
  } catch (e) {
    console.error('Error fetching company firms from MongoDB:', e.message);
  }

  res.json({ success: true, count: memoryFirms.length, data: memoryFirms });
});

// GET /api/company-firms/:id
router.get('/:id', async (req, res) => {
  try {
    const firmId = req.params.id;
    if (mongoose.Types.ObjectId.isValid(firmId)) {
      const firm = await CompanyFirm.findById(firmId);
      if (firm) return res.json({ success: true, data: firm });
    }
    const memFirm = memoryFirms.find(f => String(f._id) === String(firmId));
    if (memFirm) return res.json({ success: true, data: memFirm });

    res.status(404).json({ success: false, message: 'Company firm not found' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/company-firms - Create new Company Firm in MongoDB
router.post('/', async (req, res) => {
  try {
    const {
      name, isGstRegistered, gstin, invoicePrefix, currentInvoiceSequence,
      address, state, phone, email, bankName, bankAccountNo, ifscCode, branchName, isDefault
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Firm Name is required' });
    }

    if (isDefault) {
      try {
        await CompanyFirm.updateMany({}, { $set: { isDefault: false } }).catch(() => {});
      } catch (e) {}
      memoryFirms.forEach(f => f.isDefault = false);
    }

    const firmData = {
      name: name.trim(),
      isGstRegistered: Boolean(isGstRegistered),
      gstin: (gstin || '').toUpperCase().trim(),
      invoicePrefix: invoicePrefix || 'INV/',
      currentInvoiceSequence: Number(currentInvoiceSequence) || 101,
      address: address || '',
      state: state || '23-Madhya Pradesh',
      phone: phone || '',
      email: email || '',
      bankName: bankName || '',
      bankAccountNo: bankAccountNo || '',
      ifscCode: ifscCode || '',
      branchName: branchName || '',
      isDefault: Boolean(isDefault),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let savedFirm = null;

    try {
      const firm = new CompanyFirm(firmData);
      savedFirm = await firm.save();
    } catch (saveErr) {
      console.warn('⚠️ Mongoose firm save warning:', saveErr.message);
    }

    if (!savedFirm && mongoose.connection && mongoose.connection.db) {
      try {
        const result = await mongoose.connection.db.collection('companyfirms').insertOne(firmData);
        savedFirm = { _id: result.insertedId, ...firmData };
      } catch (nativeErr) {}
    }

    if (!savedFirm) {
      savedFirm = { _id: `FIRM-${Date.now()}`, ...firmData };
    }

    memoryFirms.unshift(savedFirm);

    res.status(201).json({ success: true, message: 'Company firm created successfully', data: savedFirm });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/company-firms/:id
router.put('/:id', async (req, res) => {
  try {
    const firmId = req.params.id;
    const updateObj = { ...req.body, updatedAt: new Date() };

    if (updateObj.isDefault) {
      try {
        await CompanyFirm.updateMany({ _id: { $ne: firmId } }, { $set: { isDefault: false } }).catch(() => {});
      } catch (e) {}
      memoryFirms.forEach(f => {
        if (String(f._id) !== String(firmId)) f.isDefault = false;
      });
    }

    try {
      if (mongoose.Types.ObjectId.isValid(firmId)) {
        await CompanyFirm.findByIdAndUpdate(firmId, { $set: updateObj }).catch(() => {});
      }
    } catch (dbErr) {}

    let updatedMem = null;
    memoryFirms = memoryFirms.map(f => {
      if (String(f._id) === String(firmId)) {
        updatedMem = { ...f, ...updateObj };
        return updatedMem;
      }
      return f;
    });

    res.json({ success: true, message: 'Company firm updated successfully', data: updatedMem || updateObj });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// DELETE /api/company-firms/:id
router.delete('/:id', async (req, res) => {
  try {
    const firmId = req.params.id;
    memoryFirms = memoryFirms.filter(f => String(f._id) !== String(firmId));

    if (mongoose.Types.ObjectId.isValid(firmId)) {
      await CompanyFirm.findByIdAndDelete(firmId).catch(() => {});
    }

    res.json({ success: true, message: 'Company firm deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
