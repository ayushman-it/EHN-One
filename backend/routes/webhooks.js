const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

let lastReceivedWebhookEvent = null;
let webhookLogsHistory = [];

/**
 * GET /api/webhooks/meta/last-event
 * Live Monitor Endpoint to inspect incoming Meta Webhook POST events
 */
router.get('/meta/last-event', (req, res) => {
  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    totalReceived: webhookLogsHistory.length,
    lastEvent: lastReceivedWebhookEvent,
    recentHistory: webhookLogsHistory.slice(0, 15)
  });
});

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
  const timestamp = new Date().toISOString();
  const body = req.body || {};

  console.log(`\n========================================`);
  console.log(`[Meta Webhook POST Received @ ${timestamp}]`);
  console.log(`Payload:`, JSON.stringify(body, null, 2));

  let eventLog = {
    timestamp,
    ip: req.ip || req.headers['x-forwarded-for'],
    stage: 'POST_RECEIVED',
    body,
    parsedMessage: null,
    parsedStatus: null,
  };

  if (body.object) {
    eventLog.stage = 'OBJECT_MATCHED';
    if (body.entry && body.entry[0]?.changes && body.entry[0]?.changes[0]?.value) {
      const value = body.entry[0].changes[0].value;
      eventLog.stage = 'CHANGES_PARSED';

      // Handle Incoming Messages (e.g., "Hello webhook test 123")
      if (value.messages && value.messages[0]) {
        const msgObj = value.messages[0];
        const from = msgObj.from;
        const msgText = msgObj.text?.body || msgObj.caption || JSON.stringify(msgObj);
        
        console.log(`📩 INCOMING WHATSAPP MESSAGE:`);
        console.log(`   From: +${from}`);
        console.log(`   Text: "${msgText}"`);

        eventLog.stage = 'MESSAGE_RECEIVED';
        eventLog.parsedMessage = {
          from,
          text: msgText,
          messageId: msgObj.id,
          type: msgObj.type
        };
      }

      // Handle Message Delivery Receipts (sent, delivered, read)
      if (value.statuses && value.statuses[0]) {
        const statusObj = value.statuses[0];
        const status = statusObj.status;
        const recipient = statusObj.recipient_id;

        console.log(`📊 WHATSAPP DELIVERY RECEIPT:`);
        console.log(`   Recipient: +${recipient}`);
        console.log(`   Status: ${status.toUpperCase()}`);

        eventLog.stage = 'STATUS_RECEIPT';
        eventLog.parsedStatus = {
          recipient,
          status,
          messageId: statusObj.id
        };
      }
    }

    lastReceivedWebhookEvent = eventLog;
    webhookLogsHistory.unshift(eventLog);
    if (webhookLogsHistory.length > 50) webhookLogsHistory.pop();

    console.log(`========================================\n`);
    return res.status(200).send('EVENT_RECEIVED');
  }

  lastReceivedWebhookEvent = eventLog;
  webhookLogsHistory.unshift(eventLog);
  console.log(`========================================\n`);
  return res.status(200).send('OK');
});

module.exports = router;
