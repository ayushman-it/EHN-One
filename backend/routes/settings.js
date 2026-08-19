const express = require('express');
const router = express.Router();
const https = require('https');
const Settings = require('../models/Settings');

// Get settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create default
    if (!settings) {
      settings = new Settings({
        company: { name: 'EHN One' },
        email: { fromName: 'EHN One' },
        notifications: {
          emailNotifications: true,
          whatsappNotifications: true,
          lowStockAlert: true,
          paymentReminder: true,
          dailyReport: false
        }
      });
      await settings.save();
    }
    
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update settings
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
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/settings/send-whatsapp - Send Live WhatsApp API Message
router.post('/send-whatsapp', async (req, res) => {
  try {
    const { phone, message, apiKey, phoneNumberId } = req.body;
    let settings = await Settings.findOne();

    const token = apiKey || settings?.whatsappConfig?.apiKey;
    const phoneId = phoneNumberId || settings?.whatsappConfig?.phoneNumberId;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Phone and message are required' });
    }

    if (!token || !phoneId) {
      return res.status(400).json({ 
        success: false, 
        error: 'WhatsApp Business API Key and Phone Number ID not configured',
        requiresManualSend: true
      });
    }

    // Format Meta Graph API Cloud Payload
    const postData = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { body: message }
    });

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v18.0/${phoneId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (response.statusCode >= 200 && response.statusCode < 300) {
            return res.json({ success: true, message: 'WhatsApp message sent live!', data: parsed });
          } else {
            return res.status(400).json({ success: false, error: parsed.error?.message || 'Meta API error', details: parsed });
          }
        } catch (e) {
          return res.status(500).json({ success: false, error: 'Failed to parse Meta API response', raw: data });
        }
      });
    });

    request.on('error', (err) => {
      res.status(500).json({ success: false, error: err.message });
    });

    request.write(postData);
    request.end();

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
