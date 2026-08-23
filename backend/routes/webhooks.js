const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

const VERIFY_TOKEN = 'ehn_one_whatsapp_verify_token_2026';

/**
 * GET /api/webhooks/meta
 * Meta Developer Portal Webhook Verification Handshake
 */
router.get('/meta', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  let customVerifyToken = VERIFY_TOKEN;
  try {
    const settings = await Settings.findOne();
    if (settings?.whatsapp?.webhookVerifyToken) {
      customVerifyToken = settings.whatsapp.webhookVerifyToken;
    }
  } catch (e) {}

  if (mode && token) {
    if (mode === 'subscribe' && (token === customVerifyToken || token === VERIFY_TOKEN)) {
      console.log('✅ Meta Webhook Verified Successfully!');
      return res.status(200).send(challenge);
    } else {
      console.warn('❌ Meta Webhook Verification Token Mismatch.');
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
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

  return res.sendStatus(404);
});

module.exports = router;
