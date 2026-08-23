const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

/**
 * GET /api/webhooks/meta
 * Meta Developer Portal Webhook Verification Handshake & Browser Health Status
 */
router.get('/meta', async (req, res) => {
  const urlObj = new URL(req.originalUrl || req.url, 'https://admin.kedvasshygieneproducts.com');
  const mode = req.query['hub.mode'] || (req.query.hub && req.query.hub.mode) || urlObj.searchParams.get('hub.mode');
  const token = req.query['hub.verify_token'] || (req.query.hub && req.query.hub.verify_token) || urlObj.searchParams.get('hub.verify_token');
  const challenge = req.query['hub.challenge'] || (req.query.hub && req.query.hub.challenge) || urlObj.searchParams.get('hub.challenge');

  // Resolve verify token from process.env or Settings DB model fallback
  let verifyToken = process.env.META_VERIFY_TOKEN || 'ehn_one_whatsapp_verify_token_2026';
  try {
    const settings = await Settings.findOne();
    if (settings?.whatsapp?.webhookVerifyToken) {
      verifyToken = settings.whatsapp.webhookVerifyToken;
    }
  } catch (e) {}

  // 1. Meta Developer Portal Verification Handshake
  if (mode || token || challenge) {
    if (mode === 'subscribe' && (token === verifyToken || token === 'ehn_one_whatsapp_verify_token_2026')) {
      console.log('✅ Meta Webhook Verification Successful! Responding with challenge:', challenge);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    } else {
      console.warn('❌ Meta Webhook Verification Failed: Token mismatch or invalid mode.');
      return res.sendStatus(403);
    }
  }

  // 2. Normal Browser GET Health Check (No Meta query params sent)
  return res.status(200).json({
    success: true,
    status: 'active',
    service: 'EHN One Meta WhatsApp Webhook Verification Endpoint',
    callbackUrl: 'https://admin.kedvasshygieneproducts.com/api/webhooks/meta',
    verifyToken: verifyToken,
    instructions: 'Enter Callback URL and Verify Token in Meta Developer Portal Webhook Configuration.'
  });
});

/**
 * POST /api/webhooks/meta
 * Receive incoming WhatsApp messages and delivery status updates from Meta Cloud API
 */
router.post('/meta', (req, res) => {
  const body = req.body;

  if (body.object) {
    if (body.entry && body.entry[0]?.changes && body.entry[0]?.changes[0]?.value) {
      const value = body.entry[0].changes[0].value;

      // Handle Incoming Messages
      if (value.messages && value.messages[0]) {
        const from = value.messages[0].from;
        const msgText = value.messages[0].text?.body || '';
        console.log(`📩 Incoming WhatsApp Message from +${from}: "${msgText}"`);
      }

      // Handle Message Delivery Receipts
      if (value.statuses && value.statuses[0]) {
        const status = value.statuses[0].status; // sent, delivered, read
        const recipient = value.statuses[0].recipient_id;
        console.log(`📊 WhatsApp Message Status for +${recipient}: ${status.toUpperCase()}`);
      }
    }
    return res.status(200).send('EVENT_RECEIVED');
  }

  return res.status(200).send('OK');
});

module.exports = router;
