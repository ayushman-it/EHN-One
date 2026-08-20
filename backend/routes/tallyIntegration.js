const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/ledgers', async (req, res) => {
  try {
    res.json({ success: true, data: [], message: 'Tally integration pending' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/items', async (req, res) => {
  try {
    res.json({ success: true, data: [], message: 'Tally integration pending' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
