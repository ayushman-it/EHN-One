const express = require('express');
const router = express.Router();
const https = require('https');
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({
        company: { name: 'EHN One' },
        email: { fromName: 'EHN One' },
        notifications: { emailNotifications: true, whatsappNotifications: true, lowStockAlert: true, paymentReminder: true, dailyReport: false }
      });
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key])) {
          settings[key] = { ...settings[key], ...req.body[key] };
        } else {
          settings[key] = req.body[key];
        }
      });
    }
    await settings.save();
    res.json({ success: true, message: 'Settings updated', data: settings });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Server error' });
  }
});

router.post('/send-whatsapp', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message are required' });
    }

    let settings = await Settings.findOne();
    const token = settings?.whatsappConfig?.apiKey || settings?.whatsapp?.apiKey || 'EAAX71GdiWggBSVNQf5y7pT71r7SZCC7OU8UDLGvRiDZAABnlo7OAMtayZAsnj5BcTcH7BwPcN6DiJc2EsU3n0uzof31uINkUZBO6hb1kZAog5BElfQzBqZAXpshREnQmZAcVW8nnYe7vOyLajLRG7grw4QD3ivr0J5tQfbBxQDjPNYrR5JXqnw0SrSjI1t5EgIzgwZDZD';
    const phoneId = settings?.whatsappConfig?.phoneNumberId || settings?.whatsapp?.phoneNumberId || '1221104881094408';

    if (!token || !phoneId) {
      return res.status(400).json({ success: false, message: 'WhatsApp API not configured', requiresManualSend: true });
    }

    const postData = JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: phone, type: 'text', text: { body: message } });
    const options = {
      hostname: 'graph.facebook.com', port: 443,
      path: '/v25.0/' + phoneId + '/messages', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (response.statusCode >= 200 && response.statusCode < 300) {
            return res.json({ success: true, message: 'WhatsApp message sent', data: parsed });
          } else {
            return res.status(400).json({ success: false, message: 'Meta API error' });
          }
        } catch (e) {
          return res.status(500).json({ success: false, message: 'Server error' });
        }
      });
    });

    request.on('error', () => { res.status(500).json({ success: false, message: 'Server error' }); });
    request.write(postData);
    request.end();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
